import { writable } from 'svelte/store';
import type { User } from '$lib/server/db/schema';

const userStore = writable<User | null>(null);

export function setUser(user: User | null) {
    userStore.set(user);
}

export function getUser() {
    let currentUser: User | null = null;
    userStore.subscribe(value => {
        currentUser = value;
    })();
    return currentUser;
}

export { userStore }; 