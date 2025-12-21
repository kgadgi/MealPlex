import { Dish, MealType } from '@/constants/dishes';
import { saveData, loadData } from './persistence';

interface Plan {
    [date: string]: {
        [key in MealType]?: string[]; // Array of dishIds
    };
}

let listeners: (() => void)[] = [];
let plan: Plan = {};
let customDishes: Dish[] = [];

const notifyListeners = () => {
    listeners.forEach(l => l());
};

export const plannerStore = {
    getPlan: () => plan,

    getCustomDishes: () => customDishes,

    addCustomDish: (name: string, image?: string) => {
        const existing = customDishes.find(d => d.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;

        const newDish: Dish = {
            id: `custom-${Date.now()}`,
            name,
            description: '',
            image: image || '',
            cuisine: 'Custom',
            type: ['breakfast', 'lunch', 'dinner', 'snack'],
            diet: 'veg',
            ingredients: [],
        };
        customDishes = [...customDishes, newDish];
        saveData('customDishes', customDishes);
        notifyListeners();
        return newDish;
    },

    updateCustomDish: (id: string, name: string) => {
        customDishes = customDishes.map(d => d.id === id ? { ...d, name } : d);
        saveData('customDishes', customDishes);
        notifyListeners();
    },

    deleteCustomDish: (id: string) => {
        customDishes = customDishes.filter(d => d.id !== id);
        saveData('customDishes', customDishes);
        notifyListeners();
    },

    getDishesForDate: (date: string, type: MealType): string[] => {
        const val = plan[date]?.[type];
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return [val as unknown as string];
    },

    addDishToDate: (date: string, type: MealType, dishId: string) => {
        if (!plan[date]) {
            plan[date] = {};
        }
        const current = plan[date][type] || [];
        // Prevent duplicates? Maybe user wants 2 coffees? Let's allow duplicates or checks.
        // User asked "Bread butter, also PanCake". So strictly distinct items. 
        // I'll prevent adding EXACT same ID twice to avoid key collisions in lists unless I use index.
        if (!current.includes(dishId)) {
            plan[date][type] = [...current, dishId];
            saveData('planner', plan);
            notifyListeners();
        }
    },

    removeDishFromDate: (date: string, type: MealType, dishId: string) => {
        if (plan[date] && plan[date][type]) {
            plan[date][type] = plan[date][type]!.filter(id => id !== dishId);
            saveData('planner', plan);
            notifyListeners();
        }
    },

    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    init: async () => {
        const loadedPlan = await loadData('planner');
        if (loadedPlan) {
            plan = loadedPlan;
        }
        const loadedDishes = await loadData('customDishes');
        if (loadedDishes) {
            customDishes = loadedDishes;
        }
        notifyListeners();
    }
};

plannerStore.init();
