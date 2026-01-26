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

const SYSTEM_PROMPT = `You are a helpful transfer advisor for California community college students. You have access to the ASSIST.org articulation database. Help students understand transfer requirements, plan their courses, and answer questions about UC/CSU transfers. Be encouraging and concise.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_institutions",
      description: "Get a list of California colleges and universities. Use this to look up school IDs when a student mentions a school name.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_agreements",
      description: "Get available majors/programs that have articulation agreements between two schools. Requires the sending institution ID (community college) and receiving institution ID (UC/CSU).",
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
        },
        required: ["sendingInstitutionId", "receivingInstitutionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_articulation",
      description: "Get the specific course requirements for a major/program articulation agreement. Requires the agreement key from get_agreements.",
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

async function executeFunction(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "get_institutions": {
        const response = await fetch(`${ASSIST_API_BASE}/institutions`);
        const data = await response.json();
        const institutions = data
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
            };
          });
        return JSON.stringify(institutions.slice(0, 50));
      }
      case "get_agreements": {
        const { sendingInstitutionId, receivingInstitutionId } = args;
        const url = `${ASSIST_API_BASE}/agreements?receivingInstitutionId=${receivingInstitutionId}&sendingInstitutionId=${sendingInstitutionId}&academicYearId=74&categoryCode=major`;
        const response = await fetch(url);
        const data = await response.json();
        const agreements = data.reports?.slice(0, 30).map((r: any) => ({
          key: r.key,
          label: r.label,
        })) || [];
        return JSON.stringify(agreements);
      }
      case "get_articulation": {
        const { key } = args;
        const response = await fetch(`${ASSIST_API_BASE}/articulation/Agreements?Key=${encodeURIComponent(key)}`);
        const data = await response.json();
        const courses = parseArticulationDataForChat(data);
        return JSON.stringify({ courses: courses.slice(0, 20) });
      }
      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    return JSON.stringify({ error: `Failed to execute ${name}` });
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
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || "{}");
          
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
