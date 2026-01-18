import type { Express } from "express";
import { createServer, type Server } from "node:http";

const ASSIST_API_BASE = "https://assist.org/api";

interface ArticulationCourse {
  courseIdentifierParentId: number;
  courseTitle: string;
  courseNumber: string;
  prefix: string;
  prefixParentId: number;
  prefixDescription: string;
  departmentParentId: number;
  department: string;
  begin: string;
  end: string | null;
  minUnits: number;
  maxUnits: number;
}

interface ArticulationRequirement {
  type: string;
  courses?: ArticulationCourse[];
  conjunction?: string;
  position?: number;
}

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

  app.get("/api/articulation", async (req, res) => {
    try {
      const { key } = req.query;

      if (!key) {
        return res.status(400).json({ error: "key parameter is required" });
      }

      const response = await fetch(
        `${ASSIST_API_BASE}/articulation/Agreements?Key=${encodeURIComponent(key as string)}`
      );

      if (!response.ok) {
        throw new Error(`ASSIST API error: ${response.status}`);
      }

      const data = await response.json();
      
      const parsedCourses = parseArticulationData(data);
      
      res.json({
        raw: data,
        courses: parsedCourses,
      });
    } catch (error) {
      console.error("Error fetching articulation:", error);
      res.status(500).json({ error: "Failed to fetch articulation details" });
    }
  });

  function parseArticulationData(data: any): any[] {
    const courses: any[] = [];
    
    try {
      const result = data?.result;
      if (!result) return courses;

      const templateAssets = result.templateAssets;
      if (!templateAssets) return courses;

      let assets: any[];
      if (typeof templateAssets === "string") {
        assets = JSON.parse(templateAssets);
      } else {
        assets = templateAssets;
      }

      for (const asset of assets) {
        if (asset.type === "RequirementGroup" && asset.sections) {
          for (const section of asset.sections) {
            if (section.rows) {
              for (const row of section.rows) {
                if (row.cells) {
                  for (const cell of row.cells) {
                    if (cell.type === "Course" && cell.course) {
                      const course = cell.course;
                      if (course.courseTitle && course.courseNumber) {
                        courses.push({
                          id: `${course.prefix || ""}${course.courseNumber}`,
                          code: `${course.prefix || ""} ${course.courseNumber}`.trim(),
                          title: course.courseTitle,
                          units: course.maxUnits || course.minUnits || 3,
                          department: course.department || course.prefixDescription || "",
                          transferable: true,
                          source: "ASSIST",
                        });
                      }
                    }
                    if (cell.courses && Array.isArray(cell.courses)) {
                      for (const course of cell.courses) {
                        if (course.courseTitle && course.courseNumber) {
                          courses.push({
                            id: `${course.prefix || ""}${course.courseNumber}`,
                            code: `${course.prefix || ""} ${course.courseNumber}`.trim(),
                            title: course.courseTitle,
                            units: course.maxUnits || course.minUnits || 3,
                            department: course.department || course.prefixDescription || "",
                            transferable: true,
                            source: "ASSIST",
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error parsing articulation data:", e);
    }

    const uniqueCourses = courses.filter(
      (course, index, self) =>
        index === self.findIndex((c) => c.code === course.code)
    );

    return uniqueCourses;
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
