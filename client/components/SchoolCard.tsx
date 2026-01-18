import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { Institution } from "@/lib/storage";

interface SchoolCardProps {
  institution: Institution;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const typeColors = {
  CC: "#059669",
  CSU: "#3B82F6",
  UC: "#1E40AF",
};

const typeLabels = {
  CC: "Community College",
  CSU: "California State University",
  UC: "University of California",
};

export function SchoolCard({
  institution,
  selected = false,
  onPress,
  onRemove,
  showRemove = false,
}: SchoolCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const typeColor = typeColors[institution.type];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
            <ThemedText
              type="small"
              style={[styles.typeText, { color: typeColor }]}
            >
              {institution.type}
            </ThemedText>
          </View>
          {selected ? (
            <Feather name="check-circle" size={20} color={theme.primary} />
          ) : null}
          {showRemove && onRemove ? (
            <Pressable onPress={onRemove} hitSlop={8}>
              <Feather name="x-circle" size={20} color={theme.error} />
            </Pressable>
          ) : null}
        </View>
        <ThemedText type="h4" style={styles.name} numberOfLines={2}>
          {institution.name}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.code, { color: theme.textSecondary }]}
        >
          {institution.code}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

export function CompactSchoolCard({
  institution,
  selected = false,
  onPress,
}: SchoolCardProps) {
  const { theme } = useTheme();
  const typeColor = typeColors[institution.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactContainer,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.compactBadge, { backgroundColor: typeColor }]}>
        <ThemedText type="small" style={styles.compactBadgeText}>
          {institution.type}
        </ThemedText>
      </View>
      <ThemedText type="body" numberOfLines={1} style={styles.compactName}>
        {institution.name}
      </ThemedText>
      {selected ? (
        <Feather name="check" size={18} color={theme.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  name: {
    marginBottom: Spacing.xs,
  },
  code: {
    fontSize: 13,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  compactBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  compactBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  compactName: {
    flex: 1,
    fontSize: 14,
  },
});
