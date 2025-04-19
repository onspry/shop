# Database Setup and Seeding

This document explains how to set up and seed the database for the Onspry Shop application.

## Prerequisites

- Node.js and npm installed
- PostgreSQL installed and running
- `.env` file with proper database connection string

## Database Connection

Make sure your `.env` file contains the proper database connection string:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DIRECT_URL=postgresql://username:password@localhost:5432/database_name
```

## Database Initialization

To initialize the database with the schema and seed data, run:

```bash
npm run db:init
```

This command will:
1. Reset the database (drop all tables and recreate them)
2. Apply all migrations
3. Seed the database with product data

## Seeding Only

If you want to seed the database without resetting it, run:

```bash
npm run prisma:seed
```

This will run the seed script that inserts product data into the database.

## Alternative Seeding Method

If you prefer to run the SQL seed file directly using `psql`, you can use:

```bash
npm run db:seed:postgres
```

This method requires that you have the PostgreSQL client (`psql`) installed and available in your PATH.

## Development Workflow

1. Start with a fresh database: `npm run db:init`
2. Run the application: `npm run dev`
3. Make changes to the schema if needed
4. Generate a new migration: `npx prisma migrate dev --name your_migration_name`
5. Apply the migration: `npx prisma migrate deploy`

## Troubleshooting

If you encounter issues with the database connection:

1. Check that PostgreSQL is running
2. Verify your connection string in the `.env` file
3. Make sure you have the necessary permissions to create/modify the database
4. Try running `npx prisma db push` to apply schema changes without migrations

For issues with the seed data:

1. Check the console output for specific error messages
2. Verify that the seed SQL file is properly formatted
3. Try running the SQL commands directly in a PostgreSQL client
