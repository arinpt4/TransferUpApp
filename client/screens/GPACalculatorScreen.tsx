import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getCourses,
  calculateGPA,
  GRADE_POINTS,
  type Course,
  type CourseGrade,
} from "@/lib/storage";

export default function GPACalculatorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadData = useCallback(async () => {
    const loadedCourses = await getCourses();
    setCourses(loadedCourses);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const takenCourses = courses.filter(c => c.status === "taken" && c.grade);
  const { gpa, totalUnits } = calculateGPA(courses);

  const getGradeColor = (grade: CourseGrade) => {
    const points = GRADE_POINTS[grade];
    if (points >= 3.7) return theme.success;
    if (points >= 2.7) return theme.primary;
    if (points >= 1.7) return theme.warning;
    return theme.error;
  };

  const gradientColors = isDark
    ? ["#1E40AF", "#3B82F6", "#60A5FA"] as const
    : ["#3B82F6", "#2563EB", "#1D4ED8"] as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={[
          styles.backButton,
          {
            top: insets.top + Spacing.sm,
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.8)",
          },
        ]}
      >
        <Feather name="arrow-left" size={22} color={theme.text} />
      </Pressable>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing["3xl"] + Spacing.md,
          paddingBottom: insets.bottom + Spacing["3xl"],
          paddingHorizontal: Spacing.lg,
        }}
      >
      <Animated.View entering={FadeInUp.duration(600)}>
        <View style={styles.gpaContainer}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gpaGradient}
          >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurOverlay}>
              <ThemedText type="small" style={styles.gpaLabel}>
                Cumulative GPA
              </ThemedText>
              <ThemedText style={styles.gpaNumber}>
                {takenCourses.length > 0 ? gpa.toFixed(2) : "--"}
              </ThemedText>
              <View style={styles.unitsRow}>
                <Feather name="book-open" size={16} color="rgba(255,255,255,0.8)" />
                <ThemedText type="body" style={styles.unitsText}>
                  {totalUnits} units completed
                </ThemedText>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable
          onPress={() => setShowBreakdown(!showBreakdown)}
          style={[
            styles.breakdownButton,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
          ]}
        >
          <ThemedText type="h4">View Breakdown</ThemedText>
          <Feather
            name={showBreakdown ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.text}
          />
        </Pressable>
      </Animated.View>

      {showBreakdown ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          {takenCourses.length === 0 ? (
            <Card elevation={1} style={{ ...styles.emptyCard, borderColor: theme.border }}>
              <Feather name="info" size={24} color={theme.textSecondary} />
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}
              >
                No completed courses yet. Add courses to your roadmap and mark them as "Taken" with grades to calculate your GPA.
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.coursesList}>
              <View style={[styles.listHeader, { borderBottomColor: theme.border }]}>
                <ThemedText type="small" style={[styles.headerCell, { flex: 2 }]}>
                  Course
                </ThemedText>
                <ThemedText type="small" style={[styles.headerCell, { flex: 1, textAlign: "center" }]}>
                  Units
                </ThemedText>
                <ThemedText type="small" style={[styles.headerCell, { flex: 1, textAlign: "center" }]}>
                  Grade
                </ThemedText>
                <ThemedText type="small" style={[styles.headerCell, { flex: 1, textAlign: "right" }]}>
                  Points
                </ThemedText>
              </View>
              {takenCourses.map((course, index) => (
                <View
                  key={course.id}
                  style={[
                    styles.courseRow,
                    {
                      backgroundColor: index % 2 === 0 ? theme.backgroundSecondary : "transparent",
                    },
                  ]}
                >
                  <View style={{ flex: 2 }}>
                    <ThemedText type="body" numberOfLines={1}>
                      {course.code || course.title}
                    </ThemedText>
                    {course.code ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                        {course.title}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText type="body" style={{ flex: 1, textAlign: "center" }}>
                    {course.units}
                  </ThemedText>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={[
                        styles.gradeBadge,
                        { backgroundColor: `${getGradeColor(course.grade!)}20` },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={{ color: getGradeColor(course.grade!), fontWeight: "600" }}
                      >
                        {course.grade}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="body" style={{ flex: 1, textAlign: "right" }}>
                    {(GRADE_POINTS[course.grade!] * course.units).toFixed(1)}
                  </ThemedText>
                </View>
              ))}
              <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                <ThemedText type="h4" style={{ flex: 2 }}>
                  Total
                </ThemedText>
                <ThemedText type="h4" style={{ flex: 1, textAlign: "center" }}>
                  {totalUnits}
                </ThemedText>
                <ThemedText type="h4" style={{ flex: 1, textAlign: "center" }}>
                  --
                </ThemedText>
                <ThemedText type="h4" style={{ flex: 1, textAlign: "right" }}>
                  {(gpa * totalUnits).toFixed(1)}
                </ThemedText>
              </View>
            </View>
          )}
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Card elevation={1} style={{ ...styles.legendCard, borderColor: theme.border }}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Grade Scale
          </ThemedText>
          <View style={styles.legendGrid}>
            {Object.entries(GRADE_POINTS).map(([grade, points]) => (
              <View key={grade} style={styles.legendItem}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {grade}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {points.toFixed(1)}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gpaContainer: {
    marginBottom: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
  },
  gpaGradient: {
    borderRadius: BorderRadius["2xl"],
  },
  blurOverlay: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  gpaLabel: {
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  gpaNumber: {
    fontSize: 72,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 80,
  },
  unitsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  unitsText: {
    color: "rgba(255,255,255,0.8)",
  },
  breakdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  coursesList: {
    marginBottom: Spacing.lg,
  },
  listHeader: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontWeight: "600",
    opacity: 0.7,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  gradeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  legendCard: {
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  legendItem: {
    width: 50,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
