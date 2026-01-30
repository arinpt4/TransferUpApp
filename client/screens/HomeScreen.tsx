import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  getUserProfile,
  getCourses,
  getSemesters,
  getQuarters,
  getRoadmapMode,
  type UserProfile,
  type Course,
  type Semester,
} from "@/lib/storage";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GIANT_RING_SIZE = 256;
const GIANT_RING_STROKE = 12;
const GIANT_RING_RADIUS = (GIANT_RING_SIZE - GIANT_RING_STROKE) / 2;
const GIANT_RING_CIRCUMFERENCE = 2 * Math.PI * GIANT_RING_RADIUS;

function GiantCircularProgress({ progress, theme }: { progress: number; theme: any }) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = GIANT_RING_CIRCUMFERENCE * (1 - animatedProgress.value);
    return { strokeDashoffset };
  });

  return (
    <View style={styles.giantRingContainer}>
      <View style={styles.giantRingGlow} />
      <Svg width={GIANT_RING_SIZE} height={GIANT_RING_SIZE}>
        <Defs>
          <SvgGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#2563EB" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={GIANT_RING_SIZE / 2}
          cy={GIANT_RING_SIZE / 2}
          r={GIANT_RING_RADIUS}
          stroke="#1E293B"
          strokeWidth={GIANT_RING_STROKE}
          fill="transparent"
        />
        <AnimatedCircle
          cx={GIANT_RING_SIZE / 2}
          cy={GIANT_RING_SIZE / 2}
          r={GIANT_RING_RADIUS}
          stroke="url(#blueGradient)"
          strokeWidth={GIANT_RING_STROKE}
          fill="transparent"
          strokeDasharray={GIANT_RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${GIANT_RING_SIZE / 2}, ${GIANT_RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.giantRingCenter}>
        <ThemedText style={styles.giantRingPercent}>
          {Math.round(progress * 100)}%
        </ThemedText>
        <ThemedText style={styles.giantRingLabel}>Complete</ThemedText>
      </View>
    </View>
  );
}

function MiniStatCard({
  label,
  value,
  valueColor,
  delay,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.miniStatCard}
    >
      <ThemedText style={[styles.miniStatValue, { color: valueColor }]}>
        {value}
      </ThemedText>
      <ThemedText style={styles.miniStatLabel}>{label}</ThemedText>
    </Animated.View>
  );
}

function CourseCard({
  course,
  period,
  delay,
  theme,
}: {
  course: Course;
  period?: Semester;
  delay: number;
  theme: any;
}) {
  const isInProgress = course.status === "in_progress";
  const isPlanned = course.status === "planned" || !course.status;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.courseCard}
    >
      <View style={styles.courseCardRow}>
        <View
          style={[
            styles.courseIconContainer,
            isInProgress
              ? styles.courseIconInProgress
              : styles.courseIconPlanned,
          ]}
        >
          <Feather
            name="book-open"
            size={20}
            color={isInProgress ? "#FFFFFF" : "#64748B"}
          />
        </View>
        <View style={styles.courseCardContent}>
          <View style={styles.courseCardHeader}>
            <ThemedText style={styles.courseCode}>{course.code}</ThemedText>
            <View
              style={[
                styles.statusBadge,
                isInProgress ? styles.statusBadgeInProgress : styles.statusBadgePlanned,
              ]}
            >
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: isInProgress ? "#60A5FA" : "#64748B" },
                ]}
              >
                {isInProgress ? "In Progress" : "Planned"}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.courseTitle} numberOfLines={1}>
            {course.title}
          </ThemedText>
          <View style={styles.courseCardFooter}>
            <ThemedText style={styles.courseUnits}>{course.units} units</ThemedText>
            {isInProgress ? (
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: "50%" }]}
                />
              </View>
            ) : period ? (
              <ThemedText style={styles.coursePeriod}>{period.name}</ThemedText>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function QuickActionButton({
  icon,
  label,
  description,
  onPress,
  delay,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.quickActionButton,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={["#2563EB", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIconContainer}>
            <Feather name={icon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionTextContainer}>
            <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
            <ThemedText style={styles.quickActionDescription}>{description}</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color="#93C5FD" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [periods, setPeriods] = useState<Semester[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [userProfile, userCourses, mode] = await Promise.all([
      getUserProfile(),
      getCourses(),
      getRoadmapMode(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);

    const userPeriods = mode === "quarter" ? await getQuarters() : await getSemesters();
    setPeriods(userPeriods);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const completedCourses = courses.filter((c) => c.completed || c.status === "taken");
  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  const completedUnits = completedCourses.reduce((sum, c) => sum + c.units, 0);
  const remainingUnits = totalUnits - completedUnits;
  const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;

  const upcomingCourses = courses
    .filter((c) => c.status === "in_progress" || c.status === "planned" || !c.status)
    .slice(0, 3);

  const displayName = profile?.name || "Student";
  const ccName = profile?.communityCollegeName || "Community College";
  const targetUni = "Target University";

  const getPeriodForCourse = (course: Course) => {
    return periods.find((p) => p.id === course.semesterId);
  };

  const calculateGPA = () => {
    const gradePoints: Record<string, number> = {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
      "D+": 1.3, "D": 1.0, "D-": 0.7,
      "F": 0.0,
    };
    const gradedCourses = courses.filter((c) => c.grade && gradePoints[c.grade] !== undefined);
    if (gradedCourses.length === 0) return "N/A";
    const totalPoints = gradedCourses.reduce(
      (sum, c) => sum + (gradePoints[c.grade!] || 0) * c.units,
      0
    );
    const totalUnits = gradedCourses.reduce((sum, c) => sum + c.units, 0);
    return (totalPoints / totalUnits).toFixed(2);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <View style={styles.headerTextContainer}>
          <ThemedText style={styles.greeting}>Hey, {displayName}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {ccName} → {targetUni}
          </ThemedText>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            (navigation as any).navigate("ProfileTab");
          }}
        >
          <Feather name="settings" size={20} color="#94A3B8" />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <GiantCircularProgress progress={progress} theme={theme} />
      </Animated.View>

      <View style={styles.miniStatsRow}>
        <MiniStatCard
          label="Units Done"
          value={completedUnits}
          valueColor="#FFFFFF"
          delay={200}
        />
        <MiniStatCard
          label="Current GPA"
          value={calculateGPA()}
          valueColor="#34D399"
          delay={250}
        />
        <MiniStatCard
          label="Remaining"
          value={remainingUnits}
          valueColor="#60A5FA"
          delay={300}
        />
      </View>

      {upcomingCourses.length > 0 ? (
        <>
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <ThemedText style={styles.sectionTitle}>Coming Up</ThemedText>
          </Animated.View>

          <View style={styles.coursesContainer}>
            {upcomingCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                period={getPeriodForCourse(course)}
                delay={400 + index * 50}
                theme={theme}
              />
            ))}
          </View>
        </>
      ) : null}

      <Animated.View entering={FadeInDown.delay(550).duration(400)}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
      </Animated.View>

      <View style={styles.quickActionsContainer}>
        <QuickActionButton
          icon="file-text"
          label="Requirements"
          description="View transfer requirements"
          onPress={() => (navigation as any).navigate("SchoolsTab")}
          delay={600}
        />
        <QuickActionButton
          icon="message-circle"
          label="Ask Advisor"
          description="Get AI transfer guidance"
          onPress={() => (navigation as any).navigate("AlertsTab")}
          delay={650}
        />
        <QuickActionButton
          icon="bar-chart-2"
          label="GPA Calculator"
          description="Calculate your GPA"
          onPress={() => (navigation as any).navigate("GPACalculator")}
          delay={700}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing["2xl"],
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  giantRingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
    position: "relative",
  },
  giantRingGlow: {
    position: "absolute",
    width: GIANT_RING_SIZE + 60,
    height: GIANT_RING_SIZE + 60,
    borderRadius: (GIANT_RING_SIZE + 60) / 2,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  giantRingCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  giantRingPercent: {
    fontSize: 48,
    fontWeight: "700",
    color: "#60A5FA",
  },
  giantRingLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  miniStatsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  miniStatLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coursesContainer: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  courseCard: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  courseCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  courseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  courseIconInProgress: {
    backgroundColor: "#2563EB",
  },
  courseIconPlanned: {
    backgroundColor: "#1E293B",
  },
  courseCardContent: {
    flex: 1,
  },
  courseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeInProgress: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  statusBadgePlanned: {
    backgroundColor: "#1E293B",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  courseTitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: Spacing.sm,
  },
  courseCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseUnits: {
    fontSize: 12,
    color: "#64748B",
  },
  coursePeriod: {
    fontSize: 12,
    color: "#64748B",
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "#1E293B",
    borderRadius: 2,
    marginLeft: Spacing.md,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  quickActionsContainer: {
    gap: Spacing.md,
  },
  quickActionButton: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.blue,
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quickActionDescription: {
    fontSize: 12,
    color: "#93C5FD",
    marginTop: 2,
  },
});
