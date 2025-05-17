
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User } from 'lucide-react';

const Header = () => {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-eduPurple" />
            <span className="font-bold text-lg text-eduPurple">EduFun</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {user && (
              <Link to="/dashboard" className="transition-colors hover:text-eduPurple">
                {t('header.dashboard')}
              </Link>
            )}
            <Link to="/lessons" className="transition-colors hover:text-eduPurple">
              {t('header.lessons')}
            </Link>
            <Link to="/faq" className="transition-colors hover:text-eduPurple">
              {t('header.faq')}
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
          
          {user ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex items-center gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <User className="h-4 w-4" />
                {language === 'id' ? 'Dashboard' : 'Dashboard'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {language === 'id' ? 'Keluar' : 'Sign out'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/auth', { state: { action: 'signin' } })}
              >
                {language === 'id' ? 'Masuk' : 'Sign in'}
              </Button>
              <Button 
                className="bg-eduPurple hover:bg-eduPurple-dark"
                onClick={() => navigate('/auth', { state: { action: 'signup' } })}
              >
                {language === 'id' ? 'Daftar' : 'Sign up'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
