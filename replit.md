# TransferUp

## Overview

TransferUp is a mobile-first application designed to help California community college students navigate complex transfer requirements to UC and CSU universities. The app integrates with the ASSIST.org API to provide articulation agreements, course equivalencies, and transfer planning tools.

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
2. **Schools** - University selection, transfer requirements, and ASSIST.org integration
3. **Roadmap** - Semester-by-semester course planning
4. **Alerts** - Warnings and deadline notifications
5. **Profile** - Settings and GPA calculator

Each tab contains its own stack navigator for hierarchical navigation. A root stack navigator handles the onboarding flow as a modal.

### Transfer Requirements Feature
The app integrates with ASSIST.org to show official transfer requirements:
1. User selects their community college (CC) on the Schools tab
2. User selects target universities (UC/CSU)
3. "View Transfer Requirements" button appears below each target university
4. Tapping opens TransferRequirementsScreen showing available majors from ASSIST.org
5. Selecting a major loads course requirements parsed from the articulation agreement
6. Users can select courses and add them directly to their roadmap by semester
7. Added courses show an "In Roadmap" badge to prevent duplicates

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
  - `/api/institutions` - Fetches all 100+ California community colleges and universities
  - `/api/agreements?sendingInstitutionId=X&receivingInstitutionId=Y&academicYearId=74` - Gets list of majors/programs with articulation agreements
  - `/api/articulation/Agreements?Key=...` - Gets detailed course requirements for a specific major

**IMPORTANT: ASSIST.org Data Structure**
The articulation API response contains:
- `result.templateAssets` - Nested JSON showing major requirements layout (NOT the actual articulation mappings)
- `result.articulations` - JSON string containing actual course-to-course articulation mappings:
  - `articulation.course` - The receiving (university) course requirement
  - `articulation.sendingArticulation.items` - The sending (CC) courses that satisfy the requirement
  
### Backend API Endpoints
- `GET /api/institutions` - Proxies ASSIST.org institutions, transforms to normalized format with id, code, name, type (CC/UC/CSU)
- `GET /api/agreements` - Proxies ASSIST.org agreements endpoint for majors list
- `GET /api/articulation?key=...` - Fetches articulation data and parses into ArticulationAgreement objects:
  - `receivingCourses[]` - University requirement courses
  - `sendingCourses[]` - CC equivalent courses
  - `noArticulation` - True if no CC equivalent exists
  - `conjunction` - "AND" or "OR" for multi-course requirements

**Institution ID Examples:**
- De Anza College: 113
- UC Berkeley: 79
- Foothill College: 119

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