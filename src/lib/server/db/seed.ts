import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function seedDatabase() {
    console.log('Starting database seeding...');

    try {
        // Read the seed file
        const seedPath = join(process.cwd(), 'seed_products.sql');
        const seedContent = readFileSync(seedPath, 'utf-8');

        // Split the content into individual statements
        const statements = seedContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // Execute each statement
        for (const statement of statements) {
            await db.run(sql.raw(statement));
        }

        console.log('Database seeding completed successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
} 