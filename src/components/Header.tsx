
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = () => {
  const { t } = useLanguage();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg text-eduPurple">EduFun</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="transition-colors hover:text-eduPurple">
              {t('header.dashboard')}
            </Link>
            <Link to="/lessons" className="transition-colors hover:text-eduPurple">
              {t('header.lessons')}
            </Link>
            <Link to="/about" className="transition-colors hover:text-eduPurple">
              {t('header.about')}
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between md:justify-end space-x-2">
          <div className="flex items-center">
            <LanguageSelector />
          </div>
          <Button className="bg-eduPurple hover:bg-eduPurple-dark">
            <Link to="/dashboard" className="text-white">
              {t('header.dashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
