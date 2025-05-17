
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Sparkles, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LearningHeaderProps {
  currentStudent: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  stars: number;
  showProfileManager: boolean;
  onToggleProfileManager: () => void;
  onGoBack: () => void;
}

const LearningHeader: React.FC<LearningHeaderProps> = ({
  currentStudent,
  stars,
  showProfileManager,
  onToggleProfileManager,
  onGoBack,
}) => {
  return (
    <section className="bg-eduPastel-blue py-8">
      <div className="container px-4 md:px-6">
        <Button 
          variant="ghost" 
          size="sm"
          className="mb-4"
          onClick={onGoBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Lessons
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">AI Learning Adventure</h1>
            <p className="text-muted-foreground">
              Create custom lessons, quizzes, and games about any topic!
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-2 md:items-center">
            {currentStudent ? (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                <div className="w-8 h-8 rounded-full bg-eduPastel-purple flex items-center justify-center text-lg">
                  {currentStudent.avatar || '👦'}
                </div>
                <span className="font-medium">{currentStudent.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleProfileManager}
                  className="ml-1"
                >
                  {showProfileManager ? 'Hide' : 'Change'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleProfileManager}
                >
                  Select Student
                </Button>
              </div>
            )}
            
            {stars > 0 && (
              <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{stars} Stars Earned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningHeader;
