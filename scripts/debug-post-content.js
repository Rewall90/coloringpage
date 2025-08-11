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

// Debug post content
async function debugPost() {
  const posts = await client.fetch(`*[_type == "post" && title match "Robot*"]{
    title,
    excerpt,
    content,
    "categoryTitle": category->title
  }`);
  
  if (posts.length > 0) {
    const post = posts[0];
    console.log('Post Title:', post.title);
    console.log('Category:', post.categoryTitle);
    console.log('\nExcerpt:');
    console.log(post.excerpt);
    console.log('\nContent array:');
    console.log(JSON.stringify(post.content, null, 2));
  }
}

debugPost().catch(console.error);