import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
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
  getCachedInstitutions,
  type UserProfile,
  type Course,
  type Semester,
  type Institution,
} from "@/lib/storage";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GIANT_RING_SIZE = 200;
const GIANT_RING_STROKE = 14;
const GIANT_RING_RADIUS = (GIANT_RING_SIZE - GIANT_RING_STROKE) / 2;
const GIANT_RING_CIRCUMFERENCE = 2 * Math.PI * GIANT_RING_RADIUS;

function GiantCircularProgress({ 
  progress, 
  theme, 
  isDark 
}: { 
  progress: number; 
  theme: any;
  isDark: boolean;
}) {
  const animatedProgress = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);

  useEffect(() => {
    scaleValue.value = withSpring(1, { damping: 12, stiffness: 100 });
    animatedProgress.value = withDelay(
      300,
      withTiming(progress, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = GIANT_RING_CIRCUMFERENCE * (1 - animatedProgress.value);
    return { strokeDashoffset };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: interpolate(scaleValue.value, [0.8, 1], [0, 1]),
  }));

  const bgCircleColor = isDark ? "#1E293B" : "#CBD5E1";

  return (
    <Animated.View style={[styles.giantRingContainer, animatedContainerStyle]}>
      <View style={styles.glowEffect} />
      <Svg width={GIANT_RING_SIZE} height={GIANT_RING_SIZE}>
        <Defs>
          <SvgGradient id="blueGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1D4ED8" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#93C5FD" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={GIANT_RING_SIZE / 2}
          cy={GIANT_RING_SIZE / 2}
          r={GIANT_RING_RADIUS}
          stroke={bgCircleColor}
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
        <ThemedText style={[styles.giantRingPercent, { color: theme.primary }]}>
          {Math.round(progress * 100)}%
        </ThemedText>
        <ThemedText style={[styles.giantRingLabel, { color: theme.textSecondary }]}>
          Complete
        </ThemedText>
      </View>
    </Animated.View>
  );
}

function MiniStatCard({
  label,
  value,
  valueColor,
  delay,
  theme,
  isDark,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  delay: number;
  theme: any;
  isDark: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={[
        styles.miniStatCard,
        {
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.9)",
          borderColor: theme.border,
        },
      ]}
    >
      <ThemedText style={[styles.miniStatValue, { color: valueColor }]}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.miniStatLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </Animated.View>
  );
}

function CourseCard({
  course,
  period,
  delay,
  theme,
  isDark,
}: {
  course: Course;
  period?: Semester;
  delay: number;
  theme: any;
  isDark: boolean;
}) {
  const isInProgress = course.status === "in_progress";

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.courseCard,
        {
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.courseCardRow}>
        <View
          style={[
            styles.courseIconContainer,
            {
              backgroundColor: isInProgress 
                ? theme.primary 
                : isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          <Feather
            name="book-open"
            size={16}
            color={isInProgress ? "#FFFFFF" : theme.textSecondary}
          />
        </View>
        <View style={styles.courseCardContent}>
          <View style={styles.courseCardHeader}>
            <ThemedText style={[styles.courseCode, { color: theme.text }]}>
              {course.code}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isInProgress 
                    ? "rgba(59, 130, 246, 0.1)" 
                    : isDark ? "#1E293B" : "#E2E8F0",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: isInProgress ? "#60A5FA" : theme.textSecondary },
                ]}
              >
                {isInProgress ? "In Progress" : "Planned"}
              </ThemedText>
            </View>
          </View>
          <ThemedText 
            style={[styles.courseTitle, { color: theme.textSecondary }]} 
            numberOfLines={1}
          >
            {course.title}
          </ThemedText>
          <View style={styles.courseCardFooter}>
            <ThemedText style={[styles.courseUnits, { color: theme.textTertiary }]}>
              {course.units} units
            </ThemedText>
            {isInProgress ? (
              <View 
                style={[
                  styles.progressBarContainer, 
                  { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" }
                ]}
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: "50%" }]}
                />
              </View>
            ) : period ? (
              <ThemedText style={[styles.coursePeriod, { color: theme.textTertiary }]}>
                {period.name}
              </ThemedText>
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
  isDark,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  delay: number;
  isDark: boolean;
}) {
  const gradientColors: [string, string] = isDark 
    ? ["#2563EB", "#1D4ED8"] 
    : ["#3B82F6", "#2563EB"];

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
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIconContainer}>
            <Feather name={icon} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.quickActionTextContainer}>
            <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
            <ThemedText style={styles.quickActionDescription}>{description}</ThemedText>
          </View>
          <Feather name="chevron-right" size={18} color="#93C5FD" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [periods, setPeriods] = useState<Semester[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [userProfile, userCourses, mode, cachedInstitutions] = await Promise.all([
      getUserProfile(),
      getCourses(),
      getRoadmapMode(),
      getCachedInstitutions(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);
    if (cachedInstitutions) {
      setInstitutions(cachedInstitutions);
    }

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
  
  const getTargetUniversityName = () => {
    const targetIds = profile?.targetUniversityIds || [];
    if (targetIds.length === 0) return "Select a Target";
    const targetInstitution = institutions.find((i) => i.id === targetIds[0]);
    if (targetInstitution) {
      if (targetIds.length > 1) {
        return `${targetInstitution.name} +${targetIds.length - 1}`;
      }
      return targetInstitution.name;
    }
    return "Target University";
  };
  const targetUni = getTargetUniversityName();

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
    const totalGradedUnits = gradedCourses.reduce((sum, c) => sum + c.units, 0);
    return (totalPoints / totalGradedUnits).toFixed(2);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.md,
        paddingBottom: tabBarHeight + Spacing.lg,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.delay(100).duration(600)} 
        style={styles.header}
      >
        <View style={styles.headerTextContainer}>
          <ThemedText style={[styles.greeting, { color: theme.text }]}>
            Hey, {displayName}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {ccName} → {targetUni}
          </ThemedText>
        </View>
        <Animated.View entering={ZoomIn.delay(200).duration(400)}>
          <Pressable
            style={[
              styles.settingsButton,
              {
                backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              (navigation as any).navigate("ProfileTab");
            }}
          >
            <Feather name="settings" size={20} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <GiantCircularProgress progress={progress} theme={theme} isDark={isDark} />

      <Animated.View 
        entering={FadeInDown.delay(400).duration(500)} 
        style={styles.miniStatsRow}
      >
        <MiniStatCard
          label="Units Done"
          value={completedUnits}
          valueColor={theme.text}
          delay={450}
          theme={theme}
          isDark={isDark}
        />
        <MiniStatCard
          label="Current GPA"
          value={calculateGPA()}
          valueColor="#34D399"
          delay={500}
          theme={theme}
          isDark={isDark}
        />
        <MiniStatCard
          label="Remaining"
          value={remainingUnits}
          valueColor={theme.primary}
          delay={550}
          theme={theme}
          isDark={isDark}
        />
      </Animated.View>

      {upcomingCourses.length > 0 ? (
        <>
          <Animated.View entering={FadeInDown.delay(600).duration(400)}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Coming Up
            </ThemedText>
          </Animated.View>

          <View style={styles.coursesContainer}>
            {upcomingCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                period={getPeriodForCourse(course)}
                delay={650 + index * 80}
                theme={theme}
                isDark={isDark}
              />
            ))}
          </View>
        </>
      ) : null}

      <Animated.View entering={FadeInDown.delay(850).duration(400)}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Quick Actions
        </ThemedText>
      </Animated.View>

      <View style={styles.quickActionsContainer}>
        <QuickActionButton
          icon="file-text"
          label="Requirements"
          description="View transfer requirements"
          onPress={() => (navigation as any).navigate("SchoolsTab")}
          delay={900}
          isDark={isDark}
        />
        <QuickActionButton
          icon="message-circle"
          label="Ask Advisor"
          description="Get AI transfer guidance"
          onPress={() => (navigation as any).navigate("AlertsTab")}
          delay={980}
          isDark={isDark}
        />
        <QuickActionButton
          icon="bar-chart-2"
          label="GPA Calculator"
          description="Calculate your GPA"
          onPress={() => (navigation as any).navigate("GPACalculator")}
          delay={1060}
          isDark={isDark}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "600",
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  giantRingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    width: GIANT_RING_SIZE,
    height: GIANT_RING_SIZE,
    alignSelf: "center",
  },
  glowEffect: {
    position: "absolute",
    width: GIANT_RING_SIZE - 32,
    height: GIANT_RING_SIZE - 32,
    borderRadius: (GIANT_RING_SIZE - 32) / 2,
    backgroundColor: "rgba(59, 130, 246, 0.03)",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 25,
  },
  giantRingCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  giantRingPercent: {
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 46,
  },
  giantRingLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  miniStatsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  miniStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  miniStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coursesContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  courseCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  courseCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  courseIconContainer: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
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
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  courseTitle: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  courseCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseUnits: {
    fontSize: 12,
  },
  coursePeriod: {
    fontSize: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginLeft: Spacing.md,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  quickActionsContainer: {
    gap: Spacing.sm,
  },
  quickActionButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.blue,
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  quickActionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quickActionDescription: {
    fontSize: 11,
    color: "#93C5FD",
    marginTop: 1,
  },
});
