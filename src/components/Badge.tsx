
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
            onError={(e) => {
              // Fallback to default icon if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-eduPastel-purple">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-eduPurple">
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                  </svg>
                </div>`;
              }
            }}
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
