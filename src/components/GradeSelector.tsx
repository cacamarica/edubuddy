
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface GradeGroup {
  name: string;
  ageRange: string;
  grades: string;
  description: string;
  bgColor: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
}

const gradeGroups: GradeGroup[] = [
  {
    name: "Early Learners",
    ageRange: "5-7 years old",
    grades: "K-3",
    description: "Fun games and colorful lessons for our youngest learners!",
    bgColor: "bg-eduPastel-yellow",
    gradeLevel: 'k-3'
  },
  {
    name: "Intermediate",
    ageRange: "8-10 years old",
    grades: "4-6",
    description: "Building skills with interactive challenges!",
    bgColor: "bg-eduPastel-green",
    gradeLevel: '4-6'
  },
  {
    name: "Advanced",
    ageRange: "11-15 years old",
    grades: "7-9",
    description: "Deeper concepts and advanced learning adventures!",
    bgColor: "bg-eduPastel-blue",
    gradeLevel: '7-9'
  }
];

const GradeSelector = () => {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleGradeSelect = (gradeLevel: string) => {
    setSelectedGrade(gradeLevel);
    setTimeout(() => {
      navigate("/lessons", { state: { gradeLevel } });
    }, 500);
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Grade Level</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gradeGroups.map((group) => (
          <Card 
            key={group.name}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
              selectedGrade === group.gradeLevel ? "ring-4 ring-eduPurple" : ""
            }`}
          >
            <div className={`h-16 ${group.bgColor}`} />
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                {group.ageRange} | Grades {group.grades}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{group.description}</p>
              <Button 
                className="w-full bg-eduPurple hover:bg-eduPurple-dark"
                onClick={() => handleGradeSelect(group.gradeLevel)}
              >
                Select
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GradeSelector;
