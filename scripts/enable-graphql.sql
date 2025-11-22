-- Enable pg_graphql extension for Supabase GraphQL API
-- Run this in Supabase Dashboard → SQL Editor

-- Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'pg_graphql';

-- Enable the extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_graphql;

-- Verify the extension is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_graphql';

-- Note: Your GraphQL endpoint will be available at:
-- https://<PROJECT_REF>.supabase.co/graphql/v1
-- You can test it in Supabase Dashboard → API → GraphQL tab

