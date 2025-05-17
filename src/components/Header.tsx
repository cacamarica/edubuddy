
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import LanguageSelector from './LanguageSelector';
import { Menu, LogIn, LogOut, Home, BookOpen, PencilRuler, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Header = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('auth.signedOut'));
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('auth.signOutError'));
    }
    
    // Close mobile menu after sign out
    setMobileMenuOpen(false);
  };
  
  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  return (
    <header className="bg-white border-b border-b-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="sr-only">EduBuddy</span>
            {/* Logo */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-eduPurple to-eduBlue flex items-center justify-center text-white font-bold text-lg mr-2">
              E
            </div>
            <span className="text-xl font-bold font-display">EduBuddy</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          <nav className="flex items-center space-x-1 mr-4">
            <Button variant="ghost" asChild>
              <Link to="/" className={location.pathname === '/' ? 'text-eduPurple' : ''}>
                {t('nav.home')}
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/lessons" className={location.pathname === '/lessons' ? 'text-eduPurple' : ''}>
                {t('nav.lessons')}
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/quiz" className={location.pathname === '/quiz' ? 'text-eduPurple' : ''}>
                {t('nav.quiz')}
              </Link>
            </Button>
            {user && (
              <Button variant="ghost" asChild>
                <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'text-eduPurple' : ''}>
                  {t('nav.dashboard')}
                </Link>
              </Button>
            )}
          </nav>
          
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                className="bg-eduPurple hover:bg-eduPurple-dark text-white flex items-center"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('auth.signIn')}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-xl font-display">EduApp</SheetTitle>
                <SheetDescription>
                  {t('nav.menu')}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleMobileNavigation('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {t('nav.home')}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleMobileNavigation('/lessons')}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('nav.lessons')}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleMobileNavigation('/quiz')}
                >
                  <PencilRuler className="mr-2 h-4 w-4" />
                  {t('nav.quiz')}
                </Button>
                {user && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleMobileNavigation('/dashboard')}
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {t('nav.dashboard')}
                  </Button>
                )}
              </div>
              
              <div className="border-t mt-6 pt-6 space-y-4">
                <LanguageSelector />
                
                {user ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.signOut')}
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="w-full bg-eduPurple hover:bg-eduPurple-dark text-white flex items-center justify-center"
                    onClick={() => handleMobileNavigation('/auth')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('auth.signIn')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
