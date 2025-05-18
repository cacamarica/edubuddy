import { FlaskConical, BookOpen, Calculator, Atom, Globe, Code, Languages, Music, Palette, GraduationCap, Calendar, PencilRuler, BookOpenCheck } from 'lucide-react';
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
import { useEffect, useState } from 'react';
import { studentProgressService } from '@/services/studentProgressService';
import { Subject } from '@/types/learning';

type Subject = 'math' | 'english' | 'science' | 'history' | 'computer' | 'art' | 'music' | 'geography' | 'social';

interface SubjectCardProps {
  subject: string | Subject;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
  hasProgress?: boolean;
  studentId?: string;
  onClick?: () => void;
}

const subjectConfig = {
  math: {
    title: 'Mathematics',
    description: {
      'k-3': 'Learn numbers, counting, shapes, and basic addition! Ages 5-8',
      '4-6': 'Explore fractions, decimals, multiplication, and division! Ages 9-11',
      '7-9': 'Master algebra, geometry, and mathematical reasoning! Ages 12-15',
    },
    color: 'bg-eduPastel-blue',
    icon: Calculator,
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
      'k-3': 'Learn letters, sounds, reading, and basic vocabulary! Ages 5-8',
      '4-6': 'Explore grammar, writing stories, and reading comprehension! Ages 9-11',
      '7-9': 'Master essays, literature analysis, and advanced grammar! Ages 12-15',
    },
    color: 'bg-eduPastel-green',
    icon: BookOpenCheck,
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
      'k-3': 'Discover plants, animals, weather, and our five senses! Ages 5-8',
      '4-6': 'Explore habitats, simple machines, and the water cycle! Ages 9-11',
      '7-9': 'Investigate chemistry, physics, and biology concepts! Ages 12-15',
    },
    color: 'bg-eduPastel-peach',
    icon: Atom,
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
  history: {
    title: 'History',
    description: {
      'k-3': 'Discover historical figures, events, and traditions! Ages 5-8',
      '4-6': 'Explore ancient civilizations, important events, and cultural history! Ages 9-11',
      '7-9': 'Master historical analysis, world wars, and modern history! Ages 12-15',
    },
    color: 'bg-eduPastel-yellow',
    icon: BookOpen,
    progress: {
      'k-3': 15,
      '4-6': 22,
      '7-9': 18,
    },
    lessons: {
      'k-3': ['Community Helpers', 'Famous People', 'Holiday Traditions'],
      '4-6': ['Ancient Egypt', 'Native Americans', 'American Revolution'],
      '7-9': ['World War I', 'Civil Rights', 'Modern Global History'],
    },
  },
  computer: {
    title: 'Computer Science',
    description: {
      'k-3': 'Learn basic coding, digital safety, and technology basics! Ages 5-8',
      '4-6': 'Explore programming, digital skills, and simple algorithms! Ages 9-11',
      '7-9': 'Master coding languages, web development, and computational thinking! Ages 12-15',
    },
    color: 'bg-eduPastel-purple',
    icon: Code,
    progress: {
      'k-3': 10,
      '4-6': 15,
      '7-9': 25,
    },
    lessons: {
      'k-3': ['Computer Basics', 'Digital Safety', 'Introduction to Coding'],
      '4-6': ['Block Coding', 'Digital Projects', 'Internet Safety'],
      '7-9': ['JavaScript Basics', 'Web Development', 'Python Programming'],
    },
  },
  art: {
    title: 'Art',
    description: {
      'k-3': 'Express creativity through drawing, coloring, and crafts! Ages 5-8',
      '4-6': 'Explore different art mediums, techniques, and famous artists! Ages 9-11',
      '7-9': 'Master advanced art techniques, art history, and personal style! Ages 12-15',
    },
    color: 'bg-eduPastel-red',
    icon: Palette,
    progress: {
      'k-3': 25,
      '4-6': 18,
      '7-9': 12,
    },
    lessons: {
      'k-3': ['Basic Colors', 'Simple Shapes', 'Fun Crafts'],
      '4-6': ['Painting Basics', 'Famous Artists', 'Mixed Media'],
      '7-9': ['Advanced Drawing', 'Art History', 'Digital Art'],
    },
  },
  music: {
    title: 'Music',
    description: {
      'k-3': 'Explore rhythm, simple songs, and musical instruments! Ages 5-8',
      '4-6': 'Learn musical notation, instrumental basics, and music appreciation! Ages 9-11',
      '7-9': 'Develop music theory knowledge, composition, and performance skills! Ages 12-15',
    },
    color: 'bg-eduPastel-blue',
    icon: Music,
    progress: {
      'k-3': 30,
      '4-6': 20,
      '7-9': 15,
    },
    lessons: {
      'k-3': ['Rhythm Games', 'Singing Fun', 'Instrument Discovery'],
      '4-6': ['Basic Notes', 'Music Reading', 'Famous Composers'],
      '7-9': ['Music Theory', 'Composition Basics', 'Music History'],
    },
  },
  geography: {
    title: 'Geography',
    description: {
      'k-3': 'Explore maps, landforms, and community locations! Ages 5-8',
      '4-6': 'Learn about continents, countries, and natural wonders! Ages 9-11',
      '7-9': 'Study climates, cultures, and global geography concepts! Ages 12-15',
    },
    color: 'bg-eduPastel-green',
    icon: Globe,
    progress: {
      'k-3': 15,
      '4-6': 25,
      '7-9': 18,
    },
    lessons: {
      'k-3': ['Map Basics', 'My Neighborhood', 'Land and Water'],
      '4-6': ['Continents & Oceans', 'World Landmarks', 'Map Reading'],
      '7-9': ['Climate Zones', 'Cultural Geography', 'Global Issues'],
    },
  },
  social: {
    title: 'Social Studies',
    description: {
      'k-3': 'Learn about communities, families, and diversity! Ages 5-8',
      '4-6': 'Explore citizenship, government, and cultural traditions! Ages 9-11',
      '7-9': 'Master civic responsibility, global relationships, and economics! Ages 12-15',
    },
    color: 'bg-eduPastel-yellow',
    icon: GraduationCap,
    progress: {
      'k-3': 35,
      '4-6': 20,
      '7-9': 15,
    },
    lessons: {
      'k-3': ['My Family', 'Community Helpers', 'Cultural Celebrations'],
      '4-6': ['Government Basics', 'Cultural Traditions', 'Local History'],
      '7-9': ['Civic Engagement', 'Global Economics', 'Social Issues'],
    },
  },
};

const SubjectCard = ({ subject, gradeLevel = 'k-3', hasProgress = true, studentId, onClick }: SubjectCardProps) => {
  const navigate = useNavigate();
  
  // Handle both string and Subject interface as input
  const subjectId = typeof subject === 'string' ? subject : subject.id;
  const config = subjectConfig[subjectId as keyof typeof subjectConfig] || {
    title: typeof subject !== 'string' ? subject.name : 'Unknown',
    description: {
      'k-3': typeof subject !== 'string' ? subject.description : '',
      '4-6': typeof subject !== 'string' ? subject.description : '',
      '7-9': typeof subject !== 'string' ? subject.description : '',
    },
    color: typeof subject !== 'string' ? subject.color : 'bg-gray-500',
    icon: Calculator, // Default icon
    progress: {
      'k-3': 0,
      '4-6': 0,
      '7-9': 0,
    },
    lessons: {
      'k-3': ['Sample Lesson 1', 'Sample Lesson 2', 'Sample Lesson 3'],
      '4-6': ['Sample Lesson 1', 'Sample Lesson 2', 'Sample Lesson 3'],
      '7-9': ['Sample Lesson 1', 'Sample Lesson 2', 'Sample Lesson 3'],
    },
  };
  
  const [progress, setProgress] = useState(config.progress[gradeLevel]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchSubjectProgress = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        // Fetch progress data for this specific subject
        const progressData = await studentProgressService.getSubjectProgress(studentId);
        const subjectData = progressData.find(item => 
          item.subject.toLowerCase() === config.title.toLowerCase()
        );
        
        if (subjectData) {
          setProgress(subjectData.progress);
        }
      } catch (error) {
        console.error("Error fetching subject progress:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubjectProgress();
  }, [studentId, subjectId, config.title]);
  
  const handleContinueLearning = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Default to first lesson if no progress, otherwise continue from most recent
    const topicIndex = hasProgress ? Math.floor(progress / 100 * config.lessons[gradeLevel].length) : 0;
    const selectedTopic = config.lessons[gradeLevel][topicIndex] || config.lessons[gradeLevel][0];
    
    // Navigate to AI Learning with subject, grade level and topic
    navigate('/ai-learning', { 
      state: { 
        gradeLevel,
        subject: config.title,
        topic: selectedTopic,
        studentId, // Pass along student ID if available
        autoStart: true, // Signal to auto-start content
        isNewLesson: !hasProgress // Signal this is a new lesson for a new student
      } 
    });
  };

  const Icon = config.icon;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={`h-16 ${config.color}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.title}
          </CardTitle>
          {isLoading ? (
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
          ) : hasProgress ? (
            <Badge variant="outline" className="text-xs">
              {progress}% Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-eduPastel-purple/20">
              New
            </Badge>
          )}
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
                    autoStart: true,
                    isNewLesson: !hasProgress
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
          {hasProgress ? 'Continue Learning' : 'Start Learning'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubjectCard;
