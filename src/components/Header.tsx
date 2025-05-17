
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, User, Menu, X, BookOpen, Award, Search } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-full bg-eduPurple p-1">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-eduPurple-dark">EduBuddy</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-eduPurple transition-colors">
            Home
          </Link>
          <Link to="/lessons" className="text-foreground hover:text-eduPurple transition-colors">
            Lessons
          </Link>
          <Link to="/quiz" className="text-foreground hover:text-eduPurple transition-colors">
            Quizzes
          </Link>
          <Link to="/games" className="text-foreground hover:text-eduPurple transition-colors">
            Games
          </Link>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/dashboard">Parent Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile">Student Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-border">
          <div className="container py-4 flex flex-col gap-2">
            <Link 
              to="/" 
              className="px-4 py-2 rounded-md hover:bg-eduPastel-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/lessons" 
              className="px-4 py-2 rounded-md hover:bg-eduPastel-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Lessons
            </Link>
            <Link 
              to="/quiz" 
              className="px-4 py-2 rounded-md hover:bg-eduPastel-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Quizzes
            </Link>
            <Link 
              to="/games" 
              className="px-4 py-2 rounded-md hover:bg-eduPastel-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Games
            </Link>
            <Link 
              to="/dashboard" 
              className="px-4 py-2 rounded-md hover:bg-eduPastel-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Parent Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
