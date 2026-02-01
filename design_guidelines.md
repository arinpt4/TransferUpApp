# TransferUp - Design Guidelines

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

## Color Palette - Blue/Slate Theme (SOURCE OF TRUTH)

### Dark Mode (Primary)
- **Background Root**: `#020617` (slate-950 - almost black)
- **Background Default**: `#0F172A` (slate-900 - card backgrounds)
- **Background Secondary**: `#1E293B` (slate-800 - elevated surfaces)
- **Background Tertiary**: `#334155` (slate-700)
- **Border**: `#1E293B` (slate-800)

### Primary Colors
- **Primary**: `#3B82F6` (blue-500 - main accent)
- **Primary Dark**: `#2563EB` (blue-600 - pressed states)
- **Primary Light**: `#60A5FA` (blue-400 - text accents)
- **Blue Gradient**: `#2563EB` to `#1D4ED8` (blue-600 to blue-700)

### Text Colors
- **Text Primary**: `#F8FAFC` (slate-50 - white)
- **Text Secondary**: `#94A3B8` (slate-400)
- **Text Tertiary**: `#64748B` (slate-500)

### Semantic Colors
- **Success/GPA**: `#10B981` (emerald-500), `#34D399` (emerald-400 for light text)
- **Warning**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)

### Light Mode
- **Background Root**: `#F8FAFC` (slate-50)
- **Background Default**: `#F1F5F9` (slate-100)
- **Background Secondary**: `#E2E8F0` (slate-200)
- **Text Primary**: `#0F172A` (slate-900)
- **Text Secondary**: `#64748B` (slate-500)
- **Border**: `#E2E8F0` (slate-200)

## Component Styling

### Cards
```
backgroundColor: #0F172A (slate-900)
borderWidth: 1
borderColor: #1E293B (slate-800)
borderRadius: 20px (BorderRadius.xl)
padding: 16-20px
```

### Buttons - Primary (Blue Gradient)
```
gradient: from #2563EB to #1D4ED8 (blue-600 to blue-700)
borderRadius: 20px
padding: 16-20px
shadow: blue-900/30
active:scale: 0.98
```

### Status Badges
- **In Progress**: `backgroundColor: rgba(59, 130, 246, 0.1)`, `color: #60A5FA`
- **Planned**: `backgroundColor: #1E293B`, `color: #64748B`
- **Completed**: `backgroundColor: rgba(16, 185, 129, 0.1)`, `color: #34D399`

### Icon Containers
- **Active/In Progress**: `backgroundColor: #2563EB`, icon color: white
- **Inactive/Planned**: `backgroundColor: #1E293B`, icon color: `#64748B`

### Progress Indicators
- Background track: `#1E293B` (slate-800)
- Fill: Gradient from `#3B82F6` to `#2563EB` (blue-500 to blue-600)

## Screen-by-Screen Specifications

### Home Screen (NEW DESIGN)
- **Header**: "Hey, [username]" title + CC → University subtitle + settings button
- **Giant Circular Progress**: 256x256px, blue gradient stroke, percentage in center
- **Mini Stats Row**: 3 cards (Units Done, Current GPA in emerald, Remaining in blue)
- **Coming Up Section**: Course cards with In Progress/Planned status
- **Quick Actions**: Blue gradient buttons (Requirements, Ask Advisor, GPA Calculator)

### Schools Screen
- Use blue for selection indicators and buttons
- Selected state: `backgroundColor: rgba(59, 130, 246, 0.1)`, `borderColor: #3B82F6`

### Roadmap Screen
- Mode toggle: Blue for active state
- Progress bars: Blue gradient fill
- Course cards: Same styling as Home screen

### Transfer Requirements Screen
- "Add to Roadmap" button: Blue gradient
- Selected courses: Blue border and background tint

### Advisor/Chat Screen
- User message bubbles: Blue gradient background
- Send button: Blue gradient
- AI messages: slate-800 background

### Profile/Settings Screen
- Active toggles: Blue (#3B82F6)
- Buttons: Blue gradient

### GPA Calculator Screen
- GPA display: Emerald green (`#34D399`)
- Other buttons: Blue gradient

## Typography

**Font**: System font with Nunito for display text
- **H1**: 32px Bold (Screen titles)
- **H2**: 24px Semibold (Section headers)
- **H3**: 18px Semibold (Card titles)
- **Body**: 16px Regular (Main content)
- **Small**: 14px Regular (Labels, metadata)
- **Caption**: 12px Regular (Disclaimers)

## Visual Design

- **Touch Targets**: Minimum 48px height for all interactive elements
- **Card Style**: Rounded corners (20px radius), subtle border, no shadow on cards
- **Button Shadows**: Blue shadow for gradient buttons (`shadow-blue-900/30`)
- **Pressed States**: Scale to 0.98, haptic feedback
- **Icons**: Feather icon set from @expo/vector-icons, 20-24px default size
- **Progress Bars**: Rounded, height 4-8px, animated fill
- **Animations**: Spring-based (duration 300-400ms)

## Key Principles

1. **Blue is the primary accent** - Replace all amber/orange/purple with blue
2. **Emerald only for GPA/success** - Keep green exclusively for grades and completion
3. **Consistent card styling** - All cards use slate-900 bg with slate-800 border
4. **Gradient buttons** - Blue-600 to blue-700 for all primary actions
5. **Slate grays for text hierarchy** - Use slate-400/500 for secondary/tertiary text
