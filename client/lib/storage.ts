import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: "onboarding_complete",
  USER_PROFILE: "user_profile",
  SELECTED_CC: "selected_cc",
  TARGET_UNIVERSITIES: "target_universities",
  COURSES: "courses",
  SEMESTERS: "semesters",
  QUARTERS: "quarters",
  ROADMAP_MODE: "roadmapMode",
  ALERTS: "alerts",
  CACHED_INSTITUTIONS: "cached_institutions",
  CHAT_HISTORY: "chatHistory",
  THEME: "theme",
  SELECTED_MAJORS: "selected_majors",
} as const;

export type RoadmapMode = "semester" | "quarter";

export interface UserProfile {
  name: string;
  communityCollegeId: number | null;
  communityCollegeName: string | null;
  targetUniversityIds: number[];
  gpa: number | null;
}

export interface Institution {
  id: number;
  code: string;
  name: string;
  type: "CC" | "CSU" | "UC";
  isCommunityCollege: boolean;
}

export type CourseStatus = "planned" | "in_progress" | "taken";
export type CourseGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "D-" | "F";

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  semesterId: string;
  completed: boolean;
  category: "major" | "ge" | "elective";
  transferable: boolean;
  notes?: string;
  status?: CourseStatus;
  grade?: CourseGrade;
}

export interface Semester {
  id: string;
  name: string;
  year: number;
  term: "Fall" | "Spring" | "Summer" | "Winter";
  order: number;
}

export interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    complete.toString()
  );
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getCourses(): Promise<Course[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.COURSES);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveCourses(courses: Course[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

export async function getSemesters(): Promise<Semester[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SEMESTERS);
    if (value) {
      return JSON.parse(value);
    }
    const defaultSemesters = generateDefaultSemesters();
    await saveSemesters(defaultSemesters);
    return defaultSemesters;
  } catch {
    return generateDefaultSemesters();
  }
}

export async function saveSemesters(semesters: Semester[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
}

export async function getQuarters(): Promise<Semester[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.QUARTERS);
    if (value) {
      return JSON.parse(value);
    }
    const defaultQuarters = generateDefaultQuarters();
    await saveQuarters(defaultQuarters);
    return defaultQuarters;
  } catch {
    return generateDefaultQuarters();
  }
}

export async function saveQuarters(quarters: Semester[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.QUARTERS, JSON.stringify(quarters));
}

export async function getRoadmapMode(): Promise<RoadmapMode> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAP_MODE);
    return (value as RoadmapMode) || "semester";
  } catch {
    return "semester";
  }
}

export async function saveRoadmapMode(mode: RoadmapMode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ROADMAP_MODE, mode);
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
}

export async function getCachedInstitutions(): Promise<Institution[] | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_INSTITUTIONS);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function saveCachedInstitutions(institutions: Institution[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.CACHED_INSTITUTIONS,
    JSON.stringify(institutions)
  );
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
}

export async function clearAllData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  if (allKeys.length > 0) {
    await AsyncStorage.multiRemove(allKeys as string[]);
  }
}

export type ThemePreference = "light" | "dark" | "system";

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (value as ThemePreference) || "dark";
  } catch {
    return "dark";
  }
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export const GRADE_POINTS: Record<CourseGrade, number> = {
  "A+": 4.0,
  "A": 4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D": 1.0,
  "D-": 0.7,
  "F": 0.0,
};

export function calculateGPA(courses: Course[]): { gpa: number; totalUnits: number } {
  const takenCourses = courses.filter(c => c.status === "taken" && c.grade);
  if (takenCourses.length === 0) return { gpa: 0, totalUnits: 0 };
  
  let totalPoints = 0;
  let totalUnits = 0;
  
  for (const course of takenCourses) {
    if (course.grade) {
      totalPoints += GRADE_POINTS[course.grade] * course.units;
      totalUnits += course.units;
    }
  }
  
  return {
    gpa: totalUnits > 0 ? totalPoints / totalUnits : 0,
    totalUnits,
  };
}

function generateDefaultSemesters(): Semester[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  const semesters: Semester[] = [];
  
  for (let i = 0; i < 6; i++) {
    const semesterYear = startYear + Math.floor((i + 1) / 2);
    const term = i % 2 === 0 ? "Fall" : "Spring";
    semesters.push({
      id: `sem-${i + 1}`,
      name: `${term} ${semesterYear}`,
      year: semesterYear,
      term: term as "Fall" | "Spring",
      order: i,
    });
  }
  
  return semesters;
}

function generateDefaultQuarters(): Semester[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const quarters: Semester[] = [];
  const terms: Array<"Fall" | "Winter" | "Spring" | "Summer"> = ["Fall", "Winter", "Spring", "Summer"];
  
  let order = 0;
  for (let yearOffset = 0; yearOffset < 2; yearOffset++) {
    for (const term of terms) {
      const quarterYear = term === "Fall" ? startYear + yearOffset : startYear + yearOffset + 1;
      const academicYear = term === "Fall" ? startYear + yearOffset : startYear + yearOffset;
      quarters.push({
        id: `qtr-${order + 1}`,
        name: `${term} ${quarterYear}`,
        year: quarterYear,
        term,
        order,
      });
      order++;
    }
  }
  
  return quarters;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export interface SelectedMajor {
  label: string;
  key: string;
  sendingId: number;
  receivingId: number;
  receivingName: string;
}

interface SelectedMajorsMap {
  [universityId: string]: SelectedMajor;
}

export async function getSelectedMajor(receivingId: number): Promise<SelectedMajor | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MAJORS);
    if (!value) return null;
    const majorsMap: SelectedMajorsMap = JSON.parse(value);
    return majorsMap[receivingId.toString()] || null;
  } catch {
    return null;
  }
}

export async function saveSelectedMajor(major: SelectedMajor): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MAJORS);
    const majorsMap: SelectedMajorsMap = value ? JSON.parse(value) : {};
    majorsMap[major.receivingId.toString()] = major;
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MAJORS, JSON.stringify(majorsMap));
  } catch (err) {
    console.error("Error saving selected major:", err);
  }
}

export async function clearSelectedMajor(receivingId: number): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MAJORS);
    if (!value) return;
    const majorsMap: SelectedMajorsMap = JSON.parse(value);
    delete majorsMap[receivingId.toString()];
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MAJORS, JSON.stringify(majorsMap));
  } catch (err) {
    console.error("Error clearing selected major:", err);
  }
}
