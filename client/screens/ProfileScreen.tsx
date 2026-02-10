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
  getAIAdvisorConsent,
  saveAIAdvisorConsent,
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
  const [aiAdvisorEnabled, setAiAdvisorEnabled] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const loadData = useCallback(async () => {
    const [userProfile, userCourses, aiConsent] = await Promise.all([
      getUserProfile(),
      getCourses(),
      getAIAdvisorConsent(),
    ]);
    setProfile(userProfile);
    setCourses(userCourses);
    setAiAdvisorEnabled(aiConsent === true);
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

  const handleToggleAIAdvisor = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (aiAdvisorEnabled) {
      await saveAIAdvisorConsent(false);
      setAiAdvisorEnabled(false);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleAcceptConsent = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveAIAdvisorConsent(true);
    setAiAdvisorEnabled(true);
    setShowConsentModal(false);
  };

  const handleDeclineConsent = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowConsentModal(false);
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

        <Pressable
          onPress={handleToggleAIAdvisor}
          style={[styles.settingRow, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.settingContent}>
              <Feather name="message-circle" size={20} color={theme.text} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                AI Advisor
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginLeft: 36, marginTop: 2 }}
            >
              Sends messages to OpenAI for processing
            </ThemedText>
          </View>
          <Switch
            value={aiAdvisorEnabled}
            onValueChange={handleToggleAIAdvisor}
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
          onPress={() => Linking.openURL('https://transferup.github.io/transferup/')}
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

      <Modal
        visible={showConsentModal}
        animationType="fade"
        transparent
        onRequestClose={handleDeclineConsent}
      >
        <View style={styles.consentOverlay}>
          <View style={[styles.consentContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.consentIconContainer, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="message-circle" size={28} color={theme.primary} />
            </View>

            <ThemedText type="h3" style={styles.consentTitle}>
              AI Advisor Uses OpenAI
            </ThemedText>

            <ThemedText type="body" style={[styles.consentText, { color: theme.textSecondary }]}>
              To provide helpful transfer advice, your messages and course information will be sent to OpenAI's servers for processing.
            </ThemedText>

            <ThemedText type="body" style={[styles.consentSubheading, { color: theme.text }]}>
              Data shared includes:
            </ThemedText>

            <View style={styles.consentDataList}>
              <View style={styles.consentDataItem}>
                <Feather name="message-circle" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.consentDataItemText, { color: theme.textSecondary }]}>
                  Your questions and messages
                </ThemedText>
              </View>
              <View style={styles.consentDataItem}>
                <Feather name="book" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.consentDataItemText, { color: theme.textSecondary }]}>
                  Your selected schools and major
                </ThemedText>
              </View>
              <View style={styles.consentDataItem}>
                <Feather name="list" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.consentDataItemText, { color: theme.textSecondary }]}>
                  Your completed courses (when relevant)
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" style={[styles.consentDisclaimer, { color: theme.textSecondary }]}>
              OpenAI processes this data according to their privacy policy. Messages are not used to train AI models and are retained temporarily for abuse monitoring.
            </ThemedText>

            <View style={styles.consentButtons}>
              <Pressable
                onPress={handleAcceptConsent}
                style={[styles.consentAcceptButton, { backgroundColor: theme.primary }]}
                testID="button-settings-accept-consent"
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontFamily: "Nunito_700Bold" }}>
                  Accept & Continue
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleDeclineConsent}
                style={[styles.consentDeclineButton, { backgroundColor: theme.backgroundTertiary }]}
                testID="button-settings-decline-consent"
              >
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Decline
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
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
  consentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  consentContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
  },
  consentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  consentTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  consentText: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  consentSubheading: {
    fontFamily: "Nunito_700Bold",
    marginBottom: Spacing.sm,
  },
  consentDataList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  consentDataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  consentDataItemText: {
    flex: 1,
  },
  consentDisclaimer: {
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  consentButtons: {
    gap: Spacing.sm,
  },
  consentAcceptButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  consentDeclineButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
});
