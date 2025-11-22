#!/usr/bin/env ts-node

/**
 * List files in S3 bucket to see what's available
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_STORAGE_ENDPOINT = process.env.SUPABASE_STORAGE_ENDPOINT!;
const SUPABASE_STORAGE_ACCESS_KEY_ID = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!;
const SUPABASE_STORAGE_SECRET_ACCESS_KEY = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!;
const SUPABASE_STORAGE_REGION = process.env.SUPABASE_STORAGE_REGION || 'ap-southeast-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

const s3Client = new S3Client({
  endpoint: SUPABASE_STORAGE_ENDPOINT,
  region: SUPABASE_STORAGE_REGION,
  forcePathStyle: true, // Required for S3-compatible APIs
  credentials: {
    accessKeyId: SUPABASE_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: SUPABASE_STORAGE_SECRET_ACCESS_KEY,
  },
});

async function listS3Bucket() {
  if (!S3_BUCKET_NAME) {
    console.log('❌ S3_BUCKET_NAME not set. Please set it in .env.local');
    console.log('   Example: S3_BUCKET_NAME=my-music-bucket');
    return;
  }

  console.log(`📂 Listing files in S3 bucket: ${S3_BUCKET_NAME}\n`);

  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('  📭 Bucket is empty');
      return;
    }

    console.log(`  Found ${response.Contents.length} files:\n`);
    
    // Group by prefix/folder
    const byPrefix: Record<string, string[]> = {};
    
    response.Contents.forEach(obj => {
      if (obj.Key) {
        const parts = obj.Key.split('/');
        const prefix = parts.length > 1 ? parts[0] : '(root)';
        if (!byPrefix[prefix]) {
          byPrefix[prefix] = [];
        }
        byPrefix[prefix].push(obj.Key);
      }
    });

    Object.keys(byPrefix).sort().forEach(prefix => {
      console.log(`  📁 ${prefix}/`);
      byPrefix[prefix].slice(0, 10).forEach(key => {
        console.log(`     - ${key}`);
      });
      if (byPrefix[prefix].length > 10) {
        console.log(`     ... and ${byPrefix[prefix].length - 10} more files`);
      }
      console.log();
    });

    console.log('\n💡 Tip: Make sure your songs are in "songs/" folder and images in "images/" folder');
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.message.includes('NoSuchBucket')) {
      console.log(`\n   The bucket "${S3_BUCKET_NAME}" does not exist or you don't have access to it.`);
    }
    if (error.message.includes('InvalidAccessKeyId')) {
      console.log(`\n   Check your SUPABASE_STORAGE_ACCESS_KEY_ID and SUPABASE_STORAGE_SECRET_ACCESS_KEY in .env.local`);
    }
  }
}

listS3Bucket()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

