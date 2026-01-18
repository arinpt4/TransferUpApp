import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { AlertCard } from "@/components/AlertCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getUserProfile,
  getCourses,
  getAlerts,
  saveAlerts,
  type UserProfile,
  type Course,
  type Alert,
} from "@/lib/storage";

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [userProfile, userCourses, userAlerts] = await Promise.all([
      getUserProfile(),
      getCourses(),
      getAlerts(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);
    setAlerts(userAlerts.filter((a) => !a.dismissed));
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

  const dismissAlert = async (alertId: string) => {
    const allAlerts = await getAlerts();
    const updatedAlerts = allAlerts.map((a) =>
      a.id === alertId ? { ...a, dismissed: true } : a
    );
    await saveAlerts(updatedAlerts);
    setAlerts(updatedAlerts.filter((a) => !a.dismissed));
  };

  const completedCourses = courses.filter((c) => c.completed);
  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  const completedUnits = completedCourses.reduce((sum, c) => sum + c.units, 0);
  const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;

  const greeting = getGreeting();
  const displayName = profile?.name || "Student";

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["2xl"],
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <ThemedText type="h2" style={styles.greeting}>
          {greeting}, {displayName}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subGreeting, { color: theme.textSecondary }]}
        >
          {getMotivationalMessage(progress)}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Card
          elevation={1}
          style={[styles.progressCard, { borderColor: theme.border }]}
        >
          <View style={styles.progressHeader}>
            <ThemedText type="h3">Transfer Progress</ThemedText>
            <ThemedText
              type="h2"
              style={[styles.progressPercent, { color: theme.primary }]}
            >
              {Math.round(progress * 100)}%
            </ThemedText>
          </View>
          <ProgressBar progress={progress} height={10} showGlow />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="h3" style={{ color: theme.success }}>
                {completedCourses.length}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Courses Done
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                {completedUnits}/{totalUnits}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Units
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h3" style={{ color: theme.secondary }}>
                {courses.length - completedCourses.length}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Remaining
              </ThemedText>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            icon="map"
            label="Roadmap"
            color={theme.primary}
            onPress={() => (navigation as any).navigate("RoadmapTab")}
            theme={theme}
          />
          <QuickActionCard
            icon="book-open"
            label="Schools"
            color={theme.secondary}
            onPress={() => (navigation as any).navigate("SchoolsTab")}
            theme={theme}
          />
          <QuickActionCard
            icon="calculator"
            label="GPA Calc"
            color="#7C3AED"
            onPress={() => (navigation as any).navigate("ProfileTab")}
            theme={theme}
          />
        </View>
      </Animated.View>

      {alerts.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Recent Alerts</ThemedText>
            <Pressable
              onPress={() => (navigation as any).navigate("AlertsTab")}
              hitSlop={8}
            >
              <ThemedText type="link" style={{ color: theme.link }}>
                View all
              </ThemedText>
            </Pressable>
          </View>
          {alerts.slice(0, 2).map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </Animated.View>
      ) : null}

      {profile?.communityCollegeName ? (
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card
            elevation={1}
            style={[styles.schoolCard, { borderColor: theme.border }]}
            onPress={() => (navigation as any).navigate("SchoolsTab")}
          >
            <View style={styles.schoolCardContent}>
              <View>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginBottom: 4 }}
                >
                  Your Community College
                </ThemedText>
                <ThemedText type="h4" numberOfLines={1}>
                  {profile.communityCollegeName}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

function QuickActionCard({
  icon,
  label,
  color,
  onPress,
  theme,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <ThemedText type="small" style={styles.quickActionLabel}>
        {label}
      </ThemedText>
    </Pressable>
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
  if (progress < 0.75) return "Over halfway there! Keep going!";
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
  progressCard: {
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressPercent: {
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  statItem: {
    alignItems: "center",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  schoolCard: {
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  schoolCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
