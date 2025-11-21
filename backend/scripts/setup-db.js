#!/usr/bin/env node

/**
 * Database Setup Script for Quiubole Backend
 * This script creates a fresh database, dropping any existing one
 *
 * Usage: npm run db:setup
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');

// Default values
let config = {
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: '74840616',
  DATABASE_NAME: 'quiubole_db'
};

// Try to load from .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });
  console.log('✓ Loaded configuration from .env file');
} else {
  console.log('⚠ No .env file found, using default values');
  console.log('  Creating .env file with defaults...');

  const defaultEnv = `DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=74840616
DATABASE_NAME=quiubole_db
JWT_SECRET=tu_secret_super_seguro_cambiar_en_produccion_12345
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`;

  fs.writeFileSync(envPath, defaultEnv);
  console.log('✓ Created .env file');
}

const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_HOST, DATABASE_PORT } = config;

console.log('\n========================================');
console.log('  Quiubole Database Setup');
console.log('========================================\n');
console.log(`Database: ${DATABASE_NAME}`);
console.log(`Host: ${DATABASE_HOST}:${DATABASE_PORT}`);
console.log(`User: ${DATABASE_USER}`);
console.log('');

// Set PGPASSWORD environment variable for passwordless commands
process.env.PGPASSWORD = DATABASE_PASSWORD;

function runPsql(command, ignoreError = false) {
  try {
    execSync(`psql -h ${DATABASE_HOST} -p ${DATABASE_PORT} -U ${DATABASE_USER} -c "${command}"`, {
      stdio: 'pipe',
      env: { ...process.env, PGPASSWORD: DATABASE_PASSWORD }
    });
    return true;
  } catch (error) {
    if (!ignoreError) {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
}

console.log('Step 1: Dropping existing database (if exists)...');
if (runPsql(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`, true)) {
  console.log(`✓ Dropped database "${DATABASE_NAME}" (or it didn\'t exist)`);
} else {
  console.log('⚠ Could not drop database (may have active connections)');
  console.log('  Trying to terminate connections...');

  runPsql(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${DATABASE_NAME}' AND pid <> pg_backend_pid()`, true);

  if (runPsql(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`, true)) {
    console.log(`✓ Dropped database "${DATABASE_NAME}"`);
  } else {
    console.error('✗ Failed to drop database. Please close all connections and try again.');
    process.exit(1);
  }
}

console.log('\nStep 2: Creating new database...');
if (runPsql(`CREATE DATABASE ${DATABASE_NAME}`)) {
  console.log(`✓ Created database "${DATABASE_NAME}"`);
} else {
  console.error('✗ Failed to create database');
  process.exit(1);
}

console.log('\n========================================');
console.log('  Setup Complete!');
console.log('========================================\n');
console.log('Next steps:');
console.log('  1. Run: npm run start:dev');
console.log('  2. The database tables will be created automatically');
console.log('');
