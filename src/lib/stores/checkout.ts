import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types for checkout data
export type ShippingConfig = {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    shippingMethod: string;
};

export type PaymentConfig = {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    cvv?: string;
    savePaymentMethod?: boolean;
};

export type CheckoutState = {
    email: string;
    shippingConfig: ShippingConfig;
    shippingCost: number;
    estimatedDays: string;
    paymentConfig?: PaymentConfig;
};

// Initial checkout state
const DEFAULT_COUNTRY = 'US';
const DEFAULT_SHIPPING_METHOD = '';

const initialCheckoutState: CheckoutState = {
    email: '',
    shippingConfig: {
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: DEFAULT_COUNTRY,
        shippingMethod: DEFAULT_SHIPPING_METHOD
    },
    shippingCost: 0,
    estimatedDays: ''
};

// Helper to safely parse JSON with fallback
function safeJSONParse<T>(jsonString: string | null, fallback: T): T {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Failed to parse stored checkout data:', error);
        return fallback;
    }
}

const CHECKOUT_STORAGE_KEY = 'checkout_data';

// Create checkout store with localStorage persistence
export const createCheckoutStore = () => {
    // Try to load from localStorage if in browser
    const storedData = browser ? localStorage.getItem(CHECKOUT_STORAGE_KEY) : null;

    const initialState = storedData
        ? safeJSONParse(storedData, initialCheckoutState)
        : initialCheckoutState;

    const { subscribe, set, update } = writable<CheckoutState>(initialState);

    // Persist to localStorage whenever store changes
    if (browser) {
        // This will run every time the store changes
        // and persist the state to localStorage
        subscribe((state) => {
            // Only persist if state is not empty
            localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state));
        });
    }

    return {
        subscribe,
        set: (state: CheckoutState) => {
            set(state);
        },
        update, // Expose update method for Writable compatibility
        // Reset store to initial state
        reset: () => {
            console.log('[CHECKOUT] Resetting checkout store');

            // First set the store to initial state
            set({ ...initialCheckoutState });

            // Then remove from localStorage if in browser
            if (browser) {
                try {
                    // Try multiple approaches to ensure it's removed
                    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                    localStorage.setItem(CHECKOUT_STORAGE_KEY, ''); // Set to empty as fallback
                    localStorage.removeItem(CHECKOUT_STORAGE_KEY); // Try again

                    console.log('[CHECKOUT] Store reset and removed from localStorage');

                    // Double-check that it was actually removed
                    const storedData = localStorage.getItem(CHECKOUT_STORAGE_KEY);
                    if (storedData) {
                        console.warn('[CHECKOUT] Failed to remove from localStorage, trying again');
                        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                        // As a last resort, overwrite with initial state
                        localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(initialCheckoutState));
                    }
                } catch (error) {
                    console.error('[CHECKOUT] Failed to remove from localStorage:', error);
                    // Try a different approach if the first one failed
                    try {
                        window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                    } catch {
                        console.error('[CHECKOUT] All attempts to clear localStorage failed');
                    }
                }
            }
        },

        // Update current accordion section
        setCurrentSection: (section: 'email' | 'shipping' | 'payment') => {
            update(state => {
                const newState = { ...state, currentSection: section };

                return newState;
            });
        },

        // Update email state
        setEmail: (email: string, validated: boolean = true) => {
            update(state => {
                const newState = {
                    ...state,
                    email: validated ? email : '', // Only save email if validated
                };

                return newState;
            });
        },

        // Update shipping configuration
        updateShippingConfig: (config: Partial<ShippingConfig>) => {
            update(state => {
                const newState = {
                    ...state,
                    shippingConfig: {
                        ...state.shippingConfig,
                        ...config
                    }
                };

                return newState;
            });
        },

        // Update payment configuration
        updatePaymentConfig: (config: Partial<PaymentConfig>) => {
            update(state => {
                const newState = {
                    ...state,
                    paymentConfig: {
                        ...state.paymentConfig,
                        ...config
                    }
                };

                return newState;
            });
        },

        // Set shipping validation state
        setShippingValidated: (validated: boolean) => {
            update(state => {
                const newState = {
                    ...state,
                    shippingValidated: validated
                };

                return newState;
            });
        },

        // Update shipping cost
        setShippingCost: (cost: number) => {
            update(state => {
                const newState = {
                    ...state,
                    shippingCost: cost
                };

                return newState;
            });
        },

        // Update estimated delivery days
        setEstimatedDays: (days: string) => {
            update(state => {
                const newState = {
                    ...state,
                    estimatedDays: days
                };

                return newState;
            });
        },

        // Get a specific part of the state without subscribing
        // Useful for one-off access
        getState: () => get(checkoutStore),

        // Debug function to log the current state
        debug: () => {
            const state = get(checkoutStore);
            console.log('[CHECKOUT DEBUG] Current state:', state);

            if (browser) {
                const storedData = localStorage.getItem(CHECKOUT_STORAGE_KEY);
                console.log('[CHECKOUT DEBUG] localStorage data:', storedData);
            }

            return state;
        },

        // Force clear localStorage data (for troubleshooting)
        forceClearStorage: () => {
            if (browser) {
                try {
                    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                    console.log('[CHECKOUT] Forced removal from localStorage');
                    return true;
                } catch (error) {
                    console.error('[CHECKOUT] Failed to force remove from localStorage:', error);
                    return false;
                }
            }
            return false;
        },

        // Clear sensitive data but keep shipping preferences
        clearSensitiveData: () => {
            update(state => {
                // Keep shipping preferences but clear validation states
                const newState = {
                    ...initialCheckoutState,
                    shippingConfig: state.shippingConfig
                };

                return newState;
            });
        }
    };
};

export const checkoutStore = createCheckoutStore();