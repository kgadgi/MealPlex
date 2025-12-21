import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shoppingStore, ShoppingItem, IngredientCategory } from '@/store/shoppingStore';
import { plannerStore } from '@/store/plannerStore';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import {
    CheckSquare, Square, ShoppingCart, Plus, Trash2,
    Sparkles, Apple, Milk, Beef, Wheat, Package, MoreHorizontal,
    ChevronDown, ChevronUp, X
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryConfig: Record<IngredientCategory, { label: string; icon: any; colorKey: keyof typeof import('@/constants/Colors').Colors.light }> = {
    produce: { label: '🥬 Fresh Produce', icon: Apple, colorKey: 'categoryProduce' },
    dairy: { label: '🥛 Dairy & Eggs', icon: Milk, colorKey: 'categoryDairy' },
    protein: { label: '🍖 Proteins', icon: Beef, colorKey: 'categoryProtein' },
    grains: { label: '🍞 Grains & Bread', icon: Wheat, colorKey: 'categoryGrains' },
    pantry: { label: '🫙 Pantry Staples', icon: Package, colorKey: 'categoryPantry' },
    other: { label: '📦 Other Items', icon: MoreHorizontal, colorKey: 'categoryOther' },
};

export default function ShoppingScreen() {
    const theme = useTheme();
    const { isTablet, contentMaxWidth } = useResponsive();
    const [items, setItems] = useState<ShoppingItem[]>(shoppingStore.getItems());
    const [newItemName, setNewItemName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(new Set(['produce', 'dairy', 'protein', 'grains', 'pantry', 'other']));
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const unsub = shoppingStore.subscribe(() => {
            setItems([...shoppingStore.getItems()]);
        });
        return unsub;
    }, []);

    const handleAddItem = () => {
        if (newItemName.trim()) {
            shoppingStore.addItem(newItemName.trim());
            setNewItemName('');
        }
    };

    const handleGenerateFromPlan = async () => {
        setIsGenerating(true);
        try {
            const startOfWeek = new Date();
            startOfWeek.setHours(0, 0, 0, 0);

            const count = await shoppingStore.generateFromPlan(
                plannerStore.getPlan(),
                plannerStore.getCustomDishes(),
                startOfWeek,
                7
            );

            Alert.alert(
                '✨ Shopping List Generated',
                count > 0
                    ? `Added ${count} ingredients from your meal plan for the next 7 days!`
                    : 'No new ingredients found. Try adding meals with ingredients first.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleCategory = (category: IngredientCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const grouped = shoppingStore.getItemsByCategory();
    const checkedCount = items.filter(i => i.checked).length;
    const totalCount = items.length;

    const sections = Object.entries(categoryConfig)
        .map(([key, config]) => ({
            category: key as IngredientCategory,
            title: config.label,
            data: grouped[key as IngredientCategory],
            color: theme[config.colorKey as keyof typeof theme] as string,
        }))
        .filter(section => section.data.length > 0);

    const renderItem = ({ item }: { item: ShoppingItem }) => {
        const config = categoryConfig[item.category];
        const categoryColor = theme[config.colorKey as keyof typeof theme] as string;

        return (
            <AnimatedPressable
                entering={SlideInRight.duration(300)}
                exiting={SlideOutLeft.duration(200)}
                layout={Layout.springify()}
                onPress={() => shoppingStore.toggleItem(item.id)}
                style={[styles.itemRow, { backgroundColor: theme.surface }]}
            >
                <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />

                <View style={styles.checkArea}>
                    {item.checked ? (
                        <CheckSquare size={22} color={theme.success} />
                    ) : (
                        <Square size={22} color={theme.textMuted} />
                    )}
                </View>

                <View style={styles.itemContent}>
                    <Text style={[
                        styles.itemName,
                        { color: item.checked ? theme.textMuted : theme.text },
                        item.checked && styles.checkedText
                    ]}>
                        {item.name}
                    </Text>

                    {item.fromMeals && item.fromMeals.length > 0 && (
                        <Text style={[styles.mealSourceText, { color: theme.textMuted }]} numberOfLines={1}>
                            For: {item.fromMeals.join(', ')}
                        </Text>
                    )}
                </View>

                {item.isGenerated && (
                    <View style={[styles.generatedBadge, { backgroundColor: theme.primaryLight + '30' }]}>
                        <Sparkles size={12} color={theme.primary} />
                    </View>
                )}

                <Pressable
                    onPress={() => shoppingStore.removeItem(item.id)}
                    style={styles.deleteBtn}
                    hitSlop={8}
                >
                    <Trash2 size={18} color={theme.error} />
                </Pressable>
            </AnimatedPressable>
        );
    };

    const renderSectionHeader = ({ section }: { section: { category: IngredientCategory; title: string; color: string; data: ShoppingItem[] } }) => {
        const isExpanded = expandedCategories.has(section.category);
        const uncheckedCount = section.data.filter(i => !i.checked).length;

        return (
            <Pressable
                onPress={() => toggleCategory(section.category)}
                style={[styles.sectionHeader, { backgroundColor: theme.background }]}
            >
                <View style={[styles.sectionColorDot, { backgroundColor: section.color }]} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: section.color + '20' }]}>
                    <Text style={[styles.countText, { color: section.color }]}>{uncheckedCount}</Text>
                </View>
                {isExpanded ? (
                    <ChevronUp size={20} color={theme.textMuted} />
                ) : (
                    <ChevronDown size={20} color={theme.textMuted} />
                )}
            </Pressable>
        );
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.contentWrapper}>
                <View style={[styles.innerContent, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.md]}>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>Shopping List</Text>
                            {totalCount > 0 && (
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    {checkedCount} of {totalCount} items done
                                </Text>
                            )}
                        </View>

                        <View style={styles.headerActions}>
                            {checkedCount > 0 && (
                                <Pressable
                                    onPress={() => shoppingStore.clearChecked()}
                                    style={[styles.clearBtn, { backgroundColor: theme.errorLight }]}
                                >
                                    <Text style={[styles.clearText, { color: theme.error }]}>Clear Done</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Generate Button */}
                    <Pressable
                        onPress={handleGenerateFromPlan}
                        disabled={isGenerating}
                        style={[styles.generateButton, { backgroundColor: theme.primary }]}
                    >
                        <Sparkles size={20} color={theme.onPrimary} />
                        <Text style={[styles.generateButtonText, { color: theme.onPrimary }]}>
                            {isGenerating ? 'Generating...' : 'Generate from Meal Plan'}
                        </Text>
                    </Pressable>

                    {/* Input */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Add item..."
                            placeholderTextColor={theme.textMuted}
                            value={newItemName}
                            onChangeText={setNewItemName}
                            onSubmitEditing={handleAddItem}
                        />
                        <Pressable
                            onPress={handleAddItem}
                            style={[styles.addBtn, { backgroundColor: theme.primary }]}
                        >
                            <Plus size={24} color={theme.onPrimary} />
                        </Pressable>
                    </View>

                    {/* List */}
                    {items.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme.primaryLight + '20' }]}>
                                <ShoppingCart size={48} color={theme.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Your list is empty</Text>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                Add items manually or generate from your meal plan
                            </Text>
                        </View>
                    ) : (
                        <SectionList
                            sections={sections}
                            keyExtractor={item => item.id}
                            renderItem={({ item, section }) =>
                                expandedCategories.has(section.category) ? renderItem({ item }) : null
                            }
                            renderSectionHeader={renderSectionHeader}
                            contentContainerStyle={styles.list}
                            stickySectionHeadersEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    clearBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.lg,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        height: 48,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        marginTop: Spacing.sm,
        gap: Spacing.sm,
    },
    sectionColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    countBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
        minWidth: 24,
        alignItems: 'center',
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingRight: Spacing.md,
        paddingLeft: 0,
        marginBottom: Spacing.sm,
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    categoryIndicator: {
        width: 4,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    checkArea: {
        paddingHorizontal: Spacing.md,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
    },
    mealSourceText: {
        fontSize: 12,
        marginTop: 2,
    },
    checkedText: {
        textDecorationLine: 'line-through',
    },
    generatedBadge: {
        padding: 4,
        borderRadius: Radius.sm,
        marginRight: Spacing.sm,
    },
    deleteBtn: {
        padding: Spacing.sm,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyIconContainer: {
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
        lineHeight: 24,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    innerContent: {
        flex: 1,
        width: '100%',
    },
});
