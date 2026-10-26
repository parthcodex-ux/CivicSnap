import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config.js';

const { Client } = pg;

async function runMigration() {
  const dbUrl = config.DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  if (dbUrl.includes('[YOUR-PASSWORD]')) {
    console.error('⚠️ DATABASE_URL contains placeholder [YOUR-PASSWORD].');
    console.error('Please update .env with your actual Supabase database password:');
    console.error('  DATABASE_URL=postgresql://postgres:<YOUR-ACTUAL-PASSWORD>@db.<YOUR-PROJECT-REF>.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL!');

    const rootDir = path.resolve(process.cwd(), '../..');
    const migrationPath = path.join(rootDir, 'supabase/migrations/20261026000000_civic_snap_schema.sql');
    const seedPath = path.join(rootDir, 'supabase/seed.sql');

    console.log(`📄 Applying schema migration from: ${migrationPath}`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSql);
    console.log('✅ Database schema and RLS policies applied successfully.');

    if (fs.existsSync(seedPath)) {
      console.log(`🌱 Applying verified authority seed data from: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('✅ Seed data inserted successfully.');
    }

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Verified Public Tables in Supabase:');
    res.rows.forEach(r => console.log(`   - ${r.table_name}`));

    console.log('\n🎉 CivicSnap database setup complete!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
