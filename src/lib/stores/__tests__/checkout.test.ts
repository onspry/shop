import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CheckoutState, ShippingConfig, PaymentConfig } from '../checkout';
import { checkoutStore, createCheckoutStore } from '../checkout';
import { get } from 'svelte/store';

// Mock browser environment
vi.mock('$app/environment', () => ({
    browser: true
}));


function setupStoreMockStorage() {
    let store: Record<string, string> = {};

    const mockStorage = {
        get length() {
            return Object.keys(store).length;
        },
        key(index: number) {
            const keys = Object.keys(store);
            return keys[index] || null;
        },
        getItem(key: string) {
            return store[key] || null;
        },
        setItem(key: string, value: string) {
            store[key] = value;
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        },
    };

    Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true,
    });
}

describe('checkoutStore', () => {
    let store: typeof checkoutStore;

    beforeEach(() => {
        // Clear localStorage mock
        localStorage.clear();
        // Create fresh store instance
        store = checkoutStore;
    });

    it('should initialize with default state', () => {
        const state = get(store);
        expect(state).toEqual({
            email: '',
            shippingConfig: {
                firstName: '',
                lastName: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'US',
                shippingMethod: ''
            },
            shippingCost: 0,
            estimatedDays: ''
        });
    });

    it('should update email when validated', () => {
        store.setEmail('test@example.com', true);
        const state = get(store);
        expect(state.email).toBe('test@example.com');
    });

    it('should not update email when not validated', () => {
        store.setEmail('test@example.com', false);
        const state = get(store);
        expect(state.email).toBe('');
    });

    it('should update shipping config partially', () => {
        const partialConfig: Partial<ShippingConfig> = {
            firstName: 'John',
            lastName: 'Doe'
        };

        store.updateShippingConfig(partialConfig);
        const state = get(store);

        expect(state.shippingConfig.firstName).toBe('John');
        expect(state.shippingConfig.lastName).toBe('Doe');
        // Other fields should remain default
        expect(state.shippingConfig.addressLine1).toBe('');
    });

    it('should update payment config', () => {
        const paymentConfig: Partial<PaymentConfig> = {
            cardNumber: '4111111111111111',
            cardHolder: 'John Doe'
        };

        store.updatePaymentConfig(paymentConfig);
        const state = get(store);

        expect(state.paymentConfig?.cardNumber).toBe('4111111111111111');
        expect(state.paymentConfig?.cardHolder).toBe('John Doe');
    });

    it('should persist to localStorage when updated', async () => {
        setupStoreMockStorage();
        const setItemSpy = vi.spyOn(localStorage, 'setItem');

        store.setEmail('test@example.com', true);

        await new Promise(r => setTimeout(r, 0));

        expect(setItemSpy).toHaveBeenCalledWith(
            'checkout_data',
            expect.any(String)
        );

        const savedData = JSON.parse(setItemSpy.mock.calls[0][1]);
        expect(savedData.email).toBe('test@example.com');
    });

    it('should load from localStorage on initialization', async () => {
        setupStoreMockStorage();
        const initialData: CheckoutState = {
            email: 'saved@example.com',
            shippingConfig: {
                firstName: 'Jane',
                lastName: 'Doe',
                addressLine1: '123 St',
                addressLine2: '',
                city: 'City',
                state: 'State',
                postalCode: '12345',
                country: 'US',
                shippingMethod: 'standard'
            },
            shippingCost: 500,
            estimatedDays: '3-5'
        };

        localStorage.setItem('checkout_data', JSON.stringify(initialData));
        const store = createCheckoutStore();
        const state = get(store);

        expect(state).toEqual(initialData);
    });

    it('should clear sensitive data but keep shipping preferences', () => {
        // Set up initial state
        store.setEmail('test@example.com', true);
        store.updateShippingConfig({
            firstName: 'John',
            lastName: 'Doe'
        });
        store.updatePaymentConfig({
            cardNumber: '4111111111111111'
        });

        // Clear sensitive data
        store.clearSensitiveData();

        const state = get(store);

        // Shipping info should be preserved
        expect(state.shippingConfig.firstName).toBe('John');
        expect(state.shippingConfig.lastName).toBe('Doe');

        // Sensitive data should be cleared
        expect(state.email).toBe('');
        expect(state.paymentConfig?.cardNumber).toBeUndefined();
    });

    it('should reset store to initial state', () => {
        // Set up some state
        store.setEmail('test@example.com', true);
        store.updateShippingConfig({
            firstName: 'John'
        });

        // Reset
        store.reset();

        const state = get(store);
        expect(state).toEqual({
            email: '',
            shippingConfig: {
                firstName: '',
                lastName: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'US',
                shippingMethod: ''
            },
            shippingCost: 0,
            estimatedDays: ''
        });
    });
});