import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getUserProfile,
  getCourses,
  type UserProfile,
  type Course,
} from "@/lib/storage";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 120;
const RING_STROKE_WIDTH = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CircularProgress({ progress, theme }: { progress: number; theme: any }) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#EA580C" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={RING_STROKE_WIDTH}
          fill="transparent"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="url(#progressGradient)"
          strokeWidth={RING_STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <ThemedText type="h2" style={[styles.ringPercent, { color: theme.primary }]}>
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>
    </View>
  );
}

function AnimatedCounter({ value, color, suffix = "" }: { value: number; color: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  const updateDisplay = useCallback((val: number) => {
    setDisplayValue(Math.round(val));
  }, []);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    }, () => {
      runOnJS(updateDisplay)(value);
    });

    const interval = setInterval(() => {
      const current = animatedValue.value;
      if (current < value) {
        setDisplayValue(Math.round(current));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <ThemedText type="h2" style={{ color, fontFamily: "Nunito_700Bold" }}>
      {displayValue}{suffix}
    </ThemedText>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  gradientColors,
  delay,
  theme,
  suffix = "",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  gradientColors: [string, string];
  delay: number;
  theme: any;
  suffix?: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.statCardWrapper}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statCard, { borderColor: `${color}30` }]}
      >
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <AnimatedCounter value={value} color={theme.text} suffix={suffix} />
        <ThemedText
          type="small"
          style={[styles.statLabel, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}
        >
          {label}
        </ThemedText>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickActionCard({
  icon,
  label,
  gradientColors,
  onPress,
  delay,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  gradientColors: [string, string];
  onPress: () => void;
  delay: number;
  theme: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.quickActionWrapper}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.quickActionPressable,
          {
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.quickActionCard, { borderColor: theme.border }]}
        >
          <View style={[styles.quickActionIconBg, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Ionicons name={icon} size={24} color="#FFFFFF" />
          </View>
          <ThemedText
            type="small"
            style={[styles.quickActionLabel, { color: "#FFFFFF", fontFamily: "Nunito_600SemiBold" }]}
          >
            {label}
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function RecentActivityItem({
  course,
  delay,
  theme,
  isLast,
}: {
  course: Course;
  delay: number;
  theme: any;
  isLast: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={[
        styles.activityItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <View style={[styles.activityDot, { backgroundColor: theme.primary }]} />
      <View style={styles.activityContent}>
        <ThemedText
          type="body"
          numberOfLines={1}
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {course.code}
        </ThemedText>
        <ThemedText
          type="small"
          numberOfLines={1}
          style={{ color: theme.textSecondary, fontFamily: "Nunito_400Regular" }}
        >
          {course.title}
        </ThemedText>
      </View>
      <View style={styles.activityUnits}>
        <ThemedText type="small" style={{ color: theme.primary, fontFamily: "Nunito_600SemiBold" }}>
          {course.units} units
        </ThemedText>
      </View>
    </Animated.View>
  );
}

function EmptyActivityState({ theme }: { theme: any }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.primary}15` }]}>
        <Ionicons name="albums-outline" size={32} color={theme.primary} />
      </View>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}
      >
        No courses added yet
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, textAlign: "center", fontFamily: "Nunito_400Regular" }}
      >
        Add courses from transfer requirements to see them here
      </ThemedText>
    </View>
  );
}

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [userProfile, userCourses] = await Promise.all([
      getUserProfile(),
      getCourses(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const completedCourses = courses.filter((c) => c.completed);
  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  const completedUnits = completedCourses.reduce((sum, c) => sum + c.units, 0);
  const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;
  const recentCourses = courses.slice(-3).reverse();

  const greeting = getGreeting();
  const displayName = profile?.name || "Student";
  const motivationalMessage = getMotivationalMessage(progress);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["2xl"],
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <Animated.View entering={FadeInUp.delay(0).duration(500)}>
        <ThemedText type="h2" style={[styles.greeting, { fontFamily: "Nunito_700Bold" }]}>
          {greeting}, {displayName}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subGreeting, { color: theme.textSecondary, fontFamily: "Nunito_400Regular" }]}
        >
          {motivationalMessage}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.progressCardOuter}>
          {Platform.OS === "ios" ? (
            <BlurView intensity={40} tint="dark" style={styles.progressCardBlur}>
              <ProgressCardContent
                progress={progress}
                theme={theme}
                completedCourses={completedCourses.length}
                completedUnits={completedUnits}
                totalUnits={totalUnits}
                remainingCourses={courses.length - completedCourses.length}
              />
            </BlurView>
          ) : (
            <View style={[styles.progressCardFallback, { backgroundColor: "rgba(30, 41, 59, 0.9)" }]}>
              <ProgressCardContent
                progress={progress}
                theme={theme}
                completedCourses={completedCourses.length}
                completedUnits={completedUnits}
                totalUnits={totalUnits}
                remainingCourses={courses.length - completedCourses.length}
              />
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.statCardsRow}>
        <StatCard
          icon="checkmark-circle"
          label="Completed"
          value={completedCourses.length}
          color={theme.success}
          gradientColors={["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.05)"]}
          delay={200}
          theme={theme}
        />
        <StatCard
          icon="book"
          label="Units Done"
          value={completedUnits}
          color={theme.primary}
          gradientColors={["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.05)"]}
          delay={250}
          theme={theme}
        />
        <StatCard
          icon="time"
          label="Remaining"
          value={courses.length - completedCourses.length}
          color={theme.secondary}
          gradientColors={["rgba(59, 130, 246, 0.15)", "rgba(59, 130, 246, 0.05)"]}
          delay={300}
          theme={theme}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <ThemedText
          type="h3"
          style={[styles.sectionTitle, { fontFamily: "Nunito_700Bold" }]}
        >
          Quick Actions
        </ThemedText>
      </Animated.View>

      <View style={styles.quickActionsGrid}>
        <QuickActionCard
          icon="add-circle"
          label="Add Courses"
          gradientColors={["#F59E0B", "#EA580C"]}
          onPress={() => (navigation as any).navigate("RoadmapTab")}
          delay={400}
          theme={theme}
        />
        <QuickActionCard
          icon="school"
          label="Requirements"
          gradientColors={["#1E40AF", "#3B82F6"]}
          onPress={() => (navigation as any).navigate("SchoolsTab")}
          delay={450}
          theme={theme}
        />
        <QuickActionCard
          icon="chatbubble-ellipses"
          label="Ask Advisor"
          gradientColors={["#7C3AED", "#A855F7"]}
          onPress={() => (navigation as any).navigate("AlertsTab")}
          delay={500}
          theme={theme}
        />
        <QuickActionCard
          icon="calculator"
          label="GPA Calc"
          gradientColors={["#10B981", "#34D399"]}
          onPress={() => (navigation as any).navigate("ProfileTab")}
          delay={550}
          theme={theme}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <ThemedText
          type="h3"
          style={[styles.sectionTitle, { fontFamily: "Nunito_700Bold" }]}
        >
          Recent Activity
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(650).duration(400)}>
        <View style={[styles.activityCard, { backgroundColor: "rgba(30, 41, 59, 0.6)", borderColor: theme.border }]}>
          {recentCourses.length > 0 ? (
            recentCourses.map((course, index) => (
              <RecentActivityItem
                key={course.id}
                course={course}
                delay={700 + index * 50}
                theme={theme}
                isLast={index === recentCourses.length - 1}
              />
            ))
          ) : (
            <EmptyActivityState theme={theme} />
          )}
        </View>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

function ProgressCardContent({
  progress,
  theme,
  completedCourses,
  completedUnits,
  totalUnits,
  remainingCourses,
}: {
  progress: number;
  theme: any;
  completedCourses: number;
  completedUnits: number;
  totalUnits: number;
  remainingCourses: number;
}) {
  return (
    <View style={styles.progressCardContent}>
      <View style={styles.progressCardHeader}>
        <View>
          <ThemedText type="h3" style={{ fontFamily: "Nunito_700Bold" }}>
            Transfer Progress
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: 4, fontFamily: "Nunito_400Regular" }}
          >
            {completedUnits} of {totalUnits} units complete
          </ThemedText>
        </View>
        <CircularProgress progress={progress} theme={theme} />
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalMessage(progress: number): string {
  if (progress === 0) return "Let's start planning your transfer journey!";
  if (progress < 0.25) return "Great start! Keep building momentum.";
  if (progress < 0.5) return "You're making solid progress!";
  if (progress < 0.75) return "Keep it up! Over halfway there.";
  if (progress < 1) return "Almost there! The finish line is in sight.";
  return "Congratulations! You've completed your courses!";
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: Spacing.xs,
  },
  subGreeting: {
    marginBottom: Spacing["2xl"],
  },
  progressCardOuter: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressCardBlur: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressCardFallback: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  progressCardContent: {
    padding: Spacing.xl,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringPercent: {
    fontWeight: "700",
  },
  statCardsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statLabel: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  quickActionWrapper: {
    width: "48%",
    flexGrow: 1,
  },
  quickActionPressable: {
    flex: 1,
  },
  quickActionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    minHeight: 100,
    justifyContent: "center",
  },
  quickActionIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
  activityCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityUnits: {
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyText: {
    marginBottom: Spacing.xs,
  },
});
