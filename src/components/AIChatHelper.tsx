import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIChatHelperProps {
  context: 'lesson' | 'quiz';
  subject: string;
  topic: string;
  student?: any;
}

const AIChatHelper: React.FC<AIChatHelperProps> = ({ context, subject, topic, student }) => {
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Integrate with AI buddy logic
  const handleAsk = async () => {
    setLoading(true);
    // Placeholder: Replace with real API call
    setTimeout(() => {
      setAnswer(`AI answer for: ${question}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-2">
      <input
        className="border rounded p-2 w-full"
        placeholder={t('buddy.placeholder')}
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />
      <Button onClick={handleAsk} disabled={loading || !question}>{t('buddy.send')}</Button>
      {answer && <div className="bg-eduPastel-purple/20 p-2 rounded mt-2">{answer}</div>}
    </div>
  );
};

export default AIChatHelper; 