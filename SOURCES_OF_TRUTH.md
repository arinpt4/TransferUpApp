# Sources of Truth

This document catalogs all reusable functions, utilities, services, and patterns in the Transfer Pathway Optimizer codebase.

---

## Client-Side Utilities

### Storage (`client/lib/storage.ts`)

The central data persistence layer using AsyncStorage.

| Function | Description | Called By |
|----------|-------------|-----------|
| `getOnboardingComplete()` | Returns whether onboarding is complete | RootStackNavigator |
| `setOnboardingComplete(boolean)` | Marks onboarding as complete/incomplete | OnboardingScreen |
| `getUserProfile()` | Gets user profile (name, CC, targets, GPA) | HomeScreen, ProfileScreen, SchoolsScreen, RoadmapScreen |
| `saveUserProfile(UserProfile)` | Saves user profile | OnboardingScreen, ProfileScreen, SchoolsScreen |
| `getCourses()` | Gets all courses in roadmap | HomeScreen, ProfileScreen, RoadmapScreen, GPACalculatorScreen |
| `saveCourses(Course[])` | Saves courses to roadmap | RoadmapScreen |
| `getSemesters()` | Gets semester definitions | RoadmapScreen |
| `saveSemesters(Semester[])` | Saves semester definitions | Internal |
| `getQuarters()` | Gets quarter definitions | RoadmapScreen |
| `saveQuarters(Semester[])` | Saves quarter definitions | Internal |
| `getRoadmapMode()` | Gets semester/quarter mode | RoadmapScreen |
| `saveRoadmapMode(RoadmapMode)` | Saves roadmap display mode | RoadmapScreen |
| `getAlerts()` | Gets all alerts | AlertsScreen |
| `saveAlerts(Alert[])` | Saves alerts | AlertsScreen |
| `getCachedInstitutions()` | Gets cached institution list | SchoolsScreen |
| `saveCachedInstitutions(Institution[])` | Caches institution list | SchoolsScreen |
| `getChatHistory()` | Gets advisor chat history | AdvisorScreen |
| `saveChatHistory(ChatMessage[])` | Saves chat history | AdvisorScreen |
| `clearChatHistory()` | Clears chat history | AdvisorScreen |
| `clearAllData()` | Clears all AsyncStorage data | ProfileScreen |
| `getThemePreference()` | Gets light/dark/system preference | ThemeContext |
| `saveThemePreference(ThemePreference)` | Saves theme preference | ThemeContext |
| `calculateGPA(Course[])` | Calculates GPA from courses marked as "taken" | GPACalculatorScreen |
| `generateId()` | Generates unique ID (timestamp + random) | RoadmapScreen |

#### Types Exported
- `UserProfile` - User's profile data
- `Institution` - School data
- `Course` - Course in roadmap
- `CourseStatus` - "planned" | "in_progress" | "taken"
- `CourseGrade` - Grade options (A+ through F)
- `Semester` - Semester/quarter definition
- `Alert` - Notification alert
- `RoadmapMode` - "semester" | "quarter"
- `ThemePreference` - "light" | "dark" | "system"
- `ChatMessage` - Chat message format

#### Constants Exported
- `GRADE_POINTS` - Maps grades to point values (A=4.0, B=3.0, etc.)

---

### API Client (`client/lib/query-client.ts`)

HTTP client utilities for API communication.

| Function | Description | Called By |
|----------|-------------|-----------|
| `getApiUrl()` | Returns base API URL from environment | SchoolsScreen, TransferRequirementsScreen, AdvisorScreen |
| `apiRequest(method, route, data?)` | Makes authenticated API request | Available for mutations |
| `getQueryFn({ on401 })` | Creates query function for React Query | QueryClient default |
| `queryClient` | Configured TanStack Query client | App.tsx |

---

### Theme System

#### Theme Context (`client/contexts/ThemeContext.tsx`)

| Export | Description | Called By |
|--------|-------------|-----------|
| `ThemeProvider` | Provides theme state to app | App.tsx |
| `useThemeContext()` | Low-level theme access | useTheme hook |

#### Theme Hook (`client/hooks/useTheme.ts`)

| Export | Description | Called By |
|--------|-------------|-----------|
| `useTheme()` | Returns `{ theme, isDark, themePreference, setThemePreference }` | All components needing theme |

#### Theme Constants (`client/constants/theme.ts`)

| Export | Description | Called By |
|--------|-------------|-----------|
| `Colors` | Light/dark color palettes | useTheme |
| `Spacing` | Spacing scale (xs through 6xl) | All components |
| `BorderRadius` | Border radius scale | All components |
| `Typography` | Font styles (h1-h4, body, small, etc.) | ThemedText |
| `Fonts` | Platform-specific font families | - |
| `Shadows` | Shadow styles (sm, md, lg) | - |

---

### Navigation Hook (`client/hooks/useScreenOptions.ts`)

| Function | Description | Called By |
|----------|-------------|-----------|
| `useScreenOptions({ transparent? })` | Returns navigator screen options | All Stack navigators |

---

## Reusable Components

### Layout Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ThemedView` | `client/components/ThemedView.tsx` | View with theme background |
| `ThemedText` | `client/components/ThemedText.tsx` | Text with typography presets (h1-h4, body, small, caption, link) |
| `Card` | `client/components/Card.tsx` | Animated card with elevation backgrounds |
| `KeyboardAwareScrollViewCompat` | `client/components/KeyboardAwareScrollViewCompat.tsx` | Cross-platform keyboard-aware scroll |

### Interactive Components

| Component | Location | Description |
|-----------|----------|-------------|
| `Button` | `client/components/Button.tsx` | Primary animated button |
| `CourseCard` | `client/components/CourseCard.tsx` | Course display card with checkbox |
| `SchoolCard` | `client/components/SchoolCard.tsx` | School selection card |
| `AlertCard` | `client/components/AlertCard.tsx` | Alert notification card |

### Feedback Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ProgressBar` | `client/components/ProgressBar.tsx` | Animated progress indicator |
| `SkeletonLoader` | `client/components/SkeletonLoader.tsx` | Loading placeholder |
| `SkeletonCard` | `client/components/SkeletonLoader.tsx` | Card loading placeholder |
| `SkeletonCourseCard` | `client/components/SkeletonLoader.tsx` | Course card loading placeholder |
| `EmptyState` | `client/components/EmptyState.tsx` | Empty list state with image, title, action |

### Error Handling

| Component | Location | Description |
|-----------|----------|-------------|
| `ErrorBoundary` | `client/components/ErrorBoundary.tsx` | React error boundary wrapper |
| `ErrorFallback` | `client/components/ErrorFallback.tsx` | Error UI with restart button |

### Navigation Components

| Component | Location | Description |
|-----------|----------|-------------|
| `HeaderTitle` | `client/components/HeaderTitle.tsx` | Custom header with app branding |

---

## Animation Utilities (`client/lib/animations.ts`)

Shared animation configuration for consistent micro-interactions.

| Export | Description | Used By |
|--------|-------------|---------|
| `springConfig` | Standard spring animation config (damping: 15, mass: 0.3, stiffness: 150) | Button, Card, CourseCard, ProgressBar |
| `AnimatedPressable` | Pre-configured Animated Pressable component | Button, Card, CourseCard |

---

## Server-Side Utilities

### API Routes (`server/routes.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/institutions` | GET | Fetches and normalizes California institutions from ASSIST.org |
| `/api/agreements` | GET | Fetches articulation agreements between two schools |
| `/api/articulation` | GET | Fetches and parses course requirements for a major |
| `/api/chat` | POST | AI advisor chat with function calling |
| `/api/health` | GET | Health check endpoint |

### Internal Functions

| Function | Description |
|----------|-------------|
| `fetchAllInstitutions()` | Fetches and caches all institutions |
| `fuzzyMatchScore(query, text)` | Fuzzy string matching for search |
| `expandQueryWithAliases(query)` | Expands major abbreviations (CS -> Computer Science) |
| `executeFunction(name, args)` | Executes AI tool calls |
| `parseArticulationData(data)` | Parses ASSIST.org articulation response into full course objects |
| `parseArticulationDataForChat(data)` | Wrapper that returns simplified course objects (code, title, units) |

### AI Tools (for chat function calling)

| Tool | Description |
|------|-------------|
| `search_institutions` | Search schools by name |
| `get_agreements` | Get majors with articulation agreements |
| `search_majors` | Fuzzy search for specific major |
| `get_articulation` | Get course requirements for a major |

---

## Common Patterns

### Data Loading Pattern

Used across screens for consistent data fetching:

```typescript
const loadData = useCallback(async () => {
  const data = await getDataFromStorage();
  setData(data);
}, []);

useEffect(() => {
  loadData();
}, [loadData]);

// Refresh on screen focus
useEffect(() => {
  const unsubscribe = navigation.addListener("focus", loadData);
  return unsubscribe;
}, [navigation, loadData]);
```

### Modal Pattern

Consistent bottom sheet modal styling:

```typescript
<Modal visible={show} animationType="slide" transparent onRequestClose={onClose}>
  <View style={styles.modalOverlay}>
    <ThemedView style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <ThemedText type="h3">Title</ThemedText>
        <Pressable onPress={onClose}>
          <Feather name="x" size={24} />
        </Pressable>
      </View>
      {/* Content */}
    </ThemedView>
  </View>
</Modal>
```

### Haptic Feedback Pattern

Consistent tactile feedback:

```typescript
// Light tap
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Success action
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning/destructive action
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

### Safe Area Padding Pattern

Consistent screen padding calculation:

```typescript
const headerHeight = useHeaderHeight();
const tabBarHeight = useBottomTabBarHeight();

// For ScrollView
contentContainerStyle={{
  paddingTop: headerHeight + Spacing.xl,
  paddingBottom: tabBarHeight + Spacing["2xl"],
  paddingHorizontal: Spacing.lg,
}}
```

---

## File Structure

```
client/
├── App.tsx                 # Root component, providers
├── lib/
│   ├── storage.ts          # AsyncStorage utilities
│   ├── query-client.ts     # API client
│   └── animations.ts       # Shared animation configs (NEW)
├── constants/
│   └── theme.ts            # Colors, spacing, typography
├── contexts/
│   └── ThemeContext.tsx    # Theme state provider
├── hooks/
│   ├── useTheme.ts         # Theme access hook
│   └── useScreenOptions.ts # Navigator options hook
├── components/             # Reusable UI components
├── screens/                # Screen components
└── navigation/             # Navigator definitions

server/
├── index.ts                # Express server setup
├── routes.ts               # API routes and AI tools
└── storage.ts              # Server-side storage interface
```
