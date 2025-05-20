import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Check, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LearningBuddySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Key for storing the API key in localStorage
const API_KEY_STORAGE_KEY = 'edu_buddy_openai_api_key';

const LearningBuddySettings: React.FC<LearningBuddySettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  } | null>(null);
  const { language } = useLanguage();

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
      setHasKey(true);
    }
  }, []);

  // Show a temporary toast message
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' | 'success' = 'default') => {
    setToastMessage({ title, description, variant });
    
    // Clear toast after 3 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      showToast(
        language === 'id' ? 'Kunci API Dibutuhkan' : 'API Key Required',
        language === 'id' ? 'Silakan masukkan kunci API OpenAI Anda.' : 'Please enter your OpenAI API key.',
        'destructive'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate the API key with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      // Save the API key
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      setHasKey(true);
      
      showToast(
        language === 'id' ? 'Kunci API Disimpan' : 'API Key Saved',
        language === 'id' ? 'Kunci API OpenAI Anda telah disimpan.' : 'Your OpenAI API key has been saved.',
        'success'
      );
      
      // Close the dialog
      onClose();
      
      // Trigger a storage event so other components know the API key has changed
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error validating API key:', error);
      showToast(
        language === 'id' ? 'Kunci API Tidak Valid' : 'Invalid API Key',
        language === 'id' ? 'Kunci API yang Anda masukkan tidak valid. Silakan periksa dan coba lagi.' : 'The API key you entered is invalid. Please check and try again.',
        'destructive'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setHasKey(false);
    showToast(
      language === 'id' ? 'Kunci API Dihapus' : 'API Key Removed',
      language === 'id' ? 'Kunci API OpenAI Anda telah dihapus.' : 'Your OpenAI API key has been removed.',
      'default'
    );
    
    // Trigger a storage event so other components know the API key has changed
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-eduPurple" />
              {language === 'id' ? 'Pengaturan Learning Buddy' : 'Learning Buddy Settings'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="openai-api-key" className="text-sm font-medium">
                {language === 'id' ? 'Kunci API OpenAI' : 'OpenAI API Key'}
              </Label>
              <div className="relative">
                <Input
                  id="openai-api-key"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'id'
                  ? 'Masukkan kunci API OpenAI Anda untuk menggunakan Learning Buddy.'
                  : 'Enter your OpenAI API key to use the Learning Buddy.'}
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                {language === 'id'
                  ? 'Kunci API Anda disimpan di perangkat Anda dan tidak pernah dikirim ke server kami. Kunci ini hanya digunakan untuk permintaan AI langsung dari peramban Anda.'
                  : 'Your API key is stored on your device and never sent to our servers. It is only used for AI requests directly from your browser.'}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {language === 'id'
                ? 'Belum punya kunci API? Dapatkan di '
                : 'Don\'t have an API key? Get one at '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eduPurple hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:justify-between sm:space-x-0">
            {hasKey && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                {language === 'id' ? 'Hapus Kunci API' : 'Remove API Key'}
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-eduPurple hover:bg-eduPurple/90"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                  </span>
                ) : (
                  language === 'id' ? 'Simpan' : 'Save'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Simple toast notification */}
      {toastMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 max-w-md rounded-lg shadow-lg p-4 transition-all duration-300 transform translate-y-0 opacity-100 ${
            toastMessage.variant === 'destructive' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : toastMessage.variant === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm">{toastMessage.title}</h4>
              <p className="text-xs mt-1 opacity-90">{toastMessage.description}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LearningBuddySettings; 