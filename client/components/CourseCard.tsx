import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { springConfig, AnimatedPressable } from "@/lib/animations";
import type { Course } from "@/lib/storage";

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
  onToggleComplete?: () => void;
}

const categoryColors = {
  major: "#1E40AF",
  ge: "#059669",
  elective: "#7C3AED",
};

const categoryLabels = {
  major: "Major",
  ge: "GE",
  elective: "Elective",
};

export function CourseCard({ course, onPress, onToggleComplete }: CourseCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleComplete?.();
  };

  const categoryColor = categoryColors[course.category];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: course.completed ? theme.success : theme.border,
          borderWidth: course.completed ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <ThemedText type="h4" style={styles.code}>
            {course.code}
          </ThemedText>
          <View
            style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}
          >
            <ThemedText
              type="small"
              style={[styles.categoryText, { color: categoryColor }]}
            >
              {categoryLabels[course.category]}
            </ThemedText>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={[styles.unitsBadge, { backgroundColor: theme.primary }]}>
            <ThemedText type="small" style={styles.unitsText}>
              {course.units}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleToggle}
            style={[
              styles.checkbox,
              {
                backgroundColor: course.completed
                  ? theme.success
                  : theme.backgroundSecondary,
                borderColor: course.completed ? theme.success : theme.border,
              },
            ]}
            hitSlop={8}
          >
            {course.completed ? (
              <Feather name="check" size={14} color="#FFFFFF" />
            ) : null}
          </Pressable>
        </View>
      </View>
      <ThemedText type="body" numberOfLines={2} style={styles.title}>
        {course.title}
      </ThemedText>
      {!course.transferable ? (
        <View style={[styles.warningBadge, { backgroundColor: `${theme.error}15` }]}>
          <Feather name="alert-circle" size={12} color={theme.error} />
          <ThemedText type="small" style={[styles.warningText, { color: theme.error }]}>
            May not transfer
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  code: {
    fontSize: 15,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unitsBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  unitsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    opacity: 0.85,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  warningText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
