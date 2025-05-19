
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface SubjectCardProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  onClick: () => void;
  description?: string;
  color?: string;
  textColor?: string;
  iconText?: string;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ 
  subject, 
  gradeLevel, 
  onClick, 
  description,
  color = 'bg-blue-500',
  textColor = 'text-blue-500',
  iconText
}) => {
  return (
    <Card 
      className={`shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-t-4 ${textColor} border-t-${color.slice(3)}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`${color} text-white p-3 rounded-full w-12 h-12 flex items-center justify-center text-xl`}>
            {iconText || subject.substring(0, 1)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-xl mb-1">{subject}</h3>
            {description && (
              <p className="text-gray-600 text-sm">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCard;
