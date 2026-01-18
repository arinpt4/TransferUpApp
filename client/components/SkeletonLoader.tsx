import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundTertiary,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader height={24} width="60%" style={styles.cardTitle} />
      <SkeletonLoader height={16} width="80%" style={styles.cardLine} />
      <SkeletonLoader height={16} width="40%" />
    </View>
  );
}

export function SkeletonCourseCard() {
  return (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <SkeletonLoader height={18} width={80} />
        <SkeletonLoader height={24} width={40} borderRadius={BorderRadius.full} />
      </View>
      <SkeletonLoader height={16} width="70%" style={styles.courseLine} />
      <SkeletonLoader height={14} width={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  cardLine: {
    marginBottom: Spacing.sm,
  },
  courseCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  courseLine: {
    marginBottom: Spacing.xs,
  },
});
