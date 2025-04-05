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
const DEFAULT_SHIPPING_METHOD = 'standard';

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
const createCheckoutStore = () => {
    // Try to load from localStorage if in browser
    const storedData = browser ? localStorage.getItem(CHECKOUT_STORAGE_KEY) : null;
    const initialState = storedData
        ? safeJSONParse(storedData, initialCheckoutState)
        : initialCheckoutState;

    const { subscribe, set, update } = writable<CheckoutState>(initialState);

    // Save to localStorage whenever store changes
    const saveToStorage = (state: CheckoutState) => {
        if (browser) {
            localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(state));
        }
    };

    return {
        subscribe,

        // Set the entire checkout state
        set: (state: CheckoutState) => {
            saveToStorage(state);
            set(state);
        },

        // Reset store to initial state
        reset: () => {
            if (browser) {
                localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            }
            set(initialCheckoutState);
        },

        // Update current accordion section
        setCurrentSection: (section: 'email' | 'shipping' | 'payment') => {
            update(state => {
                const newState = { ...state, currentSection: section };
                saveToStorage(newState);
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
                saveToStorage(newState);
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
                saveToStorage(newState);
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
                saveToStorage(newState);
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
                saveToStorage(newState);
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
                saveToStorage(newState);
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
                saveToStorage(newState);
                return newState;
            });
        },

        // Get a specific part of the state without subscribing
        // Useful for one-off access
        getState: () => get(checkoutStore),

        // Clear sensitive data but keep shipping preferences
        clearSensitiveData: () => {
            update(state => {
                // Keep shipping preferences but clear validation states
                const newState = {
                    ...initialCheckoutState,
                    shippingConfig: state.shippingConfig
                };
                saveToStorage(newState);
                return newState;
            });
        }
    };
};

export const checkoutStore = createCheckoutStore(); 