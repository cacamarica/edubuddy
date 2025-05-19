import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface StoryPlaygroundProps {
  subject: string;
  topic: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  student?: any;
}

const StoryPlayground: React.FC<StoryPlaygroundProps> = ({ subject, topic, gradeLevel, student }) => {
  const { t } = useLanguage();
  const [story, setStory] = useState<string>('');
  const [choices, setChoices] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // TODO: Call GenAI API to get story and choices
  const fetchStory = async (choice?: string) => {
    setLoading(true);
    // Placeholder: Replace with real API call
    setTimeout(() => {
      setStory(`Adventure step ${step + 1} for ${topic}.`);
      setChoices([`Option A ${step + 1}`, `Option B ${step + 1}`]);
      setStep(s => s + 1);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t('lesson.storyMode')}</h3>
      <p>{story || t('lesson.storyIntro')}</p>
      <div className="flex gap-2">
        {choices.map((c, idx) => (
          <Button key={idx} onClick={() => fetchStory(c)}>{c}</Button>
        ))}
      </div>
      <Button onClick={() => fetchStory()} disabled={loading}>{loading ? t('lesson.loading') : t('lesson.nextStep')}</Button>
    </div>
  );
};

export default StoryPlayground; 