import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { SchoolCard, CompactSchoolCard } from "@/components/SchoolCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import {
  getUserProfile,
  saveUserProfile,
  getCachedInstitutions,
  saveCachedInstitutions,
  type Institution,
  type UserProfile,
} from "@/lib/storage";

type FilterType = "all" | "CC" | "CSU" | "UC";

export default function SchoolsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  const loadInstitutions = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      if (!forceRefresh) {
        const cached = await getCachedInstitutions();
        if (cached && cached.length > 0) {
          setInstitutions(cached);
          setLoading(false);
          return;
        }
      }

      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/institutions", baseUrl).href);
      
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }

      const data = await response.json();
      setInstitutions(data);
      await saveCachedInstitutions(data);
    } catch (err) {
      console.error("Error loading institutions:", err);
      setError("Unable to load schools. Pull to refresh.");
      const cached = await getCachedInstitutions();
      if (cached) setInstitutions(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const userProfile = await getUserProfile();
    setProfile(userProfile);
  }, []);

  useEffect(() => {
    loadInstitutions();
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadInstitutions(true), loadProfile()]);
    setRefreshing(false);
  };

  const selectCommunityCollege = async (institution: Institution) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedProfile: UserProfile = {
      name: profile?.name || "",
      communityCollegeId: institution.id,
      communityCollegeName: institution.name,
      targetUniversityIds: profile?.targetUniversityIds || [],
      gpa: profile?.gpa || null,
    };
    await saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const toggleTargetUniversity = async (institution: Institution) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentTargets = profile?.targetUniversityIds || [];
    const isSelected = currentTargets.includes(institution.id);

    const updatedTargets = isSelected
      ? currentTargets.filter((id) => id !== institution.id)
      : [...currentTargets, institution.id];

    const updatedProfile: UserProfile = {
      name: profile?.name || "",
      communityCollegeId: profile?.communityCollegeId || null,
      communityCollegeName: profile?.communityCollegeName || null,
      targetUniversityIds: updatedTargets,
      gpa: profile?.gpa || null,
    };
    await saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || inst.type === filter;
    return matchesSearch && matchesFilter;
  });

  const communityColleges = filteredInstitutions.filter((i) => i.type === "CC");
  const universities = filteredInstitutions.filter((i) => i.type !== "CC");

  const selectedCC = institutions.find(
    (i) => i.id === profile?.communityCollegeId
  );
  const selectedUnis = institutions.filter((i) =>
    profile?.targetUniversityIds?.includes(i.id)
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: headerHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  const renderContent = () => {
    if (institutions.length === 0 && error) {
      return (
        <EmptyState
          image={require("../../assets/images/illustrations/empty_schools_illustration.png")}
          title="Unable to load schools"
          description={error}
          actionLabel="Try Again"
          onAction={() => loadInstitutions(true)}
        />
      );
    }

    return (
      <>
        {selectedCC ? (
          <Animated.View entering={FadeInDown.delay(0).duration(300)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">My Community College</ThemedText>
            </View>
            <SchoolCard
              institution={selectedCC}
              selected
              onRemove={() => {
                const updatedProfile: UserProfile = {
                  ...profile!,
                  communityCollegeId: null,
                  communityCollegeName: null,
                };
                saveUserProfile(updatedProfile);
                setProfile(updatedProfile);
              }}
              showRemove
            />
          </Animated.View>
        ) : null}

        {selectedUnis.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Target Universities</ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                {selectedUnis.length} selected
              </ThemedText>
            </View>
            {selectedUnis.map((uni) => (
              <SchoolCard
                key={uni.id}
                institution={uni}
                selected
                onRemove={() => toggleTargetUniversity(uni)}
                showRemove
              />
            ))}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Browse Schools</ThemedText>
          </View>

          <View style={styles.filterRow}>
            {(["all", "CC", "CSU", "UC"] as FilterType[]).map((f) => (
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
                  {f === "all" ? "All" : f}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {!selectedCC && filter !== "CSU" && filter !== "UC" ? (
          <View style={styles.schoolSection}>
            <ThemedText
              type="h4"
              style={[styles.subsectionTitle, { color: theme.textSecondary }]}
            >
              Community Colleges
            </ThemedText>
            {communityColleges.slice(0, 10).map((inst) => (
              <CompactSchoolCard
                key={inst.id}
                institution={inst}
                selected={inst.id === profile?.communityCollegeId}
                onPress={() => selectCommunityCollege(inst)}
              />
            ))}
          </View>
        ) : null}

        {filter !== "CC" ? (
          <View style={styles.schoolSection}>
            <ThemedText
              type="h4"
              style={[styles.subsectionTitle, { color: theme.textSecondary }]}
            >
              Universities (UC & CSU)
            </ThemedText>
            {universities.slice(0, 15).map((inst) => (
              <CompactSchoolCard
                key={inst.id}
                institution={inst}
                selected={profile?.targetUniversityIds?.includes(inst.id)}
                onPress={() => toggleTargetUniversity(inst)}
              />
            ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search schools..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
            {renderContent()}
          </>
        }
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
          paddingHorizontal: Spacing.lg,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  schoolSection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    marginBottom: Spacing.sm,
  },
});
