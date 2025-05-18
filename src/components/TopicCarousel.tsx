import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { BookOpen, Calculator, FlaskConical, Atom, Globe, Code, Languages, Music, Palette, GraduationCap, Calendar, BookOpenCheck, PencilRuler } from "lucide-react";

const topics = [
  {
    id: 1,
    title: "Mathematics",
    description: "Master algebra, geometry, and mathematical reasoning! Ages 12-15",
    color: "bg-eduPastel-blue",
    icon: Calculator,
    lessons: ["Algebra Foundations", "Geometry Concepts", "Statistics"],
    progress: 20,
  },
  {
    id: 2,
    title: "English",
    description: "Master essays, literature analysis, and advanced grammar! Ages 12-15",
    color: "bg-eduPastel-green",
    icon: BookOpenCheck,
    lessons: ["Essay Structure", "Literary Analysis", "Advanced Grammar"],
    progress: 35,
  },
  {
    id: 3,
    title: "Science",
    description: "Investigate chemistry, physics, and biology concepts! Ages 12-15",
    color: "bg-eduPastel-peach",
    icon: FlaskConical,
    lessons: ["Chemistry Basics", "Forces & Motion", "Cell Biology"],
    progress: 15,
  },
  {
    id: 4,
    title: "History",
    description: "Explore ancient civilizations, world wars and global events! Ages 12-15",
    color: "bg-eduPastel-yellow",
    icon: BookOpen,
    lessons: ["Ancient Civilizations", "World Wars", "Modern History"],
    progress: 40,
  },
  {
    id: 5,
    title: "Computer Science",
    description: "Learn programming, algorithms, and computational thinking! Ages 12-15",
    color: "bg-eduPastel-purple",
    icon: Code,
    lessons: ["Programming Basics", "Data Structures", "Web Development"],
    progress: 10,
  },
  {
    id: 6,
    title: "Foreign Languages",
    description: "Master vocabulary, grammar and communication skills! Ages 12-15",
    color: "bg-eduPastel-blue",
    icon: Languages,
    lessons: ["Basic Vocabulary", "Grammar Rules", "Conversation Practice"],
    progress: 25,
  },
  {
    id: 7,
    title: "Music",
    description: "Study music theory, instruments, and composition! Ages 12-15",
    color: "bg-eduPastel-green",
    icon: Music,
    lessons: ["Music Theory", "Instruments", "Music History"],
    progress: 30,
  },
  {
    id: 8,
    title: "Art",
    description: "Explore drawing techniques, art history, and creative expression! Ages 12-15",
    color: "bg-eduPastel-peach",
    icon: Palette,
    lessons: ["Drawing Basics", "Color Theory", "Art History"],
    progress: 5,
  },
  {
    id: 9,
    title: "Geography",
    description: "Discover continents, countries, and natural wonders! Ages 12-15",
    color: "bg-eduPastel-yellow",
    icon: Globe,
    lessons: ["Continents", "Map Reading", "Physical Geography"],
    progress: 15,
  },
  {
    id: 10,
    title: "Physical Education",
    description: "Learn about fitness, sports, and healthy habits! Ages 12-15",
    color: "bg-eduPastel-purple",
    icon: GraduationCap,
    lessons: ["Team Sports", "Fitness Basics", "Health & Nutrition"],
    progress: 45,
  },
  {
    id: 11,
    title: "Social Studies",
    description: "Explore communities, government, and cultural diversity! Ages 12-15",
    color: "bg-eduPastel-blue",
    icon: BookOpen,
    lessons: ["Communities", "Government", "Cultural Studies"],
    progress: 20,
  },
  {
    id: 12,
    title: "Life Skills",
    description: "Develop organization, communication, and problem-solving skills! Ages 12-15",
    color: "bg-eduPastel-green",
    icon: Calendar,
    lessons: ["Organization", "Communication", "Problem Solving"],
    progress: 10,
  }
];

const TopicCarousel = ({ gradeLevel = 'k-3' }: { gradeLevel?: 'k-3' | '4-6' | '7-9' }) => {
  const navigate = useNavigate();
  
  const handleStartLearning = (topic: string, lesson: string) => {
    navigate('/ai-learning', { 
      state: { 
        gradeLevel,
        subject: topic,
        topic: lesson,
        autoStart: true,
        isNewLesson: false
      } 
    });
  };

  return (
    <div className="w-full py-6">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {topics.map((topic) => (
            <CarouselItem key={topic.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className={`h-16 ${topic.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <topic.icon className="h-5 w-5" />
                      {topic.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {topic.progress}% Complete
                    </Badge>
                  </div>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Popular Lessons:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {topic.lessons.map((lesson) => (
                        <li 
                          key={lesson} 
                          className="cursor-pointer hover:text-eduPurple transition-colors"
                          onClick={() => handleStartLearning(topic.title, lesson)}
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
                    onClick={() => handleStartLearning(topic.title, topic.lessons[0])}
                  >
                    Start Learning
                  </Button>
                </CardFooter>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:flex">
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default TopicCarousel;
