import { Dish, MealType, DISHES } from '@/constants/dishes';
import { saveData, loadData } from './persistence';

// Ingredient categories for grouping in shopping list
export type IngredientCategory = 'produce' | 'dairy' | 'protein' | 'grains' | 'pantry' | 'other';

export interface ShoppingItem {
    id: string;
    name: string;
    checked: boolean;
    category: IngredientCategory;
    quantity?: string;
    fromMeals?: string[]; // Which meals this ingredient is from
    isGenerated?: boolean; // Was this auto-generated from the plan?
}

// Category keywords for auto-categorization
const categoryKeywords: Record<IngredientCategory, string[]> = {
    produce: ['spinach', 'tomato', 'onion', 'garlic', 'potato', 'avocado', 'lemon', 'berry', 'fruit', 'vegetable', 'carrot', 'pepper', 'lettuce', 'cucumber', 'mushroom', 'broccoli', 'celery', 'ginger', 'herbs', 'cilantro', 'parsley', 'basil', 'mint', 'strawberr', 'blueberr'],
    dairy: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'paneer', 'ghee', 'curd', 'whipped'],
    protein: ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu', 'mutton', 'bacon', 'sausage', 'shrimp', 'salmon', 'meat'],
    grains: ['rice', 'bread', 'flour', 'pasta', 'noodle', 'oat', 'cereal', 'wheat', 'batter', 'waffle', 'pancake', 'sourdough', 'bun'],
    pantry: ['oil', 'salt', 'sugar', 'spice', 'sauce', 'syrup', 'vinegar', 'soy', 'chickpea', 'lentil', 'bean', 'canned', 'maple', 'honey', 'mustard', 'seeds', 'chili', 'flakes', 'mix'],
    other: [],
};

function categorizeIngredient(name: string): IngredientCategory {
    const lower = name.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (category === 'other') continue;
        if (keywords.some(kw => lower.includes(kw))) {
            return category as IngredientCategory;
        }
    }
    return 'other';
}

let listeners: (() => void)[] = [];
let items: ShoppingItem[] = [];

const notifyListeners = () => {
    listeners.forEach(l => l());
};

export const shoppingStore = {
    getItems: () => items,

    getItemsByCategory: () => {
        const grouped: Record<IngredientCategory, ShoppingItem[]> = {
            produce: [],
            dairy: [],
            protein: [],
            grains: [],
            pantry: [],
            other: [],
        };
        items.forEach(item => {
            grouped[item.category].push(item);
        });
        return grouped;
    },

    addItem: (name: string, category?: IngredientCategory) => {
        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            name,
            checked: false,
            category: category || categorizeIngredient(name),
        };
        items = [...items, newItem];
        saveData('shoppingList', items);
        notifyListeners();
    },

    addItemWithDetails: (item: Omit<ShoppingItem, 'id'>) => {
        const newItem: ShoppingItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        items = [...items, newItem];
        saveData('shoppingList', items);
        notifyListeners();
    },

    generateFromPlan: async (
        plan: Record<string, any>,
        customDishes: Dish[],
        startDate: Date,
        days: number = 7
    ) => {
        const allDishes = [...customDishes, ...DISHES];

        const ingredientMap = new Map<string, { category: IngredientCategory; meals: Set<string> }>();

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
                    const dish = allDishes.find(d => String(d.id) === String(dishId));
                    if (dish && dish.ingredients) {
                        for (const ing of dish.ingredients) {
                            const normalizedName = ing.trim();
                            if (!ingredientMap.has(normalizedName)) {
                                ingredientMap.set(normalizedName, {
                                    category: categorizeIngredient(normalizedName),
                                    meals: new Set(),
                                });
                            }
                            ingredientMap.get(normalizedName)!.meals.add(dish.name);
                        }
                    }
                }
            }
        }

        // Remove any existing generated items, keep manual ones
        const manualItems = items.filter(i => !i.isGenerated);

        // Create new items from plan
        const generatedItems: ShoppingItem[] = [];
        ingredientMap.forEach((data, name) => {
            // Check if this item already exists in manual items
            const existsManual = manualItems.some(i => i.name.toLowerCase() === name.toLowerCase());
            if (!existsManual) {
                generatedItems.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name,
                    checked: false,
                    category: data.category,
                    fromMeals: Array.from(data.meals),
                    isGenerated: true,
                });
            }
        });

        items = [...manualItems, ...generatedItems];
        saveData('shoppingList', items);
        notifyListeners();

        return generatedItems.length;
    },

    toggleItem: (id: string) => {
        items = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
        saveData('shoppingList', items);
        notifyListeners();
    },

    removeItem: (id: string) => {
        items = items.filter(i => i.id !== id);
        saveData('shoppingList', items);
        notifyListeners();
    },

    clearChecked: () => {
        items = items.filter(i => !i.checked);
        saveData('shoppingList', items);
        notifyListeners();
    },

    clearGenerated: () => {
        items = items.filter(i => !i.isGenerated);
        saveData('shoppingList', items);
        notifyListeners();
    },

    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    init: async () => {
        const loaded = await loadData('shoppingList');
        if (loaded) {
            // Migrate old items to include category
            items = loaded.map((item: any) => ({
                ...item,
                category: item.category || categorizeIngredient(item.name),
            }));
            notifyListeners();
        }
    }
};

shoppingStore.init();
