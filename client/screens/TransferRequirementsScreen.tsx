import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Modal,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import {
  getCourses,
  saveCourses,
  getSemesters,
  getQuarters,
  getRoadmapMode,
  generateId,
  getSelectedMajor,
  saveSelectedMajor,
  type Course,
  type Semester,
  type RoadmapMode,
  type SelectedMajor,
} from "@/lib/storage";

interface Major {
  label: string;
  key: string;
}

interface AssistCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  department: string;
  transferable: boolean;
  source: string;
}

interface ArticulationAgreement {
  id: string;
  receivingCourses: AssistCourse[];
  sendingCourses: AssistCourse[];
  conjunction: string;
  noArticulation: boolean;
}

type TransferRequirementsParams = {
  sendingId: number;
  sendingName: string;
  receivingId: number;
  receivingName: string;
};

export default function TransferRequirementsScreen() {
  const route = useRoute<RouteProp<{ params: TransferRequirementsParams }, "params">>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const { sendingId, sendingName, receivingId, receivingName } = route.params;
  const tabBarHeight = useBottomTabBarHeight();

  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [agreements, setAgreements] = useState<ArticulationAgreement[]>([]);
  const [existingCourses, setExistingCourses] = useState<Course[]>([]);
  const [periods, setPeriods] = useState<Semester[]>([]);
  const [roadmapMode, setRoadmapMode] = useState<RoadmapMode>("semester");
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadMajors = useCallback(async () => {
    try {
      setError(null);
      const baseUrl = getApiUrl();
      const url = new URL("/api/agreements", baseUrl);
      url.searchParams.set("sendingInstitutionId", sendingId.toString());
      url.searchParams.set("receivingInstitutionId", receivingId.toString());
      url.searchParams.set("academicYearId", "74");

      const response = await fetch(url.href);
      if (!response.ok) throw new Error("Failed to fetch majors");

      const data = await response.json();
      const majorsList = data.reports || [];
      setMajors(majorsList);
    } catch (err) {
      console.error("Error loading majors:", err);
      setError("Unable to load transfer requirements");
    } finally {
      setLoading(false);
    }
  }, [sendingId, receivingId]);

  const loadCourses = useCallback(async (major: Major) => {
    try {
      setLoadingCourses(true);
      setAgreements([]);
      const baseUrl = getApiUrl();
      const url = new URL("/api/articulation", baseUrl);
      url.searchParams.set("key", major.key);

      const response = await fetch(url.href);
      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      setAgreements(data.agreements || []);
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadExistingData = useCallback(async () => {
    const [userCourses, mode] = await Promise.all([
      getCourses(),
      getRoadmapMode(),
    ]);
    setExistingCourses(userCourses);
    setRoadmapMode(mode);
    
    const userPeriods = mode === "quarter" ? await getQuarters() : await getSemesters();
    setPeriods(userPeriods);
    if (userPeriods.length > 0) {
      setSelectedPeriodId(userPeriods[0].id);
    }
  }, []);

  useEffect(() => {
    const initializeScreen = async () => {
      await loadMajors();
      await loadExistingData();
      
      const savedMajor = await getSelectedMajor(receivingId);
      if (savedMajor && savedMajor.sendingId === sendingId) {
        setSelectedMajor({ label: savedMajor.label, key: savedMajor.key });
        loadCourses({ label: savedMajor.label, key: savedMajor.key });
      }
    };
    initializeScreen();
  }, [loadMajors, loadExistingData, receivingId, sendingId, loadCourses]);

  // Reload roadmap mode and periods when screen gets focus (in case user changed mode on Roadmap screen)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadExistingData);
    return unsubscribe;
  }, [navigation, loadExistingData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMajors();
    if (selectedMajor) {
      await loadCourses(selectedMajor);
    }
    setRefreshing(false);
  };

  const selectMajor = async (major: Major) => {
    setSelectedMajor(major);
    setSearchQuery("");
    setSelectedCourses(new Set());
    loadCourses(major);
    
    await saveSelectedMajor({
      label: major.label,
      key: major.key,
      sendingId,
      receivingId,
      receivingName,
    });
  };

  const changeMajor = () => {
    setSelectedMajor(null);
    setAgreements([]);
    setSelectedCourses(new Set());
  };

  const getCourseKey = (agreementId: string, courseCode: string) => 
    `${agreementId}:${courseCode}`;

  const toggleCourseSelection = (agreementId: string, course: AssistCourse) => {
    if (isCourseInRoadmap(course.code)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const key = getCourseKey(agreementId, course.code);
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCourses(newSelected);
  };

  const isCourseSelected = (agreementId: string, courseCode: string) => {
    return selectedCourses.has(getCourseKey(agreementId, courseCode));
  };

  const isAgreementAlreadyAdded = (agreement: ArticulationAgreement) => {
    if (agreement.sendingCourses.length === 0) return false;
    return agreement.sendingCourses.every((sc) =>
      existingCourses.some((c) => c.code.toLowerCase() === sc.code.toLowerCase())
    );
  };

  const isCourseInRoadmap = (courseCode: string) => {
    return existingCourses.some(
      (c) => c.code.toLowerCase() === courseCode.toLowerCase()
    );
  };

  const addSelectedCourses = async () => {
    if (selectedCourses.size === 0 || !selectedPeriodId) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCourses: Course[] = [];
    for (const courseKey of selectedCourses) {
      const [agreementId, courseCode] = courseKey.split(":");
      const agreement = agreements.find((a) => a.id === agreementId);
      if (agreement) {
        const sendingCourse = agreement.sendingCourses.find(
          (sc) => sc.code === courseCode
        );
        if (sendingCourse && !isCourseInRoadmap(sendingCourse.code)) {
          const receivingInfo = agreement.receivingCourses
            .map((rc) => rc.code)
            .join(", ");
          newCourses.push({
            id: generateId(),
            code: sendingCourse.code,
            title: sendingCourse.title,
            units: sendingCourse.units,
            semesterId: selectedPeriodId,
            completed: false,
            category: "major",
            transferable: true,
            status: "planned",
            notes: `Satisfies ${receivingName}: ${receivingInfo}`,
          });
        }
      }
    }

    const updatedCourses = [...existingCourses, ...newCourses];
    await saveCourses(updatedCourses);
    setExistingCourses(updatedCourses);
    setSelectedCourses(new Set());
    setShowAddModal(false);
  };

  const filteredMajors = majors.filter((m) =>
    m.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgreements = agreements.filter((a) => {
    const searchLower = searchQuery.toLowerCase();
    const receivingMatch = a.receivingCourses.some(
      (c) =>
        c.code.toLowerCase().includes(searchLower) ||
        c.title.toLowerCase().includes(searchLower)
    );
    const sendingMatch = a.sendingCourses.some(
      (c) =>
        c.code.toLowerCase().includes(searchLower) ||
        c.title.toLowerCase().includes(searchLower)
    );
    return receivingMatch || sendingMatch;
  });

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

  if (error) {
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
        <EmptyState
          image={require("../../assets/images/illustrations/empty_schools_illustration.png")}
          title="Unable to load requirements"
          description={error}
          actionLabel="Try Again"
          onAction={loadMajors}
        />
      </View>
    );
  }

  const renderMajorItem = ({ item, index }: { item: Major; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
      <Pressable
        onPress={() => selectMajor(item)}
        style={({ pressed }) => [
          styles.majorItem,
          {
            backgroundColor:
              selectedMajor?.key === item.key
                ? `${theme.primary}15`
                : theme.backgroundDefault,
            borderColor:
              selectedMajor?.key === item.key ? theme.primary : theme.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <ThemedText type="body" numberOfLines={2} style={{ flex: 1 }}>
          {item.label}
        </ThemedText>
        <Feather
          name={selectedMajor?.key === item.key ? "check-circle" : "chevron-right"}
          size={18}
          color={
            selectedMajor?.key === item.key ? theme.primary : theme.textSecondary
          }
        />
      </Pressable>
    </Animated.View>
  );

  const renderAgreementItem = ({ item, index }: { item: ArticulationAgreement; index: number }) => {
    const alreadyAdded = isAgreementAlreadyAdded(item);
    const hasNoEquivalent = item.noArticulation || item.sendingCourses.length === 0;
    const hasAnySelected = item.sendingCourses.some(
      (c) => isCourseSelected(item.id, c.code)
    );

    return (
      <Animated.View entering={FadeInDown.delay(index * 20).duration(200)}>
        <View
          style={[
            styles.agreementCard,
            {
              backgroundColor: hasAnySelected
                ? `${theme.primary}10`
                : alreadyAdded
                ? `${theme.success}08`
                : theme.backgroundDefault,
              borderColor: hasAnySelected
                ? theme.primary
                : alreadyAdded
                ? theme.success
                : theme.border,
            },
          ]}
        >
          <View style={styles.agreementContent}>
            <View style={[styles.requirementSection, { backgroundColor: `${theme.primary}08` }]}>
              <View style={styles.requirementHeader}>
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                  {receivingName} Requirement
                </ThemedText>
              </View>
              {item.receivingCourses.map((course, idx) => (
                <View key={course.id + idx} style={styles.courseRow}>
                  <ThemedText type="h4" style={{ color: theme.primary }}>
                    {course.code}
                  </ThemedText>
                  <ThemedText
                    type="body"
                    numberOfLines={1}
                    style={{ color: theme.text, flex: 1, marginLeft: Spacing.sm }}
                  >
                    {course.title}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.arrowContainer}>
              <Feather name="arrow-down" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                Satisfied by at {sendingName}
              </ThemedText>
            </View>

            {hasNoEquivalent ? (
              <View style={[styles.noEquivalentSection, { backgroundColor: `${theme.warning}10` }]}>
                <Feather name="alert-circle" size={16} color={theme.warning} />
                <ThemedText type="body" style={{ color: theme.warning, marginLeft: Spacing.sm }}>
                  No direct equivalent - consult advisor
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.equivalentSection, { backgroundColor: `${theme.success}08` }]}>
                <View style={styles.requirementHeader}>
                  <ThemedText type="small" style={{ color: theme.success, fontWeight: "600" }}>
                    {sendingName} Course{item.sendingCourses.length > 1 ? "s" : ""} - Tap to select
                  </ThemedText>
                </View>
                {item.sendingCourses.map((course, idx) => {
                  const inRoadmap = isCourseInRoadmap(course.code);
                  const isSelected = isCourseSelected(item.id, course.code);
                  
                  return (
                    <Pressable
                      key={course.id + idx}
                      onPress={() => toggleCourseSelection(item.id, course)}
                      disabled={inRoadmap}
                      style={({ pressed }) => [
                        styles.selectableCourseRow,
                        {
                          backgroundColor: isSelected
                            ? `${theme.primary}15`
                            : inRoadmap
                            ? `${theme.success}10`
                            : "transparent",
                          opacity: pressed && !inRoadmap ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.courseCheckbox,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : inRoadmap
                              ? theme.success
                              : theme.backgroundSecondary,
                            borderColor: isSelected
                              ? theme.primary
                              : inRoadmap
                              ? theme.success
                              : theme.border,
                          },
                        ]}
                      >
                        {isSelected || inRoadmap ? (
                          <Feather name="check" size={12} color="#FFFFFF" />
                        ) : null}
                      </View>
                      <ThemedText type="h4" style={{ color: theme.success, marginLeft: Spacing.sm }}>
                        {course.code}
                      </ThemedText>
                      <ThemedText
                        type="body"
                        numberOfLines={1}
                        style={{ color: theme.text, flex: 1, marginLeft: Spacing.sm }}
                      >
                        {course.title}
                      </ThemedText>
                      {inRoadmap ? (
                        <ThemedText type="small" style={{ color: theme.success, marginLeft: Spacing.xs }}>
                          Added
                        </ThemedText>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {alreadyAdded ? (
              <View style={[styles.addedBadge, { backgroundColor: `${theme.success}20`, marginTop: Spacing.sm }]}>
                <Feather name="check" size={12} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.success, marginLeft: 4 }}>
                  All courses in Roadmap
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.headerSection,
          {
            paddingTop: headerHeight + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={styles.schoolsInfo}>
          <View style={styles.schoolBadge}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              From
            </ThemedText>
            <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "600" }}>
              {sendingName}
            </ThemedText>
          </View>
          <Feather name="arrow-right" size={16} color={theme.textSecondary} />
          <View style={styles.schoolBadge}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              To
            </ThemedText>
            <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "600" }}>
              {receivingName}
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={selectedMajor ? "Search courses..." : "Search majors..."}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {selectedMajor ? (
          <View style={styles.selectedMajorHeader}>
            <View style={styles.majorHeaderRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Currently viewing
                </ThemedText>
                <ThemedText type="h4" numberOfLines={2} style={{ marginTop: 2 }}>
                  {selectedMajor.label}
                </ThemedText>
              </View>
              <Pressable
                onPress={changeMajor}
                style={[styles.changeMajorButton, { borderColor: theme.primary }]}
              >
                <Feather name="refresh-cw" size={14} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.primary, marginLeft: 4, fontWeight: "600" }}>
                  Change Major
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {!selectedMajor ? (
        <FlatList
          data={filteredMajors}
          renderItem={renderMajorItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                No majors found
              </ThemedText>
            </View>
          }
        />
      ) : loadingCourses ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredAgreements}
          renderItem={renderAgreementItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: selectedCourses.size > 0 ? 160 : tabBarHeight + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                No articulation agreements found for this major
              </ThemedText>
            </View>
          }
        />
      )}

      {selectedCourses.size > 0 ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: tabBarHeight + Spacing.md,
              borderTopColor: theme.border,
            },
          ]}
        >
          <ThemedText type="body" style={{ marginBottom: Spacing.sm }}>
            {selectedCourses.size} course{selectedCourses.size !== 1 ? "s" : ""}{" "}
            selected
          </ThemedText>
          <Button onPress={() => setShowAddModal(true)}>
            Add to Roadmap
          </Button>
        </View>
      ) : null}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">
                Select {roadmapMode === "quarter" ? "Quarter" : "Term"}
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}
            >
              Select which {roadmapMode === "quarter" ? "quarter" : "semester"} to add courses to:
            </ThemedText>

            {periods.map((period) => (
              <Pressable
                key={period.id}
                onPress={() => setSelectedPeriodId(period.id)}
                style={[
                  styles.semesterOption,
                  {
                    backgroundColor:
                      selectedPeriodId === period.id
                        ? `${theme.primary}15`
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedPeriodId === period.id
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              >
                <ThemedText type="body">{period.name}</ThemedText>
                {selectedPeriodId === period.id ? (
                  <Feather name="check" size={18} color={theme.primary} />
                ) : null}
              </Pressable>
            ))}

            <Button onPress={addSelectedCourses} style={{ marginTop: Spacing.lg }}>
              Add Courses
            </Button>
          </ThemedView>
        </View>
      </Modal>
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
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  schoolsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  schoolBadge: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  selectedMajorHeader: {
    marginTop: Spacing.md,
  },
  majorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  changeMajorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["6xl"],
  },
  majorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  courseContent: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  courseCode: {
    fontSize: 15,
  },
  selectableCourseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  courseCheckbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  courseTitle: {
    fontSize: 14,
  },
  addedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  semesterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  agreementCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  agreementContent: {
    flex: 1,
  },
  requirementSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  requirementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  noEquivalentSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  equivalentSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  inRoadmapBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
});
