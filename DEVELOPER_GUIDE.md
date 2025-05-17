# EduBuddy Developer Documentation

This document provides technical details and guidance for developers working on the EduBuddy codebase.

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Setup](#project-setup)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [Key Components](#key-components)
6. [State Management](#state-management)
7. [Authentication Flow](#authentication-flow)
8. [Internationalization](#internationalization)
9. [Supabase Integration](#supabase-integration)
10. [AI Services](#ai-services)
11. [Component Libraries](#component-libraries)
12. [Adding New Features](#adding-new-features)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Error Handling and ErrorBoundary](#error-handling-and-errorboundary)
16. [Common Issues](#common-issues)

## Technology Stack

### Frontend
- **React**: UI library for building components
- **TypeScript**: For type safety and better developer experience
- **Vite**: Build tool for fast development and optimized production builds
- **React Router DOM**: For client-side routing
- **React Query**: Data fetching and caching library
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation library
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI and Tailwind

### Backend/Services
- **Supabase**: Backend-as-a-Service for authentication and database
- **Supabase Edge Functions**: Serverless functions for AI content generation

## Project Setup

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd edubuddy

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup
Create a `.env` file in the project root with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Process
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

EduBuddy follows a modern React application architecture:

1. **Component-Based Structure**: UI elements are broken down into reusable components
2. **Context API for State Management**: Global state like authentication and language preferences
3. **API Services Layer**: Abstraction for backend interactions
4. **Route-Based Code Organization**: Components organized by their corresponding routes
5. **Feature-Based Organization**: Components grouped by features (Lessons, Quizzes, etc.)

## Folder Structure

```
src/
├── App.tsx              # Main application component with routes
├── main.tsx            # Application entry point
├── components/         # UI components
│   ├── ui/             # shadcn UI components
│   ├── AILesson.tsx    # Lesson component
│   ├── AIQuiz.tsx      # Quiz component
│   ├── AIGame.tsx      # Educational game component  
│   ├── LearningBuddy.tsx # AI assistant component
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication context
│   └── LanguageContext.tsx # Internationalization context
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Dashboard.tsx   # User dashboard
│   ├── Lessons.tsx     # Lessons listing page
│   └── ...
├── services/           # API services
│   ├── aiEducationService.ts # AI content generation service
│   ├── lessonService.ts      # Lesson management service
│   └── ...
└── types/              # TypeScript type definitions
```

## Key Components

### AILesson Component
```tsx
// Used to display interactive lesson content
<AILesson 
  subject="Math" 
  topic="Multiplication" 
  gradeLevel="k-3" 
  onComplete={() => {}} 
  limitProgress={false}
  studentId="student-id-123"
/>
```

### AIQuiz Component
```tsx
// Used to display quiz questions
<AIQuiz 
  subject="Science" 
  topic="Plants" 
  gradeLevel="4-6" 
  questionCount={5} 
  onComplete={() => {}} 
  studentId="student-id-123"
/>
```

### LearningBuddy Component
```tsx
// AI assistant that answers questions
<LearningBuddy 
  studentId="student-id-123" 
  defaultOpen={false}
/>
```

### StudentProfile Component
```tsx
// Manages student profiles
<StudentProfile 
  onStudentChange={(student) => {}} 
  currentStudentId="student-id-123" 
/>
```

## State Management

### Authentication Context
The `AuthContext` provides authentication state and methods throughout the application:

```tsx
const { user, session, signIn, signUp, signOut, loading, isAuthReady } = useAuth();

// Example usage for protected routes
if (!user) {
  return <Navigate to="/auth" replace />;
}
```

### Language Context
The `LanguageContext` manages language preferences and translations:

```tsx
const { language, setLanguage, t } = useLanguage();

// Example usage for translations
<Button>{t('auth.signIn')}</Button>
```

## Authentication Flow

1. **Registration**:
   - User submits sign-up form with email, password and full name
   - Data is sent to Supabase Auth
   - User is automatically signed in after successful registration

2. **Sign In**:
   - User enters email and password
   - Credentials are verified through Supabase Auth
   - On success, a session is created and stored in localStorage

3. **Session Management**:
   - Auth state listener (`onAuthStateChange`) updates React state
   - Sessions are automatically refreshed by Supabase client
   - Session state is maintained across page reloads

4. **Sign Out**:
   - User clicks sign out
   - Supabase Auth clears the session
   - User is redirected to public pages

## Internationalization

The application supports multiple languages through the `LanguageContext`.

### Adding a New Translation
1. Add the translation strings to both language objects in `LanguageContext.tsx`:

```tsx
const translations = {
  en: {
    'key.newString': 'New string in English',
    // ...existing translations
  },
  id: {
    'key.newString': 'Terjemahan baru dalam Bahasa Indonesia',
    // ...existing translations
  }
};
```

2. Use the translation in components:

```tsx
const { t } = useLanguage();
// ...
<p>{t('key.newString')}</p>
```

## Supabase Integration

### Client Setup
The Supabase client is initialized in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "your-supabase-url";
const SUPABASE_PUBLISHABLE_KEY = "your-supabase-anon-key";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Database Operations
Example of querying data:

```typescript
// Fetch student profiles
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('parent_id', user.id);
```

### Edge Functions
Supabase Edge Functions are used for AI content generation:

```typescript
// Call the AI lesson generator edge function
const { data, error } = await supabase.functions.invoke('ai-lesson-generator', {
  body: {
    contentType: 'lesson',
    subject: 'Math',
    gradeLevel: 'k-3',
    topic: 'Addition',
    language: 'en'
  }
});
```

## AI Services

The application uses AI services through Supabase Edge Functions for:

1. **Content Generation**: Creating lesson content, quiz questions, etc.
2. **Learning Buddy**: Answering student questions

### AI Service Architecture
1. Frontend sends a request to a Supabase Edge Function
2. Edge Function processes the request and calls an external AI service
3. AI generates the content and returns it to the Edge Function
4. Edge Function formats the content and returns it to the frontend
5. Frontend renders the content to the user

### aiEducationService.ts
This service manages all AI content requests:

```typescript
export async function getAIEducationContent({
  contentType, // 'lesson' | 'quiz' | 'game' | 'buddy'
  subject,
  gradeLevel,
  topic,
  question,
  includeImages = true,
  language = 'en'
}) {
  // Call Supabase Edge Function and process response
}
```

## Component Libraries

EduBuddy uses shadcn/ui components built on Radix UI and Tailwind CSS:

### UI Components
- Buttons, cards, dialogs, forms, etc.
- Located in `src/components/ui/`
- Customized with Tailwind utility classes

### Custom Components
- Built on top of shadcn/ui components
- Located in the main components directory
- Examples: AILesson, AIQuiz, LearningBuddy, etc.

## Adding New Features

### Creating a New Page
1. Create a new TSX file in `src/pages/`
2. Add the component to the routes in `App.tsx`

Example:
```tsx
// Add to App.tsx
<Route path="/new-feature" element={<NewFeature />} />
```

### Creating a New Component
1. Create a new TSX file in `src/components/`
2. Import and use in appropriate pages/components

### Adding a New Service
1. Create a new TS file in `src/services/`
2. Export functions that handle specific API or data concerns

## Testing

No formal testing framework is currently set up, but can be added:

### Recommended Testing Setup
- Jest for unit and integration testing
- React Testing Library for component testing
- Cypress for E2E testing

## Deployment

### Build Process
```bash
# Production build
npm run build

# The build output will be in the 'dist' directory
```

### Deployment Options
- Static hosting services (Netlify, Vercel, etc.)
- Self-hosted solution with a web server

## Common Issues

### Authentication Issues
- Check if Supabase URL and anon key are correct
- Verify that email confirmations are properly configured in Supabase dashboard

### Content Loading Issues
- Check browser console for errors
- Verify Supabase edge functions are deployed correctly
- Check network requests for API failures

### Edge Function Timeouts
- Supabase edge functions have execution time limits
- Optimize functions to complete within the allocated time
- Consider breaking complex operations into multiple functions

### Frontend Console Errors

#### CORS Policy Errors with Cloudflare Insights
- The Cloudflare Insights script may be blocked by CORS policy when the app is deployed
- These errors come from the hosting platform and not from our local code
- If these errors cause problems, you can add a Content Security Policy (CSP) header to your hosting configuration
- Example CSP: `connect-src 'self' https://cloudflareinsights.com;`

#### jQuery Migrate Warnings
- jQuery Migrate warnings may appear in the console
- These warnings typically come from third-party scripts or the hosting platform
- They are informational and do not impact application functionality

#### Runtime Message Port Errors
- Messages like "Could not establish connection. Receiving end does not exist" are often related to browser extensions
- These errors do not affect the application and can be safely ignored

#### Select.Item Component Errors
- Make sure all `SelectItem` components have a non-empty value prop
- Empty string values (`value=""`) can cause rendering issues or React warnings
- Always use a meaningful value (or "all" for showing all items) instead of an empty string

## Error Handling and ErrorBoundary

### ErrorBoundary Pattern

We've implemented the ErrorBoundary pattern to gracefully handle runtime errors in React components. This prevents the entire application from crashing when a component fails to render.

#### Using the ErrorBoundary

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a fallback UI component
const ComponentFallback = ({ onRetry }) => (
  <div>
    <h3>Something went wrong</h3>
    <p>Could not load the component</p>
    <button onClick={onRetry}>Try Again</button>
  </div>
);

// Wrap your component with ErrorBoundary
<ErrorBoundary fallback={<ComponentFallback onRetry={() => {/* retry logic */}} />}>
  <YourComponent />
</ErrorBoundary>
```

#### Best Practices

1. **Wrap complex components**: Add ErrorBoundary around complex or data-dependent components, especially when they rely on external services.

2. **Provide helpful fallbacks**: Design fallback UIs that inform users about the error and offer recovery options.

3. **Wrap at appropriate levels**: Don't wrap the entire app in a single ErrorBoundary. Use multiple boundaries at appropriate component levels to isolate failures.

4. **Log errors**: The ErrorBoundary logs errors to the console, but you might want to send them to an error tracking service for production monitoring.

5. **Consider key props for reset**: When you need to force a remount of a component that previously errored, you can use a key prop with a new value.
