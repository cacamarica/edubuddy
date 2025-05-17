
import { Book, BookOpen, Pencil } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

type Subject = 'math' | 'english' | 'science';

interface SubjectCardProps {
  subject: Subject;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
}

const subjectConfig = {
  math: {
    title: 'Mathematics',
    description: {
      'k-3': 'Learn numbers, counting, shapes, and basic addition!',
      '4-6': 'Explore fractions, decimals, multiplication, and division!',
      '7-9': 'Master algebra, geometry, and mathematical reasoning!',
    },
    color: 'bg-eduPastel-blue',
    icon: BookOpen,
    progress: {
      'k-3': 30,
      '4-6': 20,
      '7-9': 10,
    },
    lessons: {
      'k-3': ['Counting Fun', 'Shape Adventure', 'Addition Games'],
      '4-6': ['Fraction Basics', 'Decimal Places', 'Times Tables'],
      '7-9': ['Algebra Foundations', 'Geometry Concepts', 'Problem Solving'],
    },
  },
  english: {
    title: 'English',
    description: {
      'k-3': 'Learn letters, sounds, reading, and basic vocabulary!',
      '4-6': 'Explore grammar, writing stories, and reading comprehension!',
      '7-9': 'Master essays, literature analysis, and advanced grammar!',
    },
    color: 'bg-eduPastel-green',
    icon: Book,
    progress: {
      'k-3': 40,
      '4-6': 25,
      '7-9': 15,
    },
    lessons: {
      'k-3': ['Letter Sounds', 'Sight Words', 'Story Time'],
      '4-6': ['Parts of Speech', 'Creative Writing', 'Reading Skills'],
      '7-9': ['Essay Structure', 'Literary Analysis', 'Advanced Grammar'],
    },
  },
  science: {
    title: 'Science',
    description: {
      'k-3': 'Discover plants, animals, weather, and our five senses!',
      '4-6': 'Explore habitats, simple machines, and the water cycle!',
      '7-9': 'Investigate chemistry, physics, and biology concepts!',
    },
    color: 'bg-eduPastel-peach',
    icon: Pencil,
    progress: {
      'k-3': 20,
      '4-6': 15,
      '7-9': 5,
    },
    lessons: {
      'k-3': ['Animal Friends', 'Weather Watch', 'Five Senses'],
      '4-6': ['Habitats', 'Simple Machines', 'Water Cycle'],
      '7-9': ['Chemistry Basics', 'Forces & Motion', 'Cell Biology'],
    },
  },
};

const SubjectCard = ({ subject, gradeLevel = 'k-3' }: SubjectCardProps) => {
  const navigate = useNavigate();
  const config = subjectConfig[subject];
  const Icon = config.icon;
  
  const handleContinueLearning = () => {
    // Default to first lesson if no progress, otherwise continue from most recent
    const topicIndex = Math.floor(config.progress[gradeLevel] / 100 * config.lessons[gradeLevel].length);
    const selectedTopic = config.lessons[gradeLevel][topicIndex] || config.lessons[gradeLevel][0];
    
    // Navigate to AI Learning with subject, grade level and topic
    navigate('/ai-learning', { 
      state: { 
        gradeLevel,
        subject: config.title,
        topic: selectedTopic,
        autoStart: true // Signal to auto-start content
      } 
    });
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={`h-16 ${config.color}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {config.progress[gradeLevel]}% Complete
          </Badge>
        </div>
        <CardDescription>{config.description[gradeLevel]}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">Popular Lessons:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            {config.lessons[gradeLevel].map((lesson) => (
              <li 
                key={lesson} 
                className="cursor-pointer hover:text-eduPurple transition-colors"
                onClick={() => navigate('/ai-learning', { 
                  state: { 
                    gradeLevel,
                    subject: config.title, 
                    topic: lesson,
                    autoStart: true
                  } 
                })}
              >
                {lesson}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-eduPurple hover:bg-eduPurple-dark"
          onClick={handleContinueLearning}
        >
          Continue Learning
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubjectCard;
