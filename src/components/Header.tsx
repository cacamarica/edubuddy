
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, User, Menu } from 'lucide-react';

const Header = () => {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
            <span className="font-bold text-lg text-eduPurple">EduBuddy</span>
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
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="ml-2 flex items-center">
            <BookOpen className="h-5 w-5 text-eduPurple" />
            <span className="font-bold text-lg text-eduPurple">EduBuddy</span>
          </Link>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-14 left-0 w-full bg-background border-b border-border/40 md:hidden z-50">
            <nav className="container py-3">
              <ul className="space-y-2">
                {user && (
                  <li>
                    <Link 
                      to="/dashboard" 
                      className="block px-4 py-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('header.dashboard')}
                    </Link>
                  </li>
                )}
                <li>
                  <Link 
                    to="/lessons" 
                    className="block px-4 py-2 hover:bg-muted rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.lessons')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/faq" 
                    className="block px-4 py-2 hover:bg-muted rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.faq')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/about" 
                    className="block px-4 py-2 hover:bg-muted rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.about')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
        
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
