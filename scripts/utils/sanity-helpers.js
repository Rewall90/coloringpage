/**
 * Sanity Client Utilities
 *
 * Helper functions for initializing and working with the Sanity client,
 * including environment validation and connection testing.
 */

import { createClient } from '@sanity/client';

import { sanityLogger } from './logger.js';

/**
 * Validate required environment variables
 */
export const validateEnvironment = () => {
  const requiredEnvVars = ['SANITY_PROJECT_ID', 'SANITY_DATASET'];

  const optionalEnvVars = [
    'SANITY_TOKEN', // For private datasets or webhooks
  ];

  sanityLogger.info('Validating environment variables...');

  const missingVars = [];
  const presentVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
      // Mask sensitive values in logs
      const value = varName.includes('TOKEN') ? '***HIDDEN***' : process.env[varName];
      sanityLogger.debug(`${varName}: ${value}`);
    }
  });

  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      const value = varName.includes('TOKEN') ? '***HIDDEN***' : process.env[varName];
      sanityLogger.debug(`${varName}: ${value} (optional)`);
    }
  });

  if (missingVars.length > 0) {
    sanityLogger.error('Missing required environment variables:', missingVars);
    sanityLogger.error('Setup instructions:');
    sanityLogger.error('Local development: Create .env.local with required variables');
    sanityLogger.error('Vercel: Run `vercel env add` or set in dashboard');
    sanityLogger.error('Netlify: Set in Site settings > Environment variables');
    sanityLogger.error('GitHub Actions: Set in repository Secrets');

    process.exit(1);
  }

  sanityLogger.success(`Environment validation passed (${presentVars.length} variables loaded)`);
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

    sanityLogger.success('Sanity client initialized successfully');
    return client;
  } catch (error) {
    sanityLogger.error('Failed to initialize Sanity client:', error.message);
    process.exit(1);
  }
};

/**
 * Test connection to Sanity
 */
export const testConnection = async client => {
  try {
    sanityLogger.info('Testing Sanity connection...');
    const result = await client.fetch('count(*)');
    sanityLogger.success(`Connection successful - ${result} total documents`);
  } catch (error) {
    sanityLogger.error('Sanity connection test failed:', error.message);
    sanityLogger.error('Check your PROJECT_ID and DATASET values');
    process.exit(1);
  }
};
