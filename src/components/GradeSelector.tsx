import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, Calculator, Atom, Globe, Code, Music, Palette, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define grade groups with more specific grades
const gradeGroups = [
  {
    id: 'k-3',
    name: 'Early Elementary',
    grades: ['K1', 'K2', 'K3'],
    description: 'Fundamental skills and early learning concepts',
    color: 'bg-gradient-to-br from-blue-100 to-blue-200',
    borderColor: 'border-blue-300',
    hoverColor: 'group-hover:bg-blue-50',
    icon: BookOpen,
    subjects: ['Math', 'Reading', 'Science', 'Art'],
    topics: ['Counting', 'Letters', 'Colors', 'Shapes', 'Animals'],
  },
  {
    id: '4-6',
    name: 'Upper Elementary',
    grades: ['K4', 'K5', 'K6'],
    description: 'Building core academic knowledge and skills',
    color: 'bg-gradient-to-br from-green-100 to-green-200',
    borderColor: 'border-green-300',
    hoverColor: 'group-hover:bg-green-50',
    icon: Calculator,
    subjects: ['Mathematics', 'Language Arts', 'Science', 'Social Studies', 'Technology'],
    topics: ['Fractions', 'Writing', 'Life Science', 'Geography', 'Coding'],
  },
  {
    id: '7-9',
    name: 'Middle School',
    grades: ['K7', 'K8', 'K9'],
    description: 'Advanced concepts and critical thinking skills',
    color: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    borderColor: 'border-yellow-300',
    hoverColor: 'group-hover:bg-yellow-50',
    icon: Atom,
    subjects: ['Algebra', 'Literature', 'Chemistry', 'History', 'Computer Science'],
    topics: ['Equations', 'Essays', 'Elements', 'World History', 'Web Development'],
  }
];

// Map subject names to their icons
const subjectIcons: Record<string, React.ReactNode> = {
  'Math': <Calculator className="h-4 w-4" />,
  'Mathematics': <Calculator className="h-4 w-4" />,
  'Algebra': <Calculator className="h-4 w-4" />,
  'Reading': <BookOpen className="h-4 w-4" />,
  'Language Arts': <BookOpen className="h-4 w-4" />,
  'Literature': <BookOpen className="h-4 w-4" />,
  'Science': <Atom className="h-4 w-4" />,
  'Chemistry': <Atom className="h-4 w-4" />,
  'Life Science': <Atom className="h-4 w-4" />,
  'Social Studies': <GraduationCap className="h-4 w-4" />,
  'History': <GraduationCap className="h-4 w-4" />,
  'World History': <GraduationCap className="h-4 w-4" />,
  'Geography': <Globe className="h-4 w-4" />,
  'Technology': <Code className="h-4 w-4" />,
  'Computer Science': <Code className="h-4 w-4" />,
  'Coding': <Code className="h-4 w-4" />,
  'Web Development': <Code className="h-4 w-4" />,
  'Art': <Palette className="h-4 w-4" />,
  'Music': <Music className="h-4 w-4" />
};

export interface GradeSelectorProps {
  selectedGradeLevel: 'k-3' | '4-6' | '7-9';
  onGradeChange: (gradeLevel: 'k-3' | '4-6' | '7-9') => void;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({ selectedGradeLevel, onGradeChange }) => {
  const navigate = useNavigate();

  const handleSubjectClick = (gradeLevel: string, subject: string) => {
    // Navigate to lessons page with subject selection
    navigate('/lessons', {
      state: {
        gradeLevel: gradeLevel,
        preSelectedSubject: subject.toLowerCase()
      }
    });
  };

  const GradeCard = ({ group }: { group: typeof gradeGroups[0] }) => {
    const isSelected = selectedGradeLevel === group.id;
    const Icon = group.icon;
    
    return (
      <div className="group h-full">
        <Card 
          className={`flex flex-col h-full border-2 transition-all duration-300 ${isSelected ? `${group.borderColor} shadow-lg` : 'border-transparent hover:border-gray-200'} overflow-hidden`}
          onClick={() => onGradeChange(group.id as 'k-3' | '4-6' | '7-9')}
        >
          <div className={`absolute top-0 left-0 w-1 h-full ${isSelected ? group.borderColor : 'bg-transparent'}`}></div>
          
          <CardHeader className={`pb-2 ${group.color} transition-colors duration-300`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full bg-white/80 ${isSelected ? group.borderColor : 'border border-gray-200'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{group.name}</CardTitle>
              </div>
            </div>
            <div className="flex space-x-1 mt-2">
              {group.grades.map(grade => (
                <Badge key={grade} variant="outline" className="bg-white/80 font-medium">
                  {grade}
                </Badge>
              ))}
            </div>
            <CardDescription className="text-gray-700 font-medium mt-2">
              {group.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className={`pb-2 transition-colors duration-300 ${group.hoverColor} flex-grow`}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Popular Subjects</h4>
                <div className="grid grid-cols-2 gap-1">
                  {group.subjects.slice(0, 4).map(subject => (
                    <Badge 
                      key={subject} 
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80 py-1 justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubjectClick(group.id, subject);
                      }}
                    >
                      {subjectIcons[subject]}
                      <span className="truncate">{subject}</span>
                    </Badge>
                  ))}
                </div>
                {group.subjects.length > 4 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto mt-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/subjects', { state: { gradeLevel: group.id } });
                    }}
                  >
                    +{group.subjects.length - 4} more subjects
                  </Button>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Featured Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {group.topics.map(topic => (
                    <Badge 
                      key={topic} 
                      variant="outline"
                      className="text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className={`transition-colors duration-300 ${group.hoverColor} mt-auto`}>
            <Button 
              className="w-full group"
              onClick={(e) => {
                e.stopPropagation();
                onGradeChange(group.id as 'k-3' | '4-6' | '7-9');
                navigate('/lessons', { state: { gradeLevel: group.id } });
              }}
            >
              <span className="mr-1">Explore {group.name}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium mb-2">Select Grade Level</h2>
        <p className="text-gray-500">Choose a grade level to explore subjects and lessons tailored to that level.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gradeGroups.map(group => (
          <GradeCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
};

export default GradeSelector;
