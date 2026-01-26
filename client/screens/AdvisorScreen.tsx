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
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
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
  type ChatMessage,
} from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm your transfer advisor. Ask me anything about transferring from your community college to a UC or CSU.",
};

export default function AdvisorScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    const history = await getChatHistory();
    if (history.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    } else {
      setMessages(history);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearChat = useCallback(() => {
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
            setMessages([WELCOME_MESSAGE]);
          },
        },
      ]
    );
  }, []);

  useEffect(() => {
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
  }, [navigation, theme, handleClearChat]);

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
      const historyForApi = newMessages
        .filter((m) => m !== WELCOME_MESSAGE)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/chat", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedText,
          history: historyForApi.slice(0, -1),
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
      color: theme.amber,
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
      color: theme.amber,
      fontSize: 14,
      marginRight: Spacing.xs,
    },
    code_inline: {
      backgroundColor: theme.backgroundTertiary,
      color: theme.amber,
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
          { paddingTop: headerHeight + Spacing.md },
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
