import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, userId, studentId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Log request for debugging (can be removed in production)
    console.log(`Processing chat request for user: ${userId || 'anonymous'}, student: ${studentId || 'unknown'}`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as any, // Type assertion to match OpenAI's expected format
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract and return the response
    const responseContent = completion.choices[0]?.message?.content || '';

    // Return formatted response
    return res.status(200).json({
      content: responseContent,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    return res.status(500).json({
      error: 'Error processing your request',
      details: error.message
    });
  }
} 