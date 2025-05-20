import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useStudentProfile } from './StudentProfileContext';
import { useAuth } from './AuthContext';
import { handleChatRequest } from '@/api/openai';
import { useLanguage } from '@/contexts/LanguageContext';

// Define the message type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  // For formatted responses
  formattedContent?: React.ReactNode;
}

// Context interface
interface LearningBuddyContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  toggleOpen: () => void;
  toggleExpanded: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

// Create the context
const LearningBuddyContext = createContext<LearningBuddyContextType | undefined>(undefined);

// Provider component
export const LearningBuddyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedProfile } = useStudentProfile();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  // Send a welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Create initial welcome message
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Hello! I'm your Learning Buddy. ${selectedProfile?.gradeLevel ? `I'm here to help with your ${selectedProfile.gradeLevel} level studies.` : 'I can help you learn new things!'} What would you like to learn about today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, selectedProfile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generate unique ID for messages
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Format messages with rich content
  const formatMessage = (content: string): React.ReactNode => {
    // This is a simple example - we could make this much more sophisticated
    // with markdown parsing or custom formatting

    // Split content on new lines and format sections
    const lines = content.split('\n');
    return (
      <>
        {lines.map((line, i) => {
          // Format headings
          if (line.startsWith('# ')) {
            return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.substring(2)}</h3>;
          }
          // Format subheadings
          if (line.startsWith('## ')) {
            return <h4 key={i} className="text-md font-bold mt-2 mb-1">{line.substring(3)}</h4>;
          }
          // Format lists
          if (line.startsWith('- ')) {
            return (
              <div key={i} className="flex items-start gap-2 my-1">
                <div className="rounded-full bg-eduPurple/10 h-5 w-5 flex items-center justify-center mt-0.5">
                  <div className="rounded-full bg-eduPurple h-1.5 w-1.5" />
                </div>
                <div>{line.substring(2)}</div>
              </div>
            );
          }
          // Handle empty lines
          if (line === '') {
            return <div key={i} className="h-2" />;
          }
          // Default paragraph
          return <p key={i} className="my-1">{line}</p>;
        })}
      </>
    );
  };

  // Send message to OpenAI
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Check if the user has provided an API key
    const apiKey = localStorage.getItem('edu_buddy_openai_api_key');
    if (!apiKey) {
      // Add error message about missing API key
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: language === 'id' 
          ? "Maaf, Anda perlu menambahkan kunci API OpenAI Anda untuk menggunakan Learning Buddy. Silakan klik ikon pengaturan untuk menambahkannya."
          : "Sorry, you need to add your OpenAI API key to use the Learning Buddy. Please click the settings icon to add it.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Construct prompt based on student profile
      const studentLevel = selectedProfile?.gradeLevel || 'elementary';
      const studentName = selectedProfile?.name || 'the student';
      const studentAge = selectedProfile?.age || 'appropriate';

      // Basic system prompt template that tells the AI to act as a teacher
      const systemPrompt = `You are a helpful and encouraging learning assistant for ${studentName}, a ${studentLevel} level student around ${studentAge} years old. 
      Respond in a way that is educational, clear, and appropriate for their grade level.
      Format your responses with appropriate structure using:
      - Headings with #
      - Subheadings with ##
      - Lists with -
      - Short, clear paragraphs
      - Occasional emojis for engagement 🔍 📚 ✏️
      - Simple explanations of complex topics
      
      Keep answers concise but comprehensive. Be enthusiastic and supportive!`;

      // Create the conversation history for context
      const conversation = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add the system message at the beginning
      conversation.unshift({
        role: 'system',
        content: systemPrompt
      });

      // Add the new user message
      conversation.push({
        role: 'user',
        content: message
      });

      let data;
      const requestPayload = {
        messages: conversation,
        userId: user?.id,
        studentId: selectedProfile?.id,
      };

      // Define different endpoint options - try secure options first
      const endpoints = [
        // 1. Try production secure proxy endpoint (if running)
        'http://localhost:3001/api/openai/chat',
        // 2. Try Next.js API route (if available)
        '/api/openai/chat',
        // 3. Fallback to direct API call (not recommended for production)
        null // null indicates we should use the direct API call
      ];

      let success = false;
      let lastError: any = null;

      // Try each endpoint in order until one succeeds
      for (const endpoint of endpoints) {
        if (success) break;
        
        try {
          if (endpoint) {
            // Try using a server endpoint
            console.log(`Attempting to use endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
              throw new Error(`Endpoint ${endpoint} returned status ${response.status}`);
            }

            data = await response.json();
            success = true;
          } else {
            // Fall back to direct API call
            console.log('Falling back to direct OpenAI call');
            data = await handleChatRequest(
              conversation, 
              user?.id, 
              selectedProfile?.id
            );
            success = true;
          }
        } catch (error: any) {
          console.warn(`Error with endpoint ${endpoint}:`, error);
          lastError = error;
          // Continue to next endpoint
        }
      }

      if (!success) {
        throw lastError || new Error('All API endpoints failed');
      }
      
      // Create the AI response message
      const aiResponse: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.content || "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
        formattedContent: formatMessage(data.content)
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('Error sending message to OpenAI:', error);
      
      // Determine if this is an API key issue
      const isApiKeyError = error.message && (
        error.message.includes('API key') || 
        error.message.includes('authentication') || 
        error.message.includes('401')
      );
      
      // Add appropriate error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: isApiKeyError
          ? (language === 'id'
              ? "Ada masalah dengan kunci API OpenAI Anda. Silakan periksa bahwa kunci tersebut valid dan belum kedaluwarsa."
              : "There's an issue with your OpenAI API key. Please check that it's valid and hasn't expired.")
          : (language === 'id'
              ? "Maaf, saya mengalami kesulitan terhubung ke basis pengetahuan saya. Silakan coba lagi nanti."
              : "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again later."),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Toggle chat open/closed
  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setIsExpanded(false);
    }
  };

  // Toggle expanded/collapsed
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <LearningBuddyContext.Provider
      value={{
        messages,
        isOpen,
        isExpanded,
        isLoading,
        toggleOpen,
        toggleExpanded,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
      <div ref={messagesEndRef} />
    </LearningBuddyContext.Provider>
  );
};

// Custom hook to use the Learning Buddy context
export const useLearningBuddy = () => {
  const context = useContext(LearningBuddyContext);
  if (context === undefined) {
    throw new Error('useLearningBuddy must be used within a LearningBuddyProvider');
  }
  return context;
}; 