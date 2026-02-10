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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
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
  getQuarters,
  getRoadmapMode,
  saveRoadmapMode,
  generateId,
  type Course,
  type Semester,
  type RoadmapMode,
  type CourseStatus,
  type CourseGrade,
} from "@/lib/storage";

const GRADES: CourseGrade[] = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SEMESTER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export default function RoadmapScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [courseToGrade, setCourseToGrade] = useState<Course | null>(null);
  const [pendingGrade, setPendingGrade] = useState<CourseGrade | undefined>(undefined);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [roadmapMode, setRoadmapMode] = useState<RoadmapMode>("semester");
  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    units: "3",
    category: "major" as Course["category"],
    status: "planned" as CourseStatus,
    grade: undefined as CourseGrade | undefined,
  });

  const loadData = useCallback(async () => {
    const [loadedCourses, loadedMode] = await Promise.all([
      getCourses(),
      getRoadmapMode(),
    ]);
    setCourses(loadedCourses);
    setRoadmapMode(loadedMode);
    
    const periods = loadedMode === "quarter" ? await getQuarters() : await getSemesters();
    setSemesters(periods);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleModeChange = async (mode: RoadmapMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoadmapMode(mode);
    await saveRoadmapMode(mode);
    
    const periods = mode === "quarter" ? await getQuarters() : await getSemesters();
    setSemesters(periods);
    setCurrentSemesterIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  const toggleCourseComplete = async (courseId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    if (!course.completed) {
      setCourseToGrade(course);
      setPendingGrade(course.grade);
      setShowCourseModal(false);
      setShowGradeModal(true);
    } else {
      const updatedCourses = courses.map((c) =>
        c.id === courseId ? { ...c, completed: false, status: "in_progress" as CourseStatus } : c
      );
      setCourses(updatedCourses);
      await saveCourses(updatedCourses);
      if (selectedCourse?.id === courseId) {
        setSelectedCourse({ ...selectedCourse, completed: false, status: "in_progress" });
      }
    }
  };

  const saveGradeAndComplete = async (skipGrade: boolean = false) => {
    if (!courseToGrade) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedCourses = courses.map((c) =>
      c.id === courseToGrade.id
        ? {
            ...c,
            completed: true,
            status: "taken" as CourseStatus,
            grade: skipGrade ? undefined : pendingGrade,
          }
        : c
    );
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
    setShowGradeModal(false);
    setCourseToGrade(null);
    setPendingGrade(undefined);
  };

  const updateCourseGrade = async (grade: CourseGrade) => {
    if (!selectedCourse) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedCourses = courses.map((c) =>
      c.id === selectedCourse.id ? { ...c, grade } : c
    );
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
    setSelectedCourse({ ...selectedCourse, grade });
  };

  const addCourse = async () => {
    if (!newCourse.title.trim()) return;
    if (newCourse.status === "taken" && !newCourse.grade) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const currentSemester = semesters[currentSemesterIndex];
    const course: Course = {
      id: generateId(),
      code: newCourse.code.trim().toUpperCase(),
      title: newCourse.title,
      units: parseInt(newCourse.units) || 3,
      semesterId: currentSemester.id,
      completed: newCourse.status === "taken",
      category: newCourse.category,
      transferable: true,
      status: newCourse.status,
      grade: newCourse.status === "taken" ? newCourse.grade : undefined,
    };

    const updatedCourses = [...courses, course];
    setCourses(updatedCourses);
    await saveCourses(updatedCourses);
    setShowAddModal(false);
    setNewCourse({ code: "", title: "", units: "3", category: "major", status: "planned", grade: undefined });
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
      <View style={[styles.semesterContainer, { width: SCREEN_WIDTH, paddingHorizontal: Spacing.lg }]}>
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
            paddingTop: Math.max(headerHeight, insets.top) + Spacing["4xl"],
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => handleModeChange("semester")}
            style={[
              styles.modeButton,
              styles.modeButtonLeft,
              {
                backgroundColor: roadmapMode === "semester" ? theme.primary : "transparent",
                borderColor: theme.primary,
              },
            ]}
            testID="mode-semester"
          >
            <ThemedText
              type="small"
              style={{
                color: roadmapMode === "semester" ? "#FFFFFF" : theme.primary,
                fontWeight: "600",
              }}
            >
              Semester
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleModeChange("quarter")}
            style={[
              styles.modeButton,
              styles.modeButtonRight,
              {
                backgroundColor: roadmapMode === "quarter" ? theme.primary : "transparent",
                borderColor: theme.primary,
              },
            ]}
            testID="mode-quarter"
          >
            <ThemedText
              type="small"
              style={{
                color: roadmapMode === "quarter" ? "#FFFFFF" : theme.primary,
                fontWeight: "600",
              }}
            >
              Quarter
            </ThemedText>
          </Pressable>
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
          decelerationRate="fast"
          contentContainerStyle={{
            paddingBottom: tabBarHeight + Spacing["6xl"],
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ThemedView style={styles.modalContent}>
            <View style={styles.addModalHeader}>
              <ThemedText style={styles.addModalTitle}>Add Course</ThemedText>
              <Pressable
                onPress={() => setShowAddModal(false)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.addModalScroll}
            >
              <ThemedText
                style={[styles.addModalSubtitle, { color: theme.textSecondary }]}
              >
                Adding to: {semesters[currentSemesterIndex]?.name}
              </ThemedText>

              <View style={styles.addInputGroup}>
                <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                  Course Code (Optional)
                </ThemedText>
                <TextInput
                  style={[
                    styles.addInput,
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

              <View style={styles.addInputGroup}>
                <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                  Course Title
                </ThemedText>
                <TextInput
                  style={[
                    styles.addInput,
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
                <View style={[styles.addInputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                    Units
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.addInput,
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

                <View style={[styles.addInputGroup, { flex: 2 }]}>
                  <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                    Category
                  </ThemedText>
                  <View style={styles.addChipRow}>
                    {(["major", "ge", "elective"] as const).map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() =>
                          setNewCourse({ ...newCourse, category: cat })
                        }
                        style={[
                          styles.addChip,
                          {
                            backgroundColor:
                              newCourse.category === cat
                                ? theme.primary
                                : theme.backgroundSecondary,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[styles.addChipText, {
                            color:
                              newCourse.category === cat
                                ? "#FFFFFF"
                                : theme.text,
                          }]}
                        >
                          {cat === "ge" ? "GE" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.addInputGroup}>
                <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                  Status
                </ThemedText>
                <View style={styles.addChipRow}>
                  {(["planned", "in_progress", "taken"] as const).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() =>
                        setNewCourse({ ...newCourse, status, grade: status !== "taken" ? undefined : newCourse.grade })
                      }
                      style={[
                        styles.addChip,
                        {
                          backgroundColor:
                            newCourse.status === status
                              ? status === "taken" ? theme.success : status === "in_progress" ? theme.primary : theme.secondary
                              : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.addChipText, {
                          color:
                            newCourse.status === status
                              ? "#FFFFFF"
                              : theme.text,
                        }]}
                      >
                        {status === "planned" ? "Planned" : status === "in_progress" ? "In Progress" : "Taken"}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {newCourse.status === "taken" ? (
                <View style={styles.addInputGroup}>
                  <ThemedText style={[styles.addLabel, { color: theme.textSecondary }]}>
                    Grade
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.addGradeRow}
                  >
                    {GRADES.map((grade) => (
                      <Pressable
                        key={grade}
                        onPress={() => setNewCourse({ ...newCourse, grade })}
                        style={[
                          styles.addGradeChip,
                          {
                            backgroundColor:
                              newCourse.grade === grade
                                ? theme.success
                                : theme.backgroundSecondary,
                            borderColor:
                              newCourse.grade === grade
                                ? theme.success
                                : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[styles.addChipText, {
                            color: newCourse.grade === grade ? "#FFFFFF" : theme.text,
                          }]}
                        >
                          {grade}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <Button onPress={addCourse} style={styles.addButton}>
                Add Course
              </Button>
            </ScrollView>
          </ThemedView>
        </KeyboardAvoidingView>
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

                  {selectedCourse.completed ? (
                    <View style={{ marginTop: Spacing.md }}>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                        Grade {selectedCourse.grade ? "" : "(not set)"}
                      </ThemedText>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.gradeRow}
                      >
                        {GRADES.map((grade) => (
                          <Pressable
                            key={grade}
                            onPress={() => updateCourseGrade(grade)}
                            style={[
                              styles.gradeButton,
                              {
                                backgroundColor:
                                  selectedCourse.grade === grade
                                    ? theme.success
                                    : theme.backgroundSecondary,
                                borderColor:
                                  selectedCourse.grade === grade
                                    ? theme.success
                                    : theme.border,
                              },
                            ]}
                          >
                            <ThemedText
                              type="small"
                              style={{
                                color: selectedCourse.grade === grade ? "#FFFFFF" : theme.text,
                                fontWeight: "600",
                              }}
                            >
                              {grade}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
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

      <Modal
        visible={showGradeModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowGradeModal(false);
          setCourseToGrade(null);
          setPendingGrade(undefined);
        }}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Enter Grade</ThemedText>
              <Pressable
                onPress={() => {
                  setShowGradeModal(false);
                  setCourseToGrade(null);
                  setPendingGrade(undefined);
                }}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {courseToGrade ? (
              <>
                <ThemedText type="body" style={{ marginBottom: Spacing.md }}>
                  What grade did you receive in{" "}
                  <ThemedText type="body" style={{ fontWeight: "700" }}>
                    {courseToGrade.code}
                  </ThemedText>
                  ?
                </ThemedText>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gradeRow}
                >
                  {GRADES.map((grade) => (
                    <Pressable
                      key={grade}
                      onPress={() => setPendingGrade(grade)}
                      style={[
                        styles.gradeButton,
                        {
                          backgroundColor:
                            pendingGrade === grade
                              ? theme.success
                              : theme.backgroundSecondary,
                          borderColor:
                            pendingGrade === grade
                              ? theme.success
                              : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: pendingGrade === grade ? "#FFFFFF" : theme.text,
                          fontWeight: "600",
                        }}
                      >
                        {grade}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={[styles.modalActions, { marginTop: Spacing.lg }]}>
                  <Button
                    onPress={() => saveGradeAndComplete(false)}
                    disabled={!pendingGrade}
                    style={{ flex: 1 }}
                  >
                    Save Grade
                  </Button>
                </View>
                <Pressable
                  onPress={() => saveGradeAndComplete(true)}
                  style={{ alignItems: "center", paddingVertical: Spacing.md }}
                >
                  <ThemedText type="body" style={{ color: theme.link }}>
                    Skip for now
                  </ThemedText>
                </Pressable>
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
  modeToggle: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modeButtonLeft: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    borderRightWidth: 0,
  },
  modeButtonRight: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "90%",
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
    gap: Spacing.sm,
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
  gradeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  gradeButton: {
    paddingHorizontal: Spacing.md,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  addModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.sm,
    marginBottom: 2,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  addModalScroll: {
    paddingBottom: Spacing.sm,
  },
  addModalSubtitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  addInputGroup: {
    marginBottom: Spacing.sm,
  },
  addLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  addInput: {
    height: 38,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    borderWidth: 1,
  },
  addChipRow: {
    flexDirection: "row",
    gap: 4,
  },
  addChip: {
    flex: 1,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
  },
  addChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addGradeRow: {
    flexDirection: "row",
    gap: 4,
  },
  addGradeChip: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  addButton: {
    marginTop: Spacing.sm,
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
