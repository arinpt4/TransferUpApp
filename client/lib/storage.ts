import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: "onboarding_complete",
  USER_PROFILE: "user_profile",
  SELECTED_CC: "selected_cc",
  TARGET_UNIVERSITIES: "target_universities",
  COURSES: "courses",
  SEMESTERS: "semesters",
  ALERTS: "alerts",
  CACHED_INSTITUTIONS: "cached_institutions",
} as const;

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
}

export interface Semester {
  id: string;
  name: string;
  year: number;
  term: "Fall" | "Spring" | "Summer";
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

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
