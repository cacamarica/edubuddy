import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, ChevronUp, ChevronDown, Send, Loader2, Trash, BookOpen, Link, ClipboardList, BookMarked, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLearningBuddy, ChatMessage } from '@/contexts/LearningBuddyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Key for storing the API key in localStorage - must match the one in LearningBuddySettings
const API_KEY_STORAGE_KEY = 'edu_buddy_openai_api_key';

interface InfoBoardContent {
  title: string;
  content: string;
  references?: Array<{
    title: string;
    author?: string;
    url?: string;
    year?: string;
  }>;
  summary?: string;
  keyConcepts?: string[];
}

const LearningBuddy: React.FC = () => {
  const { 
    messages, 
    isOpen, 
    isExpanded, 
    isLoading, 
    toggleOpen, 
    toggleExpanded, 
    sendMessage, 
    clearMessages 
  } = useLearningBuddy();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedProfile } = useStudentProfile();
  const [inputValue, setInputValue] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true); // Always assume we have API key
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Disable the info mode since we're now showing that in the lesson
  const [infoMode, setInfoMode] = useState<'chat'>('chat');
  
  // Detect screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Update screen size detection on mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Set default API key if not already set
  useEffect(() => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
      // Set the provided API key
      const providedKey = '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';
      localStorage.setItem(API_KEY_STORAGE_KEY, providedKey);
      // Trigger a storage event so other components know the API key has changed
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  // Focus input when chat opens or expands
  useEffect(() => {
    if ((isOpen || isExpanded) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isExpanded]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  // We're removing the automated info board since we now handle that in the lesson
  // This function is kept in case we need similar functionality in the future
  const suggestRelatedQuestions = (messageContent: string) => {
    // Extract potential topics from the message
    const topics = messageContent.match(/\b\w{5,}\b/g) || [];
    
    // Generate related questions based on identified topics
    const relatedQuestions = topics
      .filter(topic => topic.length > 5) // Only use significant words
      .slice(0, 3) // Limit to 3 topics
      .map(topic => `Tell me more about ${topic}?`);
      
    return relatedQuestions;
  };

  // Format timestamp for message display
  const formatTimestamp = (timestamp: Date): string => {
    return format(timestamp, 'HH:mm');
  };

  // Determine appropriate avatar for message sender
  const getMessageAvatar = (message: ChatMessage) => {
    if (message.role === 'user') {
      return (
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
          <AvatarFallback className="bg-muted text-xs">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
          <AvatarImage src="/ai-avatar.png" />
          <AvatarFallback className="bg-eduPurple/20">
            <Brain className="h-4 w-4 text-eduPurple" />
          </AvatarFallback>
        </Avatar>
      );
    }
  };
  
  // If not logged in, don't display the learning buddy
  if (!user) return null;

  return (
    <>
      {/* Chat bubble button (only visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-4 right-4 z-40 h-12 w-12 sm:h-14 sm:w-14 bg-eduPurple hover:bg-eduPurple-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          aria-label={language === 'id' ? 'Buka Asisten Belajar' : 'Open Learning Buddy'}
        >
          <Brain className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      )}
      
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-40 shadow-xl bg-background border rounded-lg overflow-hidden flex flex-col ${
              isExpanded
                ? 'sm:top-[calc(50%-250px)] sm:left-[calc(50%-350px)] sm:w-[700px] sm:h-[500px] top-5 left-5 right-5 bottom-5'
                : 'bottom-4 right-4 w-[320px] sm:w-[350px] h-[450px] sm:h-[500px]'
            }`}
            style={{ 
              transition: 'width 0.2s, height 0.2s, top 0.2s, left 0.2s, right 0.2s, bottom 0.2s',
              maxHeight: isExpanded ? '90vh' : 'none',
              minHeight: '300px'
            }}
          >
            {/* Header */}
            <div className="py-2 sm:py-3 px-3 sm:px-4 border-b bg-eduPurple/5 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-eduPurple/10 p-1.5 rounded-md flex-shrink-0">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-eduPurple" />
                </div>
                <h3 className="font-semibold text-eduPurple-dark text-sm sm:text-base truncate">
                  {language === 'id' ? 'Asisten Belajar' : 'Learning Buddy'}
                </h3>
                {selectedProfile && (
                  <div className="text-xs bg-eduPurple/10 px-2 py-0.5 rounded-full text-eduPurple hidden sm:block">
                    {selectedProfile.gradeLevel}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full"
                    onClick={clearMessages}
                    title={language === 'id' ? 'Bersihkan Percakapan' : 'Clear Conversation'}
                  >
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full"
                    onClick={toggleExpanded}
                    title={isExpanded 
                      ? (language === 'id' ? 'Perkecil' : 'Minimize') 
                      : (language === 'id' ? 'Perbesar' : 'Maximize')}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full"
                  onClick={toggleOpen}
                  title={language === 'id' ? 'Tutup' : 'Close'}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            
            {/* Main content: Chat interface */}
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center p-4">
                    <Brain className="h-8 w-8 mb-2 text-eduPurple/30" />
                    <p className="text-sm mb-2">{language === 'id' ? 'Hai! Saya Asisten Belajar Anda' : 'Hi! I\'m your Learning Buddy'}</p>
                    <p className="text-xs mb-4">{language === 'id' ? 'Tanyakan tentang pelajaran Anda' : 'Ask me about your lessons'}</p>
                    <div className="max-w-xs mx-auto text-xs bg-eduPurple/5 p-3 rounded-md">
                      <p className="font-medium text-eduPurple mb-1">Suggested questions:</p>
                      <ul className="space-y-2 mt-2">
                        <li>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full justify-start text-left text-xs h-auto py-1"
                            onClick={() => sendMessage("Can you help me understand this topic better?")}
                          >
                            Can you help me understand this topic better?
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full justify-start text-left text-xs h-auto py-1"
                            onClick={() => sendMessage("What are the most important things to remember about this subject?")}
                          >
                            What are the most important things to remember?
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full justify-start text-left text-xs h-auto py-1"
                            onClick={() => sendMessage("How can I apply what I'm learning to real life?")}
                          >
                            How can I apply this to real life?
                          </Button>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2 sm:gap-3`}
                    >
                      {message.role !== 'user' && getMessageAvatar(message)}
                      <div 
                        className={`rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%] space-y-1 ${
                          message.role === 'user' ? 'bg-eduPurple text-white' : 'bg-muted'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <div className="text-xs opacity-70 text-right">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                      {message.role === 'user' && getMessageAvatar(message)}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === 'id' ? "Tanyakan sesuatu..." : "Ask something..."}
                  className="flex-1"
                  disabled={isLoading || !hasApiKey}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !hasApiKey || !inputValue.trim()}
                  className="bg-eduPurple hover:bg-eduPurple-dark"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LearningBuddy;
