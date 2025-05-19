import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizQuestion {
  type: 'mcq' | 'truefalse' | 'wordmatch' | 'voice';
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation?: string;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  student?: any;
  onComplete: (score: number) => void;
}

const QuizEngine: React.FC<QuizEngineProps> = ({ questions, student, onComplete }) => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [retries, setRetries] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selected, setSelected] = useState<number | string | null>(null);

  const handleAnswer = (answer: number | string) => {
    setSelected(answer);
    const q = questions[current];
    if (answer === q.correctAnswer) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setShowExplanation(false);
    } else {
      setStreak(0);
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      onComplete(score);
    }
  };

  const handleRetry = () => {
    setRetries(r => r + 1);
    setCurrent(0);
    setScore(0);
    setStreak(0);
    setSelected(null);
    setShowExplanation(false);
  };

  // TODO: Integrate badge logic and AIChatHelper for explanations

  const q = questions[current];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">{q.question}</h3>
      {q.type === 'mcq' && q.options && (
        <div className="flex flex-col gap-2">
          {q.options.map((opt, idx) => (
            <Button key={idx} variant={selected === idx ? 'primary' : 'outline'} onClick={() => handleAnswer(idx)}>{opt}</Button>
          ))}
        </div>
      )}
      {q.type === 'truefalse' && (
        <div className="flex gap-2">
          <Button variant={selected === 0 ? 'primary' : 'outline'} onClick={() => handleAnswer(0)}>{t('quiz.true')}</Button>
          <Button variant={selected === 1 ? 'primary' : 'outline'} onClick={() => handleAnswer(1)}>{t('quiz.false')}</Button>
        </div>
      )}
      {/* TODO: Add word-matching and voice-answer UI */}
      {showExplanation && (
        <div className="bg-yellow-50 p-2 rounded">
          <p>{q.explanation || t('quiz.noExplanation')}</p>
          <Button onClick={() => {/* TODO: Call AIChatHelper */}}>{t('quiz.whyWrong')}</Button>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <Button onClick={handleNext}>{current < questions.length - 1 ? t('quiz.next') : t('quiz.finish')}</Button>
        <Button onClick={handleRetry}>{t('quiz.retry')}</Button>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{t('quiz.streak')}: {streak} | {t('quiz.retries')}: {retries}</div>
    </div>
  );
};

export default QuizEngine; 