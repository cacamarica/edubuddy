
import { useState, useRef } from 'react';
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

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'buddy';
  timestamp: Date;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getBuddyResponse = (question: string): string => {
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate thinking
    setTimeout(() => {
      // Add buddy response
      const buddyResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBuddyResponse(inputValue),
        sender: 'buddy',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, buddyResponse]);
      scrollToBottom();
      
      // Show encouragement toast occasionally
      if (Math.random() > 0.7) {
        toast.success("Great question! You earned a star! ⭐", {
          position: "bottom-right",
        });
      }
    }, 1000);
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
            <Button size="sm" variant="ghost" className="ml-auto h-8 text-xs gap-1">
              <Star className="h-3 w-3" />
              <span>Fun Facts</span>
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
              />
              <Button size="icon" onClick={handleSendMessage}>
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
