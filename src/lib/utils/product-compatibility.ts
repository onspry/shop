import type { ProductViewModel, ProductVariantViewModel } from '$lib/server/db/prisma/models/product';

interface CompatibilityRules {
    stemType: string | string[];
}

interface CompatibilityConfig {
    [productType: string]: CompatibilityRules;
}

export class ProductCompatibilityService {
    static filterCompatibleProducts(
        sourceProduct: ProductViewModel,
        sourceVariant: ProductVariantViewModel,
        targetProducts: ProductViewModel[]
    ): ProductViewModel[] {
        // Get compatibility rules from the source variant
        const compatibility = this.getCompatibilityConfig(sourceVariant);

        // Get the target product type (e.g., "SWITCH" or "KEYCAP")
        const targetType = Object.keys(compatibility)[0];
        if (!targetType) {
            return [];
        }

        // Get the rules for the target type
        const rules = compatibility[targetType];
        if (!rules || !rules.stemType) {
            return [];
        }

        // Convert stemType to array if it's a string
        const requiredStemTypes = Array.isArray(rules.stemType) ? rules.stemType : [rules.stemType];

        // Filter products based on compatibility rules
        const compatibleProducts = targetProducts.filter(product => {
            // Check if product is of the target type
            if (product.category !== targetType) {
                return false;
            }

            // Check if any of the product's variants have a compatible stem type
            const hasCompatibleVariant = product.variants.some(variant => {
                const variantStemType = this.getVariantAttribute<string | string[]>(variant, 'stemType', []);
                const variantStemTypes = Array.isArray(variantStemType) ? variantStemType : [variantStemType];

                // Check if any of the variant's stem types match any of the required stem types
                return requiredStemTypes.some(rst =>
                    variantStemTypes.includes(rst)
                );
            });

            return hasCompatibleVariant;
        });

        return compatibleProducts;
    }

    private static getCompatibilityConfig(variant: ProductVariantViewModel): CompatibilityConfig {
        try {
            return (variant.attributes['compatibleWith'] as CompatibilityConfig) ?? {};
        } catch {
            return {};
        }
    }

    private static getVariantAttribute<T>(
        variant: ProductVariantViewModel,
        key: string,
        defaultValue: T
    ): T {
        try {
            const value = variant.attributes[key];
            return (value as T) ?? defaultValue;
        } catch {
            return defaultValue;
        }
    }
} 