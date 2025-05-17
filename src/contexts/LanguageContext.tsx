
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface Translation {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

interface TranslationsType {
  en: Translation;
  id: Translation;
}

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
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Get saved language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage === 'id' || savedLanguage === 'en') ? savedLanguage : 'en';
  });

  // When language changes, save to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
