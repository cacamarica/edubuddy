
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, Mail, User } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-eduPurple/10 border-t border-eduPurple/20 py-8 mt-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="col-span-1 md:col-span-1 flex flex-col">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="rounded-full bg-eduPurple p-1">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-eduPurple-dark">
                EduBuddy
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Making learning fun and engaging for students of all ages!
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/lessons" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Lessons
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Quizzes
                </Link>
              </li>
              <li>
                <Link to="/games" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Games
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For Parents */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">For Parents</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Track Progress
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-eduPurple" />
                <Link to="/faq" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  FAQ
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-eduPurple" />
                <a href="mailto:support@edubuddy.example" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  Contact Us
                </a>
              </li>
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-eduPurple" />
                <Link to="/about" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-eduPurple/10 mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 EduBuddy. All rights reserved. An educational platform for children.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
