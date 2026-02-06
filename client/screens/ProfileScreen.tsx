import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Modal,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { reloadAppAsync } from "expo";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getUserProfile,
  saveUserProfile,
  getCourses,
  clearAllData,
  type UserProfile,
  type Course,
} from "@/lib/storage";

export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark, setThemePreference } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");

  const loadData = useCallback(async () => {
    const [userProfile, userCourses] = await Promise.all([
      getUserProfile(),
      getCourses(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);
    if (userProfile?.name) {
      setEditName(userProfile.name);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const saveProfile = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedProfile: UserProfile = {
      name: editName,
      communityCollegeId: profile?.communityCollegeId || null,
      communityCollegeName: profile?.communityCollegeName || null,
      targetUniversityIds: profile?.targetUniversityIds || [],
      gpa: profile?.gpa || null,
    };
    await saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setShowEditModal(false);
  };

  const handleToggleDarkMode = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemePreference(isDark ? "light" : "dark");
  };

  const handleClearData = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to delete your data? This action cannot be undone."
      );
      if (confirmed) {
        await clearAllData();
        await reloadAppAsync();
      }
    } else {
      Alert.alert(
        "Clear All Data",
        "Are you sure you want to delete your data? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await clearAllData();
              await reloadAppAsync();
            },
          },
        ]
      );
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["2xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <View style={styles.profileHeader}>
          <View
            style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="user" size={32} color={theme.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="h2">{profile?.name || "Student"}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: 2 }}
            >
              {profile?.communityCollegeName || "No school selected"}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setShowEditModal(true)}
            style={[styles.editButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="edit-2" size={18} color={theme.text} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Quick Tools
        </ThemedText>

        <Card
          elevation={1}
          style={{ ...styles.toolCard, borderColor: theme.border }}
          onPress={() => (navigation as any).navigate("SchoolsTab")}
        >
          <View style={styles.toolContent}>
            <View
              style={[styles.toolIcon, { backgroundColor: `${theme.secondary}15` }]}
            >
              <Feather name="book-open" size={22} color={theme.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">Manage Schools</ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: 2 }}
              >
                Update your CC and target universities
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Settings
        </ThemedText>

        <Pressable
          onPress={handleToggleDarkMode}
          style={[styles.settingRow, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.settingContent}>
            <Feather name={isDark ? "moon" : "sun"} size={20} color={theme.text} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </ThemedText>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </Pressable>

      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Data
        </ThemedText>

        <Pressable
          onPress={handleClearData}
          style={({ pressed }) => [
            styles.dangerButton,
            {
              backgroundColor: `${theme.error}15`,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="trash-2" size={20} color={theme.error} />
          <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.md }}>
            Clear All Data
          </ThemedText>
        </Pressable>

      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Legal
        </ThemedText>

        <Pressable
          onPress={() => Linking.openURL('https://transferupapp.com/privacy-policy.html')}
          style={({ pressed }) => [
            styles.settingRow,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.settingContent}>
            <Feather name="shield" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              Privacy Policy
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <ThemedText
          type="small"
          style={[styles.footerText, { color: theme.textSecondary }]}
        >
          TransferUp v1.0.0
        </ThemedText>
      </Animated.View>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Edit Profile</ThemedText>
              <Pressable onPress={() => setShowEditModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Your Name
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
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />
            </View>

            <Button onPress={saveProfile} style={{ marginTop: Spacing.lg }}>
              Save Changes
            </Button>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  toolCard: {
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  toolContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  footerText: {
    textAlign: "center",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.lg,
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
});
