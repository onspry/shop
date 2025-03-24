import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';

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
        console.log('[Compatibility] Starting compatibility check for:', {
            sourceProduct: sourceProduct.name,
            sourceVariant: sourceVariant.name,
            sourceVariantId: sourceVariant.id,
            targetProductsCount: targetProducts.length
        });

        // Get compatibility rules from the source variant
        const compatibility = this.getCompatibilityConfig(sourceVariant);
        console.log('[Compatibility] Rules from source variant:', JSON.stringify(compatibility, null, 2));

        // Get the target product type (e.g., "SWITCH" or "KEYCAP")
        const targetType = Object.keys(compatibility)[0];
        if (!targetType) {
            console.log('[Compatibility] No compatibility rules found in variant attributes');
            return [];
        }

        // Get the rules for the target type
        const rules = compatibility[targetType];
        if (!rules || !rules.stemType) {
            console.log(`[Compatibility] No stem type rules found for target type: ${targetType}`);
            return [];
        }

        // Convert stemType to array if it's a string
        const requiredStemTypes = Array.isArray(rules.stemType) ? rules.stemType : [rules.stemType];

        console.log('[Compatibility] Looking for products with:', {
            targetType,
            requiredStemTypes
        });

        // Filter products based on compatibility rules
        const compatibleProducts = targetProducts.filter(product => {
            // Check if product is of the target type
            if (product.category !== targetType) {
                console.log(`[Compatibility] Skipping product ${product.name} - wrong category (${product.category} != ${targetType})`);
                return false;
            }

            // Check if any of the product's variants have a compatible stem type
            const hasCompatibleVariant = product.variants.some(variant => {
                const variantStemType = this.getVariantAttribute<string | string[]>(variant, 'stemType', []);
                const variantStemTypes = Array.isArray(variantStemType) ? variantStemType : [variantStemType];

                // Check if any of the variant's stem types match any of the required stem types
                const isCompatible = requiredStemTypes.some(rst =>
                    variantStemTypes.includes(rst)
                );

                console.log(`[Compatibility] Checking variant ${variant.name}:`, {
                    variantStemTypes,
                    requiredStemTypes,
                    isCompatible
                });
                return isCompatible;
            });

            if (hasCompatibleVariant) {
                console.log(`[Compatibility] Found compatible product: ${product.name}`);
            }
            return hasCompatibleVariant;
        });

        console.log('[Compatibility] Results:', {
            totalProducts: targetProducts.length,
            compatibleProducts: compatibleProducts.length,
            compatibleNames: compatibleProducts.map(p => p.name)
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