import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import { apiService } from '@/services/api';
import { plannerStore } from '@/store/plannerStore';
import { Dish, MealType } from '@/constants/dishes';
import { Search, X, ChefHat, Plus, ArrowLeft, Clock, Users, Flame } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Category {
    name: string;
    image: string;
    description: string;
}

export default function RecipesScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { isTablet, contentMaxWidth, getColumnCount } = useResponsive();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [recipes, setRecipes] = useState<Dish[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Dish | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const cats = await apiService.getCategories();
        setCategories(cats);
        setLoading(false);
    };

    const loadRecipesByCategory = async (category: string) => {
        setSelectedCategory(category);
        setLoadingRecipes(true);
        const meals = await apiService.getMealsByCategory(category, 12);
        setRecipes(meals);
        setLoadingRecipes(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoadingRecipes(true);
        setSelectedCategory(null);
        const results = await apiService.searchMeals(searchQuery);
        setSearchResults(results);
        setLoadingRecipes(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const addToPlan = (recipe: Dish, mealType: MealType) => {
        const today = new Date().toISOString().split('T')[0];
        // First add to custom dishes to persist it
        const savedDish = plannerStore.addCustomDish(recipe.name, recipe.image);
        plannerStore.addDishToDate(today, mealType, savedDish.id);
        // Show feedback
        alert(`Added "${recipe.name}" to today's ${mealType}!`);
    };

    const styles = createStyles(theme);

    const renderCategoryCard = ({ item, index }: { item: Category; index: number }) => (
        <AnimatedPressable
            entering={FadeInDown.delay(index * 50).duration(300)}
            onPress={() => loadRecipesByCategory(item.name)}
            style={[
                styles.categoryCard,
                { backgroundColor: theme.surface },
                selectedCategory === item.name && { borderColor: theme.primary, borderWidth: 2 },
                Shadows.sm
            ]}
        >
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
        </AnimatedPressable>
    );

    const renderRecipeCard = ({ item, index }: { item: Dish; index: number }) => (
        <AnimatedPressable
            entering={FadeInDown.delay(index * 50).duration(300)}
            onPress={() => setSelectedRecipe(item)}
            style={[styles.recipeCard, { backgroundColor: theme.surface }, Shadows.md]}
        >
            <Image source={{ uri: item.image }} style={styles.recipeImage} />
            <View style={styles.recipeOverlay}>
                <View style={[styles.dietBadge, { backgroundColor: item.diet === 'veg' ? theme.success : item.diet === 'egg' ? theme.warning : theme.error }]}>
                    <Text style={styles.dietBadgeText}>{item.diet?.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.recipeContent}>
                <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.recipeCuisine, { color: theme.textSecondary }]}>{item.cuisine}</Text>
            </View>
        </AnimatedPressable>
    );

    // Recipe detail modal view
    if (selectedRecipe) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.contentWrapper}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={isTablet && { maxWidth: 800, width: '100%', alignSelf: 'center' }}>
                        {/* Header Image */}
                        <View style={styles.detailImageContainer}>
                            <Image source={{ uri: selectedRecipe.image }} style={styles.detailImage} />
                            <Pressable
                                onPress={() => setSelectedRecipe(null)}
                                style={[styles.backButton, { backgroundColor: theme.surface }]}
                            >
                                <ArrowLeft size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <View style={[styles.detailContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedRecipe.name}</Text>

                            <View style={styles.detailMeta}>
                                <View style={[styles.metaItem, { backgroundColor: theme.primaryLight + '20' }]}>
                                    <ChefHat size={16} color={theme.primary} />
                                    <Text style={[styles.metaText, { color: theme.text }]}>{selectedRecipe.cuisine}</Text>
                                </View>
                                <View style={[
                                    styles.metaItem,
                                    { backgroundColor: selectedRecipe.diet === 'veg' ? theme.successLight : theme.errorLight }
                                ]}>
                                    <Flame size={16} color={selectedRecipe.diet === 'veg' ? theme.success : theme.error} />
                                    <Text style={[styles.metaText, { color: theme.text }]}>
                                        {selectedRecipe.diet === 'veg' ? 'Vegetarian' : selectedRecipe.diet === 'egg' ? 'Contains Egg' : 'Non-Veg'}
                                    </Text>
                                </View>
                            </View>

                            {/* Add to Plan Buttons */}
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add to Today's Plan</Text>
                            <View style={styles.mealButtons}>
                                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                                    <Pressable
                                        key={type}
                                        onPress={() => addToPlan(selectedRecipe, type)}
                                        style={[styles.mealButton, { backgroundColor: theme.primaryLight + '20' }]}
                                    >
                                        <Plus size={16} color={theme.primary} />
                                        <Text style={[styles.mealButtonText, { color: theme.primary }]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Ingredients */}
                            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredients</Text>
                                    <View style={[styles.ingredientsList, { backgroundColor: theme.background }]}>
                                        {selectedRecipe.ingredients.map((ing, idx) => (
                                            <View key={idx} style={styles.ingredientRow}>
                                                <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
                                                <Text style={[styles.ingredientText, { color: theme.text }]}>{ing}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Instructions */}
                            {selectedRecipe.instructions && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Instructions</Text>
                                    <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
                                        {selectedRecipe.instructions}
                                    </Text>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.contentWrapper}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.md]}>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Discover Recipes</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Browse from TheMealDB
                        </Text>
                    </View>
                </View>

                {/* Search */}
                <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                    <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
                        <Search size={18} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search recipes..."
                            placeholderTextColor={theme.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={clearSearch}>
                                <X size={18} color={theme.textMuted} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading categories...</Text>
                    </View>
                ) : (
                    <View style={styles.contentWrapper}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isTablet && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
                            {/* Categories */}
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CATEGORIES</Text>
                            <FlatList
                                data={categories}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={renderCategoryCard}
                                keyExtractor={item => item.name}
                                contentContainerStyle={styles.categoriesList}
                            />

                            {/* Recipes */}
                            {(searchResults.length > 0 || recipes.length > 0) && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                        {searchQuery && searchResults.length > 0
                                            ? `SEARCH RESULTS (${searchResults.length})`
                                            : selectedCategory
                                                ? `${selectedCategory.toUpperCase()} RECIPES`
                                                : 'RECIPES'
                                        }
                                    </Text>
                                    {loadingRecipes ? (
                                        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                                    ) : (
                                        <View style={styles.recipesGrid}>
                                            {(searchResults.length > 0 ? searchResults : recipes).map((recipe, index) => (
                                                <View key={recipe.id} style={[styles.recipeGridItem, isTablet && { width: `${100 / getColumnCount(2, 3, 4)}%` }]}>
                                                    {renderRecipeCard({ item: recipe, index })}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            {!selectedCategory && searchResults.length === 0 && (
                                <View style={styles.emptyPrompt}>
                                    <ChefHat size={48} color={theme.textMuted} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Select a category or search for recipes
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
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
    searchBar: {
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: 14,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    categoriesList: {
        gap: Spacing.sm,
    },
    categoryCard: {
        width: 100,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        padding: Spacing.sm,
    },
    categoryImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    recipesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    recipeGridItem: {
        width: '50%',
        padding: Spacing.xs,
    },
    recipeCard: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    recipeImage: {
        width: '100%',
        height: 120,
    },
    recipeOverlay: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
    },
    dietBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    dietBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    recipeContent: {
        padding: Spacing.sm,
    },
    recipeName: {
        fontSize: 14,
        fontWeight: '600',
    },
    recipeCuisine: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyPrompt: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    },
    // Detail view styles
    detailImageContainer: {
        height: 280,
        position: 'relative',
    },
    detailImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        padding: Spacing.lg,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        marginTop: -Spacing.lg,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    detailMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    mealButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    mealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
    },
    mealButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    ingredientsList: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: Spacing.sm,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    ingredientText: {
        fontSize: 15,
        flex: 1,
    },
    instructionsText: {
        fontSize: 15,
        lineHeight: 24,
    },
});
