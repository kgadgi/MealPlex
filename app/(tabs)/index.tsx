import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, FlatList, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISHES, Dish, MealType } from '@/constants/dishes';
import { plannerStore } from '@/store/plannerStore';
import { remindersStore, Reminder } from '@/store/remindersStore';
import { useTheme } from '@/components/useColorScheme';
import { Colors, Radius, Shadows, Spacing } from '@/constants/Colors';
import { ArrowLeft, ArrowRight, Plus, CalendarRange, List, Share2, Clock, X, Utensils, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import Animated, {
  FadeIn, FadeInDown, SlideInRight, SlideOutRight, Layout,
  useAnimatedStyle, withSpring, useSharedValue, withTiming
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const mealConfig: Record<MealType, { label: string; icon: any; gradient: string[] }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, gradient: ['#FCD34D', '#F97316'] },
  lunch: { label: 'Lunch', icon: Sun, gradient: ['#34D399', '#10B981'] },
  dinner: { label: 'Dinner', icon: Moon, gradient: ['#EC4899', '#F472B6'] },
  snack: { label: 'Snack', icon: Cookie, gradient: ['#60A5FA', '#3B82F6'] },
};

export default function PlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isTablet, contentMaxWidth } = useResponsive();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [plan, setPlan] = useState(plannerStore.getPlan());
  const [reminders, setReminders] = useState<Reminder[]>(remindersStore.getReminders());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MealType | null>(null);
  const [customDishName, setCustomDishName] = useState('');
  const [allDishes, setAllDishes] = useState<any[]>([]);

  useEffect(() => {
    const unsubPlanner = plannerStore.subscribe(() => {
      setPlan({ ...plannerStore.getPlan() });
    });
    const unsubReminders = remindersStore.subscribe(() => {
      setReminders(remindersStore.getReminders());
    });
    return () => {
      unsubPlanner();
      unsubReminders();
    };
  }, []);

  useEffect(() => {
    if (pickerVisible) {
      const custom = plannerStore.getCustomDishes();
      setAllDishes([...custom, ...DISHES]);
    }
  }, [pickerVisible]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const changeWeek = (days: number) => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() + days);
    setWeekStartDate(newDate);
  };

  const goToThisWeek = () => {
    setWeekStartDate(new Date());
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const dateKey = formatDateKey(currentDate);

  const handleAddDish = (type: MealType) => {
    setSelectedSlot(type);
    setPickerVisible(true);
  };

  const handleAddCustomDish = () => {
    if (!customDishName.trim()) return;

    const newDish = plannerStore.addCustomDish(customDishName.trim(), undefined);
    if (selectedSlot) {
      plannerStore.addDishToDate(
        dateKey,
        selectedSlot,
        newDish.id
      );
    }
    setCustomDishName('');
    setPickerVisible(false);
    setSelectedSlot(null);
  };

  const getDishName = (id: string | number | undefined) => {
    if (!id) return null;
    const strId = String(id);
    const custom = plannerStore.getCustomDishes();
    const d = custom.find(item => String(item.id) === strId) || DISHES.find(item => String(item.id) === strId);
    return d ? d.name : 'Unknown Item';
  };

  const handleShare = async () => {
    let message = '';
    if (viewMode === 'day') {
      const b = plannerStore.getDishesForDate(dateKey, 'breakfast').map(id => getDishName(id)).join(', ') || 'Nothing planned';
      const l = plannerStore.getDishesForDate(dateKey, 'lunch').map(id => getDishName(id)).join(', ') || 'Nothing planned';
      const d = plannerStore.getDishesForDate(dateKey, 'dinner').map(id => getDishName(id)).join(', ') || 'Nothing planned';
      message = `📅 Plan for ${currentDate.toDateString()}\n\n🍳 Breakfast: ${b}\n🥗 Lunch: ${l}\n🍽️ Dinner: ${d}`;
    } else {
      message = "📅 Upcoming Meal Plan:\n\n";
      const days = getWeekDays();
      days.forEach(day => {
        const k = formatDateKey(day);
        const p = plannerStore.getPlan()[k] || {};
        const dIds = p.dinner || [];
        const dNames = Array.isArray(dIds) ? dIds.map(id => getDishName(id)).join(', ') : (dIds ? getDishName(dIds as string) : '');
        if (dNames) {
          message += `${day.toLocaleDateString(undefined, { weekday: 'short' })}: 🍽️ ${dNames}\n`;
        } else {
          message += `${day.toLocaleDateString(undefined, { weekday: 'short' })}: -\n`;
        }
      });
    }

    try {
      await Share.share({ message });
    } catch (error) {
      // ignore
    }
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(weekStartDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const jumpToDay = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const renderDayView = () => {
    const dayReminders = reminders.filter(r => {
      if (!r.date) return false;
      const rDate = new Date(r.date);
      return rDate.getDate() === currentDate.getDate() &&
        rDate.getMonth() === currentDate.getMonth() &&
        rDate.getFullYear() === currentDate.getFullYear();
    });

    return (
      <View>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type, index) => {
          const dishIds = plannerStore.getDishesForDate(dateKey, type);
          const dishes = dishIds.map(id => {
            const strId = String(id);
            const found = plannerStore.getCustomDishes().find(d => String(d.id) === strId)
              || DISHES.find(d => String(d.id) === strId);
            return found || { id: id, name: 'Unknown Item', cuisine: '-', diet: '-', type: [], image: '' };
          });

          const config = mealConfig[type];
          const Icon = config.icon;
          const mealColorKey = `${type}Bg` as keyof typeof theme;
          const bgColor = theme[mealColorKey] || theme.surface;

          return (
            <AnimatedView
              key={type}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={styles.slotContainer}
            >
              <View style={styles.slotHeader}>
                <View style={[styles.mealTypeIcon, { backgroundColor: bgColor }]}>
                  <Icon size={20} color={theme[type as keyof typeof theme] || theme.primary} />
                </View>
                <Text style={[styles.slotTitle, { color: theme.text }]}>{config.label}</Text>
                <Pressable onPress={() => handleAddDish(type)} style={[styles.addHeaderButton, { backgroundColor: theme.primaryLight + '20' }]}>
                  <Plus size={18} color={theme.primary} />
                </Pressable>
              </View>

              {dishes.length > 0 ? (
                dishes.map((dish: any, dishIndex: number) => (
                  <AnimatedView
                    key={dish.id}
                    entering={SlideInRight.delay(dishIndex * 50)}
                    style={[styles.dishCard, { backgroundColor: theme.surface }, Shadows.sm]}
                  >
                    <View style={[styles.dishAccent, { backgroundColor: theme[type as keyof typeof theme] || theme.primary }]} />
                    <View style={styles.dishContent}>
                      <Text style={[styles.dishName, { color: theme.text }]}>{dish.name}</Text>
                      <Text style={[styles.dishMeta, { color: theme.textSecondary }]}>
                        {dish.cuisine !== '-' ? dish.cuisine : 'Custom'} {dish.diet !== '-' && `• ${dish.diet}`}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => plannerStore.removeDishFromDate(dateKey, type, dish.id)}
                      style={styles.removeButton}
                      hitSlop={8}
                    >
                      <X size={18} color={theme.error} />
                    </Pressable>
                  </AnimatedView>
                ))
              ) : (
                <Pressable
                  style={[styles.emptySlot, { backgroundColor: bgColor, borderColor: theme.border }]}
                  onPress={() => handleAddDish(type)}
                >
                  <Plus size={28} color={theme[type as keyof typeof theme] || theme.primary} />
                  <Text style={[styles.addText, { color: theme.textSecondary }]}>Add {config.label.toLowerCase()}</Text>
                </Pressable>
              )}
            </AnimatedView>
          );
        })}

        {/* Today's Reminders Section */}
        <AnimatedView
          entering={FadeInDown.delay(400).duration(400)}
          style={[styles.remindersSection, { backgroundColor: theme.surface }, Shadows.sm]}
        >
          <View style={styles.reminderHeader}>
            <Clock size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Reminders</Text>
          </View>
          {dayReminders.length > 0 ? (
            dayReminders.map(r => (
              <View key={r.id} style={[styles.reminderRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.reminderText, { color: theme.text }]}>{r.text}</Text>
                <Text style={[styles.reminderTime, { color: theme.textMuted }]}>
                  {new Date(r.date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyReminders, { color: theme.textMuted }]}>No reminders for today</Text>
          )}
        </AnimatedView>
      </View>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    return (
      <View style={styles.weekContainer}>
        {days.map((d, index) => {
          const k = formatDateKey(d);
          const dayPlan = plannerStore.getPlan()[k] || {};

          const getLabels = (ids: string[] | undefined) => {
            if (!ids) return null;
            const arr = Array.isArray(ids) ? ids : [ids as unknown as string];
            return arr.map(id => getDishName(id)).join(', ');
          };

          const b = getLabels(dayPlan.breakfast);
          const l = getLabels(dayPlan.lunch);
          const dn = getLabels(dayPlan.dinner);
          const isTodayCard = isToday(d);

          return (
            <AnimatedPressable
              key={k}
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={[
                styles.weekDayCard,
                { backgroundColor: theme.surface },
                isTodayCard && { borderColor: theme.primary, borderWidth: 2 },
                Shadows.sm
              ]}
              onPress={() => jumpToDay(d)}
            >
              <View style={styles.weekDayHeader}>
                <Text style={[styles.weekDayTitle, { color: theme.text }]}>
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </Text>
                {isTodayCard && (
                  <View style={[styles.todayBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.todayBadgeText, { color: theme.onPrimary }]}>Today</Text>
                  </View>
                )}
              </View>

              <View style={styles.weekDayMeals}>
                <View style={styles.mealSummaryRow}>
                  <Coffee size={14} color={theme.breakfast} />
                  <Text style={[styles.mealSummary, { color: b ? theme.text : theme.textMuted }]} numberOfLines={1}>
                    {b || '—'}
                  </Text>
                </View>
                <View style={styles.mealSummaryRow}>
                  <Sun size={14} color={theme.lunch} />
                  <Text style={[styles.mealSummary, { color: l ? theme.text : theme.textMuted }]} numberOfLines={1}>
                    {l || '—'}
                  </Text>
                </View>
                <View style={styles.mealSummaryRow}>
                  <Moon size={14} color={theme.dinner} />
                  <Text style={[styles.mealSummary, { color: dn ? theme.text : theme.textMuted }]} numberOfLines={1}>
                    {dn || '—'}
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.centerWrapper}>
        <View style={[styles.content, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          {/* Floating Header */}
          <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.md]}>
            <Pressable style={[styles.iconButton, { backgroundColor: theme.primaryLight + '20' }]} onPress={handleShare}>
              <Share2 size={20} color={theme.primary} />
            </Pressable>

            {viewMode === 'day' ? (
              <View style={styles.dateControl}>
                <Pressable onPress={() => changeDate(-1)} style={styles.navButton}>
                  <ArrowLeft size={22} color={theme.text} />
                </Pressable>
                <Pressable onPress={goToToday} style={styles.dateContainer}>
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  {isToday(currentDate) && (
                    <View style={[styles.todayIndicator, { backgroundColor: theme.primary }]} />
                  )}
                </Pressable>
                <Pressable onPress={() => changeDate(1)} style={styles.navButton}>
                  <ArrowRight size={22} color={theme.text} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.dateControl}>
                <Pressable onPress={() => changeWeek(-7)} style={styles.navButton}>
                  <ArrowLeft size={22} color={theme.text} />
                </Pressable>
                <Pressable onPress={goToThisWeek} style={styles.dateContainer}>
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {weekStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(new Date(weekStartDate).setDate(weekStartDate.getDate() + 6)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
                <Pressable onPress={() => changeWeek(7)} style={styles.navButton}>
                  <ArrowRight size={22} color={theme.text} />
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.primaryLight + '20' }]}
              onPress={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
            >
              {viewMode === 'day' ? (
                <CalendarRange size={20} color={theme.primary} />
              ) : (
                <List size={20} color={theme.primary} />
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewMode === 'day' ? renderDayView() : renderWeekView()}
          </ScrollView>

          {/* Dish Picker Modal */}
          <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add to {selectedSlot && mealConfig[selectedSlot].label}
                </Text>
                <Pressable onPress={() => setPickerVisible(false)} style={styles.modalCloseBtn}>
                  <X size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={[styles.modalInputSection, { backgroundColor: theme.surface }]}>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Type a dish name..."
                  placeholderTextColor={theme.textMuted}
                  value={customDishName}
                  onChangeText={setCustomDishName}
                  autoFocus={true}
                />
                <Pressable
                  onPress={handleAddCustomDish}
                  style={[styles.modalAddButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.modalAddButtonText, { color: theme.onPrimary }]}>Add</Text>
                </Pressable>
              </View>

              <Text style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
                {customDishName ? 'Suggestions' : 'Recent & Popular'}
              </Text>

              <FlatList
                data={allDishes.filter(d => d.name.toLowerCase().includes(customDishName.toLowerCase())).slice(0, 20)}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.suggestionsList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.suggestionItem, { backgroundColor: theme.surface }]}
                    onPress={() => {
                      if (selectedSlot) {
                        plannerStore.addDishToDate(formatDateKey(currentDate), selectedSlot, item.id);
                      }
                      setCustomDishName('');
                      setPickerVisible(false);
                      setSelectedSlot(null);
                    }}
                  >
                    <View style={[styles.suggestionIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                      <Utensils size={18} color={theme.primary} />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={[styles.suggestionName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.suggestionMeta, { color: theme.textMuted }]}>
                        {item.cuisine || 'Custom'} {item.diet && `• ${item.diet}`}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  centerWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.xl,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navButton: {
    padding: Spacing.sm,
  },
  dateContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  slotContainer: {
    marginBottom: Spacing.lg,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  mealTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  addHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  dishAccent: {
    width: 4,
    height: '100%',
  },
  dishContent: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dishMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.md,
  },
  emptySlot: {
    height: 100,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
  },
  remindersSection: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  reminderText: {
    fontSize: 15,
    flex: 1,
  },
  reminderTime: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyReminders: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  weekContainer: {
    gap: Spacing.sm,
  },
  weekDayCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weekDayTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weekDayMeals: {
    gap: 6,
  },
  mealSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealSummary: {
    fontSize: 14,
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: Spacing.sm,
  },
  modalInputSection: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  modalAddButton: {
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionMeta: {
    fontSize: 13,
    marginTop: 2,
  },
});
