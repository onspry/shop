import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
    log: dev ? ['query', 'error', 'warn'] : ['error']
});

if (dev) {
    global.prisma = prisma;
}

// Helper function to handle Prisma errors
export class DatabaseError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message);
        this.name = 'DatabaseError';
    }
}

// Utility function to safely handle Prisma operations
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = 'Database operation failed'
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error('Database error:', error);
        throw new DatabaseError(errorMessage, error);
    }
}

// Optional: Add custom query builders or common operations
export const db = {
    ...prisma,
    // Add any custom query builders or utility functions here

    // Example: Safe transaction wrapper
    safeTransaction: async <T>(
        fn: (tx: PrismaClient) => Promise<T>,
        errorMessage = 'Transaction failed'
    ): Promise<T> => {
        return withErrorHandling<T>(
            () => prisma.$transaction((tx) => fn(tx as PrismaClient)),
            errorMessage
        );
    },

    // Example: Disconnect function for cleanup
    disconnect: async () => {
        await prisma.$disconnect();
    },

    // Example: Connect function for initialization
    connect: async () => {
        await prisma.$connect();
    }
};

// Handle cleanup on app termination
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});
