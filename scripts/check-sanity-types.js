#!/usr/bin/env node

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

// Check all document types
async function checkTypes() {
  console.log('Checking all document types in Sanity...\n');

  // Get count of each document type
  const types = ['post', 'page', 'category', 'coloringPage'];

  for (const type of types) {
    const count = await client.fetch(`count(*[_type == "${type}"])`);
    console.log(`${type}: ${count} documents`);

    if (count > 0 && type === 'post') {
      // Show posts with their categories
      const posts = await client.fetch(`*[_type == "post"]{
        title,
        "categoryTitle": category->title
      }`);
      console.log('  Posts:');
      posts.forEach(p => {
        console.log(`    - ${p.title} (Category: ${p.categoryTitle || 'None'})`);
      });
    }
  }

  // Check for any other document types
  console.log('\nAll document types:');
  const allTypes = await client.fetch(`array::unique(*[]._type)`);
  allTypes.forEach(type => {
    console.log(`  - ${type}`);
  });
}

checkTypes().catch(console.error);
