import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { plannerStore } from '@/store/plannerStore';
import { DISHES, Dish, MealType } from '@/constants/dishes';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import { Trash2, Edit2, X, Check, Plus, Utensils, ChefHat, Search, SlidersHorizontal } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, Layout, SlideInRight, SlideOutRight } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DishesScreen() {
    const theme = useTheme();
    const [dishes, setDishes] = useState<Dish[]>(plannerStore.getCustomDishes());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDiet, setSelectedDiet] = useState<string | null>(null);

    useEffect(() => {
        const unsub = plannerStore.subscribe(() => {
            setDishes(plannerStore.getCustomDishes());
        });
        return unsub;
    }, []);

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Delete Dish",
            `Are you sure you want to delete "${name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => plannerStore.deleteCustomDish(id) }
            ]
        );
    };

    const startEdit = (dish: Dish) => {
        setEditingId(dish.id);
        setEditName(dish.name);
    };

    const saveEdit = () => {
        if (editingId && editName.trim()) {
            plannerStore.updateCustomDish(editingId, editName.trim());
            setEditingId(null);
            setEditName('');
        }
    };

    // Combine custom dishes with legacy dishes for the library view
    const allDishes = [...dishes, ...DISHES];

    const filteredDishes = allDishes
        .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(d => !selectedDiet || d.diet === selectedDiet)
        .sort((a, b) => a.name.localeCompare(b.name));

    const dietFilters = ['veg', 'non-veg', 'egg'];

    const getDietColor = (diet?: string) => {
        switch (diet) {
            case 'veg': return theme.success;
            case 'non-veg': return theme.error;
            case 'egg': return theme.warning;
            default: return theme.textMuted;
        }
    };

    const renderItem = ({ item, index }: { item: Dish; index: number }) => {
        const isEditing = editingId === item.id;
        const isCustom = item.id.startsWith('custom-');
        const dietColor = getDietColor(item.diet);

        return (
            <AnimatedPressable
                entering={FadeInDown.delay(index * 50).duration(300)}
                layout={Layout.springify()}
                style={[styles.card, { backgroundColor: theme.surface }, Shadows.sm]}
            >
                <View style={[styles.dietIndicator, { backgroundColor: dietColor }]} />

                {isEditing ? (
                    <View style={styles.editRow}>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.background, color: theme.text }]}
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                        />
                        <Pressable onPress={saveEdit} style={[styles.iconBtn, { backgroundColor: theme.successLight }]}>
                            <Check size={18} color={theme.success} />
                        </Pressable>
                        <Pressable onPress={() => setEditingId(null)} style={[styles.iconBtn, { backgroundColor: theme.errorLight }]}>
                            <X size={18} color={theme.error} />
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.row}>
                        <View style={[styles.dishIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                            {isCustom ? (
                                <ChefHat size={20} color={theme.primary} />
                            ) : (
                                <Utensils size={20} color={theme.primary} />
                            )}
                        </View>
                        <View style={styles.dishInfo}>
                            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                            <View style={styles.metaRow}>
                                <Text style={[styles.cuisine, { color: theme.textSecondary }]}>
                                    {item.cuisine || 'Custom'}
                                </Text>
                                {item.diet && (
                                    <View style={[styles.dietBadge, { backgroundColor: dietColor + '20' }]}>
                                        <Text style={[styles.dietText, { color: dietColor }]}>
                                            {item.diet === 'non-veg' ? 'Non-Veg' : item.diet.charAt(0).toUpperCase() + item.diet.slice(1)}
                                        </Text>
                                    </View>
                                )}
                                {isCustom && (
                                    <View style={[styles.customBadge, { backgroundColor: theme.infoLight }]}>
                                        <Text style={[styles.customText, { color: theme.info }]}>Custom</Text>
                                    </View>
                                )}
                            </View>
                            {item.ingredients && item.ingredients.length > 0 && (
                                <Text style={[styles.ingredientsPreview, { color: theme.textMuted }]} numberOfLines={1}>
                                    {item.ingredients.slice(0, 3).join(', ')}{item.ingredients.length > 3 ? '...' : ''}
                                </Text>
                            )}
                        </View>
                        {isCustom && (
                            <View style={styles.actions}>
                                <Pressable onPress={() => startEdit(item)} style={[styles.iconBtn, { backgroundColor: theme.primaryLight + '20' }]}>
                                    <Edit2 size={16} color={theme.primary} />
                                </Pressable>
                                <Pressable onPress={() => handleDelete(item.id, item.name)} style={[styles.iconBtn, { backgroundColor: theme.errorLight }]}>
                                    <Trash2 size={16} color={theme.error} />
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </AnimatedPressable>
        );
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.md]}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>Dish Library</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {filteredDishes.length} dishes • {dishes.length} custom
                    </Text>
                </View>
            </View>

            {/* Search & Filter */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <View style={styles.searchRow}>
                    <View style={[styles.searchInputContainer, { backgroundColor: theme.background }]}>
                        <Search size={18} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search dishes..."
                            placeholderTextColor={theme.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')}>
                                <X size={18} color={theme.textMuted} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={() => setShowFilters(!showFilters)}
                        style={[styles.filterBtn, showFilters && { backgroundColor: theme.primary }]}
                    >
                        <SlidersHorizontal size={20} color={showFilters ? theme.onPrimary : theme.textSecondary} />
                    </Pressable>
                </View>

                {showFilters && (
                    <AnimatedView entering={FadeIn.duration(200)} style={styles.filterRow}>
                        <Pressable
                            onPress={() => setSelectedDiet(null)}
                            style={[
                                styles.filterChip,
                                { backgroundColor: !selectedDiet ? theme.primary : theme.background }
                            ]}
                        >
                            <Text style={{ color: !selectedDiet ? theme.onPrimary : theme.text, fontWeight: '600' }}>All</Text>
                        </Pressable>
                        {dietFilters.map(diet => (
                            <Pressable
                                key={diet}
                                onPress={() => setSelectedDiet(selectedDiet === diet ? null : diet)}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: selectedDiet === diet ? getDietColor(diet) : theme.background }
                                ]}
                            >
                                <Text style={{
                                    color: selectedDiet === diet ? '#fff' : theme.text,
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}>
                                    {diet === 'non-veg' ? 'Non-Veg' : diet}
                                </Text>
                            </Pressable>
                        ))}
                    </AnimatedView>
                )}
            </View>

            {/* List */}
            {filteredDishes.length === 0 ? (
                <View style={styles.empty}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                        <ChefHat size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        {searchQuery ? 'No matches found' : 'No dishes yet'}
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Add dishes from the Plan screen to build your library'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDishes}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
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
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    searchContainer: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    searchRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        height: 44,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    card: {
        marginBottom: Spacing.sm,
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    dietIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        paddingLeft: Spacing.md + 4,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    dishIcon: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    dishInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: 4,
    },
    cuisine: {
        fontSize: 13,
    },
    dietBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    dietText: {
        fontSize: 11,
        fontWeight: '600',
    },
    customBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    customText: {
        fontSize: 11,
        fontWeight: '600',
    },
    ingredientsPreview: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: Radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editInput: {
        flex: 1,
        fontSize: 16,
        height: 44,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
});
