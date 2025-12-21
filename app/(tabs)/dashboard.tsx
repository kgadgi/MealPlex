import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import { plannerStore } from '@/store/plannerStore';
import { remindersStore, Reminder } from '@/store/remindersStore';
import { shoppingStore } from '@/store/shoppingStore';
import { calendarService } from '@/services/calendar';
import { DISHES, Dish, MealType } from '@/constants/dishes';
import { useRouter } from 'expo-router';
import {
    Calendar, ShoppingCart, Bell, ChefHat, Utensils,
    Coffee, Sun, Moon, Cookie, ArrowRight, Sparkles,
    Plus, CalendarPlus
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInRight } from 'react-native-reanimated';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const mealConfig: Record<MealType, { icon: any; gradient: string }> = {
    breakfast: { icon: Coffee, gradient: '#FCD34D' },
    lunch: { icon: Sun, gradient: '#34D399' },
    dinner: { icon: Moon, gradient: '#F472B6' },
    snack: { icon: Cookie, gradient: '#60A5FA' },
};

export default function DashboardScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isTablet, contentMaxWidth } = useResponsive();
    const [plan, setPlan] = useState(plannerStore.getPlan());
    const [reminders, setReminders] = useState<Reminder[]>(remindersStore.getReminders());
    const [shoppingCount, setShoppingCount] = useState(0);

    useEffect(() => {
        const unsubPlanner = plannerStore.subscribe(() => {
            setPlan({ ...plannerStore.getPlan() });
        });
        const unsubReminders = remindersStore.subscribe(() => {
            setReminders(remindersStore.getReminders());
        });
        const unsubShopping = shoppingStore.subscribe(() => {
            setShoppingCount(shoppingStore.getItems().filter(i => !i.checked).length);
        });
        // Initial counts
        setShoppingCount(shoppingStore.getItems().filter(i => !i.checked).length);

        return () => {
            unsubPlanner();
            unsubReminders();
            unsubShopping();
        };
    }, []);

    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    const todayPlan = plan[dateKey] || {};

    const getDishName = (id: string) => {
        const strId = String(id);
        const custom = plannerStore.getCustomDishes();
        const d = custom.find(item => String(item.id) === strId) || DISHES.find(item => String(item.id) === strId);
        return d ? d.name : 'Unknown';
    };

    const getTodayReminders = () => {
        return reminders.filter(r => {
            if (!r.date) return false;
            const rDate = new Date(r.date);
            return rDate.toDateString() === today.toDateString();
        });
    };

    const todayReminders = getTodayReminders();
    const plannedMealsCount = (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
        .reduce((count, type) => count + (todayPlan[type]?.length || 0), 0);

    const getGreeting = () => {
        const hour = today.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleCalendarSync = async () => {
        const result = await calendarService.exportWeekToCalendar(
            plan as any,
            new Date(),
            7,
            getDishName
        );
        if (result.success) {
            Alert.alert(
                '📅 Calendar Synced!',
                `Added ${result.count} meals to your calendar for the next 7 days.`,
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert('Sync Failed', result.error || 'Could not export to calendar.');
        }
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.contentWrapper}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isTablet && { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
                    {/* Hero Header */}
                    <AnimatedView entering={FadeIn.duration(500)} style={[styles.heroCard, { backgroundColor: theme.primary }]}>
                        <View style={styles.heroContent}>
                            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                            <Text style={styles.heroDate}>
                                {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.heroIcon}>
                            <Utensils size={48} color="rgba(255,255,255,0.3)" />
                        </View>
                    </AnimatedView>

                    {/* Quick Stats */}
                    <AnimatedView entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
                        <Pressable
                            style={[styles.statCard, { backgroundColor: theme.surface }]}
                            onPress={() => router.push('/(tabs)')}
                        >
                            <View style={[styles.statIcon, { backgroundColor: theme.primaryLight + '30' }]}>
                                <Calendar size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.statNumber, { color: theme.text }]}>{plannedMealsCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Meals Today</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.statCard, { backgroundColor: theme.surface }]}
                            onPress={() => router.push('/(tabs)/shopping')}
                        >
                            <View style={[styles.statIcon, { backgroundColor: theme.warningLight }]}>
                                <ShoppingCart size={20} color={theme.warning} />
                            </View>
                            <Text style={[styles.statNumber, { color: theme.text }]}>{shoppingCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>To Buy</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.statCard, { backgroundColor: theme.surface }]}
                            onPress={() => router.push('/(tabs)/reminders')}
                        >
                            <View style={[styles.statIcon, { backgroundColor: theme.infoLight }]}>
                                <Bell size={20} color={theme.info} />
                            </View>
                            <Text style={[styles.statNumber, { color: theme.text }]}>{todayReminders.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reminders</Text>
                        </Pressable>
                    </AnimatedView>

                    {/* Today's Meals */}
                    <AnimatedView entering={FadeInDown.delay(200).duration(400)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Meals</Text>
                            <Pressable
                                onPress={() => router.push('/(tabs)')}
                                style={styles.sectionAction}
                            >
                                <Text style={[styles.sectionActionText, { color: theme.primary }]}>View Plan</Text>
                                <ArrowRight size={16} color={theme.primary} />
                            </Pressable>
                        </View>

                        <View style={styles.mealsContainer}>
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type, index) => {
                                const dishIds = todayPlan[type] || [];
                                const config = mealConfig[type];
                                const Icon = config.icon;

                                return (
                                    <AnimatedPressable
                                        key={type}
                                        entering={SlideInRight.delay(300 + index * 100).duration(300)}
                                        onPress={() => router.push('/(tabs)')}
                                        style={[styles.mealCard, { backgroundColor: theme.surface }, Shadows.sm]}
                                    >
                                        <View style={[styles.mealIcon, { backgroundColor: config.gradient + '20' }]}>
                                            <Icon size={20} color={config.gradient} />
                                        </View>
                                        <View style={styles.mealContent}>
                                            <Text style={[styles.mealType, { color: theme.textSecondary }]}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </Text>
                                            <Text style={[styles.mealName, { color: theme.text }]} numberOfLines={1}>
                                                {dishIds.length > 0
                                                    ? dishIds.map(id => getDishName(id)).join(', ')
                                                    : 'Nothing planned'
                                                }
                                            </Text>
                                        </View>
                                        {dishIds.length === 0 && (
                                            <Plus size={18} color={theme.textMuted} />
                                        )}
                                    </AnimatedPressable>
                                );
                            })}
                        </View>
                    </AnimatedView>

                    {/* Quick Actions */}
                    <AnimatedView entering={FadeInDown.delay(400).duration(400)}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.lg }]}>Quick Actions</Text>

                        <View style={styles.actionsGrid}>
                            <Pressable
                                style={[styles.actionCard, { backgroundColor: theme.primary }]}
                                onPress={() => router.push('/(tabs)/recipes')}
                            >
                                <ChefHat size={28} color="#fff" />
                                <Text style={styles.actionTitle}>Browse Recipes</Text>
                                <Text style={styles.actionDesc}>Discover new dishes</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionCard, { backgroundColor: theme.success }]}
                                onPress={() => router.push('/(tabs)/shopping')}
                            >
                                <Sparkles size={28} color="#fff" />
                                <Text style={styles.actionTitle}>Smart Shopping</Text>
                                <Text style={styles.actionDesc}>Generate from plan</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={[styles.wideActionCard, { backgroundColor: theme.info, marginTop: Spacing.sm }]}
                            onPress={handleCalendarSync}
                        >
                            <CalendarPlus size={24} color="#fff" />
                            <View style={{ marginLeft: Spacing.md }}>
                                <Text style={styles.actionTitle}>Sync to Calendar</Text>
                                <Text style={styles.actionDesc}>Export week to device calendar</Text>
                            </View>
                        </Pressable>
                    </AnimatedView>

                    {/* Today's Reminders */}
                    {todayReminders.length > 0 && (
                        <AnimatedView entering={FadeInDown.delay(500).duration(400)}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminders</Text>
                            </View>
                            <View style={[styles.remindersCard, { backgroundColor: theme.surface }, Shadows.sm]}>
                                {todayReminders.slice(0, 3).map((r, idx) => (
                                    <View key={r.id} style={[
                                        styles.reminderRow,
                                        idx < Math.min(todayReminders.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                                    ]}>
                                        <Bell size={16} color={theme.primary} />
                                        <Text style={[styles.reminderText, { color: theme.text }]} numberOfLines={1}>
                                            {r.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </AnimatedView>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    heroCard: {
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
    },
    heroContent: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    heroDate: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    heroIcon: {
        opacity: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionActionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    mealsContainer: {
        gap: Spacing.sm,
    },
    mealCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.md,
    },
    mealIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealContent: {
        flex: 1,
    },
    mealType: {
        fontSize: 12,
        fontWeight: '500',
    },
    mealName: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 2,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionCard: {
        flex: 1,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        ...Shadows.md,
    },
    wideActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        ...Shadows.md,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginTop: Spacing.sm,
    },
    actionDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    remindersCard: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    reminderText: {
        flex: 1,
        fontSize: 14,
    },
});
