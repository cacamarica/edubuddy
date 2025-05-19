
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TopicCarouselProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subjectName: string;
  topicList: string[];
  onSelectTopic: (topic: string) => void;
  onBackClick: () => void;
  currentGrade?: 'k-3' | '4-6' | '7-9';
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
  const displayGrade = currentGrade || gradeLevel;
  
  // Get appropriate subject color based on subject
  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'math':
      case 'mathematics':
      case 'algebra':
      case 'geometry':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'science':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'reading':
      case 'language arts':
      case 'english':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'history':
      case 'social studies':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'art':
      case 'music':
        return 'bg-pink-100 border-pink-300 text-pink-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  // Get grade level label
  const getGradeLevelLabel = (grade: string) => {
    switch(grade) {
      case 'k-3': return 'K-3rd Grade';
      case '4-6': return '4-6th Grade';
      case '7-9': return '7-9th Grade';
      default: return 'All Grades';
    }
  };
  
  // Get appropriate icon for subject
  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'math':
      case 'mathematics':
      case 'algebra':
      case 'geometry':
        return '🔢';
      case 'science':
        return '🔬';
      case 'reading':
      case 'language arts':
      case 'english':
        return '📚';
      case 'history':
      case 'social studies':
        return '🏛️';
      case 'art':
        return '🎨';
      case 'music':
        return '🎵';
      case 'technology':
      case 'computer science':
      case 'beginning computer':
        return '💻';
      case 'health':
      case 'physical education':
        return '🏃';
      case 'geography':
        return '🌍';
      case 'foreign languages':
        return '🗣️';
      default:
        return '📝';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        </div>
        <div className="flex flex-col md:items-end">
          <h2 className="text-xl font-medium">
            <span className="inline-block mr-2">{getSubjectIcon(subjectName)}</span>
            {subjectDisplayName} Topics
          </h2>
          <Badge variant="outline" className="mt-1">
            {getGradeLevelLabel(displayGrade)}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {topicList.map((topic) => (
          <Card 
            key={topic} 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
            onClick={() => onSelectTopic(topic)}
          >
            <CardHeader className={`pb-2 border-b ${getSubjectColor(subjectName)}`}>
              <CardTitle className="text-lg">{topic}</CardTitle>
              <CardDescription>
                {subjectDisplayName} - {getGradeLevelLabel(displayGrade)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full bg-eduPurple hover:bg-eduPurple-dark">Start Learning</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {topicList.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <h3 className="text-xl font-medium mb-2">No Topics Available</h3>
          <p className="text-gray-500">
            No topics found for {subjectDisplayName} in {getGradeLevelLabel(displayGrade)}. 
            Try selecting a different subject or grade level.
          </p>
        </div>
      )}
    </div>
  );
};

export default TopicCarousel;
