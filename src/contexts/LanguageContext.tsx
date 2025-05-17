
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const translations = {
  en: {
    // Header
    'header.dashboard': 'Dashboard',
    'header.lessons': 'Lessons',
    'header.profile': 'Profile',
    'header.about': 'About',

    // AI Learning
    'learning.backToLessons': 'Back to Lessons',
    'learning.learningAbout': 'Learning About:',
    'learning.newTopic': 'New Topic',
    'learning.lesson': 'Lesson',
    'learning.quiz': 'Quiz',
    'learning.game': 'Game',
    'learning.selectSubject': 'Select a Subject',
    'learning.selectTopic': 'Select a Topic',
    'learning.enterTopic': 'Or enter your own topic',
    'learning.topicPlaceholder': 'Enter a topic to learn about...',
    'learning.createContent': 'Create Content',
    'learning.suggestions': 'Suggestions',

    // Quiz
    'quiz.creating': 'Creating a fun quiz just for you!',
    'quiz.moment': 'This might take a moment...',
    'quiz.start': 'Start Quiz',
    'quiz.title': 'Let\'s Quiz About',
    'quiz.description': 'Test your knowledge with this fun quiz!',
    'quiz.question': 'Question',
    'quiz.of': 'of',
    'quiz.checkAnswer': 'Check Answer',
    'quiz.next': 'Next',
    'quiz.previous': 'Previous',
    'quiz.finish': 'Finish Quiz',
    'quiz.complete': 'Quiz Complete!',
    'quiz.completed': 'You\'ve completed the Quiz',
    'quiz.amazing': 'Amazing job! You\'re a quiz superstar! 🌟',
    'quiz.great': 'Great work! You\'re doing well! 👏',
    'quiz.good': 'Good try! Let\'s practice more! 💪',
    'quiz.earned': 'You earned:',
    'quiz.stars': 'Stars',
    'quiz.badge': 'Master Badge',
    'quiz.review': 'Questions you might want to review:',
    'quiz.correctAnswer': 'Correct answer:',
    'quiz.tryAgain': 'Try Again',
    'quiz.newQuiz': 'New Quiz',

    // Game
    'game.creating': 'Creating a fun game just for you!',
    'game.moment': 'This might take a moment...',
    'game.title': 'Let\'s Play and Learn About',
    'game.description': 'Play a fun game and learn all about',
    'game.in': 'in',
    'game.create': 'Create Game',
    'game.howToPlay': 'How to Play:',
    'game.materials': 'Materials Needed:',
    'game.easier': 'Easier Version:',
    'game.harder': 'Challenge Version:',
    'game.start': 'Start Game',
    'game.finished': 'I Finished Playing!',

    // Language
    'language.select': 'Select Language',
    'language.en': 'English',
    'language.id': 'Bahasa Indonesia',
  },
  id: {
    // Header
    'header.dashboard': 'Dasbor',
    'header.lessons': 'Pelajaran',
    'header.profile': 'Profil',
    'header.about': 'Tentang',

    // AI Learning
    'learning.backToLessons': 'Kembali ke Pelajaran',
    'learning.learningAbout': 'Belajar Tentang:',
    'learning.newTopic': 'Topik Baru',
    'learning.lesson': 'Pelajaran',
    'learning.quiz': 'Kuis',
    'learning.game': 'Permainan',
    'learning.selectSubject': 'Pilih Mata Pelajaran',
    'learning.selectTopic': 'Pilih Topik',
    'learning.enterTopic': 'Atau masukkan topik sendiri',
    'learning.topicPlaceholder': 'Masukkan topik untuk dipelajari...',
    'learning.createContent': 'Buat Konten',
    'learning.suggestions': 'Saran',

    // Quiz
    'quiz.creating': 'Membuat kuis seru untukmu!',
    'quiz.moment': 'Ini mungkin membutuhkan waktu sebentar...',
    'quiz.start': 'Mulai Kuis',
    'quiz.title': 'Mari Kuis Tentang',
    'quiz.description': 'Uji pengetahuanmu dengan kuis seru ini!',
    'quiz.question': 'Pertanyaan',
    'quiz.of': 'dari',
    'quiz.checkAnswer': 'Periksa Jawaban',
    'quiz.next': 'Selanjutnya',
    'quiz.previous': 'Sebelumnya',
    'quiz.finish': 'Selesaikan Kuis',
    'quiz.complete': 'Kuis Selesai!',
    'quiz.completed': 'Kamu telah menyelesaikan Kuis',
    'quiz.amazing': 'Kerja bagus! Kamu adalah bintang kuis! 🌟',
    'quiz.great': 'Kerja hebat! Kamu melakukannya dengan baik! 👏',
    'quiz.good': 'Usaha bagus! Mari berlatih lagi! 💪',
    'quiz.earned': 'Kamu mendapatkan:',
    'quiz.stars': 'Bintang',
    'quiz.badge': 'Lencana Ahli',
    'quiz.review': 'Pertanyaan yang mungkin ingin kamu tinjau:',
    'quiz.correctAnswer': 'Jawaban benar:',
    'quiz.tryAgain': 'Coba Lagi',
    'quiz.newQuiz': 'Kuis Baru',

    // Game
    'game.creating': 'Membuat permainan seru untukmu!',
    'game.moment': 'Ini mungkin membutuhkan waktu sebentar...',
    'game.title': 'Mari Bermain dan Belajar Tentang',
    'game.description': 'Bermain permainan seru dan pelajari semua tentang',
    'game.in': 'di',
    'game.create': 'Buat Permainan',
    'game.howToPlay': 'Cara Bermain:',
    'game.materials': 'Bahan yang Dibutuhkan:',
    'game.easier': 'Versi Lebih Mudah:',
    'game.harder': 'Versi Tantangan:',
    'game.start': 'Mulai Permainan',
    'game.finished': 'Saya Sudah Selesai Bermain!',

    // Language
    'language.select': 'Pilih Bahasa',
    'language.en': 'Bahasa Inggris',
    'language.id': 'Bahasa Indonesia',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('appLanguage') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
