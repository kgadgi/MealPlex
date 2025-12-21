import { Dish } from '@/constants/dishes';
import { saveData, loadData } from './persistence';

// Simple mutable store for this MVP since we don't have Redux/Zustand
// In a real app, use a proper state management library
let listeners: (() => void)[] = [];
let favorites: Dish[] = [];

const notifyListeners = () => listeners.forEach(l => l());

export const favoritesStore = {
    getFavorites: () => favorites,
    addDish: (dish: Dish) => {
        if (!favorites.find(d => d.id === dish.id)) {
            favorites = [...favorites, dish];
            saveData('favorites', favorites);
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
        const loaded = await loadData('favorites');
        if (loaded) {
            favorites = loaded;
            notifyListeners();
        }
    }
};

// Initialize immediately
favoritesStore.init();
