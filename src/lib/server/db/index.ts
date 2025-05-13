import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const QUERY_TIMEOUT = 10000; // 10 seconds

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
    log: dev ? ['error', 'warn'] : ['error']
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

// Retry mechanism for database operations
async function withRetry<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = RETRY_DELAY
): Promise<T> {
    try {
        // Add timeout to the operation
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Operation timed out after ${QUERY_TIMEOUT}ms`));
            }, QUERY_TIMEOUT);
        });

        // Race between the operation and the timeout
        return await Promise.race([
            operation(),
            timeoutPromise
        ]);
    } catch (error) {
        if (retries === 0) {
            throw error;
        }

        // Check if error is a connection timeout
        if (error instanceof Error &&
            (error.message.includes('timeout') ||
                error.message.includes('connection') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('pool') ||
                error.message.includes('connection pool'))) {

            console.warn(`Database connection failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(operation, retries - 1, delay * 2);
        }

        throw error;
    }
}

// Utility function to safely handle Prisma operations with retry
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = 'Database operation failed'
): Promise<T> {
    try {
        return await withRetry(operation);
    } catch (error) {
        console.error('Database error:', error);
        throw new DatabaseError(errorMessage, error);
    }
}

// Connection health check
async function checkConnection(): Promise<boolean> {
    try {
        // Use a simple query that works with connection pooling
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database connection health check failed:', error);
        return false;
    }
}

// Optional: Add custom query builders or common operations
export const db = {
    ...prisma,
    // Add any custom query builders or utility functions here

    // Example: Safe transaction wrapper with retry
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

    // Example: Connect function for initialization with retry
    connect: async () => {
        await withRetry(async () => {
            await prisma.$connect();
            const isHealthy = await checkConnection();
            if (!isHealthy) {
                throw new Error('Database connection health check failed');
            }
        });
    },

    // Health check function
    healthCheck: checkConnection
};

// Handle cleanup on app termination
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});
