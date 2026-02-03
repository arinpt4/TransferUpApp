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

interface RoadmapCourseInfo {
  code: string;
  title: string;
  units: number;
  grade?: string;
  semester?: string;
}

interface RoadmapData {
  completedCourses: RoadmapCourseInfo[];
  inProgressCourses: RoadmapCourseInfo[];
  plannedCourses: RoadmapCourseInfo[];
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  plannedUnits: number;
  calculatedGPA: number;
}

interface SelectedMajor {
  label: string;
  key: string;
  sendingId: number;
  receivingId: number;
  receivingName: string;
}

interface UserContext {
  communityCollegeId: number | null;
  communityCollegeName: string | null;
  targetUniversities: { id: number; name: string }[];
  gpa: number | null;
  roadmap: RoadmapData | null;
  selectedMajors: SelectedMajor[];
}

function buildSystemPrompt(userContext?: UserContext): string {
  let contextSection = "";
  
  if (userContext) {
    const ccInfo = userContext.communityCollegeName 
      ? `Community College: ${userContext.communityCollegeName} (ID: ${userContext.communityCollegeId})`
      : "Community College: Not selected yet";
    
    const targetInfo = userContext.targetUniversities.length > 0
      ? `Target Universities: ${userContext.targetUniversities.map(u => `${u.name} (ID: ${u.id})`).join(", ")}`
      : "Target Universities: Not selected yet";
    
    const majorsInfo = userContext.selectedMajors && userContext.selectedMajors.length > 0
      ? `Selected Majors: ${userContext.selectedMajors.map(m => `${m.label} at ${m.receivingName}`).join("; ")}`
      : "Selected Majors: None selected yet";
    
    let roadmapSection = "";
    if (userContext.roadmap) {
      const r = userContext.roadmap;
      
      const completedList = r.completedCourses.length > 0
        ? r.completedCourses.map(c => `  - ${c.code}: ${c.title} (${c.units} units${c.grade ? `, Grade: ${c.grade}` : ""})`).join("\n")
        : "  (None yet)";
      
      const inProgressList = r.inProgressCourses.length > 0
        ? r.inProgressCourses.map(c => `  - ${c.code}: ${c.title} (${c.units} units)`).join("\n")
        : "  (None)";
      
      const plannedList = r.plannedCourses.length > 0
        ? r.plannedCourses.map(c => `  - ${c.code}: ${c.title} (${c.units} units, ${c.semester})`).join("\n")
        : "  (None)";
      
      const gpaDisplay = r.calculatedGPA > 0 ? r.calculatedGPA.toFixed(2) : "N/A";
      
      roadmapSection = `

STUDENT'S COURSE PROGRESS:
Current GPA: ${gpaDisplay}
Total Units in Roadmap: ${r.totalUnits} (Completed: ${r.completedUnits}, In Progress: ${r.inProgressUnits}, Planned: ${r.plannedUnits})

COMPLETED COURSES (${r.completedCourses.length}):
${completedList}

IN PROGRESS COURSES (${r.inProgressCourses.length}):
${inProgressList}

PLANNED COURSES (${r.plannedCourses.length}):
${plannedList}`;
    }
    
    contextSection = `
=== STUDENT PROFILE ===
${ccInfo}
${targetInfo}
${majorsInfo}
${roadmapSection}

=== CRITICAL INSTRUCTIONS ===
1. You ALREADY HAVE all their course data above. DO NOT ask them to list their completed or planned courses.
2. When they ask "What courses do I still need?", analyze their completed/in-progress courses against their major requirements using the ASSIST.org tools.
3. When they ask about their GPA, use the calculated GPA above.
4. When they ask about progress, calculate and tell them exactly how many more courses/units they need.
5. Be PROACTIVE: suggest what they should take next semester based on prerequisites and their current plan.
6. Reference SPECIFIC courses they've completed or need to take by name and code.
7. Warn about any gaps, missing prerequisites, or potential issues in their plan.
`;
  }

  return `You are an expert transfer advisor for California community college students. You have full access to:
1. The ASSIST.org articulation database (course equivalencies between schools)
2. The student's complete course history, progress, and planned courses (shown below)

${contextSection}

ADVISOR CAPABILITIES:
- Answer questions using their actual course data without asking them to list courses
- Look up transfer requirements from ASSIST.org using the tools provided
- Calculate remaining courses/units needed for transfer
- Suggest optimal course sequences based on prerequisites
- Identify potential problems or gaps in their transfer plan
- Provide GPA calculations and projections

IMPORTANT WORKFLOW:
1. If you have the user's school context above, use those institution IDs directly when calling get_agreements, search_majors, or get_articulation.
2. When a student mentions a DIFFERENT school name, use search_institutions to find the correct institution ID.
3. School codes are internal - students will give you school names. Be flexible with names (e.g., "UC Berkeley" = "University of California, Berkeley").
4. When searching for majors, use search_majors with flexible matching. Major names vary across institutions (e.g., "EECS" vs "Electrical Engineering and Computer Sciences").
5. If multiple schools match a search, ask the student to clarify.
6. If no articulation agreements exist, explain clearly and suggest alternatives.

Be encouraging, specific, and actionable. Provide concrete advice based on their actual progress.`;
}

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
  const fullCourses = parseArticulationData(data);
  return fullCourses.map(c => ({
    code: c.code,
    title: c.title,
    units: c.units,
  }));
}

interface ParsedCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  department: string;
  transferable: boolean;
  source: string;
}

interface ArticulationAgreement {
  id: string;
  receivingCourses: ParsedCourse[];
  sendingCourses: ParsedCourse[];
  conjunction: string;
  noArticulation: boolean;
}

function extractCoursesFromCell(cell: any): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  
  const addCourse = (course: any) => {
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
  };
  
  // Handle single Course type
  if (cell.type === "Course" && cell.course) {
    addCourse(cell.course);
  }
  
  // Handle Series type (most common in ASSIST.org)
  if (cell.type === "Series" && cell.series?.courses) {
    for (const course of cell.series.courses) {
      addCourse(course);
    }
  }
  
  // Handle direct courses array on cell
  if (cell.courses && Array.isArray(cell.courses)) {
    for (const course of cell.courses) {
      addCourse(course);
    }
  }
  
  // Handle GroupSeries with multiple series
  if (cell.type === "GroupSeries" && cell.groupSeries) {
    for (const group of cell.groupSeries) {
      if (group.courses) {
        for (const course of group.courses) {
          addCourse(course);
        }
      }
    }
  }
  
  return courses;
}

function parseArticulationAgreements(data: any): ArticulationAgreement[] {
  const agreements: ArticulationAgreement[] = [];
  
  try {
    const result = data?.result;
    if (!result) {
      return agreements;
    }

    // Parse the articulations property - this contains actual course-to-course mappings
    let articulations = result.articulations;
    if (!articulations) {
      return agreements;
    }
    
    // Parse if it's a string
    if (typeof articulations === "string") {
      articulations = JSON.parse(articulations);
    }
    
    if (!Array.isArray(articulations)) {
      return agreements;
    }

    for (let i = 0; i < articulations.length; i++) {
      const entry = articulations[i];
      const art = entry.articulation;
      
      if (!art) continue;
      
      // Extract receiving (university) course
      const receivingCourses: ParsedCourse[] = [];
      if (art.course) {
        const course = art.course;
        receivingCourses.push({
          id: `${course.prefix || ""}${course.courseNumber}`,
          code: `${course.prefix || ""} ${course.courseNumber}`.trim(),
          title: course.courseTitle || "",
          units: course.maxUnits || course.minUnits || 3,
          department: course.department || course.prefixDescription || "",
          transferable: true,
          source: "ASSIST",
        });
      }
      
      // Extract sending (CC) courses from sendingArticulation
      const sendingCourses: ParsedCourse[] = [];
      const sendingArt = art.sendingArticulation;
      
      if (sendingArt?.items) {
        for (const item of sendingArt.items) {
          // items can contain nested items (for AND/OR groups) or direct courses
          if (item.items) {
            for (const subItem of item.items) {
              if (subItem.courseNumber) {
                sendingCourses.push({
                  id: `${subItem.prefix || ""}${subItem.courseNumber}`,
                  code: `${subItem.prefix || ""} ${subItem.courseNumber}`.trim(),
                  title: subItem.courseTitle || "",
                  units: subItem.maxUnits || subItem.minUnits || 3,
                  department: subItem.department || subItem.prefixDescription || "",
                  transferable: true,
                  source: "ASSIST",
                });
              }
            }
          } else if (item.courseNumber) {
            sendingCourses.push({
              id: `${item.prefix || ""}${item.courseNumber}`,
              code: `${item.prefix || ""} ${item.courseNumber}`.trim(),
              title: item.courseTitle || "",
              units: item.maxUnits || item.minUnits || 3,
              department: item.department || item.prefixDescription || "",
              transferable: true,
              source: "ASSIST",
            });
          }
        }
      }
      
      const noArticulation = sendingArt?.noArticulationReason !== null || 
        (receivingCourses.length > 0 && sendingCourses.length === 0);
      
      // Get conjunction from sendingArticulation items
      const conjunction = sendingArt?.items?.[0]?.courseConjunction || "AND";
      
      if (receivingCourses.length > 0) {
        agreements.push({
          id: `agreement-${i}`,
          receivingCourses,
          sendingCourses,
          conjunction,
          noArticulation,
        });
      }
    }
    
  } catch (e) {
    console.error("Error parsing articulation agreements:", e);
  }

  return agreements;
}

function parseArticulationData(data: any): any[] {
  const agreements = parseArticulationAgreements(data);
  const courses: any[] = [];
  
  for (const agreement of agreements) {
    for (const course of agreement.sendingCourses) {
      if (!courses.some(c => c.code === course.code)) {
        courses.push(course);
      }
    }
    for (const course of agreement.receivingCourses) {
      if (!courses.some(c => c.code === course.code)) {
        courses.push(course);
      }
    }
  }
  
  return courses;
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
      const agreements = parseArticulationAgreements(data);
      
      res.json({
        raw: data,
        courses: parsedCourses,
        agreements: agreements,
      });
    } catch (error) {
      console.error("Error fetching articulation:", error);
      res.status(500).json({ error: "Failed to fetch articulation details" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, userContext } = req.body;

      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const systemPrompt = buildSystemPrompt(userContext);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
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
