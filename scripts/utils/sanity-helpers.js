/**
 * Sanity Client Utilities
 *
 * Helper functions for initializing and working with the Sanity client,
 * including environment validation and connection testing.
 */

import { createClient } from '@sanity/client';

/**
 * Validate required environment variables
 */
export const validateEnvironment = () => {
  const requiredEnvVars = ['SANITY_PROJECT_ID', 'SANITY_DATASET'];

  const optionalEnvVars = [
    'SANITY_TOKEN', // For private datasets or webhooks
  ];

  console.log('🔍 Validating environment variables...');

  const missingVars = [];
  const presentVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
      // Mask sensitive values in logs
      const value = varName.includes('TOKEN') ? '***HIDDEN***' : process.env[varName];
      console.log(`  ✅ ${varName}: ${value}`);
    }
  });

  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      const value = varName.includes('TOKEN') ? '***HIDDEN***' : process.env[varName];
      console.log(`  ℹ️  ${varName}: ${value} (optional)`);
    }
  });

  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   ${varName}`);
    });

    console.error('\n💡 Setup instructions:');
    console.error('   Local development: Create .env.local with:');
    missingVars.forEach(varName => {
      console.error(`     ${varName}=your_value_here`);
    });

    console.error('\n   Vercel: Run `vercel env add` or set in dashboard');
    console.error('   Netlify: Set in Site settings > Environment variables');
    console.error('   GitHub Actions: Set in repository Secrets');

    process.exit(1);
  }

  console.log(`✅ Environment validation passed (${presentVars.length} variables loaded)\n`);
};

/**
 * Create and configure Sanity client
 */
export const createSanityClient = () => {
  try {
    const client = createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      useCdn: process.env.NODE_ENV === 'production', // Use CDN in production
      apiVersion: '2023-05-03',
      token: process.env.SANITY_TOKEN, // Optional, for private datasets
    });

    console.log('🔌 Sanity client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Sanity client:', error.message);
    process.exit(1);
  }
};

/**
 * Test connection to Sanity
 */
export const testConnection = async client => {
  try {
    console.log('🧪 Testing Sanity connection...');
    const result = await client.fetch('count(*)');
    console.log(`✅ Connection successful - ${result} total documents\n`);
  } catch (error) {
    console.error('❌ Sanity connection test failed:', error.message);
    console.error('💡 Check your PROJECT_ID and DATASET values');
    process.exit(1);
  }
};
