import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the seed SQL file
const seedFilePath = join(__dirname, '../../seed_products_postgres.sql');

// Read the seed SQL file
const seedSQL = readFileSync(seedFilePath, 'utf8');

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Extract database connection details from the URL
const dbUrlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!dbUrlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, username, password, host, port, database] = dbUrlMatch;

// Command to run the seed SQL file
const command = `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${username} -d ${database} -c "${seedSQL.replace(/"/g, '\\"')}"`;

console.log('Seeding database...');

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log('Database seeded successfully!');
});
