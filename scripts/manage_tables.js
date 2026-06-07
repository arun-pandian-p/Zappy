/*
Safe management script for restaurant `tables` records.

Usage (DRY RUN - default):
  SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/manage_tables.js --dry

To actually execute deletions/creations:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/manage_tables.js --execute --create 10

What it does:
- Fetches all restaurants from `restaurants` (assumes `id` column exists)
- Optionally deletes all rows from `tables` (hard delete)
- Creates N tables per restaurant (defaults to 10) with format T1..TN

Safety:
- Default mode is dry-run and only logs planned actions.
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var to perform destructive ops.
- Review the script before running on production.
*/

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option('dry', { type: 'boolean', description: 'Dry run (no DB writes)', default: true })
  .option('execute', { type: 'boolean', description: 'Execute DB writes', default: false })
  .option('create', { type: 'number', description: 'Number of tables to create per restaurant', default: 10 })
  .help()
  .argv;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL not set in env');
  process.exit(1);
}

if (argv.execute && !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('To execute destructive operations you must provide SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || '');

async function main() {
  console.log('Mode:', argv.execute ? 'EXECUTE' : 'DRY RUN');
  console.log('Create per restaurant:', argv.create);

  // Fetch restaurants
  const { data: restaurants, error: restErr } = await supabase
    .from('restaurants')
    .select('id, name')
    .order('created_at', { ascending: true });

  if (restErr) {
    console.error('Failed to fetch restaurants:', restErr.message || restErr);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('No restaurants found — nothing to do.');
    return;
  }

  console.log(`Found ${restaurants.length} restaurants.`);

  for (const r of restaurants) {
    console.log('\n---');
    console.log(`Restaurant: ${r.name || r.id} (${r.id})`);

    // Plan delete
    console.log(`Plan: Delete all rows in 'tables' where restaurant_id = ${r.id}`);
    if (argv.execute) {
      const { error: delErr } = await supabase
        .from('tables')
        .delete()
        .eq('restaurant_id', r.id);
      if (delErr) {
        console.error('Delete error for restaurant', r.id, delErr.message || delErr);
      } else {
        console.log('Deleted existing tables for', r.id);
      }
    }

    // Create N tables
    const toCreate = argv.create || 10;
    console.log(`Plan: Create ${toCreate} tables for restaurant ${r.id}`);
    const rows = [];
    for (let i = 1; i <= toCreate; i++) {
      rows.push({
        restaurant_id: r.id,
        table_number: `T${i}`,
        capacity: 4,
        status: 'available',
      });
    }

    if (argv.execute) {
      const { data: created, error: createErr } = await supabase
        .from('tables')
        .insert(rows)
        .select();
      if (createErr) {
        console.error('Create error for restaurant', r.id, createErr.message || createErr);
      } else {
        console.log(`Created ${created.length} tables for ${r.id}`);
      }
    } else {
      console.log('Dry-run rows to create (first 3 shown):', rows.slice(0, 3));
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
