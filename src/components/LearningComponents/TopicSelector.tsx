
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
            .maybeSingle(); // Using maybeSingle instead of single to handle case when no data is found
            
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
            ? 'Beritahu kami apa yang ingin Anda pelajari dan kami akan membuat konten khusus untuk Anda!' 
            : 'Tell us what you want to learn about and we\'ll create custom content just for you!'}
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
          <Label htmlFor="topic">{language === 'id' ? 'Topik' : 'Topic'}</Label>
          <Input 
            id="customTopic"
            placeholder={language === 'id' 
              ? "Masukkan topik apa pun yang ingin Anda pelajari..." 
              : "Enter any topic you want to learn about..."}
            value={customTopic}
            onChange={(e) => onCustomTopicChange(e.target.value)}
          />
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
                    onCustomTopicChange(suggestion); // Also update the input field
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
          disabled={!customTopic.trim() || loading}
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
