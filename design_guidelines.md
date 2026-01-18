# Transfer Pathway Optimizer - Design Guidelines

## Brand Identity

**Purpose**: Empower California community college students to confidently navigate complex transfer requirements through an organized, trustworthy mobile experience.

**Aesthetic Direction**: **Editorial/Organized** - Think "smart planner meets confidence coach." Information-rich but never overwhelming, with clear hierarchy that makes complexity feel manageable. The app should reduce transfer anxiety through visual clarity and thoughtful organization.

**Memorable Element**: **Progress visualization as visual reward system** - Students see their transfer journey as a growing, colorful roadmap with satisfying completion animations. Every course marked complete triggers subtle celebration.

## Navigation Architecture

**Root Navigation**: Tab Bar (5 tabs)
- Home, Schools, Roadmap, Alerts, Profile
- No floating action button (no single core action)
- Alerts tab shows badge count for active warnings

**Screen Structure**:
1. **Home Tab**: Dashboard overview (Stack root)
2. **Schools Tab**: University selection/comparison (Stack root)
3. **Roadmap Tab**: Semester planner (Stack root)
4. **Alerts Tab**: Warnings list (Stack root)
5. **Profile Tab**: Settings/tools (Stack root)

**Modal Screens**: Onboarding flow (first launch), Course details (bottom sheet), GPA calculator

## Screen-by-Screen Specifications

### Home Screen
- **Purpose**: Quick progress snapshot, motivate action
- **Header**: Transparent, greeting + notification bell (right)
- **Layout**: Scrollable view
  - Progress card (semester completion %, units completed)
  - Quick stats (GPA, target school, next deadline)
  - Recent alerts (top 2)
  - CTA: "Continue planning" → Roadmap tab
- **Insets**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Schools Screen
- **Purpose**: Select community college + target universities
- **Header**: Default with search bar, filter icon (right)
- **Layout**: Scrollable with pull-to-refresh
  - "My Community College" card (selected CC)
  - "Target Universities" section with comparison cards (swipeable horizontal scroll)
  - "Browse All" expandable list
- **Insets**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Empty State**: "Select your schools" illustration

### Roadmap Screen
- **Purpose**: Semester-by-semester course planner
- **Header**: Transparent, progress bar (e.g., "12/45 units"), add button (right)
- **Layout**: Horizontal scroll for semesters (snaps to semester)
  - Each semester: Vertical list of course cards
  - Course cards: Swipeable to mark complete, tap for details
  - Sticky semester header while scrolling vertically
- **Floating**: Unit counter badge (bottom right)
- **Insets**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Empty State**: "Start planning" illustration with CTA

### Alerts Screen
- **Purpose**: Surface warnings, deadlines, conflicts
- **Header**: Default, "Alerts" title
- **Layout**: Scrollable list of alert cards
  - Critical alerts (red) at top
  - Warnings (amber)
  - Info (blue)
  - Swipe to dismiss
- **Insets**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Empty State**: "All clear!" illustration

### Profile Screen
- **Purpose**: Settings, tools, saved data
- **Header**: Transparent, edit button (right)
- **Layout**: Scrollable
  - User info (avatar, name, CC, target school)
  - Quick tools (GPA calculator)
  - Settings (Dark mode toggle, notifications)
  - Data management (Export roadmap, Clear cache)
- **Insets**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Course Details Modal (Bottom Sheet)
- **Purpose**: Show full course info, mark complete, add notes
- **Components**: Course code, title, units, transferability status, prerequisites, toggle for completion

## Color Palette

- **Primary**: `#F59E0B` (Amber 500 - California golden poppy)
- **Primary Dark**: `#D97706` (Pressed state)
- **Secondary**: `#1E40AF` (Blue 800 - education/trust)
- **Background**: `#FFFFFF` (Light mode), `#111827` (Dark mode)
- **Surface**: `#F9FAFB` (Cards/light), `#1F2937` (Cards/dark)
- **Text Primary**: `#111827` (Light), `#F9FAFB` (Dark)
- **Text Secondary**: `#6B7280`
- **Success**: `#10B981` (Completed courses)
- **Warning**: `#F59E0B` (Alerts)
- **Error**: `#EF4444` (Critical issues)
- **Border**: `#E5E7EB` (Light), `#374151` (Dark)

## Typography

**Font**: Inter (Google Font) - Clean, highly legible, professional
- **H1**: 32px Bold (Screen titles)
- **H2**: 24px Semibold (Section headers)
- **H3**: 18px Semibold (Card titles)
- **Body**: 16px Regular (Main content)
- **Small**: 14px Regular (Labels, metadata)
- **Caption**: 12px Regular (Disclaimers)

## Visual Design

- **Touch Targets**: Minimum 48px height for all interactive elements
- **Card Style**: Rounded corners (12px radius), subtle border, no shadow by default
- **Pressed States**: Reduce opacity to 0.7, haptic feedback
- **Icons**: Feather icon set from @expo/vector-icons, 24px default size
- **Progress Bars**: Rounded, height 8px, animated fill
- **Toggle Switches**: Use native components (iOS/Android standard)
- **Course Cards**: Horizontal swipe to reveal "Mark Complete" action (green background), long-press for quick complete
- **Animations**: Spring-based (duration 300ms, damping 15)
- **Skeleton Screens**: Use while loading course data (pulsing gray blocks)

## Assets to Generate

**Required**:
1. `icon.png` - App icon featuring stylized roadmap/pathway in amber and blue - Home screen
2. `splash-icon.png` - Same as icon.png - Splash screen
3. `empty-roadmap.png` - Illustration of empty planner/calendar with encouraging message - Roadmap screen (no courses added)
4. `empty-alerts.png` - Checkmark or calm character with "All clear!" vibe - Alerts screen (no active alerts)
5. `empty-schools.png` - Map of California or school building illustration - Schools screen (no schools selected)
6. `onboarding-1.png` - Student looking at phone with course pathway - Onboarding screen 1
7. `onboarding-2.png` - Transfer agreement visualization (two schools connected) - Onboarding screen 2
8. `onboarding-3.png` - Celebration/graduation cap - Onboarding screen 3

**Illustration Style**: Flat, friendly illustrations using app color palette (amber, blue, gray), minimal detail, optimistic tone

**User Avatar**: Generate 1 default avatar (neutral/books icon in circle) for Profile screen