import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Bell, Calendar as CalendarIcon, X, Clock, AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { remindersStore, Reminder } from '@/store/remindersStore';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import Animated, { FadeIn, FadeInDown, Layout, SlideOutLeft } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RemindersScreen() {
    const theme = useTheme();
    const [reminders, setReminders] = useState<Reminder[]>(remindersStore.getReminders());
    const [inputText, setInputText] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        const unsubscribe = remindersStore.subscribe(() => {
            setReminders(remindersStore.getReminders());
        });
        return unsubscribe;
    }, []);

    const addReminder = () => {
        if (inputText.trim()) {
            remindersStore.addReminder(inputText.trim(), selectedDate);
            setInputText('');
            setSelectedDate(undefined);
        }
    };

    const removeReminder = (id: string) => {
        remindersStore.removeReminder(id);
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (date) {
            setSelectedDate(date);
        }
    };

    // Group reminders: upcoming vs past
    const now = new Date();
    const upcomingReminders = reminders
        .filter(r => !r.date || new Date(r.date) >= now)
        .sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    const pastReminders = reminders
        .filter(r => r.date && new Date(r.date) < now)
        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) < now;
    };

    const formatReminderDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const renderReminder = ({ item, index }: { item: Reminder; index: number }) => {
        const overdue = isOverdue(item.date);

        return (
            <AnimatedPressable
                entering={FadeInDown.delay(index * 50).duration(300)}
                exiting={SlideOutLeft.duration(200)}
                layout={Layout.springify()}
                style={[
                    styles.reminderItem,
                    { backgroundColor: theme.surface },
                    overdue && { borderLeftColor: theme.warning, borderLeftWidth: 4 },
                    Shadows.sm
                ]}
            >
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: overdue ? theme.warningLight : theme.primaryLight + '20' }
                ]}>
                    {overdue ? (
                        <AlertCircle size={20} color={theme.warning} />
                    ) : (
                        <Bell size={20} color={theme.primary} />
                    )}
                </View>

                <View style={styles.reminderContent}>
                    <Text style={[styles.reminderText, { color: theme.text }]}>{item.text}</Text>
                    {item.date && (
                        <View style={styles.dateRow}>
                            <Clock size={12} color={overdue ? theme.warning : theme.textMuted} />
                            <Text style={[
                                styles.reminderDate,
                                { color: overdue ? theme.warning : theme.textMuted }
                            ]}>
                                {formatReminderDate(item.date)}
                            </Text>
                        </View>
                    )}
                </View>

                <Pressable
                    onPress={() => removeReminder(item.id)}
                    style={[styles.deleteBtn, { backgroundColor: theme.errorLight }]}
                    hitSlop={8}
                >
                    <Trash2 size={16} color={theme.error} />
                </Pressable>
            </AnimatedPressable>
        );
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.md]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Reminders</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {upcomingReminders.length} upcoming
                    </Text>
                </View>
            </View>

            {/* Input Section */}
            <View style={[styles.inputSection, { backgroundColor: theme.surface }]}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="What do you need to remember?"
                        placeholderTextColor={theme.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={addReminder}
                    />
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        onPress={() => setShowPicker(true)}
                        style={[
                            styles.dateButton,
                            { backgroundColor: selectedDate ? theme.primaryLight + '20' : theme.background }
                        ]}
                    >
                        <CalendarIcon size={18} color={selectedDate ? theme.primary : theme.textMuted} />
                        <Text style={[styles.dateButtonText, { color: selectedDate ? theme.primary : theme.textMuted }]}>
                            {selectedDate
                                ? selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'Set time'
                            }
                        </Text>
                        {selectedDate && (
                            <Pressable onPress={() => setSelectedDate(undefined)} hitSlop={8}>
                                <X size={14} color={theme.primary} />
                            </Pressable>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={addReminder}
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                    >
                        <Plus size={20} color={theme.onPrimary} />
                        <Text style={[styles.addButtonText, { color: theme.onPrimary }]}>Add</Text>
                    </Pressable>
                </View>
            </View>

            {/* Reminders List */}
            {reminders.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                        <Bell size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No reminders yet</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Add reminders for meal prep, grocery shopping, or anything else you need to remember
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={[...upcomingReminders, ...pastReminders]}
                    keyExtractor={item => item.id}
                    renderItem={renderReminder}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        pastReminders.length > 0 && upcomingReminders.length > 0 ? (
                            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>UPCOMING</Text>
                        ) : null
                    }
                />
            )}

            {/* Date Picker Modal */}
            {Platform.OS === 'ios' ? (
                <Modal
                    transparent={true}
                    visible={showPicker}
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Set Reminder Time</Text>
                                <Pressable onPress={() => setShowPicker(false)}>
                                    <Text style={[styles.modalDone, { color: theme.primary }]}>Done</Text>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="datetime"
                                display="inline"
                                onChange={handleDateChange}
                                themeVariant="light"
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                showPicker && (
                    <DateTimePicker
                        value={selectedDate || new Date()}
                        mode="datetime"
                        display="default"
                        onChange={handleDateChange}
                    />
                )
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        borderRadius: Radius.xl,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    inputSection: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    inputRow: {
        marginBottom: Spacing.sm,
    },
    input: {
        height: 48,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: Radius.md,
        gap: Spacing.sm,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 14,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        height: 44,
        borderRadius: Radius.md,
        gap: Spacing.xs,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    reminderContent: {
        flex: 1,
    },
    reminderText: {
        fontSize: 16,
        fontWeight: '500',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    reminderDate: {
        fontSize: 12,
    },
    deleteBtn: {
        width: 32,
        height: 32,
        borderRadius: Radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalDone: {
        fontWeight: '600',
        fontSize: 17,
    },
});
