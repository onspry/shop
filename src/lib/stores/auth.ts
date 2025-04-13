import type { UserViewModel } from '$lib/models/user';
import { writable } from 'svelte/store';

// Create a store with loading state
interface AuthState {
    user: UserViewModel | null;
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
    subscribe: (callback: (value: UserViewModel | null) => void) => {
        return authStore.subscribe(state => callback(state.user));
    }
};

export function setUser(user: UserViewModel | null) {
    authStore.update(state => ({
        ...state,
        user,
        isLoading: false,
        isInitialized: true
    }));
}

export function getUser() {
    let currentUser: UserViewModel | null = null;
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
