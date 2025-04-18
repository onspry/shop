import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, userStore, setUser } from '../auth';
import type { UserViewModel } from '$lib/models/user';

describe('authStore', () => {
    beforeEach(() => {
        // Reset the store to initial state before each test
        setUser(null);
    });

    it('should have correct initial state', () => {
        const state = get(authStore);
        expect(state).toEqual({
            user: null,
            isLoading: false,
            isInitialized: true
        });
    });

    it('should update user and flags when setUser is called', () => {
        const mockUser: UserViewModel = {
            id: '1',
            email: 'testuser@example.com',
            firstName: 'Test',
            lastName: 'User',
            image: null,
            provider: 'email',
            providerId: 'provider-id-1',
            isAdmin: false,
            emailVerified: true,
            status: 'active'
        };
        setUser(mockUser);
        const state = get(authStore);
        expect(state.user).toEqual(mockUser);
        expect(state.isLoading).toBe(false);
        expect(state.isInitialized).toBe(true);
    });

    it('userStore should reflect user changes', () => {
        const mockUser: UserViewModel = {
            id: '2',
            email: 'another@example.com',
            firstName: 'Another',
            lastName: 'User',
            image: null,
            provider: 'email',
            providerId: 'provider-id-2',
            isAdmin: false,
            emailVerified: true,
            status: 'active'
        };
        setUser(mockUser);
        let currentUser: UserViewModel | null = null;
        const unsubscribe = userStore.subscribe(user => {
            currentUser = user;
        });
        expect(currentUser).toEqual(mockUser);
        unsubscribe();
    });
});