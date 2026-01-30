import { Platform } from "react-native";

// New Blue/Slate Color Palette - Source of Truth for entire app
// Background: slate-950 (almost black)
// Cards: slate-900 with slate-800 border
// Primary accent: Blue (#3b82f6 to #2563eb gradients)
// Success/GPA: Emerald green (emerald-400)
// Text: white for primary, slate-400 for secondary, slate-500 for tertiary

export const Colors = {
  light: {
    text: "#0F172A", // slate-900
    textSecondary: "#64748B", // slate-500
    textTertiary: "#94A3B8", // slate-400
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: "#3B82F6", // blue-500
    link: "#3B82F6",
    linkPressed: "#2563EB", // blue-600
    backgroundRoot: "#F8FAFC", // slate-50
    backgroundDefault: "#F1F5F9", // slate-100
    backgroundSecondary: "#E2E8F0", // slate-200
    backgroundTertiary: "#CBD5E1", // slate-300
    border: "#E2E8F0", // slate-200
    primary: "#3B82F6", // blue-500
    primaryDark: "#2563EB", // blue-600
    primaryLight: "#60A5FA", // blue-400
    secondary: "#1E40AF", // blue-800
    success: "#10B981", // emerald-500
    successLight: "#34D399", // emerald-400
    warning: "#F59E0B", // amber-500
    error: "#EF4444", // red-500
    blue: "#3B82F6",
    blueGradientStart: "#3B82F6", // blue-500
    blueGradientEnd: "#2563EB", // blue-600
    cardBackground: "#FFFFFF",
    cardBorder: "#E2E8F0",
  },
  dark: {
    text: "#F8FAFC", // slate-50
    textSecondary: "#94A3B8", // slate-400
    textTertiary: "#64748B", // slate-500
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: "#3B82F6", // blue-500
    link: "#60A5FA", // blue-400
    linkPressed: "#93C5FD", // blue-300
    backgroundRoot: "#020617", // slate-950
    backgroundDefault: "#0F172A", // slate-900
    backgroundSecondary: "#1E293B", // slate-800
    backgroundTertiary: "#334155", // slate-700
    border: "#1E293B", // slate-800
    primary: "#3B82F6", // blue-500
    primaryDark: "#2563EB", // blue-600
    primaryLight: "#60A5FA", // blue-400
    secondary: "#3B82F6", // blue-500
    success: "#10B981", // emerald-500
    successLight: "#34D399", // emerald-400
    warning: "#F59E0B", // amber-500
    error: "#EF4444", // red-500
    blue: "#3B82F6",
    blueGradientStart: "#2563EB", // blue-600
    blueGradientEnd: "#1D4ED8", // blue-700
    cardBackground: "#0F172A", // slate-900
    cardBorder: "#1E293B", // slate-800
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
  touchTarget: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  blue: {
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
