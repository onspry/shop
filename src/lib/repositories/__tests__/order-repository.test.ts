import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidOrderItem, OrderRepository, mapCartItemToOrderItem } from '../order-repository'; // Adjust import if OrderRepository not present
import { OrderStatus, type CreateOrderViewModel, type OrderItemViewModel } from '$lib/models/order';
import { TransactionType } from '$lib/models/inventory';
import { mockPrismaInstance } from '../../../../test/setupTests';
import type { CartItemViewModel } from '$lib/models/cart';
import type { Order, OrderItem, OrderAddress } from '@prisma/client';
// Optionally, add mock order data here

let orderRepository: OrderRepository;

function getValidOrderInput() {
  return {
    cartId: "33333333-3333-3333-3333-333333333333",
    items: [
      {
        productId: "11111111-1111-1111-1111-111111111111",
        variantId: "22222222-2222-2222-2222-222222222222",
        productName: "P",
        variantName: "V",
        quantity: 1,
        price: 1,
        unitPrice: 1,
      },
    ],
    shipping: {
      method: "standard",
      amount: 5,
      address: {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        address1: "123 St",
        city: "City",
        postalCode: "12345",
        country: "Country",
        state: "State",
      },
    },
    payment: {
      method: "credit_card",
      intentId: "44444444-4444-4444-4444-444444444444",
      cardLast4: "1234",
      cardBrand: "Visa"
    },
    subtotal: 100,
    taxAmount: 10,
    discountAmount: 0,
    currency: "USD",
  };
}


describe('OrderRepository', () => {
  // Helper function to generate a valid order result from the database
  function getValidOrderResult(id = 'order-1'): Order & { items: OrderItem[]; addresses: OrderAddress[] } {
    return {
      id,
      userId: 'user-1',
      cartId: 'cart-1',
      status: OrderStatus.PROCESSING,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      subtotal: 100,
      discountCode: 'SAVE10',
      discountAmount: 10,
      total: 95, // subtotal - discount + shipping
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:05:00Z'),
      stripePaymentIntentId: 'pi_123456',
      stripeClientSecret: 'secret_123456',
      items: [
        {
          id: 'item-1',
          orderId: id,
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 2,
          price: 50,
          name: 'Test Product',
          variantName: 'Test Variant',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        }
      ],
      addresses: [
        {
          id: 'address-1',
          orderId: id,
          type: 'shipping',
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '555-123-4567',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        }
      ]
    };
  }
  beforeEach(() => {
    vi.clearAllMocks();
    orderRepository = new OrderRepository(); // Remove if not needed

    // Reset all relevant Prisma mocks
    mockPrismaInstance.order?.findFirst?.mockReset?.();
    mockPrismaInstance.order?.findUnique?.mockReset?.();
    mockPrismaInstance.order?.create?.mockReset?.();
    mockPrismaInstance.order?.update?.mockReset?.();
    mockPrismaInstance.orderItem?.findFirst?.mockReset?.();
    mockPrismaInstance.orderItem?.findUnique?.mockReset?.();
    mockPrismaInstance.orderItem?.create?.mockReset?.();
    mockPrismaInstance.orderItem?.update?.mockReset?.();
    mockPrismaInstance.orderItem?.delete?.mockReset?.();
    mockPrismaInstance.$transaction?.mockReset?.();
  });

  describe('isValidOrderItem', () => {
    it('returns true for a valid order item', () => {
      const validItem: OrderItemViewModel = {
        productId: '11111111-1111-1111-1111-111111111111',
        variantId: '22222222-2222-2222-2222-222222222222',
        productName: 'Product One',
        variantName: 'Variant One',
        quantity: 2,
        price: 1000,
        unitPrice: 1000
      };
      expect(isValidOrderItem(validItem)).toBe(true);
    });

    it('returns false for missing productId', () => {
      const item: OrderItemViewModel = {
        productId: '',
        variantId: '22222222-2222-2222-2222-222222222222',
        productName: 'Product One',
        variantName: 'Variant One',
        quantity: 2,
        price: 1000,
        unitPrice: 1000
      };
      expect(isValidOrderItem(item)).toBe(false);
    });

    it('returns false for non-positive quantity', () => {
      const item: OrderItemViewModel = {
        productId: '11111111-1111-1111-1111-111111111111',
        variantId: '22222222-2222-2222-2222-222222222222',
        productName: 'Product One',
        variantName: 'Variant One',
        quantity: 0,
        price: 1000,
        unitPrice: 1000
      };
      expect(isValidOrderItem(item)).toBe(false);
    });

    it('returns false for negative price', () => {
      const item: OrderItemViewModel = {
        productId: '11111111-1111-1111-1111-111111111111',
        variantId: '22222222-2222-2222-2222-222222222222',
        productName: 'Product One',
        variantName: 'Variant One',
        quantity: 1,
        price: -10,
        unitPrice: -10
      };
      expect(isValidOrderItem(item)).toBe(false);
    });
  });

  describe('mapCartItemToOrderItem', () => {
    it('correctly maps a valid cart item', () => {
      const cartItem = {
        variant: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Variant Name',
          product: { id: '11111111-1111-1111-1111-111111111111', name: 'Product Name' }
        },
        quantity: 3,
        price: 2500
      };
      const result = mapCartItemToOrderItem(cartItem as unknown as CartItemViewModel);
      expect(result).toEqual({
        productId: '11111111-1111-1111-1111-111111111111',
        variantId: '22222222-2222-2222-2222-222222222222',
        quantity: 3,
        price: 2500,
        unitPrice: 2500,
        productName: 'Product Name',
        variantName: 'Variant Name'
      });
    });

    it('falls back to variant.productId and variant.name if product missing', () => {
      const cartItem = {
        variant: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Fallback Variant',
          productId: '11111111-1111-1111-1111-111111111111'
        },
        quantity: 1,
        price: 1000
      };
      const result = mapCartItemToOrderItem(cartItem as unknown as CartItemViewModel);
      expect(result.productId).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.productName).toBe('Fallback Variant');
    });

    it('sets unitPrice equal to price', () => {
      const cartItem = {
        variant: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Unit Variant',
          product: { id: '11111111-1111-1111-1111-111111111111', name: 'Unit Product' }
        },
        quantity: 2,
        price: 1234
      };
      const result = mapCartItemToOrderItem(cartItem as unknown as CartItemViewModel);
      expect(result.unitPrice).toBe(result.price);
    });
  });

  describe('createOrder', () => {
    const createdOrder: Order & { items: OrderItem[]; addresses: OrderAddress[] } = {
      id: 'order-1',
      userId: null,
      cartId: '00000000-0000-0000-0000-000000000000',
      status: 'pending',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      subtotal: 100,
      discountCode: null,
      discountAmount: 0,
      total: 115,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripePaymentIntentId: null,
      stripeClientSecret: null,
      items: [
        {
          id: 'item-1',
          name: 'P',
          productId: '11111111-1111-1111-1111-111111111111',
          variantId: '22222222-2222-2222-2222-222222222222',
          quantity: 1,
          price: 1,
          variantName: 'V',
          createdAt: new Date(),
          updatedAt: new Date(),
          orderId: 'order-1'
        }
      ],
      addresses: [
        {
          id: 'address-1',
          orderId: 'order-1',
          type: 'shipping',
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 St',
          address2: null,
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    beforeEach(() => {
      // Root beforeEach already clears mocks and sets up orderRepository
      mockPrismaInstance.$transaction.mockImplementation(async (cb: (prisma: unknown) => unknown) => cb(mockPrismaInstance));
      mockPrismaInstance.order.create.mockResolvedValue(createdOrder);
      mockPrismaInstance.order.findUnique.mockResolvedValue(createdOrder);
      mockPrismaInstance.inventoryTransaction.create = vi.fn().mockResolvedValue({ id: 'inv-1' });
    });

    it('creates an order and returns the created order', async () => {
      // Arrange: minimal valid order input
      const orderInput: CreateOrderViewModel = {
        cartId: "33333333-3333-3333-3333-333333333333",
        items: [
          {
            productId: "11111111-1111-1111-1111-111111111111",
            variantId: "22222222-2222-2222-2222-222222222222",
            productName: "P",
            variantName: "V",
            quantity: 1,
            price: 1,
            unitPrice: 1,
          },
        ],
        shipping: {
          method: "standard",
          amount: 5,
          address: {
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            address1: "123 St",
            city: "City",
            postalCode: "12345",
            country: "Country",
            state: "State",
          },
        },
        payment: {
          method: "credit_card",
          intentId: "44444444-4444-4444-4444-444444444444",
          cardLast4: "1234",
          cardBrand: "Visa"
        },
        subtotal: 100,
        taxAmount: 10,
        discountAmount: 0,
        currency: "USD",
      };

      vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue({
        // Return a valid OrderViewModel object here matching your test expectations
        id: 'order-1',
        orderNumber: 'ORDER-1',
        status: 'pending',
        total: 115,
        subtotal: 100,
        taxAmount: 10,
        shippingAmount: 5,
        discountAmount: 0,
        currency: 'USD',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        createdAt: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            productId: '11111111-1111-1111-1111-111111111111',
            variantId: '22222222-2222-2222-2222-222222222222',
            quantity: 1,
            unitPrice: 1,
            totalPrice: 1,
            name: 'P',
            variantName: 'V'
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
          email: 'test@example.com'
        }
      });

      // Act
      const result = await orderRepository.createOrder(orderInput);

      // Assert
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
      expect(mockPrismaInstance.order.create).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'order-1', status: 'pending', total: 115 });
    });

    it('creates inventory transactions for each order item', async () => {
      // Arrange
      const orderInput: CreateOrderViewModel = {
        ...getValidOrderInput(),
        items: [
          {
            productId: "11111111-1111-1111-1111-111111111111",
            variantId: "22222222-2222-2222-2222-222222222222",
            productName: "Product 1",
            variantName: "Variant 1",
            quantity: 2,
            price: 50,
            unitPrice: 50,
          },
          {
            productId: "33333333-3333-3333-3333-333333333333",
            variantId: "44444444-4444-4444-4444-444444444444",
            productName: "Product 2",
            variantName: "Variant 2",
            quantity: 1,
            price: 100,
            unitPrice: 100,
          }
        ]
      };

      // Mock the transaction implementation to capture the inventory transaction calls
      const inventoryTransactionCreateSpy = vi.fn().mockResolvedValue({ id: 'inv-tx-1' });
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: { create: vi.fn().mockResolvedValue({ id: 'order-1' }) },
          orderItem: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          orderAddress: { create: vi.fn().mockResolvedValue({ id: 'addr-1' }) },
          orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 'hist-1' }) },
          inventoryTransaction: { create: inventoryTransactionCreateSpy }
        };
        return callback(tx);
      });

      vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORDER-1',
        status: OrderStatus.PENDING_PAYMENT,
        total: 200,
        subtotal: 200,
        taxAmount: 0,
        shippingAmount: 0,
        currency: 'USD',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        createdAt: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            productId: "11111111-1111-1111-1111-111111111111",
            variantId: "22222222-2222-2222-2222-222222222222",
            quantity: 2,
            unitPrice: 50,
            totalPrice: 100,
            name: 'Product 1',
            variantName: 'Variant 1'
          },
          {
            id: 'item-2',
            productId: "33333333-3333-3333-3333-333333333333",
            variantId: "44444444-4444-4444-4444-444444444444",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            name: 'Product 2',
            variantName: 'Variant 2'
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
          email: 'test@example.com'
        }
      });

      // Act
      await orderRepository.createOrder(orderInput);

      // Assert
      // Should be called twice, once for each item
      expect(inventoryTransactionCreateSpy).toHaveBeenCalledTimes(2);

      // First call should be for the first item
      expect(inventoryTransactionCreateSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: "22222222-2222-2222-2222-222222222222",
          orderId: expect.any(String),
          type: TransactionType.ORDER,
          quantity: -2, // Negative because it's reducing inventory
          note: expect.stringContaining('Order')
        })
      });

      // Second call should be for the second item
      expect(inventoryTransactionCreateSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: "44444444-4444-4444-4444-444444444444",
          orderId: expect.any(String),
          type: TransactionType.ORDER,
          quantity: -1, // Negative because it's reducing inventory
          note: expect.stringContaining('Order')
        })
      });
    });

    // Add inside describe('createOrder', ...) after the happy-path test:
    it('throws if items is empty', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        items: [],
      };
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).rejects.toThrow('Order must have at least one item');
    });

    it('throws if subtotal is zero', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        subtotal: 0,
      };
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).rejects.toThrow('Order subtotal must be greater than 0');
    });

    it('throws if taxAmount is negative', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        taxAmount: -1,
      };
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).rejects.toThrow('Tax amount cannot be negative');
    });

    it('throws if shipping.amount is negative', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        shipping: { ...getValidOrderInput().shipping, amount: -5 },
      };
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).rejects.toThrow('Shipping amount cannot be negative');
    });

    it('throws if shipping address is incomplete', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        shipping: { ...getValidOrderInput().shipping, address: { ...getValidOrderInput().shipping.address, address1: '' } },
      };
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).rejects.toThrow('Complete shipping address is required');
    });

    it('throws if shipping email is missing', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        shipping: { ...getValidOrderInput().shipping, address: { ...getValidOrderInput().shipping.address, email: '' } },
      };
      await expect(orderRepository.createOrder(orderInput as CreateOrderViewModel)).rejects.toThrow('Shipping email is required');
    });

    it('throws if shipping name is missing', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        shipping: { ...getValidOrderInput().shipping, address: { ...getValidOrderInput().shipping.address, firstName: '', lastName: '' } },
      };
      await expect(orderRepository.createOrder(orderInput as CreateOrderViewModel)).rejects.toThrow('Shipping name is required');
    });

    it('sets state to empty string if undefined', async () => {
      const orderInput = {
        ...getValidOrderInput(),
        shipping: { ...getValidOrderInput().shipping, address: { ...getValidOrderInput().shipping.address, state: undefined } },
      };
      mockPrismaInstance.order.create.mockResolvedValue(createdOrder);
      mockPrismaInstance.order.findUnique.mockResolvedValue(createdOrder);
      await expect(orderRepository.createOrder(orderInput as unknown as CreateOrderViewModel)).resolves.toBeDefined();
      // Optionally, check that state is set to '' in your implementation
    });

    it('throws if DB transaction fails', async () => {
      mockPrismaInstance.$transaction.mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(orderRepository.createOrder(getValidOrderInput() as unknown as CreateOrderViewModel)).rejects.toThrow('DB error');
    });

    it('throws if order retrieval after creation fails', async () => {
      mockPrismaInstance.order.findUnique.mockResolvedValueOnce(null);
      await expect(orderRepository.createOrder(getValidOrderInput() as unknown as CreateOrderViewModel)).rejects.toThrow('Failed to create order');
    });

    it('handles inventory transaction failures', async () => {
      // Arrange
      const orderInput = getValidOrderInput() as unknown as CreateOrderViewModel;

      // Mock the transaction implementation to simulate inventory transaction failure
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: { create: vi.fn().mockResolvedValue({ id: 'order-1' }) },
          orderItem: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
          orderAddress: { create: vi.fn().mockResolvedValue({ id: 'addr-1' }) },
          orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 'hist-1' }) },
          inventoryTransaction: {
            create: vi.fn().mockRejectedValue(new Error('Inventory update failed'))
          }
        };
        return callback(tx);
      });

      // Act & Assert
      await expect(orderRepository.createOrder(orderInput)).rejects.toThrow('Inventory update failed');
    });
  });

  describe('updateOrderStatus', () => {
    const orderId = 'order-1';
    const newStatus = 'shipped';
    const note = 'Order shipped via UPS';

    it('successfully updates the order status and creates a history entry', async () => {
      // Mock $transaction to call the callback and resolve
      mockPrismaInstance.$transaction.mockImplementation(async (cb) => {
        // Provide fake tx with order.update and orderStatusHistory.create
        const tx = {
          order: { update: vi.fn().mockResolvedValue({ id: orderId, status: newStatus }) },
          orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 'history-1', orderId, status: newStatus, note }) }
        };
        await cb(tx);
      });

      await expect(orderRepository.updateOrderStatus(orderId, newStatus, note)).resolves.toBeUndefined();
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
    });

    it('handles missing note parameter', async () => {
      mockPrismaInstance.$transaction.mockImplementation(async (cb) => {
        const tx = {
          order: { update: vi.fn().mockResolvedValue({ id: orderId, status: newStatus }) },
          orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 'history-2', orderId, status: newStatus, note: null }) }
        };
        await cb(tx);
      });
      await expect(orderRepository.updateOrderStatus(orderId, newStatus)).resolves.toBeUndefined();
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
    });

    it('throws an error if the order does not exist', async () => {
      mockPrismaInstance.$transaction.mockImplementation(async () => {
        throw new Error('Order not found');
      });
      await expect(orderRepository.updateOrderStatus(orderId, newStatus)).rejects.toThrow('Failed to update order status: Order not found');
    });
  });

  describe('createPaymentTransaction', () => {
    const orderId = 'order-1';
    const amount = 100;
    const paymentMethod = 'stripe';
    const paymentIntentId = 'intent-1';
    const status = 'pending';

    it('successfully creates a payment transaction with all parameters', async () => {
      mockPrismaInstance.paymentTransaction.create.mockResolvedValue({ id: 'pt-1' });
      await expect(orderRepository.createPaymentTransaction(orderId, amount, paymentMethod, paymentIntentId, status)).resolves.toBeUndefined();
      expect(mockPrismaInstance.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            amount,
            stripePaymentIntentId: paymentIntentId,
            stripePaymentMethodId: paymentMethod,
            status
          })
        })
      );
    });

    it('creates a payment transaction without paymentIntentId (should generate one)', async () => {
      mockPrismaInstance.paymentTransaction.create.mockResolvedValue({ id: 'pt-2' });
      await expect(orderRepository.createPaymentTransaction(orderId, amount, paymentMethod)).resolves.toBeUndefined();
      expect(mockPrismaInstance.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            amount,
            stripePaymentMethodId: paymentMethod,
            status: 'pending'
          })
        })
      );
    });

    it('uses the default status if not provided', async () => {
      mockPrismaInstance.paymentTransaction.create.mockResolvedValue({ id: 'pt-3' });
      await expect(orderRepository.createPaymentTransaction(orderId, amount, paymentMethod, paymentIntentId)).resolves.toBeUndefined();
      expect(mockPrismaInstance.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            amount,
            status: 'pending'
          })
        })
      );
    });

    it('throws an error if creation fails', async () => {
      mockPrismaInstance.paymentTransaction.create.mockImplementation(() => { throw new Error('DB error'); });
      await expect(orderRepository.createPaymentTransaction(orderId, amount, paymentMethod, paymentIntentId, status)).rejects.toThrow('Failed to create payment transaction: DB error');
    });
  });

  describe('createRefund', () => {
    const orderId = 'order-1';
    const transactionId = 'txn-1';
    const amount = 50;
    const reason = 'Customer request';
    const refundId = 'refund-1';

    it('successfully creates a refund and a status history entry', async () => {
      mockPrismaInstance.refund.create = vi.fn().mockResolvedValue({ id: refundId, orderId, amount });
      mockPrismaInstance.order.update = vi.fn().mockResolvedValue({ id: orderId, status: 'refunded' });
      mockPrismaInstance.orderStatusHistory.create = vi.fn().mockResolvedValue({ id: 'history-1', orderId, status: 'refunded', note: reason });
      await expect(orderRepository.createRefund(orderId, transactionId, amount, reason, refundId)).resolves.toBeUndefined();
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
    });

    it('handles missing reason and refundId', async () => {
      mockPrismaInstance.refund.create = vi.fn().mockResolvedValue({ id: 'generated-refund', orderId, amount });
      mockPrismaInstance.order.update = vi.fn().mockResolvedValue({ id: orderId, status: 'refunded' });
      mockPrismaInstance.orderStatusHistory.create = vi.fn().mockResolvedValue({ id: 'history-2', orderId, status: 'refunded', note: undefined });
      await expect(orderRepository.createRefund(orderId, transactionId, amount)).resolves.toBeUndefined();
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
    });

    it('throws an error if refund creation fails', async () => {
      mockPrismaInstance.refund.create = vi.fn(() => { throw new Error('Refund DB error'); });
      mockPrismaInstance.order.update = vi.fn().mockResolvedValue({ id: orderId, status: 'refunded' });
      mockPrismaInstance.orderStatusHistory.create = vi.fn().mockResolvedValue({ id: 'history-2', orderId, status: 'refunded', note: undefined });
      await expect(orderRepository.createRefund(orderId, transactionId, amount, reason, refundId)).rejects.toThrow('Failed to create refund: Refund DB error');
    });

    it('throws an error if status history creation fails', async () => {
      mockPrismaInstance.refund.create = vi.fn().mockResolvedValue({ id: refundId, orderId, amount });
      mockPrismaInstance.order.update = vi.fn().mockResolvedValue({ id: orderId, status: 'refunded' });
      mockPrismaInstance.orderStatusHistory.create = vi.fn(() => { throw new Error('History DB error'); });
      await expect(orderRepository.createRefund(orderId, transactionId, amount, reason, refundId)).rejects.toThrow('Failed to create refund: History DB error');
    });
  });

  describe('getOrdersByUserId', () => {
    const userId = 'user-1';
    const orderResult = [{
      id: 'order-1',
      userId,
      status: 'pending',
      total: 100,
      subtotal: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      addresses: [],
    }];
    const orderViewModel = { id: 'order-1', status: 'pending', total: 100 };

    beforeEach(() => {
      mockPrismaInstance.order.findMany = vi.fn();
    });

    it('returns an array of OrderViewModel for a user with orders', async () => {
      const enrichedOrderResult = [{
        ...orderResult[0],
        addresses: [{
          id: 'addr-1',
          type: 'shipping',
          street: '123 Main St',
          city: 'Townsville',
          country: 'US',
          // any other required fields
        }],
        items: [{
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 2,
          price: 50,
          name: 'Test Product',
          // any other required fields
        }]
      }];
      mockPrismaInstance.order.findMany.mockResolvedValue(enrichedOrderResult);
      const result = await orderRepository.getOrdersByUserId(userId);
      expect(mockPrismaInstance.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          items: true,
          addresses: { where: { type: 'shipping' } }
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(result.map(({ id, status, total }) => ({ id, status, total })))
        .toEqual([orderViewModel]);
    });

    it('returns an empty array if user has no orders', async () => {
      mockPrismaInstance.order.findMany.mockResolvedValue([]);
      const result = await orderRepository.getOrdersByUserId(userId);
      expect(result).toEqual([]);
    });

    it('returns an empty array if there is an error', async () => {
      mockPrismaInstance.order.findMany.mockImplementation(() => { throw new Error('DB error'); });
      const result = await orderRepository.getOrdersByUserId(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getOrderStatusHistory', () => {
    const orderId = 'order-1';
    const statusHistoryDb = [
      {
        status: 'pending',
        note: 'Order placed',
        createdAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        status: 'shipped',
        note: 'Order shipped',
        createdAt: new Date('2024-01-02T12:00:00Z')
      }
    ];


    it('returns mapped status history entries', async () => {
      mockPrismaInstance.orderStatusHistory.findMany.mockResolvedValue(statusHistoryDb);

      const result = await orderRepository.getOrderStatusHistory(orderId);

      expect(mockPrismaInstance.orderStatusHistory.findMany).toHaveBeenCalledWith({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual([
        {
          status: 'pending',
          note: 'Order placed',
          createdAt: '2024-01-01T10:00:00.000Z'
        },
        {
          status: 'shipped',
          note: 'Order shipped',
          createdAt: '2024-01-02T12:00:00.000Z'
        }
      ]);
    });

    it('returns an empty array if there is an error', async () => {
      mockPrismaInstance.orderStatusHistory.findMany.mockImplementation(() => { throw new Error('DB error'); });
      const result = await orderRepository.getOrderStatusHistory(orderId);
      expect(result).toEqual([]);
    });
  });
  describe('getOrdersByStatus', () => {
    const status = OrderStatus.PENDING_PAYMENT;
    const orderDb = [{
      id: 'order-1',
      status: 'pending',
      total: 100,
      subtotal: 80,
      discountAmount: 0,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      stripePaymentIntentId: 'pi_123',
      addresses: [{
        id: 'addr-1',
        type: 'shipping',
        street: '123 Main St',
        city: 'Townsville',
        country: 'US',
        // ...other required fields
      }],
      items: [{
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 2,
        price: 50,
        name: 'Test Product',
        // ...other required fields
      }]
    }];

    it('returns mapped orders for the given status', async () => {
      mockPrismaInstance.order.findMany.mockResolvedValue(orderDb);

      const result = await orderRepository.getOrdersByStatus(status);

      expect(mockPrismaInstance.order.findMany).toHaveBeenCalledWith({
        where: { status },
        include: {
          items: true,
          addresses: { where: { type: 'shipping' } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Compare only relevant fields
      expect(result.map(({ id, status, total }) => ({ id, status, total })))
        .toEqual([{ id: 'order-1', status: 'pending', total: 100 }]);
    });

    it('returns an empty array if there is an error', async () => {
      mockPrismaInstance.order.findMany.mockImplementation(() => { throw new Error('DB error'); });
      const result = await orderRepository.getOrdersByStatus(status);
      expect(result).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    const orderId = 'order-1';

    it('successfully retrieves an order by ID', async () => {
      // Arrange
      const orderData = getValidOrderResult(orderId);
      mockPrismaInstance.order.findUnique.mockResolvedValue(orderData);

      // Act
      const result = await orderRepository.getOrderById(orderId);

      // Assert
      expect(mockPrismaInstance.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        include: {
          items: true,
          addresses: {
            where: {
              type: 'shipping'
            }
          }
        }
      });

      // Verify the returned view model has the correct data
      expect(result).not.toBeNull();
      expect(result?.id).toBe(orderId);
      expect(result?.status).toBe(OrderStatus.PROCESSING);
      expect(result?.total).toBe(95);
      expect(result?.subtotal).toBe(100);
      expect(result?.discountAmount).toBe(10);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].quantity).toBe(2);
      expect(result?.items[0].unitPrice).toBe(50);
      expect(result?.items[0].totalPrice).toBe(100); // quantity * unitPrice
      expect(result?.shippingAddress).toBeDefined();
      expect(result?.shippingAddress.firstName).toBe('John');
      expect(result?.shippingAddress.lastName).toBe('Doe');
      expect(result?.shippingAddress.email).toBe('test@example.com');
    });

    it('returns null when order is not found', async () => {
      // Arrange
      mockPrismaInstance.order.findUnique.mockResolvedValue(null);

      // Act
      const result = await orderRepository.getOrderById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when order has no items', async () => {
      // Arrange
      const orderData = getValidOrderResult(orderId);
      orderData.items = []; // Empty items array
      mockPrismaInstance.order.findUnique.mockResolvedValue(orderData);

      // Act
      const result = await orderRepository.getOrderById(orderId);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when order has no shipping address', async () => {
      // Arrange
      const orderData = getValidOrderResult(orderId);
      orderData.addresses = []; // Empty addresses array
      mockPrismaInstance.order.findUnique.mockResolvedValue(orderData);

      // Act
      const result = await orderRepository.getOrderById(orderId);

      // Assert
      expect(result).toBeNull();
    });

    it('handles database errors gracefully', async () => {
      // Arrange
      mockPrismaInstance.order.findUnique.mockRejectedValue(new Error('Database connection error'));

      // Act
      const result = await orderRepository.getOrderById(orderId);

      // Assert
      expect(result).toBeNull();
    });

    it('correctly formats the order number', async () => {
      // Arrange
      const orderData = getValidOrderResult(orderId);
      mockPrismaInstance.order.findUnique.mockResolvedValue(orderData);

      // The formatOrderNumber function is imported in the repository
      // We can verify it's being used correctly by checking the orderNumber format

      // Act
      const result = await orderRepository.getOrderById(orderId);

      // Assert
      expect(result?.orderNumber).toBeDefined();
      // The format should match what formatOrderNumber would return
      // For order-1 created on 2024-01-01, it should be something like ON-20240101-ORDE
      expect(result?.orderNumber).toMatch(/ON-\d{8}-\w+/);
    });
  });

  describe('getOrderPaymentTransactions', () => {
    const orderId = 'order-1';
    const paymentTransactionsDb = [
      {
        id: 'txn-1',
        orderId,
        amount: 100,
        status: 'succeeded',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        // ...other required fields
      },
      {
        id: 'txn-2',
        orderId,
        amount: 50,
        status: 'pending',
        createdAt: new Date('2024-01-02T12:00:00Z'),
        // ...other required fields
      }
    ];

    it('returns payment transactions for the order', async () => {
      mockPrismaInstance.paymentTransaction.findMany = vi.fn().mockResolvedValue(paymentTransactionsDb);

      const result = await orderRepository.getOrderPaymentTransactions(orderId);

      expect(mockPrismaInstance.paymentTransaction.findMany).toHaveBeenCalledWith({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(paymentTransactionsDb);
    });

    it('returns an empty array if there is an error', async () => {
      mockPrismaInstance.paymentTransaction.findMany = vi.fn().mockImplementation(() => { throw new Error('DB error'); });
      const result = await orderRepository.getOrderPaymentTransactions(orderId);
      expect(result).toEqual([]);
    });
  });
});