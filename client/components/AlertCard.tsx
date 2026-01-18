import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Alert } from "@/lib/storage";

interface AlertCardProps {
  alert: Alert;
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const alertStyles = {
  critical: {
    icon: "alert-octagon" as const,
    iconColor: "#EF4444",
    bgColor: "#FEE2E2",
    darkBgColor: "#7F1D1D20",
  },
  warning: {
    icon: "alert-triangle" as const,
    iconColor: "#F59E0B",
    bgColor: "#FEF3C7",
    darkBgColor: "#78350F20",
  },
  info: {
    icon: "info" as const,
    iconColor: "#3B82F6",
    bgColor: "#DBEAFE",
    darkBgColor: "#1E3A8A20",
  },
};

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const alertStyle = alertStyles[alert.type];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? alertStyle.darkBgColor : alertStyle.bgColor,
            borderLeftColor: alertStyle.iconColor,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.iconContainer}>
          <Feather name={alertStyle.icon} size={22} color={alertStyle.iconColor} />
        </View>
        <View style={styles.content}>
          <ThemedText type="h4" style={styles.title}>
            {alert.title}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.message, { color: theme.textSecondary }]}
          >
            {alert.message}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.time, { color: theme.textSecondary }]}
          >
            {timeAgo}
          </ThemedText>
        </View>
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={12}
        >
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: 12,
  },
  dismissButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
