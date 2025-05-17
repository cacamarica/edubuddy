
import React from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Award, Star, CheckCircle, Trophy } from 'lucide-react';

interface BadgeProps {
  type?: 'award' | 'star' | 'check' | 'trophy';
  name: string;
  imageUrl?: string;
  className?: string;
}

const Badge = ({ type = 'award', name, imageUrl, className = '' }: BadgeProps) => {
  // Default icon based on type
  let IconComponent = Award;
  switch (type) {
    case 'star':
      IconComponent = Star;
      break;
    case 'check':
      IconComponent = CheckCircle;
      break;
    case 'trophy':
      IconComponent = Trophy;
      break;
    default:
      IconComponent = Award;
  }
  
  // Render image if provided, otherwise show icon
  if (imageUrl) {
    return (
      <div className="flex flex-col items-center">
        <div className={`h-12 w-12 overflow-hidden rounded-full ${className}`}>
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover" 
          />
        </div>
        <p className="text-sm font-medium mt-1">{name}</p>
      </div>
    );
  }
  
  // Default badge with icon
  return (
    <div className="flex flex-col items-center">
      <UIBadge className={`h-12 w-12 flex items-center justify-center rounded-full p-0 ${className}`}>
        <IconComponent className="h-6 w-6" />
      </UIBadge>
      <p className="text-sm font-medium mt-1">{name}</p>
    </div>
  );
};

export default Badge;
