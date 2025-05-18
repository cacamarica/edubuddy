import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface Translation {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface TranslationsType {
  en: Translation;
  id: Translation;
}

// Define translations object
const translations: TranslationsType = {
  en: {
    'language.select': 'Select language',
    'language.en': 'English',
    'language.id': 'Bahasa Indonesia',
    'header.dashboard': 'Dashboard',
    'header.lessons': 'Lessons',
    'header.about': 'About',
    'header.faq': 'FAQ',
    'quiz.creating': 'Creating your quiz...',
    'quiz.moment': 'This will just take a moment',
    'quiz.title': 'Quiz on',
    'quiz.description': 'Test your knowledge about',
    'quiz.in': 'in',
    'quiz.questionCount': 'Number of Questions',
    'quiz.questions': 'questions',
    'quiz.start': 'Start Quiz',    
    'quiz.create': 'Create Quiz',
    'quiz.howToPlay': 'How to Play',
    'quiz.finished': 'I\'ve Completed the Quiz!',
    'quiz.question': 'Question {current} of {total}',
    'quiz.saveAndExit': 'Save & Exit',
    'nav.home': 'Home',
    'nav.lessons': 'Lessons',
    'nav.quiz': 'Quiz',
    'nav.dashboard': 'Dashboard',
    'nav.menu': 'Menu',
    
    // Authentication
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.createAccount': 'Create Account',
    'auth.accessAccount': 'Sign in to access your account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.fullNamePlaceholder': 'Enter your full name',
    'auth.invalidEmail': 'Please enter a valid email',
    'auth.passwordMin': 'Password must be at least 6 characters',
    'auth.fullNameMin': 'Name must be at least 2 characters',
    'auth.termsNotice': 'By continuing, you agree to our Terms of Service and Privacy Policy',
    'auth.signingIn': 'Signing in...',
    'auth.signingUp': 'Creating account...',
    'auth.signInSuccess': 'Successfully signed in!',
    'auth.signUpSuccess': 'Account created! You can now sign in.',
    'auth.signOut': 'Sign Out',
    'auth.signedOut': 'You have been signed out.',
    'auth.signOutError': 'Error signing out. Please try again.',
    
    // Learning content
    'learning.recommendedNextSteps': 'Recommended Next Steps',
    'learning.startLesson': 'Start Lesson',
    'lesson.title': 'Lesson about',
    'lesson.description': 'Learn about',
    'lesson.creating': 'Creating your lesson...',
    'lesson.moment': 'This will just take a moment',
    'lesson.start': 'Start Learning',
    'lesson.next': 'Next Chapter',
    'lesson.previous': 'Previous Chapter',
    'lesson.finish': 'Finish Lesson',
    'lesson.completed': 'Lesson Completed',
    'lesson.funFacts': 'Fun Facts',
    'lesson.activity': 'Activity',
    'lesson.tryActivity': 'Try This Activity',
    'lesson.create': 'Create Lesson',
    
    // Game
    'game.title': 'Fun Game about',
    'game.description': 'Play and learn about',
    'game.creating': 'Creating your game...',
    'game.moment': 'This will just take a moment',
    'game.howToPlay': 'How to Play',
    'game.materials': 'Materials Needed',
    'game.easier': 'Make it Easier',
    'game.harder': 'Make it Challenging',
    'game.start': 'Start Game',
    'game.finished': 'I\'ve Completed the Game!',
    'game.create': 'Create Game',
    
    // Learning Buddy
    'buddy.title': 'Learning Buddy',
    'buddy.help': 'How can I help you learn today?',
    'buddy.loading': 'Thinking...',
    'buddy.askQuestion': 'Ask a question about any topic',
    'buddy.send': 'Send',
    'buddy.placeholder': 'What would you like to learn about?',
    'buddy.examples': 'Examples',
    'buddy.askExample1': 'What is photosynthesis?',
    'buddy.askExample2': 'Explain multiplication to a 7-year-old',
    'buddy.askExample3': 'How do airplanes fly?',
    
    // Topic selector
    'topic.personalizedFor': 'Personalized for',
    'topic.years': 'years',
    'topic.grade': 'Grade',
    
    // Footer
    'footer.trackProgress': 'Track Progress',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.contactUs': 'Contact Us',
    'footer.copyright': 'All rights reserved',

    // Student profile
    'student.manage': 'Manage Profiles',
    'student.add': 'Add Student',
    'student.edit': 'Edit Student',
    
    // Additional translations for learning content
    'learning.learningAbout': 'Learning About',
    'learning.newTopic': 'New Topic',
    'learning.limitedAccessWarning': 'Limited Access',
    'learning.limitedAccessDescription': 'You can only access 30% of content. Sign in to unlock all content.',
    'learning.contentTailoredGrade': 'Content will be tailored for grade level',
    'lesson': 'Lesson',
    'quiz': 'Quiz',
    'game': 'Game'
  },
  id: {
    'language.select': 'Pilih bahasa',
    'language.en': 'Bahasa Inggris',
    'language.id': 'Bahasa Indonesia',
    'header.dashboard': 'Dasbor',
    'header.lessons': 'Pelajaran',
    'header.about': 'Tentang',
    'header.faq': 'FAQ',
    'quiz.creating': 'Membuat kuis Anda...',
    'quiz.moment': 'Ini akan memakan waktu sebentar',
    'quiz.title': 'Kuis tentang',
    'quiz.description': 'Uji pengetahuan Anda tentang',
    'quiz.in': 'dalam',
    'quiz.questionCount': 'Jumlah Pertanyaan',
    'quiz.questions': 'pertanyaan',
    'quiz.start': 'Mulai Kuis',    
    'quiz.create': 'Buat Kuis',
    'quiz.howToPlay': 'Cara Bermain',
    'quiz.finished': 'Saya Telah Menyelesaikan Kuis!',
    'quiz.question': 'Pertanyaan {current} dari {total}',
    'quiz.saveAndExit': 'Simpan & Keluar',
    'nav.home': 'Beranda',
    'nav.lessons': 'Pelajaran',
    'nav.quiz': 'Kuis',
    'nav.dashboard': 'Dasbor',
    'nav.menu': 'Menu',
    
    // Authentication
    'auth.signIn': 'Masuk',
    'auth.signUp': 'Daftar',
    'auth.createAccount': 'Buat Akun',
    'auth.accessAccount': 'Masuk untuk mengakses akun Anda',
    'auth.email': 'Email',
    'auth.password': 'Kata Sandi',
    'auth.fullName': 'Nama Lengkap',
    'auth.fullNamePlaceholder': 'Masukkan nama lengkap Anda',
    'auth.invalidEmail': 'Masukkan email yang valid',
    'auth.passwordMin': 'Kata sandi minimal 6 karakter',
    'auth.fullNameMin': 'Nama minimal 2 karakter',
    'auth.termsNotice': 'Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami',
    'auth.signingIn': 'Sedang masuk...',
    'auth.signingUp': 'Membuat akun...',
    'auth.signInSuccess': 'Berhasil masuk!',
    'auth.signUpSuccess': 'Akun dibuat! Anda sekarang dapat masuk.',
    'auth.signOut': 'Keluar',
    'auth.signedOut': 'Anda telah keluar.',
    'auth.signOutError': 'Kesalahan saat keluar. Silakan coba lagi.',
    
    // Learning content
    'learning.recommendedNextSteps': 'Langkah Selanjutnya yang Direkomendasikan',
    'learning.startLesson': 'Mulai Pelajaran',
    'lesson.title': 'Pelajaran tentang',
    'lesson.description': 'Pelajari tentang',
    'lesson.creating': 'Membuat pelajaran Anda...',
    'lesson.moment': 'Ini akan memakan waktu sebentar',
    'lesson.start': 'Mulai Belajar',
    'lesson.next': 'Bab Selanjutnya',
    'lesson.previous': 'Bab Sebelumnya',
    'lesson.finish': 'Selesaikan Pelajaran',
    'lesson.completed': 'Pelajaran Selesai',
    'lesson.funFacts': 'Fakta Menarik',
    'lesson.activity': 'Aktivitas',
    'lesson.tryActivity': 'Coba Aktivitas Ini',
    'lesson.create': 'Buat Pelajaran',
    
    // Game
    'game.title': 'Permainan Seru tentang',
    'game.description': 'Bermain dan belajar tentang',
    'game.creating': 'Membuat permainan Anda...',
    'game.moment': 'Ini akan memakan waktu sebentar',
    'game.howToPlay': 'Cara Bermain',
    'game.materials': 'Bahan yang Diperlukan',
    'game.easier': 'Buat Lebih Mudah',
    'game.harder': 'Buat Lebih Menantang',
    'game.start': 'Mulai Permainan',
    'game.finished': 'Saya Telah Menyelesaikan Permainan!',
    'game.create': 'Buat Permainan',
    
    // Learning Buddy
    'buddy.title': 'Teman Belajar',
    'buddy.help': 'Bagaimana saya bisa membantu Anda belajar hari ini?',
    'buddy.loading': 'Berpikir...',
    'buddy.askQuestion': 'Ajukan pertanyaan tentang topik apa saja',
    'buddy.send': 'Kirim',
    'buddy.placeholder': 'Apa yang ingin Anda pelajari?',
    'buddy.examples': 'Contoh',
    'buddy.askExample1': 'Apa itu fotosintesis?',
    'buddy.askExample2': 'Jelaskan perkalian untuk anak 7 tahun',
    'buddy.askExample3': 'Bagaimana pesawat terbang?',
    
    // Topic selector
    'topic.personalizedFor': 'Dipersonalisasi untuk',
    'topic.years': 'tahun',
    'topic.grade': 'Kelas',
    
    // Footer
    'footer.trackProgress': 'Lacak Kemajuan',
    'footer.privacyPolicy': 'Kebijakan Privasi',
    'footer.termsOfService': 'Ketentuan Layanan',
    'footer.contactUs': 'Hubungi Kami',
    'footer.copyright': 'Semua hak dilindungi',

    // Student profile
    'student.manage': 'Kelola Profil',
    'student.add': 'Tambah Siswa',
    'student.edit': 'Edit Siswa',
    
    // Additional translations for learning content
    'learning.learningAbout': 'Belajar Tentang',
    'learning.newTopic': 'Topik Baru',
    'learning.limitedAccessWarning': 'Akses Terbatas',
    'learning.limitedAccessDescription': 'Anda hanya dapat mengakses 30% konten. Masuk untuk mengakses semua konten.',
    'learning.contentTailoredGrade': 'Konten akan disesuaikan untuk tingkat kelas',
    'lesson': 'Pelajaran',
    'quiz': 'Kuis',
    'game': 'Permainan'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get saved language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLanguage = localStorage.getItem('language');
      return (savedLanguage === 'id' || savedLanguage === 'en') ? savedLanguage : 'en';
    } catch (error) {
      console.error('Failed to read language from localStorage:', error);
      return 'en';
    }
  });

  // When language changes, save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Failed to save language to localStorage:', error);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    let translatedText = translations[language][key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translatedText = translatedText.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translatedText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Export the useLanguage hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
