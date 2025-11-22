#!/usr/bin/env ts-node

/**
 * List all available S3 buckets for the AWS account
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_STORAGE_ENDPOINT = process.env.SUPABASE_STORAGE_ENDPOINT!;
const SUPABASE_STORAGE_ACCESS_KEY_ID = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!;
const SUPABASE_STORAGE_SECRET_ACCESS_KEY = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!;
const SUPABASE_STORAGE_REGION = process.env.SUPABASE_STORAGE_REGION || 'ap-southeast-1';

const s3Client = new S3Client({
  endpoint: SUPABASE_STORAGE_ENDPOINT,
  region: SUPABASE_STORAGE_REGION,
  forcePathStyle: true, // Required for S3-compatible APIs
  credentials: {
    accessKeyId: SUPABASE_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: SUPABASE_STORAGE_SECRET_ACCESS_KEY,
  },
});

async function listAllBuckets() {
  console.log('📦 Listing all available S3 buckets...\n');

  if (!SUPABASE_STORAGE_ENDPOINT || !SUPABASE_STORAGE_ACCESS_KEY_ID || !SUPABASE_STORAGE_SECRET_ACCESS_KEY) {
    console.log('❌ SUPABASE_STORAGE_ENDPOINT, SUPABASE_STORAGE_ACCESS_KEY_ID, and SUPABASE_STORAGE_SECRET_ACCESS_KEY not set in .env.local');
    return;
  }

  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    if (!response.Buckets || response.Buckets.length === 0) {
      console.log('  📭 No buckets found in this AWS account');
      return;
    }

    console.log(`  Found ${response.Buckets.length} bucket(s):\n`);

    response.Buckets.forEach((bucket, index) => {
      console.log(`  ${index + 1}. ${bucket.Name}`);
      if (bucket.CreationDate) {
        console.log(`     Created: ${bucket.CreationDate.toISOString().split('T')[0]}`);
      }
      console.log();
    });

    console.log('💡 Copy the bucket name you want to use and add it to .env.local:');
    console.log('   S3_BUCKET_NAME=your-bucket-name-here\n');
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (error.message.includes('InvalidAccessKeyId') || error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n   Your Supabase Storage credentials might be incorrect.');
      console.log('   Please check SUPABASE_STORAGE_ACCESS_KEY_ID and SUPABASE_STORAGE_SECRET_ACCESS_KEY in .env.local');
    } else if (error.message.includes('NoCredentialProviders')) {
      console.log('\n   Supabase Storage credentials not found.');
      console.log('   Please add SUPABASE_STORAGE_ENDPOINT, SUPABASE_STORAGE_ACCESS_KEY_ID, and SUPABASE_STORAGE_SECRET_ACCESS_KEY to .env.local');
    } else {
      console.log(`\n   Unexpected error: ${error.message}`);
    }
  }
}

listAllBuckets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

