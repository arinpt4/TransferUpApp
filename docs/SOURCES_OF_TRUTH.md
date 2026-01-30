# Sources of Truth

This document catalogs the authoritative sources for patterns, data structures, and conventions used throughout the Transfer Pathway Optimizer app.

## Color Scheme

**Source of Truth**: `client/constants/theme.ts`

The app uses a blue/slate color palette. All colors should be accessed via the `theme` object from `useTheme()` hook.

### Primary Colors
- **Primary Blue**: `theme.primary` (#3B82F6)
- **Primary Dark**: `theme.primaryDark` (#2563EB)
- **Primary Light**: `theme.primaryLight` (#60A5FA)

### Semantic Colors
- **Success/GPA**: `theme.success` (#10B981) - Use ONLY for GPA and completion states
- **Warning**: `theme.warning` (#F59E0B)
- **Error**: `theme.error` (#EF4444)

### Background Colors (Dark Mode)
- **Root**: `theme.backgroundRoot` (#020617 - slate-950)
- **Cards**: `theme.backgroundDefault` (#0F172A - slate-900)
- **Elevated**: `theme.backgroundSecondary` (#1E293B - slate-800)

### Text Colors
- **Primary**: `theme.text` (white/dark based on mode)
- **Secondary**: `theme.textSecondary` (#94A3B8 - slate-400)
- **Tertiary**: `theme.textTertiary` (#64748B - slate-500)

## Design Guidelines

**Source of Truth**: `design_guidelines.md`

Contains complete UI/UX specifications including:
- Component styling (cards, buttons, badges)
- Screen-by-screen layouts
- Typography specifications
- Animation guidelines

## Theme-Aware Components Pattern

When creating theme-aware components, always use the `useTheme()` hook:

```typescript
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.backgroundDefault }}>
      <Text style={{ color: theme.text }}>Content</Text>
    </View>
  );
}
```

### Do NOT:
- Hardcode colors like `#F59E0B` or `#0F172A`
- Use conditional colors without `isDark` check
- Mix amber/orange colors (legacy) - use blue instead

### Do:
- Always use `theme.*` properties for colors
- Use `isDark` for opacity-based backgrounds when needed
- Use gradient buttons with blue-600 to blue-700

## Roadmap Data Structure

**Source of Truth**: `client/lib/storage.ts`

### Roadmap Mode
- Key: `roadmapMode` in AsyncStorage
- Values: `"semester"` | `"quarter"`
- Default: `"semester"`

### Loading Periods
```typescript
const mode = await getRoadmapMode();
const periods = mode === "quarter" 
  ? await getQuarters() 
  : await getSemesters();
```

### Course Structure
```typescript
interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  semesterId: string;  // Links to semester or quarter ID
  completed: boolean;
  category: "major" | "ge" | "elective";
  status?: "planned" | "in_progress" | "taken";
  grade?: CourseGrade;
  transferable?: boolean;
  notes?: string;
}
```

## Navigation Pattern

**Source of Truth**: `client/navigation/`

### Focus Listeners for Data Refresh
When a screen needs to refresh data when returning from another screen:

```typescript
useEffect(() => {
  const unsubscribe = navigation.addListener("focus", loadData);
  return unsubscribe;
}, [navigation, loadData]);
```

This pattern is used in:
- RoadmapScreen
- TransferRequirementsScreen
- HomeScreen
- ProfileScreen

## Button Styling

**Source of Truth**: `client/components/Button.tsx` and `design_guidelines.md`

Primary buttons use `theme.primary` (blue) with gradient for emphasis:
- Gradient: #2563EB to #1D4ED8 (blue-600 to blue-700)
- Border radius: 20px (BorderRadius.xl)
- Active scale: 0.98
- Shadow: blue-900/30 for gradient buttons
