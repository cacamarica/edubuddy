import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// List of allowed educational topics for AI learning
const ALLOWED_TOPICS = [
  // Math topics
  'algebra', 'geometry', 'calculus', 'arithmetic', 'statistics', 'trigonometry', 'numbers', 
  'fractions', 'decimals', 'percentages', 'counting', 'multiplication', 'division', 'addition', 'subtraction',
  
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
  onCreateContent: (subtopic?: string) => void;
  studentId?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
}

// Interface for subtopics
interface SubtopicOption {
  value: string;
  label: string;
  description?: string;
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
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [subtopics, setSubtopics] = useState<SubtopicOption[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Topic, Step 2: Subtopic

  // Define subtopics for common topics based on grade level
  const getSubtopicsForTopic = (topic: string, grade: 'k-3' | '4-6' | '7-9' = 'k-3'): SubtopicOption[] => {
    const subtopicMap: Record<string, Record<string, SubtopicOption[]>> = {
      'Math': {
        'k-3': [
          { value: 'numbers', label: 'Numbers and Counting', description: 'Learning to count and recognize numbers' },
          { value: 'addition', label: 'Addition', description: 'Learning to add numbers together' },
          { value: 'subtraction', label: 'Subtraction', description: 'Learning to subtract numbers' },
          { value: 'shapes', label: 'Shapes', description: 'Learning about different shapes' },
          { value: 'patterns', label: 'Patterns', description: 'Finding and creating patterns' },
          { value: 'measurement', label: 'Measurement', description: 'Measuring length, weight, and time' }
        ],
        '4-6': [
          { value: 'fractions', label: 'Fractions', description: 'Understanding parts of a whole' },
          { value: 'decimals', label: 'Decimals', description: 'Working with decimal numbers' },
          { value: 'multiplication', label: 'Multiplication', description: 'Multiplying numbers together' },
          { value: 'division', label: 'Division', description: 'Dividing numbers' },
          { value: 'geometry', label: 'Geometry', description: 'Working with shapes and angles' },
          { value: 'data', label: 'Data and Graphs', description: 'Collecting and showing information' }
        ],
        '7-9': [
          { value: 'algebra', label: 'Algebra', description: 'Working with variables and equations' },
          { value: 'geometry', label: 'Geometry', description: 'Advanced shapes and measurements' },
          { value: 'statistics', label: 'Statistics', description: 'Analyzing data and probability' },
          { value: 'ratios', label: 'Ratios and Proportions', description: 'Comparing quantities' },
          { value: 'integers', label: 'Integers', description: 'Positive and negative numbers' },
          { value: 'equations', label: 'Equations', description: 'Solving for unknown values' }
        ]
      },
      'Science': {
        'k-3': [
          { value: 'plants', label: 'Plants', description: 'How plants grow and what they need' },
          { value: 'animals', label: 'Animals', description: 'Different types of animals and their habitats' },
          { value: 'weather', label: 'Weather', description: 'Weather patterns and seasons' },
          { value: 'five-senses', label: 'Five Senses', description: 'How we experience the world' },
          { value: 'earth', label: 'Earth and Space', description: 'Our planet and the solar system' },
          { value: 'living-things', label: 'Living Things', description: 'What makes something alive' }
        ],
        '4-6': [
          { value: 'ecosystems', label: 'Ecosystems', description: 'How living things interact' },
          { value: 'matter', label: 'Matter', description: 'Properties of materials' },
          { value: 'energy', label: 'Energy', description: 'Different forms of energy' },
          { value: 'human-body', label: 'Human Body', description: 'Body systems and how they work' },
          { value: 'forces', label: 'Forces and Motion', description: 'Pushes, pulls, and how things move' },
          { value: 'earth-changes', label: 'Earth Changes', description: 'How Earth changes over time' }
        ],
        '7-9': [
          { value: 'cells', label: 'Cells', description: 'The basic units of life' },
          { value: 'chemistry', label: 'Chemistry', description: 'Elements and chemical reactions' },
          { value: 'physics', label: 'Physics', description: 'Forces, energy, and motion' },
          { value: 'genetics', label: 'Genetics', description: 'How traits are passed down' },
          { value: 'earth-systems', label: 'Earth Systems', description: "Earth's atmosphere, hydrosphere, and geosphere" },
          { value: 'astronomy', label: 'Astronomy', description: 'The solar system and beyond' }
        ]
      },
      'English': {
        'k-3': [
          { value: 'phonics', label: 'Phonics', description: 'Letter sounds and reading basics' },
          { value: 'sight-words', label: 'Sight Words', description: 'Common words to recognize' },
          { value: 'reading', label: 'Reading Comprehension', description: 'Understanding stories' },
          { value: 'writing', label: 'Writing', description: 'Creating sentences and stories' },
          { value: 'speaking', label: 'Speaking and Listening', description: 'Communicating with others' },
          { value: 'vocabulary', label: 'Vocabulary', description: 'Learning new words' }
        ],
        '4-6': [
          { value: 'grammar', label: 'Grammar', description: 'Parts of speech and sentence structure' },
          { value: 'writing', label: 'Writing', description: 'Essays, stories, and reports' },
          { value: 'literature', label: 'Literature', description: 'Stories, poems, and books' },
          { value: 'vocabulary', label: 'Vocabulary', description: 'Using context clues and word parts' },
          { value: 'research', label: 'Research Skills', description: 'Finding and using information' },
          { value: 'speaking', label: 'Public Speaking', description: 'Presenting to an audience' }
        ],
        '7-9': [
          { value: 'literature-analysis', label: 'Literary Analysis', description: 'Analyzing themes and characters' },
          { value: 'writing', label: 'Writing', description: 'Essays and creative writing' },
          { value: 'research', label: 'Research', description: 'Finding and evaluating sources' },
          { value: 'media-literacy', label: 'Media Literacy', description: 'Understanding different media forms' },
          { value: 'grammar', label: 'Advanced Grammar', description: 'Complex sentence structures' },
          { value: 'debate', label: 'Debate and Rhetoric', description: 'Making persuasive arguments' }
        ]
      },
      'Social Studies': {
        'k-3': [
          { value: 'families', label: 'Families', description: 'Learning about family structures' },
          { value: 'communities', label: 'Communities', description: 'Different types of communities' },
          { value: 'maps', label: 'Maps', description: 'Reading and creating simple maps' },
          { value: 'culture', label: 'Culture', description: 'Traditions and celebrations' },
          { value: 'jobs', label: 'Jobs', description: 'Different occupations in a community' },
          { value: 'history', label: 'History', description: 'People and events from the past' }
        ],
        '4-6': [
          { value: 'regions', label: 'Regions', description: 'Different areas and their features' },
          { value: 'government', label: 'Government', description: 'How government works' },
          { value: 'history', label: 'History', description: 'Important people and events' },
          { value: 'economics', label: 'Economics', description: 'Money, goods, and services' },
          { value: 'geography', label: 'Geography', description: 'Physical features of the Earth' },
          { value: 'culture', label: 'Culture and Diversity', description: 'Different cultures around the world' }
        ],
        '7-9': [
          { value: 'civics', label: 'Civics', description: 'Government systems and citizenship' },
          { value: 'world-history', label: 'World History', description: 'Major events and civilizations' },
          { value: 'economics', label: 'Economics', description: 'Economic systems and concepts' },
          { value: 'geography', label: 'Geography', description: 'Physical and human geography' },
          { value: 'contemporary-issues', label: 'Contemporary Issues', description: 'Current events and global challenges' },
          { value: 'cultural-studies', label: 'Cultural Studies', description: 'Diverse cultures and perspectives' }
        ]
      }
    };

    // Handle non-main subjects or custom topics
    const mainSubject = subject === 'Mathematics' ? 'Math' : 
                        subject === 'Language Arts' ? 'English' : subject;

    // Return subtopics if they exist for this topic/grade combination
    if (subtopicMap[mainSubject]?.[grade]) {
      return subtopicMap[mainSubject][grade];
    }

    // Generate generic subtopics for custom topics
    return [
      { value: 'basics', label: t('subtopics.basics'), description: t('subtopics.basics_desc') },
      { value: 'intermediate', label: t('subtopics.intermediate'), description: t('subtopics.intermediate_desc') },
      { value: 'advanced', label: t('subtopics.advanced'), description: t('subtopics.advanced_desc') },
      { value: 'applications', label: t('subtopics.applications'), description: t('subtopics.applications_desc') },
      { value: 'history', label: t('subtopics.history'), description: t('subtopics.history_desc') }
    ];
  };

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

  // Update subtopics when topic changes
  useEffect(() => {
    if (customTopic) {
      const availableSubtopics = getSubtopicsForTopic(customTopic, gradeLevel || 'k-3');
      setSubtopics(availableSubtopics);
      
      // Reset subtopic selection when topic changes
      setSelectedSubtopic('');
    }
  }, [customTopic, gradeLevel, subject]);

  // Enhanced validation to be more permissive but still child-appropriate
  const validateTopic = (topic: string) => {
    if (!topic.trim()) {
      setIsValidTopic(false);
      setValidationMessage(language === 'id' 
        ? 'Silakan masukkan topik pembelajaran' 
        : 'Please enter a learning topic');
      return false;
    }
    
    const normalizedTopic = topic.toLowerCase().trim();
    
    // Check if the topic contains any of the allowed educational topics - be more permissive
    const isEducational = ALLOWED_TOPICS.some(allowedTopic => 
      normalizedTopic.includes(allowedTopic) || 
      allowedTopic.includes(normalizedTopic)
    ) || normalizedTopic.length >= 3; // More permissive - most educational terms are valid
    
    // Allow suggested topics automatically
    const isSuggested = topicSuggestions.some(suggestion => 
      suggestion.toLowerCase().includes(normalizedTopic) || 
      normalizedTopic.includes(suggestion.toLowerCase())
    );
    
    // Check if specific non-educational or inappropriate keywords are present
    const nonEducationalKeywords = ['game', 'movie', 'entertainment', 'social media', 'dating', 
      'gambling', 'weapon', 'gun', 'violence', 'adult', 'drug'];
    const hasNonEducationalKeyword = nonEducationalKeywords.some(keyword => 
      normalizedTopic.includes(keyword)
    );
    
    const isValid = (isEducational || isSuggested) && !hasNonEducationalKeyword;
    
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

  const handleNextStep = () => {
    if (!validateTopic(customTopic)) {
      return;
    }
    setStep(2);
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
    
    onCreateContent(selectedSubtopic);
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
        {step === 1 ? (
          <>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicSuggestions.map((suggestion) => (
                  <Button 
                    key={suggestion}
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      onTopicSelect(suggestion);
                      onCustomTopicChange(suggestion);
                      setIsValidTopic(true);
                      setValidationMessage('');
                    }}
                    className={`justify-start px-4 py-6 h-auto text-left ${customTopic === suggestion ? "border-2 border-eduPurple bg-eduPastel-purple/20" : "bg-eduPastel-purple/10 hover:bg-eduPastel-purple/20"}`}
                  >
                    {suggestion}
                  </Button>
                ))}
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    onCustomTopicChange('');
                    setIsValidTopic(true);
                    setValidationMessage('');
                  }}
                  className="justify-start px-4 py-6 h-auto text-left border-dashed"
                >
                  {language === 'id' ? 'Topik Kustom...' : 'Custom Topic...'}
                </Button>
              </div>
              
              {customTopic === '' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="customTopic">
                    {language === 'id' ? 'Masukkan Topik Kustom' : 'Enter Custom Topic'}
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
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subtopic">
                  {language === 'id' ? 'Subtopik untuk ' : 'Subtopics for '} 
                  <strong>{customTopic}</strong>
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep(1)}
                  className="text-muted-foreground"
                >
                  {language === 'id' ? 'Ubah Topik' : 'Change Topic'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subtopics.map((subtopic) => (
                  <div 
                    key={subtopic.value} 
                    className={`p-4 rounded-lg cursor-pointer ${selectedSubtopic === subtopic.value ? 'bg-eduPastel-purple border-2 border-eduPurple' : 'bg-muted hover:bg-muted/80 border border-transparent'}`}
                    onClick={() => setSelectedSubtopic(subtopic.value)}
                  >
                    <h4 className="font-medium">{subtopic.label}</h4>
                    {subtopic.description && (
                      <p className="text-sm text-muted-foreground mt-1">{subtopic.description}</p>
                    )}
                  </div>
                ))}
                <div 
                  className="p-4 rounded-lg cursor-pointer border border-dashed hover:bg-muted/50"
                  onClick={() => setSelectedSubtopic('')}
                >
                  <h4 className="font-medium">
                    {language === 'id' ? 'Seluruh Topik' : 'Entire Topic'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'id' ? 'Pelajari tentang keseluruhan topik' : 'Learn about the entire topic'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {step === 1 ? (
          <Button 
            onClick={handleNextStep} 
            disabled={!customTopic.trim() || loading || !isValidTopic}
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {language === 'id' ? 'Pilih Subtopik' : 'Choose Subtopic'}
          </Button>
        ) : (
          <Button 
            onClick={handleCreateContent} 
            disabled={loading}
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {language === 'id' ? 'Buat Konten Pembelajaran' : 'Create Learning Content'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TopicSelector;
