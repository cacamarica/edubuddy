/**
 * OpenAI API Proxy Server
 * 
 * This server acts as a secure proxy for OpenAI API calls, keeping your API key secure.
 * To use in production instead of client-side calls with dangerouslyAllowBrowser.
 */

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Proxy endpoint for chat completions
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, userId, studentId } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Log request for debugging (can be removed in production)
    console.log(`Processing chat request for user: ${userId || 'anonymous'}, student: ${studentId || 'unknown'}`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Return formatted response
    return res.status(200).json({
      content: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return res.status(500).json({
      error: 'Error processing your request',
      details: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OpenAI Proxy Server running on port ${PORT}`);
});

/**
 * To use this server:
 * 1. Install dependencies: npm install express cors openai dotenv
 * 2. Create a .env file with OPENAI_API_KEY=your_api_key
 * 3. Run the server: node server/openai-proxy.js
 * 4. Update your frontend code to point to this proxy endpoint
 */ 