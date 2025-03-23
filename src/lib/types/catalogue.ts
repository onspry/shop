import type { ProductViewModel } from './product';

export interface ProductGroup {
    category: string;
    products: ProductViewModel[];
}

export interface CatalogueViewModel {
    productGroups: ProductGroup[];
    totalProducts: number;
    categories: string[];
}

export function toCatalogueViewModel(productGroups: ProductGroup[], totalProducts: number): CatalogueViewModel {
    return {
        productGroups,
        totalProducts,
        categories: productGroups.map(group => group.category)
    };
} 