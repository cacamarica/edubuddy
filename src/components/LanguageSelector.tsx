
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-9 h-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('language.select')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="end">
        <div className="grid grid-cols-1 gap-1 p-1">
          <Button
            variant="ghost"
            className={`flex items-center justify-between px-3 py-1.5 ${language === 'en' ? 'bg-accent' : ''}`}
            onClick={() => setLanguage('en')}
          >
            <span>🇺🇸 {t('language.en')}</span>
            {language === 'en' && <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center justify-between px-3 py-1.5 ${language === 'id' ? 'bg-accent' : ''}`}
            onClick={() => setLanguage('id')}
          >
            <span>🇮🇩 {t('language.id')}</span>
            {language === 'id' && <Check className="h-4 w-4" />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
