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
    } else {
      // Set the provided API key - this is the key provided by the user
      const providedKey = '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';
      setApiKey(providedKey);
      // Save it automatically
      localStorage.setItem(API_KEY_STORAGE_KEY, providedKey);
      setHasKey(true);
      // Trigger a storage event so other components know the API key has changed
      window.dispatchEvent(new Event('storage'));
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
          
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {hasKey && (
              <Button 
                variant="outline" 
                onClick={handleClear}
                type="button"
              >
                {language === 'id' ? 'Hapus Kunci' : 'Remove Key'}
              </Button>
            )}
            
            <Button 
              onClick={handleSave}
              type="button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <X className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                </>
              ) : (
                language === 'id' ? 'Simpan' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-md rounded-md shadow-lg transition-all duration-300 ease-in-out
          ${toastMessage.variant === 'success' ? 'bg-green-50 border border-green-200' : 
            toastMessage.variant === 'destructive' ? 'bg-red-50 border border-red-200' : 
            'bg-white border border-gray-200'}`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toastMessage.variant === 'success' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : toastMessage.variant === 'destructive' ? (
                  <X className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium 
                  ${toastMessage.variant === 'success' ? 'text-green-800' : 
                    toastMessage.variant === 'destructive' ? 'text-red-800' : 
                    'text-gray-800'}`}
                >
                  {toastMessage.title}
                </h3>
                <div className={`mt-1 text-sm 
                  ${toastMessage.variant === 'success' ? 'text-green-600' : 
                    toastMessage.variant === 'destructive' ? 'text-red-600' : 
                    'text-gray-600'}`}
                >
                  {toastMessage.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LearningBuddySettings; 