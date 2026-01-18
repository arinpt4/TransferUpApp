import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  Dimensions,
  TextInput,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { setOnboardingComplete, saveUserProfile } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    id: "1",
    image: require("../../assets/images/illustrations/onboarding_welcome_illustration.png"),
    title: "Plan Your Transfer",
    description:
      "Navigate your community college to university transfer journey with confidence.",
  },
  {
    id: "2",
    image: require("../../assets/images/illustrations/transfer_connection_illustration.png"),
    title: "Connect Schools",
    description:
      "Link your community college with your target universities to see course equivalencies.",
  },
  {
    id: "3",
    image: require("../../assets/images/illustrations/graduation_celebration_illustration.png"),
    title: "Reach Your Goals",
    description:
      "Track your progress and stay on top of requirements to successfully transfer.",
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState("");

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      setShowNameInput(true);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveUserProfile({
      name: name.trim(),
      communityCollegeId: null,
      communityCollegeName: null,
      targetUniversityIds: [],
      gpa: null,
    });
    await setOnboardingComplete(true);
    onComplete();
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNameInput(true);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View entering={FadeIn.duration(500)}>
        <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
      </Animated.View>
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.slideContent}
      >
        <ThemedText type="h1" style={styles.slideTitle}>
          {item.title}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.slideDescription, { color: theme.textSecondary }]}
        >
          {item.description}
        </ThemedText>
      </Animated.View>
    </View>
  );

  if (showNameInput) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.nameContainer}
        >
          <View style={styles.nameHeader}>
            <ThemedText type="h1" style={styles.nameTitle}>
              What's your name?
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.nameSubtitle, { color: theme.textSecondary }]}
            >
              We'll personalize your experience
            </ThemedText>
          </View>

          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
          />

          <Button
            onPress={handleComplete}
            disabled={!name.trim()}
            style={styles.nameButton}
          >
            Get Started
          </Button>
        </Animated.View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.skipContainer}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <ThemedText type="link" style={{ color: theme.link }}>
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex ? theme.primary : theme.backgroundTertiary,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button onPress={handleNext} style={styles.nextButton}>
          {currentIndex === slides.length - 1 ? "Continue" : "Next"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  slideImage: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    marginBottom: Spacing["3xl"],
  },
  slideContent: {
    alignItems: "center",
  },
  slideTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  slideDescription: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  paginationDot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  nextButton: {
    width: "100%",
  },
  nameContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  nameHeader: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  nameTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  nameSubtitle: {
    textAlign: "center",
  },
  nameInput: {
    height: 56,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  nameButton: {
    width: "100%",
  },
});
