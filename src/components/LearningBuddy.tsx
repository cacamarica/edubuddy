
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Award, Star, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'buddy';
  timestamp: Date;
}

// Static responses for when not using AI
const BUDDY_RESPONSES = {
  general: [
    "That's a great question! Let me help you with that.",
    "I'm happy to explain this to you!",
    "Let's figure this out together!",
    "Great job asking questions!",
  ],
  math: [
    "Math is all about patterns and solving puzzles!",
    "Remember, in addition we combine numbers, and in subtraction we take away.",
    "Multiplication is like adding a number multiple times!",
    "Fractions represent parts of a whole. Think of slices of pizza!",
  ],
  english: [
    "Reading is like going on an adventure through words!",
    "Nouns are people, places, or things. Like 'teacher', 'school', or 'book'.",
    "Verbs are action words, like 'run', 'jump', or 'read'.",
    "Adjectives describe things, like 'blue', 'happy', or 'tasty'.",
  ],
  science: [
    "Scientists observe the world and ask lots of questions!",
    "Plants need sunlight, water, and air to grow.",
    "All matter is made up of tiny particles called atoms.",
    "The water cycle is how water moves around our planet.",
  ],
  encouragement: [
    "You're doing great! Keep it up!",
    "Don't worry if you don't get it right away. Learning takes time!",
    "That's a smart way of thinking about it!",
    "I believe in you! You can figure this out!",
  ],
};

const LearningBuddy = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your Learning Buddy. How can I help you today?",
      sender: 'buddy',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store messages in localStorage
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the intro message
      localStorage.setItem('learningBuddy_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('learningBuddy_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const processedMessages = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(processedMessages);
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, []);

  const getBuddyResponse = async (question: string): Promise<string> => {
    // If AI is not enabled or there's an error, fall back to static responses
    if (!isAIEnabled) {
      return getStaticResponse(question);
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-edu-content', {
        body: {
          contentType: 'buddy',
          subject: 'general',
          gradeLevel: 'k-3', // Default to younger students for simpler language
          topic: question
        }
      });
      
      if (error) throw error;
      
      setIsLoading(false);
      
      // Extract response from AI
      const response = data?.content?.response || data?.content;
      
      if (typeof response === 'string') {
        return response;
      }
      
      // Fallback in case the AI format is unexpected
      return "I'm here to help! What would you like to know about?";
    } catch (error) {
      console.error('Error getting AI buddy response:', error);
      setIsLoading(false);
      
      // Fall back to static responses if AI fails
      return getStaticResponse(question);
    }
  };

  const getStaticResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Match question to categories
    if (lowerQuestion.includes('math') || 
        lowerQuestion.includes('add') || 
        lowerQuestion.includes('subtract') || 
        lowerQuestion.includes('multiply') || 
        lowerQuestion.includes('number')) {
      return BUDDY_RESPONSES.math[Math.floor(Math.random() * BUDDY_RESPONSES.math.length)];
    } else if (lowerQuestion.includes('english') || 
               lowerQuestion.includes('read') || 
               lowerQuestion.includes('write') || 
               lowerQuestion.includes('word') || 
               lowerQuestion.includes('book')) {
      return BUDDY_RESPONSES.english[Math.floor(Math.random() * BUDDY_RESPONSES.english.length)];
    } else if (lowerQuestion.includes('science') || 
               lowerQuestion.includes('plant') || 
               lowerQuestion.includes('animal') || 
               lowerQuestion.includes('earth') || 
               lowerQuestion.includes('water')) {
      return BUDDY_RESPONSES.science[Math.floor(Math.random() * BUDDY_RESPONSES.science.length)];
    } else if (lowerQuestion.includes('help') || 
               lowerQuestion.includes('don\'t understand') || 
               lowerQuestion.includes('confused') || 
               lowerQuestion.includes('difficult')) {
      return BUDDY_RESPONSES.encouragement[Math.floor(Math.random() * BUDDY_RESPONSES.encouragement.length)];
    } else {
      return BUDDY_RESPONSES.general[Math.floor(Math.random() * BUDDY_RESPONSES.general.length)];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get AI or static response
      const response = await getBuddyResponse(userMessage.text);
      
      // Add buddy response
      const buddyResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'buddy',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, buddyResponse]);
      
      // Show encouragement toast occasionally
      if (Math.random() > 0.7) {
        toast.success("Great question! You earned a star! ⭐", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error('Error in buddy response:', error);
      // Add fallback response if there's an error
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble thinking right now. Can you ask me something else?",
        sender: 'buddy',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg bg-eduPurple hover:bg-eduPurple-dark"
          size="icon"
        >
          {isOpen ? <HelpCircle className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" alignOffset={-20}>
        <div className="flex flex-col h-96">
          {/* Header */}
          <div className="bg-eduPurple text-white px-4 py-3 flex items-center gap-3 rounded-t-lg">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src="https://api.dicebear.com/7.x/adventurer/svg?seed=buddy" alt="Learning Buddy" />
              <AvatarFallback>LB</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Learning Buddy</h3>
              <p className="text-xs text-white/80">Always here to help!</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-auto h-8 text-xs gap-1 text-white"
              onClick={() => setIsAIEnabled(!isAIEnabled)}
            >
              <Star className="h-3 w-3" />
              <span>{isAIEnabled ? 'AI On' : 'AI Off'}</span>
            </Button>
          </div>
          
          {/* Messages */}
          <div className="flex-grow p-3 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-eduPurple text-white'
                        : 'bg-eduPastel-purple text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-3 py-2 bg-eduPastel-purple text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce h-2 w-2 bg-eduPurple rounded-full"></div>
                      <div className="animate-bounce h-2 w-2 bg-eduPurple rounded-full" style={{ animationDelay: '0.2s' }}></div>
                      <div className="animate-bounce h-2 w-2 bg-eduPurple rounded-full" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-1 text-xs text-center text-muted-foreground">
              <p>I can help explain things in a simple way!</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LearningBuddy;
