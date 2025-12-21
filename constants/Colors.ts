// Modern color palette with gradient-friendly colors
// Inspired by top-tier apps like Uber Eats, DoorDash, and Apple Fitness

// Core accent colors
const accentGreen = '#10B981';  // Success, completed
const accentOrange = '#F97316'; // Warnings, highlights
const accentRed = '#EF4444';    // Errors, delete actions
const accentBlue = '#3B82F6';   // Primary actions
const accentPurple = '#8B5CF6'; // Premium features
const accentPink = '#EC4899';   // Special highlights

// Theme definitions
export const Colors = {
  light: {
    // Base
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Borders & Dividers
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#E5E7EB',

    // Primary Actions
    primary: '#6366F1',         // Indigo - modern & premium
    primaryLight: '#A5B4FC',
    primaryDark: '#4F46E5',
    onPrimary: '#FFFFFF',

    // Semantic Colors
    success: accentGreen,
    successLight: '#D1FAE5',
    warning: accentOrange,
    warningLight: '#FEF3C7',
    error: accentRed,
    errorLight: '#FEE2E2',
    info: accentBlue,
    infoLight: '#DBEAFE',

    // Meal Type Colors (for visual distinction)
    breakfast: '#FCD34D',       // Sunny yellow
    breakfastBg: '#FEF9C3',
    lunch: '#34D399',           // Fresh green
    lunchBg: '#D1FAE5',
    dinner: '#F472B6',          // Warm pink
    dinnerBg: '#FCE7F3',
    snack: '#60A5FA',           // Light blue
    snackBg: '#DBEAFE',

    // Shopping Categories
    categoryProduce: '#22C55E',
    categoryDairy: '#3B82F6',
    categoryProtein: '#EF4444',
    categoryGrains: '#F59E0B',
    categoryPantry: '#8B5CF6',
    categoryOther: '#6B7280',

    // Tab bar
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6366F1',
    tabBarBackground: '#FFFFFF',

    // Cards & Shadows
    cardBackground: '#FFFFFF',
    shadowColor: '#000000',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
  },

  dark: {
    // Base
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    background: '#0F172A',      // Deep blue-black
    surface: '#1E293B',
    surfaceElevated: '#334155',

    // Borders & Dividers
    border: '#334155',
    borderLight: '#1E293B',
    divider: '#334155',

    // Primary Actions
    primary: '#818CF8',         // Lighter indigo for dark mode
    primaryLight: '#6366F1',
    primaryDark: '#A5B4FC',
    onPrimary: '#0F172A',

    // Semantic Colors
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A5F',

    // Meal Type Colors (slightly muted for dark mode)
    breakfast: '#FCD34D',
    breakfastBg: '#422006',
    lunch: '#34D399',
    lunchBg: '#064E3B',
    dinner: '#F472B6',
    dinnerBg: '#500724',
    snack: '#60A5FA',
    snackBg: '#1E3A5F',

    // Shopping Categories
    categoryProduce: '#4ADE80',
    categoryDairy: '#60A5FA',
    categoryProtein: '#F87171',
    categoryGrains: '#FBBF24',
    categoryPantry: '#A78BFA',
    categoryOther: '#9CA3AF',

    // Tab bar
    tabIconDefault: '#6B7280',
    tabIconSelected: '#818CF8',
    tabBarBackground: '#1E293B',

    // Cards & Shadows
    cardBackground: '#1E293B',
    shadowColor: '#000000',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(255, 255, 255, 0.05)',
  },
};

// Gradient presets for visual flair
export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  success: ['#10B981', '#34D399'],
  warm: ['#F97316', '#FB923C'],
  cool: ['#3B82F6', '#60A5FA'],
  premium: ['#8B5CF6', '#EC4899'],
  sunrise: ['#FCD34D', '#F97316'],  // For breakfast
  fresh: ['#34D399', '#10B981'],     // For lunch
  sunset: ['#EC4899', '#F472B6'],    // For dinner
};

// Spacing scale (4pt grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type ThemeColors = typeof Colors.light;

export default Colors;
