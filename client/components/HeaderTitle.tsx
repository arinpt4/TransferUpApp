import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
  showIcon?: boolean;
}

export function HeaderTitle({ title, showIcon = true }: HeaderTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {showIcon ? (
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : null}
      <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
    </View>
  );
}

export function ProgressHeaderTitle({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.progressContainer}>
      <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.progressValue, { color: theme.primary }]}>
        {current}/{total}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
