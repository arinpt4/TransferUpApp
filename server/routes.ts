import type { Express } from "express";
import { createServer, type Server } from "node:http";

const ASSIST_API_BASE = "https://assist.org/api";

interface AssistInstitution {
  id: number;
  code: string;
  isCommunityCollege: boolean;
  category: string;
  names: Array<{
    name: string;
    hasDepartments: boolean;
    fromYear: number;
    hideInList: boolean;
  }>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/institutions", async (req, res) => {
    try {
      const response = await fetch(`${ASSIST_API_BASE}/institutions`);
      
      if (!response.ok) {
        throw new Error(`ASSIST API error: ${response.status}`);
      }

      const data: AssistInstitution[] = await response.json();

      const institutions = data
        .filter((inst) => {
          const currentName = inst.names.find((n) => !n.hideInList);
          return currentName !== undefined;
        })
        .map((inst) => {
          const currentName = inst.names.find((n) => !n.hideInList);
          let type: "CC" | "CSU" | "UC" = "CC";

          if (!inst.isCommunityCollege) {
            if (
              inst.code.includes("UC") ||
              currentName?.name.includes("University of California")
            ) {
              type = "UC";
            } else {
              type = "CSU";
            }
          }

          return {
            id: inst.id,
            code: inst.code,
            name: currentName?.name || inst.code,
            type,
            isCommunityCollege: inst.isCommunityCollege,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ error: "Failed to fetch institutions" });
    }
  });

  app.get("/api/agreements", async (req, res) => {
    try {
      const { receivingInstitutionId, sendingInstitutionId, academicYearId } = req.query;

      if (!receivingInstitutionId || !sendingInstitutionId) {
        return res.status(400).json({
          error: "receivingInstitutionId and sendingInstitutionId are required",
        });
      }

      const yearParam = academicYearId || "74";
      const url = `${ASSIST_API_BASE}/agreements?receivingInstitutionId=${receivingInstitutionId}&sendingInstitutionId=${sendingInstitutionId}&academicYearId=${yearParam}&categoryCode=major`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ASSIST API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Failed to fetch agreements" });
    }
  });

  app.get("/api/articulation/:key", async (req, res) => {
    try {
      const { key } = req.params;

      const response = await fetch(`${ASSIST_API_BASE}/articulation/${key}`);

      if (!response.ok) {
        throw new Error(`ASSIST API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching articulation:", error);
      res.status(500).json({ error: "Failed to fetch articulation details" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
