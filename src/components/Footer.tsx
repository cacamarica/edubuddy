
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, Mail, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

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
              {language === 'id'
                ? 'Membuat pembelajaran menyenangkan dan menarik untuk siswa dari semua usia!'
                : 'Making learning fun and engaging for students of all ages!'}
            </p>
            <p className="text-sm text-muted-foreground italic">
              {language === 'id'
                ? '"Membantu anak-anak berkembang. Membantu orang tua tetap mengikuti perkembangan."'
                : '"Helping kids grow. Helping parents stay in the loop."'}
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">
              {language === 'id' ? 'Tautan Cepat' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Beranda' : 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/lessons" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Pelajaran' : 'Lessons'}
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Kuis' : 'Quizzes'}
                </Link>
              </li>
              <li>
                <Link to="/games" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Permainan' : 'Games'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Tentang Kami' : 'About Us'}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For Parents */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">
              {language === 'id' ? 'Untuk Orang Tua' : 'For Parents'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Dasbor' : 'Dashboard'}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Pantau Kemajuan' : 'Track Progress'}
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Pengaturan Akun' : 'Account Settings'}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-display font-bold mb-4">
              {language === 'id' ? 'Bantuan & Dukungan' : 'Help & Support'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-eduPurple" />
                <Link to="/faq" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'FAQ' : 'FAQ'}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-eduPurple" />
                <a href="mailto:support@edubuddy.example" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Hubungi Kami' : 'Contact Us'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-eduPurple" />
                <Link to="/about" className="text-muted-foreground hover:text-eduPurple transition-colors">
                  {language === 'id' ? 'Tentang Kami' : 'About Us'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6 bg-eduPurple/20" />
        
        <div className="text-sm text-muted-foreground">
          <p className="text-center font-medium text-eduPurple-dark mt-4">
            &copy; 2025 EduBuddy. {language === 'id' ? 'Hak Cipta Dilindungi.' : 'All rights reserved.'} {language === 'id' ? 'Platform pendidikan untuk anak-anak.' : 'An educational platform for children.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
