import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Markdown from "react-native-markdown-display";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  getChatHistory,
  saveChatHistory,
  clearChatHistory,
  getUserProfile,
  getCachedInstitutions,
  getRoadmapDataForAdvisor,
  getAllSelectedMajors,
  getAIAdvisorConsent,
  saveAIAdvisorConsent,
  type ChatMessage,
  type UserProfile,
  type Institution,
  type RoadmapData,
  type SelectedMajor,
} from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";

interface UserContext {
  communityCollegeId: number | null;
  communityCollegeName: string | null;
  targetUniversities: { id: number; name: string }[];
  gpa: number | null;
  roadmap: RoadmapData | null;
  selectedMajors: SelectedMajor[];
}

function getWelcomeMessage(userContext: UserContext | null): ChatMessage {
  if (!userContext || (!userContext.communityCollegeName && userContext.targetUniversities.length === 0)) {
    return {
      role: "assistant",
      content: "Hi! I'm your transfer advisor. To give you personalized guidance, please go to the **Schools** tab and select your community college and target universities. Once you've done that, I'll know exactly where you're transferring from and to!",
    };
  }

  const ccPart = userContext.communityCollegeName
    ? `you're at **${userContext.communityCollegeName}**`
    : "you haven't selected a community college yet";

  const targetPart = userContext.targetUniversities.length > 0
    ? `want to transfer to **${userContext.targetUniversities.map(u => u.name).join(", ")}**`
    : "haven't selected target universities yet";

  return {
    role: "assistant",
    content: `Hi! I see ${ccPart} and ${targetPart}. How can I help you plan your transfer today?`,
  };
}

export default function AdvisorScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [consentStatus, setConsentStatus] = useState<boolean | null | "loading">("loading");
  const [showConsentModal, setShowConsentModal] = useState(false);

  const checkConsent = useCallback(async () => {
    const consent = await getAIAdvisorConsent();
    setConsentStatus(consent);
    if (consent === null) {
      setShowConsentModal(true);
    }
  }, []);

  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", checkConsent);
    return unsubscribe;
  }, [navigation, checkConsent]);

  const handleAcceptConsent = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveAIAdvisorConsent(true);
    setConsentStatus(true);
    setShowConsentModal(false);
  };

  const handleDeclineConsent = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await saveAIAdvisorConsent(false);
    setConsentStatus(false);
    setShowConsentModal(false);
  };

  const loadUserContext = useCallback(async (): Promise<UserContext | null> => {
    const profile = await getUserProfile();
    if (!profile) return null;

    const targetUniversities: { id: number; name: string }[] = [];
    
    if (profile.targetUniversityIds && profile.targetUniversityIds.length > 0) {
      const cachedInstitutions = await getCachedInstitutions();
      if (cachedInstitutions) {
        for (const id of profile.targetUniversityIds) {
          const inst = cachedInstitutions.find(i => i.id === id);
          if (inst) {
            targetUniversities.push({ id: inst.id, name: inst.name });
          }
        }
      }
    }

    const roadmap = await getRoadmapDataForAdvisor();
    const selectedMajors = await getAllSelectedMajors();

    return {
      communityCollegeId: profile.communityCollegeId,
      communityCollegeName: profile.communityCollegeName,
      targetUniversities,
      gpa: profile.gpa,
      roadmap,
      selectedMajors,
    };
  }, []);

  const loadHistory = useCallback(async () => {
    const context = await loadUserContext();
    setUserContext(context);
    
    const history = await getChatHistory();
    if (history.length === 0) {
      setMessages([getWelcomeMessage(context)]);
    } else {
      setMessages(history);
    }
  }, [loadUserContext]);

  useEffect(() => {
    if (consentStatus === true) {
      loadHistory();
    }
  }, [consentStatus, loadHistory]);

  const handleClearChat = useCallback(async () => {
    const context = await loadUserContext();
    setUserContext(context);
    
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear the chat history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await clearChatHistory();
            setMessages([getWelcomeMessage(context)]);
          },
        },
      ]
    );
  }, [loadUserContext]);

  useEffect(() => {
    if (consentStatus === true) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={handleClearChat}
            hitSlop={16}
            style={styles.headerButton}
          >
            <Feather name="trash-2" size={20} color={theme.textSecondary} />
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: () => null,
      });
    }
  }, [navigation, theme, handleClearChat, consentStatus]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = { role: "user", content: trimmedText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const context = await loadUserContext();
      setUserContext(context);
      
      const historyForApi = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/chat", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedText,
          history: historyForApi.slice(0, -1),
          userContext: context,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveChatHistory(updatedMessages);
      scrollToBottom();
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please make sure the OpenAI API key is configured and try again.",
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const markdownStyles = useMemo(() => ({
    body: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: "Nunito_400Regular",
    },
    strong: {
      color: theme.blue,
      fontFamily: "Nunito_700Bold",
    },
    em: {
      fontFamily: "Nunito_400Regular",
      fontStyle: "italic" as const,
    },
    heading1: {
      color: theme.text,
      fontSize: 20,
      fontFamily: "Nunito_700Bold",
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    heading2: {
      color: theme.text,
      fontSize: 18,
      fontFamily: "Nunito_700Bold",
      marginBottom: Spacing.xs,
      marginTop: Spacing.sm,
    },
    heading3: {
      color: theme.text,
      fontSize: 16,
      fontFamily: "Nunito_600SemiBold",
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    bullet_list: {
      marginVertical: Spacing.xs,
    },
    ordered_list: {
      marginVertical: Spacing.xs,
    },
    list_item: {
      marginVertical: 2,
    },
    bullet_list_icon: {
      color: theme.primary,
      fontSize: 14,
      marginRight: Spacing.xs,
    },
    code_inline: {
      backgroundColor: theme.backgroundTertiary,
      color: theme.primary,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    fence: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginVertical: Spacing.xs,
    },
    code_block: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
      color: theme.text,
    },
    link: {
      color: theme.blue,
      textDecorationLine: "underline" as const,
    },
    paragraph: {
      marginVertical: 4,
    },
  }), [theme]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === "user";

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).duration(200)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: theme.primary }]
              : [styles.assistantBubble, { backgroundColor: theme.backgroundSecondary }],
          ]}
        >
          {isUser ? (
            <ThemedText
              type="body"
              style={[styles.messageText, { color: "#FFFFFF" }]}
            >
              {item.content}
            </ThemedText>
          ) : (
            <Markdown style={markdownStyles}>
              {item.content}
            </Markdown>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <View
          style={[
            styles.messageBubble,
            styles.assistantBubble,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <View style={styles.typingIndicator}>
            <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
            <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
            <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      animationType="fade"
      transparent
      onRequestClose={handleDeclineConsent}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.modalIconContainer, { backgroundColor: `${theme.primary}15` }]}>
            <Feather name="cpu" size={28} color={theme.primary} />
          </View>

          <ThemedText type="h3" style={styles.modalTitle}>
            AI Advisor Uses OpenAI
          </ThemedText>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <ThemedText type="body" style={[styles.modalText, { color: theme.textSecondary }]}>
              To provide helpful transfer advice, your messages and course information will be sent to OpenAI's servers for processing.
            </ThemedText>

            <ThemedText type="body" style={[styles.modalSubheading, { color: theme.text }]}>
              Data shared includes:
            </ThemedText>

            <View style={styles.dataList}>
              <View style={styles.dataItem}>
                <Feather name="message-circle" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.dataItemText, { color: theme.textSecondary }]}>
                  Your questions and messages
                </ThemedText>
              </View>
              <View style={styles.dataItem}>
                <Feather name="book" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.dataItemText, { color: theme.textSecondary }]}>
                  Your selected schools and major
                </ThemedText>
              </View>
              <View style={styles.dataItem}>
                <Feather name="list" size={16} color={theme.primary} />
                <ThemedText type="body" style={[styles.dataItemText, { color: theme.textSecondary }]}>
                  Your completed courses (when relevant)
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" style={[styles.modalDisclaimer, { color: theme.textSecondary }]}>
              OpenAI processes this data according to their privacy policy. Messages are not used to train AI models and are retained temporarily for abuse monitoring.
            </ThemedText>

            <ThemedText type="small" style={[styles.modalDisclaimer, { color: theme.textSecondary }]}>
              You can use TransferUp without the AI Advisor.
            </ThemedText>
          </ScrollView>

          <View style={styles.modalButtons}>
            <Pressable
              onPress={handleAcceptConsent}
              style={[styles.acceptButton, { backgroundColor: theme.primary }]}
              testID="button-accept-consent"
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontFamily: "Nunito_700Bold" }}>
                Accept & Continue
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleDeclineConsent}
              style={[styles.declineButton, { backgroundColor: theme.backgroundTertiary }]}
              testID="button-decline-consent"
            >
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Decline
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (consentStatus === "loading") {
    return (
      <View style={[styles.container, styles.centeredContent, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (consentStatus === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.centeredContent, { paddingHorizontal: Spacing.xl }]}>
          <View style={[styles.disabledIcon, { backgroundColor: `${theme.textSecondary}15` }]}>
            <Feather name="cpu" size={40} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.disabledTitle}>
            AI Advisor is Disabled
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.disabledText, { color: theme.textSecondary }]}
          >
            Enable it in Settings to get personalized transfer advice.
          </ThemedText>
          <Pressable
            onPress={() => (navigation as any).navigate("ProfileTab")}
            style={[styles.settingsLink, { backgroundColor: `${theme.primary}15` }]}
            testID="button-go-to-settings"
          >
            <Feather name="settings" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary, marginLeft: Spacing.sm }}>
              Go to Settings
            </ThemedText>
          </Pressable>
        </View>
        {renderConsentModal()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={[
          styles.messagesList,
          { paddingTop: insets.top + Spacing.md },
        ]}
        ListFooterComponent={renderTypingIndicator}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + Spacing.xl,
          },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Ask about transfer requirements..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
            testID="chat-input"
          />
          <Pressable
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isLoading
                    ? theme.primary
                    : theme.backgroundTertiary,
              },
            ]}
            testID="send-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>

      {renderConsentModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.sm,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  assistantMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  assistantBubble: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  inputContainer: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  headerButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalText: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  modalSubheading: {
    fontFamily: "Nunito_700Bold",
    marginBottom: Spacing.sm,
  },
  dataList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dataItemText: {
    flex: 1,
  },
  modalDisclaimer: {
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  modalButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  acceptButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  declineButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  disabledIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  disabledTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  disabledText: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
});
