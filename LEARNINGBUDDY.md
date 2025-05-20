# Learning Buddy Chat Assistant

The Learning Buddy is an AI-powered floating chat assistant that helps students learn across the EduBuddy platform. It adapts to the selected student's grade level and provides formatted, interactive responses.

## Features

- **Floating Chat Interface**: Accessible from any page in the application
- **Minimizable/Maximizable**: Toggle between compact and full-screen views
- **Grade-Level Adaptation**: Customizes responses based on the student's profile
- **Rich Formatting**: Displays responses with headings, lists, and other formatting
- **Interactive**: Maintains conversation history and provides contextual answers

## Setup Instructions

### 1. Get an OpenAI API Key

To use the Learning Buddy feature, you'll need an OpenAI API key:

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (it starts with "sk-")

### 2. Add the API Key to Environment Variables

Create or edit a `.env` file in the root of your project and add:

```
VITE_OPENAI_API_KEY=your_openai_api_key
```

Replace `your_openai_api_key` with the actual key you copied.

### 3. Install Dependencies

Ensure you have all required dependencies:

```bash
npm install framer-motion date-fns openai
```

## Usage

The Learning Buddy is automatically available throughout the application:

- Click the brain icon in the bottom-right corner to open/close the chat
- Use the minimize/maximize buttons to adjust the view
- Type questions in the input field and press Enter or click Send
- The AI will respond with formatted text appropriate for the student's grade level

## Customization

You can customize how the AI responds by modifying the system prompt in `src/contexts/LearningBuddyContext.tsx`. Look for the `systemPrompt` variable to adjust the AI's behavior and formatting.

## Technical Details

The Learning Buddy consists of:

- **LearningBuddyContext**: Global state management for the chat
- **LearningBuddy Component**: UI for the floating chat
- **OpenAI Integration**: Handles communication with OpenAI's API
- **Message Formatting**: Transforms AI responses into rich React components 

## Security Considerations

⚠️ **Important Security Warning:** 

The current implementation uses the OpenAI API directly from the browser with `dangerouslyAllowBrowser: true`. This approach:

1. **Exposes your API key** in the browser environment
2. Is **only suitable for development or demo purposes**
3. **Should not be used in production** without additional security measures

### Recommended Production Approach

For a production environment, implement one of these more secure approaches:

1. **Backend Proxy**: Create a backend API that proxies requests to OpenAI, keeping your API key secure on the server
2. **Edge Functions**: Use serverless functions (like Netlify/Vercel Edge Functions) to handle OpenAI API calls
3. **Environment Restrictions**: If you must use client-side calls, set OpenAI API key restrictions:
   - Limit by domain
   - Set usage limits
   - Create a separate key with minimal permissions

See OpenAI's [best practices for API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety) for more information. 