
import React from 'react';
import { Button } from './ui/button';

export interface GradeSelectorProps {
  selectedGradeLevel: 'k-3' | '4-6' | '7-9';
  onGradeChange: (gradeLevel: 'k-3' | '4-6' | '7-9') => void;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({ selectedGradeLevel, onGradeChange }) => {
  return (
    <div className="flex space-x-2 sm:space-x-4">
      <Button
        variant={selectedGradeLevel === 'k-3' ? 'default' : 'outline'}
        onClick={() => onGradeChange('k-3')}
        className="flex-1"
      >
        K-3rd Grade
      </Button>
      <Button
        variant={selectedGradeLevel === '4-6' ? 'default' : 'outline'}
        onClick={() => onGradeChange('4-6')}
        className="flex-1"
      >
        4-6th Grade
      </Button>
      <Button
        variant={selectedGradeLevel === '7-9' ? 'default' : 'outline'}
        onClick={() => onGradeChange('7-9')}
        className="flex-1"
      >
        7-9th Grade
      </Button>
    </div>
  );
};

export default GradeSelector;
