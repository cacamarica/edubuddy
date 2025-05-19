
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

export interface SubjectCardProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  onClick?: () => void;
  description?: string;
  color?: string;
  textColor?: string;
  iconText?: string;
  hasProgress?: boolean;
  studentId?: string;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ 
  subject, 
  gradeLevel, 
  onClick, 
  description,
  color = 'bg-blue-500',
  textColor = 'text-blue-500',
  iconText,
  hasProgress,
  studentId
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Subject specific colors and labels
  const subjectInfo: Record<string, {color: string, textColor: string, label: string, icon?: string}> = {
    math: {
      color: 'bg-eduPastel-blue',
      textColor: 'text-blue-600',
      label: language === 'id' ? 'Matematika' : 'Mathematics',
      icon: '123'
    },
    english: {
      color: 'bg-eduPastel-green',
      textColor: 'text-green-600',
      label: language === 'id' ? 'Bahasa Inggris' : 'English',
      icon: 'Abc'
    },
    science: {
      color: 'bg-eduPastel-peach',
      textColor: 'text-orange-600',
      label: language === 'id' ? 'Sains' : 'Science',
      icon: '🧪'
    },
    history: {
      color: 'bg-eduPastel-purple',
      textColor: 'text-purple-600',
      label: language === 'id' ? 'Sejarah' : 'History',
      icon: '📚'
    },
    computer: {
      color: 'bg-eduPastel-blue',
      textColor: 'text-blue-600',
      label: language === 'id' ? 'Komputer' : 'Computer Science',
      icon: '💻'
    },
    art: {
      color: 'bg-eduPastel-yellow',
      textColor: 'text-amber-600',
      label: language === 'id' ? 'Seni' : 'Art',
      icon: '🎨'
    },
    music: {
      color: 'bg-eduPastel-pink',
      textColor: 'text-pink-600',
      label: language === 'id' ? 'Musik' : 'Music',
      icon: '🎵'
    },
    geography: {
      color: 'bg-eduPastel-green',
      textColor: 'text-green-600',
      label: language === 'id' ? 'Geografi' : 'Geography',
      icon: '🌍'
    },
    social: {
      color: 'bg-eduPastel-purple',
      textColor: 'text-purple-600',
      label: language === 'id' ? 'Sosial' : 'Social Studies',
      icon: '👥'
    }
  };

  // Use the subject-specific styling or fall back to defaults
  const cardColor = color || subjectInfo[subject]?.color || 'bg-blue-500';
  const cardTextColor = textColor || subjectInfo[subject]?.textColor || 'text-blue-500';
  const subjectLabel = subjectInfo[subject]?.label || subject;
  const subjectIcon = iconText || subjectInfo[subject]?.icon || subject.substring(0, 1).toUpperCase();
  
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default navigation behavior
      navigate('/topics', {
        state: {
          subject,
          gradeLevel,
          studentId
        }
      });
    }
  };

  return (
    <Card 
      className={`shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-t-4 ${cardTextColor} border-${cardColor.split('-')[1]}-${cardColor.split('-')[2]}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`${cardColor} text-white p-3 rounded-full w-12 h-12 flex items-center justify-center text-xl`}>
            {subjectIcon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-xl mb-1">{subjectLabel}</h3>
            {description && (
              <p className="text-gray-600 text-sm">{description}</p>
            )}
            
            {hasProgress && (
              <div className="mt-2">
                <Progress value={45} className="h-1" />
                <p className="text-xs text-gray-500 mt-1">45% {language === 'id' ? 'Selesai' : 'Complete'}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCard;
