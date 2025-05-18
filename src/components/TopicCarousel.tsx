
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TopicCarouselProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subjectName: string;
  topicList: string[];
  onSelectTopic: (topic: string) => void;
  onBackClick: () => void;
  currentGrade: 'k-3' | '4-6' | '7-9';
}

const TopicCarousel: React.FC<TopicCarouselProps> = ({
  gradeLevel,
  subjectName,
  topicList,
  onSelectTopic,
  onBackClick,
  currentGrade,
}) => {
  const subjectDisplayName = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-1"
          onClick={onBackClick}
        >
          <ChevronLeft size={16} />
          <span>Back to Subjects</span>
        </Button>
        <h2 className="text-xl font-medium">
          {subjectDisplayName} Topics for {gradeLevel === 'k-3' ? 'K-3rd' : gradeLevel === '4-6' ? '4-6th' : '7-9th'} Grade
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {topicList.map((topic) => (
          <Card 
            key={topic} 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onSelectTopic(topic)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{topic}</CardTitle>
              <CardDescription>
                {subjectDisplayName} - {gradeLevel === 'k-3' ? 'K-3rd' : gradeLevel === '4-6' ? '4-6th' : '7-9th'} Grade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Start Learning</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopicCarousel;
