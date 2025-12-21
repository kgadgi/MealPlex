import { Dish, Diet, MealType } from '@/constants/dishes';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Internal type for API response
interface MealDBResponse {
    idMeal: string;
    strMeal: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strMealThumb: string;
    strTags?: string;
    [key: string]: string | null | undefined; // For strIngredient1...20
}

// Map API Diet to our Diet type
const mapDiet = (category: string, tags: string | undefined, title: string): Diet => {
    const cat = category.toLowerCase();
    const tagStr = (tags || '').toLowerCase();
    const titleLower = title.toLowerCase();

    // 1. Explicit Non-Veg Keywords in Title (Strong signal)
    const meatKeywords = ['chicken', 'beef', 'pork', 'bacon', 'ham', 'sausage', 'steak', 'lamb', 'meat', 'fish', 'prawn', 'crab', 'shrimp', 'burger', 'seafood'];
    if (meatKeywords.some(keyword => titleLower.includes(keyword))) {
        return 'non-veg';
    }

    // 2. Explicit Veg Keywords
    if (titleLower.includes('paneer') || titleLower.includes('tofu') || titleLower.includes('vegetable') || titleLower.includes('dal')) {
        return 'veg';
    }

    // 3. Category/Tag Checks
    if (['beef', 'chicken', 'lamb', 'pork', 'seafood', 'goat'].includes(cat)) return 'non-veg';
    if (cat === 'vegetarian' || cat === 'vegan' || tagStr.includes('vegetarian')) return 'veg';

    // 4. Egg Check
    if (tagStr.includes('egg') || titleLower.includes('egg') || cat === 'breakfast') {
        if (titleLower.includes('egg') || titleLower.includes('omelette')) return 'egg';
    }

    // 5. Fallbacks for ambiguous categories
    if (['pasta', 'starter', 'side', 'dessert'].includes(cat)) {
        return 'veg'; // Safer assumption for Dessert/Side if no meat keyword found
    }

    // Default
    return 'non-veg';
};

// Map API Category to our MealType
const mapType = (category: string): MealType[] => {
    const cat = category.toLowerCase();
    if (cat === 'breakfast') return ['breakfast'];
    if (cat === 'starter' || cat === 'side') return ['snack'];
    if (cat === 'dessert') return ['snack']; // Treat dessert as snack for now
    return ['lunch', 'dinner']; // Default main courses
};

// Extract ingredients (measure + item)
const getIngredients = (meal: MealDBResponse): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const item = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (item && item.trim()) {
            ingredients.push(`${measure ? measure.trim() + ' ' : ''}${item.trim()}`);
        }
    }
    return ingredients;
};

// Transform API Meal to Dish
const transformMeal = (meal: MealDBResponse): Dish => {
    return {
        id: meal.idMeal,
        name: meal.strMeal,
        description: `${meal.strArea} ${meal.strCategory}`,
        image: meal.strMealThumb,
        cuisine: meal.strArea,
        type: mapType(meal.strCategory),
        diet: mapDiet(meal.strCategory, meal.strTags || undefined, meal.strMeal),
        ingredients: getIngredients(meal),
        instructions: meal.strInstructions,
    };
};

export const apiService = {
    searchMeals: async (query: string): Promise<Dish[]> => {
        try {
            // 1. Try Name Search
            let response = await fetch(`${BASE_URL}/search.php?s=${query}`);
            let data = await response.json();

            if (data.meals) {
                return data.meals.map(transformMeal);
            }

            // 2. Fallback: Try Area Search (e.g., "Indian")
            response = await fetch(`${BASE_URL}/filter.php?a=${query}`);
            data = await response.json();

            // 3. Fallback: Try Category Search (e.g., "Breakfast")
            if (!data.meals) {
                response = await fetch(`${BASE_URL}/filter.php?c=${query}`);
                data = await response.json();
            }

            if (data.meals) {
                // We have simplified meals (id, name, image). We need full details.
                // Limit to 5 to avoid spamming the API
                const limitedMeals = data.meals.slice(0, 5);

                // Fetch details for each in parallel
                const detailPromises = limitedMeals.map(async (simpleMeal: any) => {
                    const detailRes = await fetch(`${BASE_URL}/lookup.php?i=${simpleMeal.idMeal}`);
                    const detailData = await detailRes.json();
                    return detailData.meals ? detailData.meals[0] : null;
                });

                const details = await Promise.all(detailPromises);
                // Filter out any failed lookups and transform
                return details.filter(m => m).map(transformMeal);
            }

            return [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getRandomMeal: async (): Promise<Dish | null> => {
        try {
            const response = await fetch(`${BASE_URL}/random.php`);
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                return transformMeal(data.meals[0]);
            }
            return null;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    getCategories: async (): Promise<{ name: string; image: string; description: string }[]> => {
        try {
            const response = await fetch(`${BASE_URL}/categories.php`);
            const data = await response.json();
            if (data.categories) {
                return data.categories.map((cat: any) => ({
                    name: cat.strCategory,
                    image: cat.strCategoryThumb,
                    description: cat.strCategoryDescription?.slice(0, 100) + '...',
                }));
            }
            return [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getMealsByCategory: async (category: string, limit: number = 10): Promise<Dish[]> => {
        try {
            const response = await fetch(`${BASE_URL}/filter.php?c=${category}`);
            const data = await response.json();

            if (data.meals) {
                const limitedMeals = data.meals.slice(0, limit);

                // Fetch full details for each
                const detailPromises = limitedMeals.map(async (simpleMeal: any) => {
                    const detailRes = await fetch(`${BASE_URL}/lookup.php?i=${simpleMeal.idMeal}`);
                    const detailData = await detailRes.json();
                    return detailData.meals ? detailData.meals[0] : null;
                });

                const details = await Promise.all(detailPromises);
                return details.filter(m => m).map(transformMeal);
            }
            return [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getMealById: async (id: string): Promise<Dish | null> => {
        try {
            const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                return transformMeal(data.meals[0]);
            }
            return null;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};

