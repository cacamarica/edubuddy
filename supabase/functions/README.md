# Supabase Edge Functions

This directory contains Edge Functions that run in Supabase's Deno environment.

## Important Note on TypeScript Errors

You may see TypeScript errors in these files because:

1. These functions run in the Deno runtime, which has different imports and globals compared to Node.js
2. The TypeScript compiler in your IDE is configured for the main Node.js project, not for Deno

**These errors are expected and can be safely ignored.** The functions will work correctly when deployed to Supabase.

## Type Declarations

We've added basic type declarations in `deno.d.ts` to help with development, but they're not perfect. Some TypeScript errors are still expected, particularly:

- Errors related to Deno imports with `.ts` extensions
- Errors related to the `Deno` global object
- Type errors with request and response data

## Deployment

To deploy these functions:

```bash
npx supabase functions deploy [function-name]
```

## Function Overview

- `ai-lesson-generator`: Generates educational lessons using OpenAI's API
- `ai-edu-content`: Generates various educational content types (lessons, quizzes, games) using OpenAI's API

Each function is designed to be called from the client-side application through Supabase's function invocation API. 