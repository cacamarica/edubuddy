# EduBuddy

An interactive educational platform built to make learning fun and engaging for students ages 5-15. EduBuddy provides personalized lessons, quizzes, educational games, and an AI learning assistant - all tailored to different grade levels.

**Slogan**: Learning is an Adventure! Built by a Kid, for Kids.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Supabase Integration](#supabase-integration)
- [Authentication](#authentication)
- [Internationalization](#internationalization)
- [AI Features](#ai-features)
- [FAQ](#faq)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## Features

- **Interactive Lessons**: Engaging content with animations, stories, and interactive elements
- **Fun Quizzes**: Colorful quizzes with instant feedback and encouragement
- **AI Learning Buddy**: Get help anytime from an AI learning assistant that explains concepts in simple terms
- **Personalized Dashboard**: Track progress, view completed lessons, and see areas needing help
- **Student Profiles**: Create and manage multiple student profiles for different users
- **Bilingual Support**: Toggle between English and Bahasa Indonesia
- **Grade-Level Content**: Content tailored for different grade levels (K-3, 4-6, 7-9)

## Technologies Used

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui (based on Radix UI)
- **Styling**: Tailwind CSS
- **Backend/Authentication**: Supabase
- **State Management**: React Context API
- **API Handling**: Tanstack React Query
- **Routing**: React Router DOM
- **Form Validation**: React Hook Form with Zod
- **Notifications**: Sonner Toast

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or later)
- npm or yarn
- A Supabase account and project (for authentication and backend services)

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd edubuddy
   ```

2. Install dependencies:
   ```sh
   npm install
   # OR
   yarn install
   ```

3. Start the development server:
   ```sh
   npm run dev
   # OR
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:8080`

### Environment Variables

The project uses Supabase for authentication and as a backend. The Supabase URL and anon key are configured in `src/integrations/supabase/client.ts`. 

For production environments, it's recommended to create a `.env` file with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

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

### AILesson
Provides interactive lesson content with chapters, images, and activities.

### AIQuiz
Offers quizzes with multiple-choice questions and immediate feedback.

### AIGame
Educational games that reinforce learning concepts in a fun way.

### LearningBuddy
An AI assistant that can answer questions and provide explanations.

### StudentProfile
Manages student profiles with grade levels and progress tracking.

## Supabase Integration

EduBuddy uses Supabase for:
- User authentication
- Storing and retrieving lesson progress
- Saving student profiles
- Serverless functions for AI content generation

## Authentication

Authentication is handled through the `AuthContext` provider, which uses Supabase Auth for:
- Email/password authentication
- Session management
- Protected routes

Example of protecting a route:
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Internationalization

The application supports English and Bahasa Indonesia through the `LanguageContext`. Use the `t` function to translate text:

```tsx
const { t, language } = useLanguage();

// Usage
<Button>{t('auth.signIn')}</Button>
```

## AI Features

EduBuddy uses AI to generate:
- Educational content for lessons
- Quiz questions based on topics
- Educational games
- Answers to student questions via the Learning Buddy

These features are implemented through Supabase Edge Functions that interact with AI services.

## FAQ

**Q: Do I need a Supabase account to run this project?**  
A: Yes, you need a Supabase project to handle authentication and data storage.

**Q: How do I deploy the Supabase Edge Functions?**  
A: Use the Supabase CLI to deploy the functions in the `/supabase/functions` directory.

**Q: How can I add more languages?**  
A: Extend the translations object in `LanguageContext.tsx` and add the new language option.

**Q: Is there a mobile app version?**  
A: Currently, EduBuddy is a responsive web application that works on all devices.

**Q: How does the AI content generation work?**  
A: The application uses Supabase Edge Functions to communicate with AI services to generate educational content based on the selected grade level, subject, and topic.

**Q: Can I use the platform without logging in?**  
A: Yes, but non-authenticated users can only access about 30% of the content. Full access requires signing in.

**Q: How do I create multiple student profiles?**  
A: After signing in, go to the Dashboard and click on "Manage Student Profiles" to add, edit, or remove student profiles.

## Development Guide

### Adding a New Feature

1. Plan the feature and how it integrates with existing components
2. Create any necessary database tables in Supabase
3. Add React components and services
4. Update relevant contexts if needed
5. Add routes if adding new pages
6. Add translations for all text

### Code Style

- Use TypeScript for type safety
- Follow React hooks best practices
- Use shadcn-ui components for consistent UI
- Implement responsive design with Tailwind CSS
- Add proper documentation for functions and components

### Working with Supabase

1. Create necessary tables in Supabase dashboard
2. Update type definitions in `src/integrations/supabase/types.ts`
3. Use the supabase client for database operations:

```tsx
import { supabase } from '@/integrations/supabase/client';

// Query example
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);
```

## Troubleshooting

**Issue: Authentication not working**
- Check if Supabase URL and anon key are correct
- Verify that email confirmations are properly configured in Supabase dashboard

**Issue: Content not loading**
- Check browser console for errors
- Verify Supabase edge functions are deployed correctly
- Check network requests for API failures

**Issue: Language switching not working**
- Clear localStorage and refresh the page
- Check if the language context is properly provided at the root level

**Issue: AI generation taking too long**
- Supabase edge functions have execution time limits. Make sure your functions complete within the allocated time
- Check if AI service API keys and credentials are valid

**Issue: Missing UI components**
- Run `npm install` to ensure all dependencies are installed
- Check for CSS class conflicts with Tailwind utilities
