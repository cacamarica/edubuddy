import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, ChevronUp, ChevronDown, Send, Loader2, Trash, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLearningBuddy, ChatMessage } from '@/contexts/LearningBuddyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import LearningBuddySettings from './LearningBuddySettings';

// Key for storing the API key in localStorage - must match the one in LearningBuddySettings
const API_KEY_STORAGE_KEY = 'edu_buddy_openai_api_key';

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
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Check if user has API key
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      setHasApiKey(!!apiKey);
    };
    
    // Initial check
    checkApiKey();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkApiKey);
    
    // Also check when component mounts or dialog closes
    return () => window.removeEventListener('storage', checkApiKey);
  }, [showSettings]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <div 
        key={message.id} 
        className={`mb-3 ${message.role === 'user' ? 'ml-4 sm:ml-8' : 'mr-4 sm:mr-8'}`}
      >
        <div className="flex items-start gap-2">
          {message.role === 'assistant' && (
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-eduPurple/20 flex-shrink-0">
              <AvatarImage src="/images/buddy-avatar.png" />
              <AvatarFallback className="bg-eduPurple/20">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-eduPurple" />
              </AvatarFallback>
            </Avatar>
          )}
          
          <div 
            className={`rounded-xl py-2 px-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none max-w-[75%] sm:max-w-[70%]' 
                : 'bg-muted rounded-tl-none max-w-[75%] sm:max-w-[70%]'
            }`}
          >
            {message.formattedContent ? (
              <div className="prose-sm max-w-none break-words">
                {message.formattedContent}
              </div>
            ) : (
              <p className="break-words">{message.content}</p>
            )}
            <div className={`text-xs mt-1 opacity-70 ${message.role === 'user' ? 'text-right' : ''}`}>
              {format(new Date(message.timestamp), 'HH:mm')}
            </div>
          </div>
          
          {message.role === 'user' && (
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/20 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10">
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Toggle Button - Always visible */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? 'bg-eduPurple text-white' : 'bg-white text-eduPurple border border-eduPurple/20'
        }`}
        aria-label={language === 'id' ? 'Buka Asisten Belajar' : 'Open Learning Buddy'}
      >
        <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      
      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-40 ${
              isExpanded || isMobile
                ? 'top-0 left-0 right-0 bottom-0 sm:top-[10%] sm:left-[10%] sm:right-[10%] sm:bottom-[10%] sm:rounded-lg lg:left-[15%] lg:right-[15%] lg:top-[10%] lg:bottom-[10%] xl:left-[20%] xl:right-[20%]' 
                : 'bottom-20 sm:bottom-24 right-4 sm:right-6 w-[85vw] max-w-[350px] h-[60vh] max-h-[500px] rounded-xl'
            } bg-white shadow-xl border border-eduPurple/20 flex flex-col overflow-hidden transition-all duration-300`}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full ${!hasApiKey ? 'animate-pulse bg-amber-100' : ''}`}
                  onClick={openSettings}
                  title={language === 'id' ? 'Pengaturan API' : 'API Settings'}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
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
            
            {/* Message Area */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 bg-background/40">
              {!hasApiKey ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 text-muted-foreground">
                  <Settings className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-eduPurple/30" />
                  <h3 className="text-base sm:text-lg font-medium text-eduPurple-dark mb-1 sm:mb-2">
                    {language === 'id' ? 'Kunci API Dibutuhkan' : 'API Key Required'}
                  </h3>
                  <p className="text-xs sm:text-sm max-w-md mb-4">
                    {language === 'id' 
                      ? 'Untuk menggunakan Learning Buddy, Anda perlu menambahkan kunci API OpenAI Anda.'
                      : 'To use the Learning Buddy, you need to add your OpenAI API key.'}
                  </p>
                  <Button 
                    onClick={openSettings} 
                    size="sm"
                    className="bg-eduPurple hover:bg-eduPurple/90"
                  >
                    {language === 'id' ? 'Tambahkan Kunci API' : 'Add API Key'}
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 text-muted-foreground">
                  <Brain className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-eduPurple/30" />
                  <h3 className="text-base sm:text-lg font-medium text-eduPurple-dark mb-1 sm:mb-2">
                    {language === 'id' ? 'Asisten Belajar Anda' : 'Your Learning Buddy'}
                  </h3>
                  <p className="text-xs sm:text-sm max-w-md">
                    {language === 'id' 
                      ? 'Tanyakan apa saja untuk membantu Anda belajar. Saya bisa menjelaskan konsep, membantu dengan pekerjaan rumah, atau menjelajahi topik baru bersama!'
                      : 'Ask anything to help you learn. I can explain concepts, help with homework, or explore new topics together!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {messages.map(renderMessage)}
                  </div>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground my-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-xs sm:text-sm">
                        {language === 'id' ? 'Memikirkan jawaban...' : 'Thinking...'}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-2 sm:p-3 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === 'id' ? "Ketik pertanyaan Anda..." : "Type your question..."}
                  className="flex-grow text-sm"
                  disabled={isLoading || !hasApiKey}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="bg-eduPurple hover:bg-eduPurple/90 h-9 px-2 sm:px-3"
                  disabled={isLoading || !inputValue.trim() || !hasApiKey}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Dialog */}
      <LearningBuddySettings isOpen={showSettings} onClose={closeSettings} />
    </>
  );
};

export default LearningBuddy;
