# Database Structure

This directory contains the database schema and configuration for the application using Drizzle ORM with SQLite.

## Directory Structure

```
src/lib/server/db/
├── schema/                 # Schema definitions
│   ├── index.ts            # Exports all schemas
│   ├── user.ts             # User-related tables
│   ├── product.ts          # Product table
│   ├── product_variant.ts  # Product variant table
│   └── product_image.ts    # Product image table
├── migrations/             # SQL migration files
│   └── 0001_initial_schema.sql  # Initial schema migration
├── index.ts                # Database connection and exports
└── README.md               # This file
```

## Schema Organization

The schema is organized into separate files for each logical entity:

- `user.ts`: Contains user-related tables (user, session, etc.)
- `product.ts`: Contains the product table
- `product_variant.ts`: Contains the product variant table
- `product_image.ts`: Contains the product image table

## Naming Conventions

- **Table Names**: Singular, snake_case (e.g., `product`, `product_variant`)
- **Column Names**: snake_case in the database, camelCase in TypeScript (e.g., `product_id` in DB, `productId` in TS)
- **File Names**: Singular, snake_case (e.g., `product.ts`, `product_variant.ts`)

## Migrations

Migrations are stored in the `migrations/` directory as SQL files. They should be numbered sequentially with a descriptive name.

## Usage

Import the database instance and schemas from the main index file:

```typescript
import { db, user, product } from '$lib/server/db';

// Query example
const users = await db.select().from(user);
``` 