# Transfer Pathway Optimizer

## Overview

Transfer Pathway Optimizer is a mobile-first application designed to help California community college students navigate complex transfer requirements to UC and CSU universities. The app integrates with the ASSIST.org API to provide articulation agreements, course equivalencies, and transfer planning tools.

The application follows an Expo React Native architecture with a Node.js Express backend, enabling deployment across iOS, Android, and web platforms from a single codebase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with bottom tab navigator and native stack navigators
- **State Management**: TanStack React Query for server state, React useState/useEffect for local state
- **Styling**: StyleSheet API with a custom theme system supporting light/dark modes
- **Animations**: React Native Reanimated for smooth, native-feeling animations
- **Storage**: AsyncStorage for persistent local data (user profile, cached institutions, courses)

### Navigation Structure
The app uses a 5-tab bottom navigation pattern:
1. **Home** - Dashboard with progress overview
2. **Schools** - University selection and comparison
3. **Roadmap** - Semester-by-semester course planning
4. **Alerts** - Warnings and deadline notifications
5. **Profile** - Settings and GPA calculator

Each tab contains its own stack navigator for hierarchical navigation. A root stack navigator handles the onboarding flow as a modal.

### Backend Architecture
- **Framework**: Express.js v5 running on Node.js
- **API Proxy**: Backend proxies requests to ASSIST.org API (`https://assist.org/api`)
- **Database**: PostgreSQL with Drizzle ORM (schema defined but storage currently uses in-memory implementation)
- **Build Tool**: esbuild for server bundling, tsx for development

### Data Flow
1. Client makes API requests to Express backend
2. Backend fetches data from ASSIST.org API
3. Backend transforms and returns normalized institution/course data
4. Client caches responses in AsyncStorage for offline support

### Path Aliases
- `@/` → `./client/`
- `@shared/` → `./shared/`

## External Dependencies

### Third-Party APIs
- **ASSIST.org API** (`https://assist.org/api`): California's official transfer articulation system
  - `/api/institutions` - Fetches all community colleges and universities
  - `/api/agreements` - Gets articulation agreements between schools
  - `/api/articulation` - Gets specific course equivalencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database client with Zod validation schemas

### Key Frontend Libraries
- `expo-haptics`: Tactile feedback for touch interactions
- `expo-blur`, `expo-glass-effect`: Visual effects for iOS-style UI
- `react-native-gesture-handler`: Swipe gestures and touch handling
- `react-native-keyboard-controller`: Keyboard-aware scrolling
- `@tanstack/react-query`: API data fetching and caching

### Build & Development
- Expo CLI for mobile development and builds
- Drizzle Kit for database migrations
- ESLint with Expo config and Prettier for code quality