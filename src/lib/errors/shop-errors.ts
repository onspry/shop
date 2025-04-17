// Custom error types for better error handling
export class CartError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CartError';
    }
}

export class VariantError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VariantError';
    }
}

export class StockError extends CartError {
    constructor(message: string) {
        super(message);
        this.name = 'StockError';
    }
}

export class DiscountError extends CartError {
    constructor(message: string) {
        super(message);
        this.name = 'DiscountError';
    }
}
