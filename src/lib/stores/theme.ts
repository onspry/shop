import { writable } from 'svelte/store';

// Create a store for theme
const createThemeStore = () => {
    // Initialize from localStorage or system preference
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const systemPrefersDark = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

    const { subscribe, set, update } = writable(initialTheme);

    return {
        subscribe,
        toggle: () => update(theme => {
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme', newTheme);
            }
            return newTheme;
        }),
        set: (theme: 'light' | 'dark') => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme', theme);
            }
            set(theme);
        }
    };
};

export const theme = createThemeStore(); 