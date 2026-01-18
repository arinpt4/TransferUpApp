import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { AlertCard } from "@/components/AlertCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAlerts, saveAlerts, type Alert } from "@/lib/storage";

type FilterType = "all" | "critical" | "warning" | "info";

export default function AlertsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadAlerts = useCallback(async () => {
    const loadedAlerts = await getAlerts();
    setAlerts(loadedAlerts.filter((a) => !a.dismissed));
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadAlerts);
    return unsubscribe;
  }, [navigation, loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const dismissAlert = async (alertId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const allAlerts = await getAlerts();
    const updatedAlerts = allAlerts.map((a) =>
      a.id === alertId ? { ...a, dismissed: true } : a
    );
    await saveAlerts(updatedAlerts);
    setAlerts(updatedAlerts.filter((a) => !a.dismissed));
  };

  const clearAllAlerts = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const allAlerts = await getAlerts();
    const updatedAlerts = allAlerts.map((a) => ({ ...a, dismissed: true }));
    await saveAlerts(updatedAlerts);
    setAlerts([]);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2 };
    return priority[a.type] - priority[b.type];
  });

  const criticalCount = alerts.filter((a) => a.type === "critical").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const infoCount = alerts.filter((a) => a.type === "info").length;

  const renderHeader = () => (
    <View style={styles.header}>
      {alerts.length > 0 ? (
        <>
          <View style={styles.statsRow}>
            <StatBadge
              count={criticalCount}
              label="Critical"
              color="#EF4444"
              theme={theme}
            />
            <StatBadge
              count={warningCount}
              label="Warnings"
              color="#F59E0B"
              theme={theme}
            />
            <StatBadge
              count={infoCount}
              label="Info"
              color="#3B82F6"
              theme={theme}
            />
          </View>

          <View style={styles.filterRow}>
            {(["all", "critical", "warning", "info"] as FilterType[]).map(
              (f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor:
                        filter === f ? theme.primary : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: filter === f ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </ThemedText>
                </Pressable>
              )
            )}
          </View>

          <View style={styles.actionsRow}>
            <ThemedText type="h3">
              {sortedAlerts.length} Alert{sortedAlerts.length !== 1 ? "s" : ""}
            </ThemedText>
            <Pressable
              onPress={clearAllAlerts}
              style={({ pressed }) => [
                styles.clearButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText type="link" style={{ color: theme.link }}>
                Clear All
              </ThemedText>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/illustrations/all_clear_alerts_illustration.png")}
      title="All Clear!"
      description="You have no active alerts. We'll notify you of important updates, deadlines, and potential issues with your transfer plan."
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={sortedAlerts}
        renderItem={({ item }) => (
          <AlertCard alert={item} onDismiss={() => dismissAlert(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function StatBadge({
  count,
  label,
  color,
  theme,
}: {
  count: number;
  label: string;
  color: string;
  theme: any;
}) {
  return (
    <View style={[styles.statBadge, { backgroundColor: `${color}15` }]}>
      <ThemedText type="h3" style={{ color }}>
        {count}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBadge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
});
