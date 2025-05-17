import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// List of allowed educational topics for AI learning
const ALLOWED_TOPICS = [
  // Math topics
  'algebra', 'geometry', 'calculus', 'arithmetic', 'statistics', 'trigonometry', 'numbers', 'fractions',
  'decimals', 'percentages', 'counting', 'multiplication', 'division', 'addition', 'subtraction',
  
  // Science topics
  'biology', 'chemistry', 'physics', 'astronomy', 'earth science', 'animals', 'plants',
  'human body', 'ecosystems', 'weather', 'elements', 'electricity', 'energy', 'forces', 'motion',
  
  // English/Language topics
  'grammar', 'vocabulary', 'spelling', 'reading', 'writing', 'literature', 'poetry', 'fiction',
  'essays', 'storytelling', 'alphabets', 'phonics', 'verbs', 'nouns', 'adjectives',
  
  // Social Studies topics
  'history', 'geography', 'civics', 'economics', 'culture', 'maps', 'countries',
  'continents', 'oceans', 'people', 'communities', 'government', 'landmarks',
  
  // Other academic subjects
  'music', 'art', 'physical education', 'health', 'technology', 'computer science', 'coding'
];

interface TopicSelectorProps {
  subject: string;
  subjectOptions: string[];
  topicSuggestions: string[];
  customTopic: string;
  onSubjectChange: (subject: string) => void;
  onTopicSelect: (topic: string) => void;
  onCustomTopicChange: (topic: string) => void;
  onCreateContent: () => void;
  studentId?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  subject,
  subjectOptions,
  topicSuggestions,
  customTopic,
  onSubjectChange,
  onTopicSelect,
  onCustomTopicChange,
  onCreateContent,
  studentId,
  gradeLevel
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<{ name: string; age: number; gradeLevel: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isValidTopic, setIsValidTopic] = useState<boolean>(true);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Fetch student information if studentId is provided
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (studentId) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('students')
            .select('name, age, grade_level')
            .eq('id', studentId)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching student info:', error);
            toast.error(language === 'id' 
              ? 'Gagal memuat informasi siswa' 
              : 'Failed to load student information');
          } else if (data) {
            setStudentInfo({
              name: data.name,
              age: data.age || 6,
              gradeLevel: data.grade_level
            });
          }
        } catch (error) {
          console.error('Error in fetchStudentInfo:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchStudentInfo();
  }, [studentId, language]);

  // Validate if topic is educational/school-related
  const validateTopic = (topic: string) => {
    if (!topic.trim()) {
      setIsValidTopic(false);
      setValidationMessage(language === 'id' 
        ? 'Silakan masukkan topik pembelajaran' 
        : 'Please enter a learning topic');
      return false;
    }
    
    const normalizedTopic = topic.toLowerCase().trim();
    
    // Check if the topic contains any of the allowed educational topics
    const isEducational = ALLOWED_TOPICS.some(allowedTopic => 
      normalizedTopic.includes(allowedTopic) || 
      allowedTopic.includes(normalizedTopic)
    );
    
    // Allow suggested topics automatically
    const isSuggested = topicSuggestions.some(suggestion => 
      suggestion.toLowerCase().includes(normalizedTopic) || 
      normalizedTopic.includes(suggestion.toLowerCase())
    );
    
    // Check if specific non-educational keywords are present
    const nonEducationalKeywords = ['game', 'movie', 'entertainment', 'social media', 'dating', 'gambling'];
    const hasNonEducationalKeyword = nonEducationalKeywords.some(keyword => 
      normalizedTopic.includes(keyword)
    );
    
    const isValid = isEducational || isSuggested || !hasNonEducationalKeyword;
    
    setIsValidTopic(isValid);
    
    if (!isValid) {
      setValidationMessage(language === 'id'
        ? 'Silakan masukkan topik akademik yang terkait dengan sekolah'
        : 'Please enter an academic topic related to school subjects');
    } else {
      setValidationMessage('');
    }
    
    return isValid;
  };

  // Handle topic change with validation
  const handleTopicChange = (value: string) => {
    onCustomTopicChange(value);
    if (value.length > 3) {
      validateTopic(value);
    } else {
      setIsValidTopic(true);
      setValidationMessage('');
    }
  };

  // Display message about personalized content
  const getPersonalizedMessage = () => {
    if (studentInfo) {
      return language === 'id' 
        ? `${t('topic.personalizedFor')} ${studentInfo.name} (${studentInfo.age} ${t('topic.years')}, ${t('topic.grade')} ${studentInfo.gradeLevel})`
        : `${t('topic.personalizedFor')} ${studentInfo.name} (${studentInfo.age} ${t('topic.years')}, ${t('topic.grade')} ${studentInfo.gradeLevel})`;
    }
    
    if (gradeLevel) {
      return language === 'id'
        ? `${t('learning.contentTailoredGrade')} ${gradeLevel}`
        : `${t('learning.contentTailoredGrade')} ${gradeLevel}`;
    }
    
    return '';
  };

  const handleCreateContent = () => {
    if (!validateTopic(customTopic)) {
      return;
    }
    
    if (!user && studentId) {
      // Display a warning if there's no authenticated user but trying to use student features
      toast.warning(language === 'id'
        ? 'Login diperlukan untuk menyimpan progres belajar'
        : 'Login required to save learning progress');
    }
    
    onCreateContent();
  };

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display">
          {language === 'id' ? 'Buat Konten Pembelajaran Anda' : 'Create Your Learning Content'}
        </CardTitle>
        <CardDescription>
          {language === 'id' 
            ? 'Beritahu kami topik akademik apa yang ingin Anda pelajari dan kami akan membuat konten khusus untuk Anda!' 
            : 'Tell us what academic topic you want to learn about and we\'ll create custom content just for you!'}
        </CardDescription>
        {(studentInfo || gradeLevel) && (
          <div className="mt-2 text-sm font-medium text-eduPurple">
            {getPersonalizedMessage()}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">{language === 'id' ? 'Mata Pelajaran' : 'Subject'}</Label>
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((subjectOption) => (
              <Button 
                key={subjectOption}
                type="button"
                variant={subject === subjectOption ? "default" : "outline"}
                className={subject === subjectOption ? "bg-eduPurple hover:bg-eduPurple-dark" : ""}
                onClick={() => onSubjectChange(subjectOption)}
              >
                {subjectOption}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="topic">
            {language === 'id' ? 'Topik Akademik' : 'Academic Topic'}
          </Label>
          <Input 
            id="customTopic"
            placeholder={language === 'id' 
              ? "Masukkan topik akademik yang ingin Anda pelajari..." 
              : "Enter an academic topic you want to learn about..."}
            value={customTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            className={!isValidTopic ? "border-red-500" : ""}
          />
          {!isValidTopic && (
            <p className="text-xs text-red-500 mt-1">
              {validationMessage}
            </p>
          )}
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">
              {language === 'id' 
                ? `Atau pilih topik yang disarankan untuk ${subject}:` 
                : `Or select a suggested topic for ${subject}:`}
            </p>
            <div className="flex flex-wrap gap-2">
              {topicSuggestions?.map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onTopicSelect(suggestion);
                    onCustomTopicChange(suggestion);
                    setIsValidTopic(true);
                    setValidationMessage('');
                  }}
                  className="bg-eduPastel-purple hover:bg-eduPastel-purple/80"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={handleCreateContent} 
          disabled={!customTopic.trim() || loading || !isValidTopic}
          className="bg-eduPurple hover:bg-eduPurple-dark"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {language === 'id' ? 'Buat Konten Pembelajaran' : 'Create Learning Content'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TopicSelector;
