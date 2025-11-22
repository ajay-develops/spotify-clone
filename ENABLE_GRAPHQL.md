# Enable Supabase GraphQL API

The error "[Network] Not Found" indicates that the GraphQL endpoint is not available. This means the `pg_graphql` extension needs to be enabled in your Supabase project.

## Quick Fix

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **SQL Editor** in the left sidebar

2. **Run this SQL command:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_graphql;
   ```

3. **Verify the extension is enabled:**
   ```sql
   SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_graphql';
   ```
   You should see a row with `extname = 'pg_graphql'`

4. **Test the GraphQL endpoint:**
   - Go to **API** → **GraphQL** tab in Supabase Dashboard
   - You should see a GraphiQL interface
   - Try running a simple query:
   ```graphql
   query {
     songsCollection(first: 1) {
       edges {
         node {
           id
           title
         }
       }
     }
   }
   ```

## Alternative: Use the SQL Script

You can also run the provided SQL script:

1. Open `scripts/enable-graphql.sql` in your project
2. Copy the contents
3. Paste into Supabase Dashboard → SQL Editor
4. Click "Run"

## After Enabling

Once the extension is enabled:
- The GraphQL endpoint will be available at: `https://<YOUR_PROJECT_REF>.supabase.co/graphql/v1`
- Your Next.js app will automatically use it
- Refresh your browser and the error should be resolved

## Troubleshooting

If you still see errors after enabling:

1. **Check your Supabase URL:**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` is correct
   - Format should be: `https://<project-ref>.supabase.co`

2. **Check API Key:**
   - Verify `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is set correctly
   - This is your "anon" or "public" key from Supabase Dashboard → Settings → API

3. **Check Supabase Project Status:**
   - Make sure your Supabase project is active and not paused
   - Check that you have the correct project selected

4. **View Console Logs:**
   - Check the browser console and server logs
   - The GraphQL endpoint URL will be logged for debugging

