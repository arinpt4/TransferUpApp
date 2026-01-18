import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface ProgressBarProps {
  progress: number;
  height?: number;
  style?: ViewStyle;
  showGlow?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 20,
  mass: 0.5,
  stiffness: 100,
};

export function ProgressBar({
  progress,
  height = 8,
  style,
  showGlow = false,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(1, Math.max(0, progress)), springConfig);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor: theme.backgroundSecondary },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: theme.primary,
            height,
          },
          showGlow && {
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
