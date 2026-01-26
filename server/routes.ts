import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const ASSIST_API_BASE = "https://assist.org/api";

// OpenAI client initialized lazily to allow app startup without API key
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are a helpful transfer advisor for California community college students. You have access to the ASSIST.org articulation database.

IMPORTANT WORKFLOW:
1. When a student mentions ANY school name (like "De Anza", "UC Berkeley", "Foothill", etc.), ALWAYS use search_institutions first to find the correct institution ID. Never assume you know the ID.
2. School codes are internal - students will give you school names. Be flexible with names (e.g., "UC Berkeley" = "University of California, Berkeley").
3. When searching for majors, use search_majors with flexible matching. Major names vary across institutions (e.g., "EECS" vs "Electrical Engineering and Computer Sciences", "CS" vs "Computer Science").
4. If multiple schools match a search, ask the student to clarify which one they mean.
5. If no articulation agreements exist between schools, explain this clearly and suggest alternatives.

Be encouraging, concise, and helpful. Guide students through the transfer planning process step by step.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_institutions",
      description: "Search for California colleges and universities by name. Use this FIRST whenever a student mentions a school name to find the correct institution ID. Returns matching institutions with their IDs and types (CC/UC/CSU).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The school name or partial name to search for (e.g., 'De Anza', 'UC Berkeley', 'Foothill', 'San Jose State')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_agreements",
      description: "Get ALL available majors/programs that have articulation agreements between two schools. Returns the complete list of majors with their agreement keys. Use search_institutions first to get the correct IDs.",
      parameters: {
        type: "object",
        properties: {
          sendingInstitutionId: {
            type: "number",
            description: "The ID of the sending community college (from search_institutions)",
          },
          receivingInstitutionId: {
            type: "number",
            description: "The ID of the receiving UC or CSU (from search_institutions)",
          },
        },
        required: ["sendingInstitutionId", "receivingInstitutionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_majors",
      description: "Search through the majors available between two schools using fuzzy matching. Use this when a student asks about a specific major. Returns matching majors sorted by relevance.",
      parameters: {
        type: "object",
        properties: {
          sendingInstitutionId: {
            type: "number",
            description: "The ID of the sending community college",
          },
          receivingInstitutionId: {
            type: "number",
            description: "The ID of the receiving UC or CSU",
          },
          majorQuery: {
            type: "string",
            description: "The major name or abbreviation to search for (e.g., 'EECS', 'Computer Science', 'Business', 'Psychology')",
          },
        },
        required: ["sendingInstitutionId", "receivingInstitutionId", "majorQuery"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_articulation",
      description: "Get the specific course requirements for a major/program articulation agreement. Requires the agreement key from get_agreements or search_majors.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The articulation agreement key",
          },
        },
        required: ["key"],
      },
    },
  },
];

let cachedInstitutions: any[] = [];

async function fetchAllInstitutions(): Promise<any[]> {
  if (cachedInstitutions.length > 0) return cachedInstitutions;
  
  const response = await fetch(`${ASSIST_API_BASE}/institutions`);
  const data = await response.json();
  
  cachedInstitutions = data
    .filter((inst: any) => {
      const currentName = inst.names?.find((n: any) => !n.hideInList);
      return currentName !== undefined;
    })
    .map((inst: any) => {
      const currentName = inst.names?.find((n: any) => !n.hideInList);
      let type = "CC";
      if (!inst.isCommunityCollege) {
        if (inst.code?.includes("UC") || currentName?.name?.includes("University of California")) {
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
    });
  
  return cachedInstitutions;
}

function fuzzyMatchScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  
  const qWords = q.split(/\s+/);
  const matchedWords = qWords.filter(word => t.includes(word));
  if (matchedWords.length === qWords.length) return 70;
  if (matchedWords.length > 0) return 50 + (matchedWords.length / qWords.length) * 20;
  
  return 0;
}

const MAJOR_ALIASES: Record<string, string[]> = {
  "eecs": ["electrical engineering and computer sciences", "electrical engineering", "computer science", "eecs"],
  "cs": ["computer science", "computing", "comp sci"],
  "compsci": ["computer science", "computing"],
  "ee": ["electrical engineering"],
  "me": ["mechanical engineering"],
  "ce": ["civil engineering", "computer engineering"],
  "bio": ["biology", "biological sciences"],
  "chem": ["chemistry"],
  "phys": ["physics"],
  "math": ["mathematics"],
  "econ": ["economics"],
  "psych": ["psychology"],
  "poli sci": ["political science"],
  "polisci": ["political science"],
  "bus": ["business", "business administration"],
  "busadmin": ["business administration"],
};

function expandQueryWithAliases(query: string): string[] {
  const q = query.toLowerCase().trim();
  const expanded = [q];
  
  for (const [alias, expansions] of Object.entries(MAJOR_ALIASES)) {
    if (q.includes(alias) || alias.includes(q)) {
      expanded.push(...expansions);
    }
  }
  
  return [...new Set(expanded)];
}

async function executeFunction(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "search_institutions": {
        const { query } = args;
        if (!query || query.trim().length === 0) {
          return JSON.stringify({ error: "Please provide a school name to search for." });
        }
        
        const institutions = await fetchAllInstitutions();
        const q = query.toLowerCase().trim();
        
        const scored = institutions
          .map(inst => ({
            ...inst,
            score: Math.max(
              fuzzyMatchScore(q, inst.name),
              fuzzyMatchScore(q, inst.code)
            ),
          }))
          .filter(inst => inst.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        
        if (scored.length === 0) {
          return JSON.stringify({
            error: `No schools found matching "${query}". Please try the full official name (e.g., "De Anza College" or "University of California, Berkeley").`,
            suggestions: institutions.slice(0, 5).map(i => i.name),
          });
        }
        
        return JSON.stringify({
          matches: scored.map(({ id, code, name, type, isCommunityCollege }) => ({
            id,
            code,
            name,
            type,
            isCommunityCollege,
          })),
          note: scored.length > 1 ? `Found ${scored.length} matching schools. Please confirm which one you mean.` : undefined,
        });
      }
      
      case "get_agreements": {
        const { sendingInstitutionId, receivingInstitutionId } = args;
        const url = `${ASSIST_API_BASE}/agreements?receivingInstitutionId=${receivingInstitutionId}&sendingInstitutionId=${sendingInstitutionId}&academicYearId=74&categoryCode=major`;
        const response = await fetch(url);
        const data = await response.json();
        
        const agreements = data.reports?.map((r: any) => ({
          key: r.key,
          label: r.label,
        })) || [];
        
        if (agreements.length === 0) {
          return JSON.stringify({
            error: "No articulation agreements found between these schools.",
            message: "This could mean: (1) The schools don't have formal agreements for the current year, (2) Try checking ASSIST.org directly, or (3) One of the institution IDs might be incorrect.",
          });
        }
        
        return JSON.stringify({
          totalMajors: agreements.length,
          majors: agreements,
          note: `Found ${agreements.length} majors with articulation agreements.`,
        });
      }
      
      case "search_majors": {
        const { sendingInstitutionId, receivingInstitutionId, majorQuery } = args;
        const url = `${ASSIST_API_BASE}/agreements?receivingInstitutionId=${receivingInstitutionId}&sendingInstitutionId=${sendingInstitutionId}&academicYearId=74&categoryCode=major`;
        const response = await fetch(url);
        const data = await response.json();
        
        const agreements = data.reports?.map((r: any) => ({
          key: r.key,
          label: r.label,
        })) || [];
        
        if (agreements.length === 0) {
          return JSON.stringify({
            error: "No articulation agreements found between these schools.",
            message: "Cannot search for majors without articulation agreements.",
          });
        }
        
        const expandedQueries = expandQueryWithAliases(majorQuery);
        
        const scored = agreements
          .map((agreement: any) => {
            const maxScore = Math.max(
              ...expandedQueries.map(q => fuzzyMatchScore(q, agreement.label))
            );
            return { ...agreement, score: maxScore };
          })
          .filter((a: any) => a.score > 0)
          .sort((a: any, b: any) => b.score - a.score);
        
        if (scored.length === 0) {
          const sampleMajors = agreements.slice(0, 10).map((a: any) => a.label);
          return JSON.stringify({
            error: `No majors found matching "${majorQuery}".`,
            totalAvailableMajors: agreements.length,
            sampleMajors,
            suggestion: "Here are some available majors. Please pick one or try a different search term.",
          });
        }
        
        return JSON.stringify({
          query: majorQuery,
          matchCount: scored.length,
          topMatches: scored.slice(0, 5).map(({ key, label, score }: any) => ({ key, label, relevance: score > 80 ? "high" : score > 50 ? "medium" : "low" })),
          note: scored.length > 5 ? `Showing top 5 of ${scored.length} matches.` : undefined,
        });
      }
      
      case "get_articulation": {
        const { key } = args;
        const response = await fetch(`${ASSIST_API_BASE}/articulation/Agreements?Key=${encodeURIComponent(key)}`);
        const data = await response.json();
        const courses = parseArticulationDataForChat(data);
        
        if (courses.length === 0) {
          return JSON.stringify({
            error: "Could not parse course requirements from this agreement.",
            suggestion: "The agreement may have a different format. Please check ASSIST.org directly for detailed requirements.",
          });
        }
        
        return JSON.stringify({
          totalCourses: courses.length,
          courses: courses.slice(0, 25),
          note: courses.length > 25 ? `Showing first 25 of ${courses.length} courses.` : undefined,
        });
      }
      
      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    return JSON.stringify({ error: `Failed to execute ${name}. Please try again.` });
  }
}

function parseArticulationDataForChat(data: any): any[] {
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
                        code: `${course.prefix || ""} ${course.courseNumber}`.trim(),
                        title: course.courseTitle,
                        units: course.maxUnits || course.minUnits || 3,
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
  } catch (e) {
    console.error("Error parsing articulation data:", e);
  }
  return courses.filter((c, i, self) => i === self.findIndex((x) => x.code === c.code));
}

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

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(history || []),
        { role: "user", content: message },
      ];

      const openai = getOpenAIClient();

      let response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools,
        tool_choice: "auto",
      });

      let assistantMessage = response.choices[0].message;

      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        messages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const tc = toolCall as any;
          const functionName = tc.function.name;
          const functionArgs = JSON.parse(tc.function.arguments || "{}");
          
          console.log(`Executing function: ${functionName}`, functionArgs);
          const result = await executeFunction(functionName, functionArgs);
          
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools,
          tool_choice: "auto",
        });

        assistantMessage = response.choices[0].message;
      }

      res.json({
        message: assistantMessage.content || "I apologize, but I couldn't generate a response. Please try again.",
      });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
