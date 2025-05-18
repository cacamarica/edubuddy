
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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface GradeGroup {
  name: string;
  ageRange: string;
  grades: string;
  description: string;
  bgColor: string;
  gradeLevel: 'k1' | 'k2' | 'k-3' | '4-6' | '7-9';
}

const gradeGroups: GradeGroup[] = [
  {
    name: "Playgroup",
    ageRange: "3-4 years old",
    grades: "K1",
    description: "First steps in learning with colorful and fun activities!",
    bgColor: "bg-eduPastel-pink",
    gradeLevel: 'k1'
  },
  {
    name: "Kindergarten",
    ageRange: "4-5 years old",
    grades: "K2",
    description: "Discovery and basic skills through creative play!",
    bgColor: "bg-eduPastel-orange",
    gradeLevel: 'k2'
  },
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
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const handleGradeSelect = (gradeLevel: string) => {
    setSelectedGrade(gradeLevel);
    setTimeout(() => {
      if (user) {
        // If already logged in, go directly to lessons
        navigate("/lessons", { state: { gradeLevel } });
      } else {
        // If not logged in, redirect to auth page
        navigate("/auth", { state: { gradeLevel, action: 'signin' } });
      }
    }, 500);
  };
  
  const getLocalizedName = (name: string): string => {
    if (language === 'id') {
      switch(name) {
        case 'Playgroup': return 'Kelompok Bermain';
        case 'Kindergarten': return 'Taman Kanak-kanak';
        case 'Early Learners': return 'Pemula';
        case 'Intermediate': return 'Menengah';
        case 'Advanced': return 'Lanjutan';
        default: return name;
      }
    }
    return name;
  };
  
  const getLocalizedDescription = (gradeLevel: 'k1' | 'k2' | 'k-3' | '4-6' | '7-9'): string => {
    if (language === 'id') {
      switch(gradeLevel) {
        case 'k1': return 'Langkah pertama belajar dengan aktivitas yang berwarna dan menyenangkan!';
        case 'k2': return 'Penemuan dan keterampilan dasar melalui permainan kreatif!';
        case 'k-3': return 'Permainan menyenangkan dan pelajaran berwarna untuk pelajar termuda!';
        case '4-6': return 'Membangun keterampilan dengan tantangan interaktif!';
        case '7-9': return 'Konsep lebih mendalam dan petualangan belajar tingkat lanjut!';
      }
    }
    
    const group = gradeGroups.find(g => g.gradeLevel === gradeLevel);
    return group?.description || '';
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-8">
        {language === 'id' ? 'Pilih Tingkat Kelas Anda' : 'Choose Your Grade Level'}
      </h2>
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
              <CardTitle>{getLocalizedName(group.name)}</CardTitle>
              <CardDescription>
                {group.ageRange} | {language === 'id' ? 'Kelas' : 'Grades'} {group.grades}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{getLocalizedDescription(group.gradeLevel)}</p>
              <Button 
                className="w-full bg-eduPurple hover:bg-eduPurple-dark"
                onClick={() => handleGradeSelect(group.gradeLevel)}
              >
                {language === 'id' ? 'Pilih' : 'Select'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GradeSelector;
