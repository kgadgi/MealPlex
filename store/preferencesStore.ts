import { Diet } from '@/constants/dishes';
import { saveData, loadData } from './persistence';

interface Preferences {
    dietaryFilters: Diet[]; // Selected filters (e.g., ['veg'] means only show veg)
}

// Default: Show all
const ALL_DIETS: Diet[] = ['veg', 'non-veg', 'egg'];

let listeners: (() => void)[] = [];
let preferences: Preferences = {
    dietaryFilters: [...ALL_DIETS],
};

const notifyListeners = () => listeners.forEach(l => l());

export const preferencesStore = {
    getFilters: () => preferences.dietaryFilters,

    toggleFilter: (diet: Diet) => {
        const current = preferences.dietaryFilters;
        if (current.includes(diet)) {
            // Don't allow empty set? Or maybe yes.
            if (current.length > 1) {
                preferences.dietaryFilters = current.filter(d => d !== diet);
            }
        } else {
            preferences.dietaryFilters = [...current, diet];
        }
        saveData('preferences', preferences);
        notifyListeners();
    },

    setAllFilters: () => {
        preferences.dietaryFilters = [...ALL_DIETS];
        saveData('preferences', preferences);
        notifyListeners();
    },

    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    init: async () => {
        const loaded = await loadData('preferences');
        if (loaded) {
            preferences = loaded;
            notifyListeners();
        }
    }
};

preferencesStore.init();
