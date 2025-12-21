import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/Colors';

export function useTheme(): ThemeColors {
    const colorScheme = useRNColorScheme();
    return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}

export function useColorScheme() {
    return useRNColorScheme() ?? 'light';
}
