import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { MealType, DISHES } from '@/constants/dishes';

export interface MealEvent {
    date: string; // YYYY-MM-DD
    mealType: MealType;
    dishName: string;
}

const MEAL_TIMES: Record<MealType, { hour: number; minute: number; duration: number }> = {
    breakfast: { hour: 8, minute: 0, duration: 30 },
    lunch: { hour: 12, minute: 30, duration: 45 },
    dinner: { hour: 19, minute: 0, duration: 60 },
    snack: { hour: 16, minute: 0, duration: 15 },
};

export const calendarService = {
    requestPermissions: async (): Promise<boolean> => {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Calendar Access Required',
                'Please grant calendar access to sync your meal plan.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    },

    getDefaultCalendar: async (): Promise<string | null> => {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // Try to find a default calendar
        let defaultCalendar = calendars.find(
            cal => cal.allowsModifications && cal.isPrimary
        );

        // Fallback to any writable calendar
        if (!defaultCalendar) {
            defaultCalendar = calendars.find(cal => cal.allowsModifications);
        }

        // If no writable calendar exists, create one (iOS only)
        if (!defaultCalendar && Platform.OS === 'ios') {
            const defaultCalendarSource = calendars.find(
                cal => cal.source && cal.source.name === 'iCloud'
            )?.source || calendars[0]?.source;

            if (defaultCalendarSource) {
                const newCalendarId = await Calendar.createCalendarAsync({
                    title: 'Meal Planner',
                    color: '#6366F1',
                    entityType: Calendar.EntityTypes.EVENT,
                    sourceId: defaultCalendarSource.id,
                    source: defaultCalendarSource,
                    name: 'Meal Planner',
                    ownerAccount: 'personal',
                    accessLevel: Calendar.CalendarAccessLevel.OWNER,
                });
                return newCalendarId;
            }
        }

        return defaultCalendar?.id || null;
    },

    exportMealsToCalendar: async (
        meals: MealEvent[],
        getDishName: (id: string) => string
    ): Promise<{ success: boolean; count: number; error?: string }> => {
        try {
            const hasPermission = await calendarService.requestPermissions();
            if (!hasPermission) {
                return { success: false, count: 0, error: 'Permission denied' };
            }

            const calendarId = await calendarService.getDefaultCalendar();
            if (!calendarId) {
                return { success: false, count: 0, error: 'No writable calendar found' };
            }

            let createdCount = 0;

            for (const meal of meals) {
                const timeConfig = MEAL_TIMES[meal.mealType];
                const [year, month, day] = meal.date.split('-').map(Number);

                const startDate = new Date(year, month - 1, day, timeConfig.hour, timeConfig.minute);
                const endDate = new Date(startDate.getTime() + timeConfig.duration * 60 * 1000);

                // Create emoji prefix based on meal type
                const emoji = meal.mealType === 'breakfast' ? '🍳'
                    : meal.mealType === 'lunch' ? '🥗'
                        : meal.mealType === 'dinner' ? '🍽️'
                            : '🍪';

                await Calendar.createEventAsync(calendarId, {
                    title: `${emoji} ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}: ${meal.dishName}`,
                    startDate,
                    endDate,
                    notes: `Meal planned via Meal Planner app`,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });

                createdCount++;
            }

            return { success: true, count: createdCount };
        } catch (error) {
            console.error('Calendar sync error:', error);
            return {
                success: false,
                count: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    },

    exportWeekToCalendar: async (
        plan: Record<string, Record<MealType, string[]>>,
        startDate: Date,
        days: number,
        getDishName: (id: string) => string
    ): Promise<{ success: boolean; count: number; error?: string }> => {
        const meals: MealEvent[] = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];

            const dayPlan = plan[dateKey];
            if (!dayPlan) continue;

            const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
            for (const mealType of mealTypes) {
                const dishIds = dayPlan[mealType];
                if (!dishIds || !Array.isArray(dishIds)) continue;

                for (const dishId of dishIds) {
                    const dishName = getDishName(dishId);
                    if (dishName && dishName !== 'Unknown') {
                        meals.push({
                            date: dateKey,
                            mealType,
                            dishName,
                        });
                    }
                }
            }
        }

        if (meals.length === 0) {
            return { success: false, count: 0, error: 'No meals planned for this period' };
        }

        return calendarService.exportMealsToCalendar(meals, getDishName);
    }
};
