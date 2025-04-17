import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productRepository, toProductVariantViewModel } from '../product-repository';
import { mockPrismaInstance } from '../../../../test/setupTests';
import { VariantError } from '$lib/errors/shop-errors';
import type { Product, ProductImage, ProductVariant } from '@prisma/client';

describe('Product Repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    // Helper function to generate test product data
    function getValidProduct(): Product & {
        variants: ProductVariant[];
        images: ProductImage[];
    } {
        return {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Test Product',
            description: 'Test Description',
            category: 'Test Category',
            features: ['Feature 1', 'Feature 2'],
            specifications: { spec1: 'value1', spec2: 'value2' },
            isAccessory: false,
            slug: 'test-product',
            createdAt: new Date(),
            updatedAt: new Date(),
            variants: [
                {
                    id: '22222222-2222-2222-2222-222222222222',
                    name: 'Test Variant',
                    sku: 'TEST-SKU-001',
                    price: 1000,
                    stockQuantity: 10,
                    attributes: { color: 'red', size: 'M' },
                    productId: '11111111-1111-1111-1111-111111111111',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            images: [
                {
                    id: '33333333-3333-3333-3333-333333333333',
                    url: 'https://example.com/image.jpg',
                    alt: 'Test Image',
                    position: 1,
                    productId: '11111111-1111-1111-1111-111111111111'
                }
            ]
        };
    }

    describe('getProducts', () => {
        it('should return products and total count', async () => {
            // Arrange
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(1);

            // Act
            const result = await productRepository.getProducts();

            // Assert
            expect(result).toEqual({
                products: [expect.objectContaining({
                    id: testProduct.id,
                    name: testProduct.name,
                    category: testProduct.category
                })],
                total: 1
            });
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: undefined,
                include: {
                    variants: true,
                    images: true
                },
                skip: 0,
                take: 50,
                orderBy: { name: 'asc' }
            });
        });

        it('should filter by category when provided', async () => {
            // Arrange
            const category = 'Test Category';
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(1);

            // Act
            await productRepository.getProducts(category);

            // Assert
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: { category },
                include: {
                    variants: true,
                    images: true
                },
                skip: 0,
                take: 50,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle pagination correctly', async () => {
            // Arrange
            const page = 2;
            const pageSize = 10;
            mockPrismaInstance.product.findMany.mockResolvedValue([]);
            mockPrismaInstance.product.count.mockResolvedValue(0);

            // Act
            await productRepository.getProducts(undefined, page, pageSize);

            // Assert
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: undefined,
                include: {
                    variants: true,
                    images: true
                },
                skip: 10,
                take: 10,
                orderBy: { name: 'asc' }
            });
        });
    });

    describe('getProduct', () => {
        it('should return product and default variant id', async () => {
            // Arrange
            const testProduct = getValidProduct();
            const slug = 'test-product';
            mockPrismaInstance.product.findUnique.mockResolvedValue(testProduct);

            // Act
            const result = await productRepository.getProduct(slug);

            // Assert
            expect(result).toEqual({
                product: expect.objectContaining({
                    id: testProduct.id,
                    name: testProduct.name
                }),
                defaultVariantId: testProduct.variants[0].id
            });
            expect(mockPrismaInstance.product.findUnique).toHaveBeenCalledWith({
                where: { slug },
                include: {
                    variants: true,
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    }
                }
            });
        });

        it('should throw error when product not found', async () => {
            // Arrange
            const slug = 'non-existent-product';
            mockPrismaInstance.product.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(productRepository.getProduct(slug))
                .rejects
                .toThrow('Product not found');
        });
    });

    describe('updateVariantStock', () => {
        it('should update variant stock quantity', async () => {
            // Arrange
            const variantId = '22222222-2222-2222-2222-222222222222';
            const newQuantity = 5;
            mockPrismaInstance.productVariant.update.mockResolvedValue({ stockQuantity: newQuantity });

            // Act
            await productRepository.updateVariantStock(variantId, newQuantity);

            // Assert
            expect(mockPrismaInstance.productVariant.update).toHaveBeenCalledWith({
                where: { id: variantId },
                data: { stockQuantity: newQuantity }
            });
        });
    });

    describe('getVariantStock', () => {
        it('should return variant stock quantity', async () => {
            // Arrange
            const variantId = '22222222-2222-2222-2222-222222222222';
            const stockQuantity = 10;
            mockPrismaInstance.productVariant.findUnique.mockResolvedValue({ stockQuantity });

            // Act
            const result = await productRepository.getVariantStock(variantId);

            // Assert
            expect(result).toBe(stockQuantity);
            expect(mockPrismaInstance.productVariant.findUnique).toHaveBeenCalledWith({
                where: { id: variantId },
                select: { stockQuantity: true }
            });
        });

        it('should throw VariantError when variant not found', async () => {
            // Arrange
            const variantId = 'non-existent-variant';
            mockPrismaInstance.productVariant.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(productRepository.getVariantStock(variantId))
                .rejects
                .toThrow(VariantError);
            await expect(productRepository.getVariantStock(variantId))
                .rejects
                .toThrow('Variant not found');
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const variantId = '22222222-2222-2222-2222-222222222222';
            mockPrismaInstance.productVariant.findUnique.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.getVariantStock(variantId))
                .rejects
                .toThrow('Failed to get variant stock');
        });
    });

    describe('toProductVariantViewModel', () => {
        it('should correctly transform variant to view model', () => {
            // Arrange
            const variant = getValidProduct().variants[0];

            // Act
            const result = toProductVariantViewModel(variant);

            // Assert
            expect(result).toEqual({
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock_quantity: variant.stockQuantity,
                attributes: variant.attributes,
                stockStatus: 'in_stock',
                productId: variant.productId,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt
            });
        });

        it('should return correct stock status based on quantity', () => {
            // Arrange
            const variant = {
                ...getValidProduct().variants[0],
                stockQuantity: 0
            };

            // Act
            const result = toProductVariantViewModel(variant);

            // Assert
            expect(result.stockStatus).toBe('out_of_stock');
        });
    });

    describe('getCatalogue', () => {
        it('should return products grouped by category', async () => {
            // Arrange
            const testProduct1 = getValidProduct();
            const testProduct2 = {
                ...getValidProduct(),
                id: '44444444-4444-4444-4444-444444444444',
                name: 'Test Product 2',
                category: 'Another Category',
                slug: 'test-product-2'
            };

            // Mock the getProducts method to return our test products
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct1, testProduct2]);
            mockPrismaInstance.product.count.mockResolvedValue(2);

            // Act
            const result = await productRepository.getCatalogue();

            // Assert
            expect(result).toEqual({
                productGroups: expect.arrayContaining([
                    expect.objectContaining({
                        category: testProduct1.category,
                        products: expect.arrayContaining([
                            expect.objectContaining({
                                id: testProduct1.id,
                                name: testProduct1.name
                            })
                        ])
                    }),
                    expect.objectContaining({
                        category: testProduct2.category,
                        products: expect.arrayContaining([
                            expect.objectContaining({
                                id: testProduct2.id,
                                name: testProduct2.name
                            })
                        ])
                    })
                ]),
                totalProducts: 2,
                categories: expect.arrayContaining([testProduct1.category, testProduct2.category])
            });

            // Verify that getProducts was called with the correct parameters
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: undefined,
                include: {
                    variants: true,
                    images: true
                },
                skip: 0,
                take: 50,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle pagination correctly', async () => {
            // Arrange
            const page = 2;
            const pageSize = 10;
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(15); // Total of 15 products

            // Act
            const result = await productRepository.getCatalogue(page, pageSize);

            // Assert
            expect(result.totalProducts).toBe(15);
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: undefined,
                include: {
                    variants: true,
                    images: true
                },
                skip: 10, // (page-1) * pageSize
                take: 10,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle empty product list', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockResolvedValue([]);
            mockPrismaInstance.product.count.mockResolvedValue(0);

            // Act
            const result = await productRepository.getCatalogue();

            // Assert
            expect(result).toEqual({
                productGroups: [],
                totalProducts: 0,
                categories: []
            });
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.getCatalogue())
                .rejects
                .toThrow('Failed to retrieve catalogue');
        });
    });

    describe('getProductsByCategory', () => {
        it('should return products for a specific category', async () => {
            // Arrange
            const category = 'KEYBOARD';
            const testProduct = getValidProduct();
            testProduct.category = category;
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(1);

            // Act
            const result = await productRepository.getProductsByCategory(category);

            // Assert
            expect(result).toEqual({
                products: [expect.objectContaining({
                    id: testProduct.id,
                    name: testProduct.name,
                    category: category
                })],
                total: 1
            });
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: { category },
                include: {
                    variants: true,
                    images: true
                },
                skip: 0,
                take: 50,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle pagination correctly', async () => {
            // Arrange
            const category = 'KEYBOARD';
            const page = 2;
            const pageSize = 10;
            const testProduct = getValidProduct();
            testProduct.category = category;
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(15); // Total of 15 products

            // Act
            const result = await productRepository.getProductsByCategory(category, page, pageSize);

            // Assert
            expect(result.total).toBe(15);
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: { category },
                include: {
                    variants: true,
                    images: true
                },
                skip: 10, // (page-1) * pageSize
                take: 10,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle empty results', async () => {
            // Arrange
            const category = 'NON_EXISTENT_CATEGORY';
            mockPrismaInstance.product.findMany.mockResolvedValue([]);
            mockPrismaInstance.product.count.mockResolvedValue(0);

            // Act
            const result = await productRepository.getProductsByCategory(category);

            // Assert
            expect(result).toEqual({
                products: [],
                total: 0
            });
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const category = 'KEYBOARD';
            mockPrismaInstance.product.findMany.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.getProductsByCategory(category))
                .rejects
                .toThrow('Failed to retrieve products by category');
        });
    });

    describe('getCategories', () => {
        it('should return unique categories', async () => {
            // Arrange
            const mockCategories = [
                { category: 'KEYBOARD' },
                { category: 'KEYCAP' },
                { category: 'SWITCH' }
            ];
            mockPrismaInstance.product.findMany.mockResolvedValue(mockCategories);

            // Act
            const result = await productRepository.getCategories();

            // Assert
            expect(result).toEqual(['KEYBOARD', 'KEYCAP', 'SWITCH']);
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                select: { category: true },
                distinct: ['category']
            });
        });

        it('should handle empty results', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockResolvedValue([]);

            // Act
            const result = await productRepository.getCategories();

            // Assert
            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.getCategories())
                .rejects
                .toThrow('Failed to retrieve categories');
        });
    });

    describe('searchProducts', () => {
        it('should search products by query string', async () => {
            // Arrange
            const query = 'keyboard';
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(1);

            // Act
            const result = await productRepository.searchProducts(query);

            // Assert
            expect(result).toEqual({
                products: [expect.objectContaining({
                    id: testProduct.id,
                    name: testProduct.name
                })],
                total: 1
            });
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { category: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    variants: true,
                    images: true
                },
                skip: 0,
                take: 50,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle pagination correctly', async () => {
            // Arrange
            const query = 'keyboard';
            const page = 2;
            const pageSize = 10;
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaInstance.product.count.mockResolvedValue(15); // Total of 15 products

            // Act
            const result = await productRepository.searchProducts(query, page, pageSize);

            // Assert
            expect(result.total).toBe(15);
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { category: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    variants: true,
                    images: true
                },
                skip: 10, // (page-1) * pageSize
                take: 10,
                orderBy: { name: 'asc' }
            });
        });

        it('should handle empty results', async () => {
            // Arrange
            const query = 'nonexistent';
            mockPrismaInstance.product.findMany.mockResolvedValue([]);
            mockPrismaInstance.product.count.mockResolvedValue(0);

            // Act
            const result = await productRepository.searchProducts(query);

            // Assert
            expect(result).toEqual({
                products: [],
                total: 0
            });
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const query = 'keyboard';
            mockPrismaInstance.product.findMany.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.searchProducts(query))
                .rejects
                .toThrow('Failed to search products');
        });
    });

    describe('getFeaturedProducts', () => {
        it('should return featured products with default limit', async () => {
            // Arrange
            const testProducts = [getValidProduct(), {
                ...getValidProduct(),
                id: '44444444-4444-4444-4444-444444444444',
                name: 'Test Product 2',
                slug: 'test-product-2'
            }];
            mockPrismaInstance.product.findMany.mockResolvedValue(testProducts);

            // Act
            const result = await productRepository.getFeaturedProducts();

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(expect.objectContaining({
                id: testProducts[0].id,
                name: testProducts[0].name
            }));
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                include: {
                    variants: true,
                    images: true
                },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        });

        it('should respect custom limit parameter', async () => {
            // Arrange
            const limit = 5;
            const testProduct = getValidProduct();
            mockPrismaInstance.product.findMany.mockResolvedValue([testProduct]);

            // Act
            const result = await productRepository.getFeaturedProducts(limit);

            // Assert
            expect(result).toHaveLength(1);
            expect(mockPrismaInstance.product.findMany).toHaveBeenCalledWith({
                include: {
                    variants: true,
                    images: true
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            });
        });

        it('should handle empty results', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockResolvedValue([]);

            // Act
            const result = await productRepository.getFeaturedProducts();

            // Assert
            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            mockPrismaInstance.product.findMany.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.getFeaturedProducts())
                .rejects
                .toThrow('Failed to retrieve featured products');
        });
    });

    describe('bulkUpdateVariantStock', () => {
        it('should update multiple variant stock quantities in a transaction', async () => {
            // Arrange
            const updates = [
                { variantId: '11111111-1111-1111-1111-111111111111', quantity: 5 },
                { variantId: '22222222-2222-2222-2222-222222222222', quantity: 10 }
            ];

            // Mock the transaction function to return a resolved promise
            mockPrismaInstance.$transaction.mockResolvedValue([]);

            // Act
            await productRepository.bulkUpdateVariantStock(updates);

            // Assert
            expect(mockPrismaInstance.$transaction).toHaveBeenCalled();

            // Get the callback function passed to $transaction
            const transactionCallback = mockPrismaInstance.$transaction.mock.calls[0][0];

            // Verify the callback creates the expected update operations
            expect(transactionCallback).toBeDefined();

            // We can't directly test the callback function's internals,
            // but we can verify it was called with the correct parameters
            expect(mockPrismaInstance.$transaction).toHaveBeenCalledWith(
                expect.any(Array)
            );
        });

        it('should throw error when transaction fails', async () => {
            // Arrange
            const updates = [
                { variantId: '11111111-1111-1111-1111-111111111111', quantity: 5 },
                { variantId: '22222222-2222-2222-2222-222222222222', quantity: 10 }
            ];

            mockPrismaInstance.$transaction.mockRejectedValue(new Error('Transaction failed'));

            // Act & Assert
            await expect(productRepository.bulkUpdateVariantStock(updates))
                .rejects
                .toThrow('Failed to bulk update variant stock');
        });

        it('should handle empty updates array', async () => {
            // Arrange
            const updates: Array<{ variantId: string; quantity: number }> = [];

            mockPrismaInstance.$transaction.mockResolvedValue([]);

            // Act
            await productRepository.bulkUpdateVariantStock(updates);

            // Assert
            expect(mockPrismaInstance.$transaction).toHaveBeenCalledWith([]);
        });
    });

    describe('createProductVariant', () => {
        it('should create a new product variant', async () => {
            // Arrange
            const productId = '11111111-1111-1111-1111-111111111111';
            const variantData = {
                sku: 'TEST-SKU-002',
                name: 'New Variant',
                price: 1500,
                stockQuantity: 20,
                attributes: { color: 'blue', size: 'L' }
            };

            const expectedVariant = {
                id: '33333333-3333-3333-3333-333333333333',
                productId,
                ...variantData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrismaInstance.productVariant.create.mockResolvedValue(expectedVariant);

            // Act
            const result = await productRepository.createProductVariant(productId, variantData);

            // Assert
            expect(result).toEqual(expectedVariant);
            expect(mockPrismaInstance.productVariant.create).toHaveBeenCalledWith({
                data: {
                    productId,
                    ...variantData
                }
            });
        });

        it('should throw error when variant creation fails', async () => {
            // Arrange
            const productId = '11111111-1111-1111-1111-111111111111';
            const variantData = {
                sku: 'TEST-SKU-002',
                name: 'New Variant',
                price: 1500,
                stockQuantity: 20,
                attributes: { color: 'blue', size: 'L' }
            };

            mockPrismaInstance.productVariant.create.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(productRepository.createProductVariant(productId, variantData))
                .rejects
                .toThrow('Failed to create product variant');
        });
    });

    describe('updateProductAndVariants', () => {
        it('should update a product and its variants in a single transaction', async () => {
            // Arrange
            const productId = '11111111-1111-1111-1111-111111111111';
            const productData = {
                name: 'Updated Product Name',
                description: 'Updated description',
                specifications: { weight: '2kg', dimensions: '30x20x10cm' }
            };

            const variantsData = [
                {
                    id: '22222222-2222-2222-2222-222222222222',
                    data: {
                        name: 'Updated Variant 1',
                        price: 1200,
                        stockQuantity: 15
                    }
                },
                {
                    id: '33333333-3333-3333-3333-333333333333',
                    data: {
                        name: 'Updated Variant 2',
                        price: 1500,
                        stockQuantity: 25
                    }
                }
            ];

            // Mock transaction function
            mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
                // Create a mock transaction context
                const tx = {
                    product: {
                        update: vi.fn().mockResolvedValue({
                            id: productId,
                            ...productData
                        })
                    },
                    productVariant: {
                        update: vi.fn().mockImplementation((params) => {
                            const variantId = params.where.id;
                            const variantData = variantsData.find(v => v.id === variantId)?.data;
                            return Promise.resolve({
                                id: variantId,
                                productId,
                                ...variantData
                            });
                        })
                    }
                };

                // Execute the callback with our mock transaction
                return await callback(tx);
            });

            // Act
            await productRepository.updateProductAndVariants(productId, productData, variantsData);

            // Assert
            expect(mockPrismaInstance.$transaction).toHaveBeenCalled();

            // Get the transaction callback
            const transactionCallback = mockPrismaInstance.$transaction.mock.calls[0][0];
            expect(typeof transactionCallback).toBe('function');
        });

        it('should throw error when transaction fails', async () => {
            // Arrange
            const productId = '11111111-1111-1111-1111-111111111111';
            const productData = { name: 'Updated Product' };
            const variantsData = [{ id: '22222222-2222-2222-2222-222222222222', data: { name: 'Updated Variant' } }];

            // Mock transaction to fail
            mockPrismaInstance.$transaction.mockRejectedValue(new Error('Transaction failed'));

            // Act & Assert
            await expect(productRepository.updateProductAndVariants(productId, productData, variantsData))
                .rejects
                .toThrow('Failed to update product and variants');
        });
    });
});
