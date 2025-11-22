# GraphQL Setup Guide

This project uses Supabase's native GraphQL API (pg_graphql) with urql as the client library.

## Prerequisites

1. **Enable pg_graphql Extension**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL script: `scripts/enable-graphql.sql`
   - Verify the extension is enabled

2. **GraphQL Endpoint**
   - Automatically derived from `NEXT_PUBLIC_SUPABASE_URL`
   - Endpoint format: `https://<PROJECT_REF>.supabase.co/graphql/v1`
   - Test in Supabase Dashboard → API → GraphQL tab (GraphiQL interface)

## Environment Variables

The following environment variables are required (already set up):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase API key (used for GraphQL requests)

The GraphQL endpoint is automatically constructed from `NEXT_PUBLIC_SUPABASE_URL` + `/graphql/v1`.

## Architecture

### Server-Side (Server Components & Server Actions)
- Uses `createServerUrqlClient()` from `libs/urqlClient.ts`
- Automatically includes authentication token from Supabase session
- Used in all server actions (`actions/*.ts`)

### Client-Side (Client Components)
- Uses `UrqlProvider` which wraps the app
- Automatically includes authentication token from Supabase session
- Used in components like `LikeButton.tsx`

## GraphQL Operations

### Queries
Located in `graphql/queries/`:
- `songs.graphql` - Song queries (get all, by ID, by user, search by title/artist)
- `likedSongs.graphql` - Liked songs queries

### Mutations
Located in `graphql/mutations/`:
- `songs.graphql` - Song mutations (insert, delete)
- `likedSongs.graphql` - Liked songs mutations (like, unlike)

## Usage Examples

### Server Action (GraphQL Query)
```typescript
import { executeQuery, convertSongsCollectionToSongs } from '@/libs/graphqlHelpers';
import gql from 'graphql-tag';

const GET_SONGS = gql`
  query GetSongs {
    songsCollection(orderBy: [{ created_at: DescNullsLast }]) {
      edges {
        node {
          id
          title
          artist
        }
      }
    }
  }
`;

const data = await executeQuery(GET_SONGS);
const songs = convertSongsCollectionToSongs(data);
```

### Client Component (urql Mutation)
```typescript
import { useMutation } from 'urql';
import gql from 'graphql-tag';

const INSERT_LIKED_SONG = gql`
  mutation InsertLikedSong($userId: UUID!, $songId: BigInt!) {
    insertIntolikedSongsCollection(
      objects: [{ user_id: $userId, song_id: $songId }]
    ) {
      records {
        user_id
        song_id
      }
    }
  }
`;

const [result, insertLike] = useMutation(INSERT_LIKED_SONG);
await insertLike({ userId: user.id, songId: BigInt(songId) });
```

## Important Notes

1. **Authentication**: GraphQL requests automatically include the Supabase JWT token in the Authorization header.

2. **RLS Policies**: Existing Row Level Security policies continue to work with GraphQL API.

3. **Storage**: File uploads/downloads still use Supabase Storage (unchanged).

4. **Type Conversion**: 
   - Song IDs are converted from BigInt (GraphQL) to String (TypeScript)
   - UUIDs are passed as strings

5. **Error Handling**: All GraphQL operations include proper error handling and logging.

## Testing

1. Test queries in Supabase Dashboard → API → GraphQL (GraphiQL)
2. Verify authentication works with GraphQL
3. Test all CRUD operations (create, read, update, delete)
4. Verify file uploads still work (Supabase Storage)

