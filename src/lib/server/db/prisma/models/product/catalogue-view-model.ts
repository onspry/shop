import type { ProductViewModel } from './product-view-model';

export interface ProductGroup {
    category: string;
    products: ProductViewModel[];
}

export interface CatalogueViewModel {
    productGroups: ProductGroup[];
    totalProducts: number;
    categories: string[];
} 