# OpenAI Proxy Server Setup

This guide explains how to set up and use the secure OpenAI proxy server for the Learning Buddy feature. This approach is recommended for production environments to keep your API keys secure.

## Why Use a Proxy Server?

The OpenAI JavaScript library displays the following error when used directly in a browser:

```
Uncaught OpenAIError: It looks like you're running in a browser-like environment.

This is disabled by default, as it risks exposing your secret API credentials to attackers.
If you understand the risks and have appropriate mitigations in place,
you can set the `dangerouslyAllowBrowser` option to `true`
```

While we've implemented a temporary solution using `dangerouslyAllowBrowser: true`, this is **not recommended for production** because it exposes your API keys.

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install express cors openai dotenv
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

### 3. Start the Proxy Server

Run the proxy server using the provided npm script:

```bash
npm run openai-proxy
```

The server will start on port 3001 (or whatever port you've specified in your `.env` file).

### 4. Connect Your Frontend

The Learning Buddy feature is already configured to try connecting to the proxy server first. The priority order is:

1. Local proxy server (`http://localhost:3001/api/openai/chat`)
2. Next.js API route (`/api/openai/chat`)
3. Direct OpenAI API call (only as fallback)

## Deploying the Proxy Server

For production environments, deploy the proxy server to a secure hosting environment:

1. Set up the proxy server on your hosting provider
2. Update the proxy endpoint URL in `src/contexts/LearningBuddyContext.tsx` to point to your deployed server
3. Ensure your API keys are securely stored as environment variables on your server

## Security Considerations

- Never commit your API keys to version control
- Set domain restrictions on your OpenAI API key
- Use rate limiting to prevent abuse
- Consider implementing user authentication for the proxy server

For more information, refer to OpenAI's [best practices for API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety). 