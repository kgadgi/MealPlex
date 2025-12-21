import { saveData, loadData } from './persistence';

export interface Reminder {
    id: string;
    text: string;
    date?: string; // Stored as ISO string for persistence
}

let listeners: (() => void)[] = [];
let reminders: Reminder[] = [];

const notifyListeners = () => {
    listeners.forEach(l => l());
};

export const remindersStore = {
    getReminders: () => reminders,

    addReminder: (text: string, date?: Date) => {
        const newReminder: Reminder = {
            id: Date.now().toString(),
            text,
            date: date ? date.toISOString() : undefined,
        };
        reminders = [...reminders, newReminder];
        saveData('reminders', reminders);
        notifyListeners();
    },

    removeReminder: (id: string) => {
        reminders = reminders.filter(r => r.id !== id);
        saveData('reminders', reminders);
        notifyListeners();
    },

    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    init: async () => {
        const loaded = await loadData('reminders');
        if (loaded) {
            reminders = loaded;
            notifyListeners();
        }
    }
};

remindersStore.init();
