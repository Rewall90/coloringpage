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
  token: process.env.SANITY_TOKEN
});

// Test fetching coloring pages
async function testFetch() {
  console.log('Testing Sanity fetch...\n');
  
  // Fetch all coloring pages
  const coloringPages = await client.fetch(`*[_type == "coloringPage"]{
    _id,
    title,
    "slug": slug.current,
    categories[]->{
      title,
      "slug": slug.current
    }
  }`);
  
  console.log(`Found ${coloringPages.length} coloring pages:\n`);
  
  coloringPages.forEach(page => {
    console.log(`- ${page.title} (${page.slug})`);
    if (page.categories && page.categories.length > 0) {
      console.log(`  Categories: ${page.categories.map(c => c.title).join(', ')}`);
    } else {
      console.log(`  Categories: None`);
    }
  });
  
  // Fetch all categories
  console.log('\n---\n');
  const categories = await client.fetch(`*[_type == "category"]{
    title,
    "slug": slug.current
  }`);
  
  console.log(`Found ${categories.length} categories:\n`);
  categories.forEach(cat => {
    console.log(`- ${cat.title} (${cat.slug})`);
  });
}

testFetch().catch(console.error);