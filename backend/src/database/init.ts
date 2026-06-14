import pool, { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    console.log('📦 Initializing database...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await query(statement, []);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('✅ Database initialized successfully');

    // Check if any users exist
    const usersResult = await query(`SELECT COUNT(*) as count FROM team_members`, []);
    const userCount = parseInt(usersResult.rows[0].count);

    if (userCount === 0) {
      console.log('📝 No users found. Creating default team members...');
      await createDefaultUsers();
    }

    // Close pool
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createDefaultUsers() {
  const defaultUsers = [
    {
      name: 'Avodahmedia Owner',
      email: 'owner@avodahmedia.com',
      password: 'password123', // Change in production!
      role: 'owner',
      phone: '+1234567890',
    },
    {
      name: 'Sarah - Lead Manager',
      email: 'sarah@avodahmedia.com',
      password: 'password123',
      role: 'assistant',
      phone: null,
    },
    {
      name: 'Mike - Social Media Manager',
      email: 'mike@avodahmedia.com',
      password: 'password123',
      role: 'assistant',
      phone: null,
    },
    {
      name: 'Jessica - Proposal Handler',
      email: 'jessica@avodahmedia.com',
      password: 'password123',
      role: 'assistant',
      phone: null,
    },
  ];

  for (const user of defaultUsers) {
    try {
      // TODO: Use bcrypt for password hashing in production
      await query(
        `INSERT INTO team_members (name, email, phone, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, user.phone, user.password, user.role, true]
      );

      console.log(`✅ Created user: ${user.name} (${user.email})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.name}:`, error);
    }
  }

  console.log('📋 Default users created successfully');
  console.log('Use these credentials to login:');
  console.log('  Email: owner@avodahmedia.com');
  console.log('  Password: password123');
  console.log('⚠️  Change these default passwords before going to production!');
}

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
