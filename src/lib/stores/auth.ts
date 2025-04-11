import { writable } from 'svelte/store';
import type { User } from '$lib/server/db_drizzle/schema';

// Create a store with loading state
interface AuthState {
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    isLoading: true,
    isInitialized: false
};

const authStore = writable<AuthState>(initialState);

// Create a derived store that only exposes the user
const userStore = {
    subscribe: (callback: (value: User | null) => void) => {
        return authStore.subscribe(state => callback(state.user));
    }
};

export function setUser(user: User | null) {
    authStore.update(state => ({
        ...state,
        user,
        isLoading: false,
        isInitialized: true
    }));
}

export function getUser() {
    let currentUser: User | null = null;
    authStore.subscribe(state => {
        currentUser = state.user;
    })();
    return currentUser;
}

export function getAuthState() {
    let state: AuthState = initialState;
    authStore.subscribe(s => {
        state = s;
    })();
    return state;
}

export { userStore, authStore }; 