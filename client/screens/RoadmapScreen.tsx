import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getCourses,
  saveCourses,
  getSemesters,
  generateId,
  type Course,
  type Semester,
} from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SEMESTER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export default function RoadmapScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    units: "3",
    category: "major" as Course["category"],
  });

  const loadData = useCallback(async () => {
    const [loadedCourses, loadedSemesters] = await Promise.all([
      getCourses(),
      getSemesters(),
    ]);
    setCourses(loadedCourses);
    setSemesters(loadedSemesters);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCourseComplete = async (courseId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedCourses = courses.map((c) =>
      c.id === courseId ? { ...c, completed: !c.completed } : c
    );
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
  };

  const addCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.title.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const currentSemester = semesters[currentSemesterIndex];
    const course: Course = {
      id: generateId(),
      code: newCourse.code.toUpperCase(),
      title: newCourse.title,
      units: parseInt(newCourse.units) || 3,
      semesterId: currentSemester.id,
      completed: false,
      category: newCourse.category,
      transferable: true,
    };

    const updatedCourses = [...courses, course];
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
    setShowAddModal(false);
    setNewCourse({ code: "", title: "", units: "3", category: "major" });
  };

  const deleteCourse = async (courseId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const updatedCourses = courses.filter((c) => c.id !== courseId);
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
    setShowCourseModal(false);
    setSelectedCourse(null);
  };

  const openCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const getCoursesForSemester = (semesterId: string) =>
    courses.filter((c) => c.semesterId === semesterId);

  const getSemesterUnits = (semesterId: string) =>
    getCoursesForSemester(semesterId).reduce((sum, c) => sum + c.units, 0);

  const getSemesterProgress = (semesterId: string) => {
    const semesterCourses = getCoursesForSemester(semesterId);
    if (semesterCourses.length === 0) return 0;
    return (
      semesterCourses.filter((c) => c.completed).length / semesterCourses.length
    );
  };

  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  const completedUnits = courses
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.units, 0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSemesterIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSemester = ({ item, index }: { item: Semester; index: number }) => {
    const semesterCourses = getCoursesForSemester(item.id);
    const units = getSemesterUnits(item.id);
    const progress = getSemesterProgress(item.id);

    return (
      <View style={[styles.semesterContainer, { width: SEMESTER_WIDTH }]}>
        <View style={styles.semesterHeader}>
          <View>
            <ThemedText type="h3">{item.name}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: 2 }}
            >
              {semesterCourses.length} courses | {units} units
            </ThemedText>
          </View>
          <View
            style={[
              styles.unitsBadge,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <ThemedText
              type="h4"
              style={{ color: theme.primary, fontWeight: "700" }}
            >
              {units}
            </ThemedText>
          </View>
        </View>

        {semesterCourses.length > 0 ? (
          <ProgressBar
            progress={progress}
            height={6}
            style={{ marginBottom: Spacing.lg }}
          />
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.coursesScrollContent}
        >
          {semesterCourses.length > 0 ? (
            semesterCourses.map((course, i) => (
              <Animated.View
                key={course.id}
                entering={FadeInDown.delay(i * 50).duration(300)}
              >
                <CourseCard
                  course={course}
                  onPress={() => openCourseDetails(course)}
                  onToggleComplete={() => toggleCourseComplete(course.id)}
                />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptySlot}>
              <Feather
                name="plus-circle"
                size={40}
                color={theme.textSecondary}
              />
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
              >
                No courses yet
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: theme.textSecondary,
                  textAlign: "center",
                  marginTop: Spacing.xs,
                }}
              >
                Tap + to add courses to this semester
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: headerHeight + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Progress
          </ThemedText>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {completedUnits}/{totalUnits} units
          </ThemedText>
        </View>

        <View style={styles.semesterDots}>
          {semesters.map((sem, index) => (
            <Pressable
              key={sem.id}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index, animated: true });
              }}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentSemesterIndex
                      ? theme.primary
                      : theme.backgroundTertiary,
                  width: index === currentSemesterIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {courses.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingBottom: tabBarHeight }]}>
          <EmptyState
            image={require("../../assets/images/illustrations/empty_roadmap_illustration.png")}
            title="Start Your Roadmap"
            description="Add courses to plan your transfer pathway semester by semester."
            actionLabel="Add First Course"
            onAction={() => setShowAddModal(true)}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={semesters}
          renderItem={renderSemester}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SEMESTER_WIDTH + Spacing.md}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: tabBarHeight + Spacing["6xl"],
          }}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      <Pressable
        onPress={() => setShowAddModal(true)}
        style={[
          styles.fab,
          { backgroundColor: theme.primary, bottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Course</ThemedText>
              <Pressable
                onPress={() => setShowAddModal(false)}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText
              type="small"
              style={[styles.modalLabel, { color: theme.textSecondary }]}
            >
              Adding to: {semesters[currentSemesterIndex]?.name}
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Course Code
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g., MATH 101"
                placeholderTextColor={theme.textSecondary}
                value={newCourse.code}
                onChangeText={(text) =>
                  setNewCourse({ ...newCourse, code: text })
                }
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Course Title
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g., Calculus I"
                placeholderTextColor={theme.textSecondary}
                value={newCourse.title}
                onChangeText={(text) =>
                  setNewCourse({ ...newCourse, title: text })
                }
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="small" style={styles.label}>
                  Units
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="3"
                  placeholderTextColor={theme.textSecondary}
                  value={newCourse.units}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, units: text })
                  }
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText type="small" style={styles.label}>
                  Category
                </ThemedText>
                <View style={styles.categoryRow}>
                  {(["major", "ge", "elective"] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() =>
                        setNewCourse({ ...newCourse, category: cat })
                      }
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor:
                            newCourse.category === cat
                              ? theme.primary
                              : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color:
                            newCourse.category === cat
                              ? "#FFFFFF"
                              : theme.text,
                          fontWeight: "600",
                        }}
                      >
                        {cat === "ge" ? "GE" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Button onPress={addCourse} style={{ marginTop: Spacing.lg }}>
              Add Course
            </Button>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showCourseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Course Details</ThemedText>
              <Pressable
                onPress={() => setShowCourseModal(false)}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedCourse ? (
              <>
                <View style={styles.courseDetails}>
                  <ThemedText type="h2">{selectedCourse.code}</ThemedText>
                  <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                    {selectedCourse.title}
                  </ThemedText>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Feather
                        name="book"
                        size={18}
                        color={theme.textSecondary}
                      />
                      <ThemedText type="body">{selectedCourse.units} units</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <Feather
                        name="tag"
                        size={18}
                        color={theme.textSecondary}
                      />
                      <ThemedText type="body">
                        {selectedCourse.category.charAt(0).toUpperCase() +
                          selectedCourse.category.slice(1)}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: selectedCourse.completed
                          ? `${theme.success}20`
                          : `${theme.warning}20`,
                      },
                    ]}
                  >
                    <Feather
                      name={selectedCourse.completed ? "check-circle" : "clock"}
                      size={16}
                      color={
                        selectedCourse.completed ? theme.success : theme.warning
                      }
                    />
                    <ThemedText
                      type="body"
                      style={{
                        color: selectedCourse.completed
                          ? theme.success
                          : theme.warning,
                        marginLeft: Spacing.xs,
                      }}
                    >
                      {selectedCourse.completed ? "Completed" : "In Progress"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    onPress={() => toggleCourseComplete(selectedCourse.id)}
                    style={{ flex: 1 }}
                  >
                    {selectedCourse.completed
                      ? "Mark Incomplete"
                      : "Mark Complete"}
                  </Button>
                  <Pressable
                    onPress={() => deleteCourse(selectedCourse.id)}
                    style={[
                      styles.deleteButton,
                      { backgroundColor: `${theme.error}15` },
                    ]}
                  >
                    <Feather name="trash-2" size={20} color={theme.error} />
                  </Pressable>
                </View>
              </>
            ) : null}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  semesterDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  semesterContainer: {
    flex: 1,
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  unitsBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  coursesScrollContent: {
    paddingBottom: Spacing["4xl"],
  },
  emptySlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["6xl"],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: Spacing.xl,
  },
  modalLabel: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  categoryButton: {
    flex: 1,
    height: Spacing.inputHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  courseDetails: {
    marginBottom: Spacing.xl,
  },
  detailsRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  deleteButton: {
    width: Spacing.buttonHeight,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
