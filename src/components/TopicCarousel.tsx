import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStudentProfile } from '@/contexts/StudentProfileContext';

interface TopicCarouselProps {
  subjectName: string;
  topicList: string[];
  onSelectTopic: (topic: string, subtopic?: string) => void;
  onBackClick: () => void;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  currentGrade?: string;
}

interface Subtopic {
  name: string;
  description: string;
}

interface TopicWithSubtopics {
  topic: string;
  subtopics: Subtopic[];
}

// Helper function to save custom topic to localStorage as a fallback
const saveCustomTopicToLocalStorage = (data: {
  student_id: string;
  subject: string;
  topic: string;
  grade_level: string;
}) => {
  try {
    // Get existing topics or initialize empty array
    const storedTopics = localStorage.getItem('custom_topics');
    const customTopics = storedTopics ? JSON.parse(storedTopics) : [];
    
    // Add new topic with timestamp
    customTopics.push({
      ...data,
      created_at: new Date().toISOString(),
      id: `local-${Date.now()}`
    });
    
    // Save back to localStorage
    localStorage.setItem('custom_topics', JSON.stringify(customTopics));
    console.log('Saved custom topic to localStorage fallback');
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// Helper function to find similar topics
const findSimilarTopics = (input: string, availableTopics: string[], maxResults = 3) => {
  const normalized = input.toLowerCase();
  const results: {topic: string, similarity: number}[] = [];
  
  for (const topic of availableTopics) {
    const topicLower = topic.toLowerCase();
    
    // Check for partial matches
    if (topicLower.includes(normalized) || normalized.includes(topicLower)) {
      results.push({
        topic,
        similarity: 0.8
      });
      continue;
    }
    
    // Check for close matches (simple Levenshtein-like calculation)
    // For words that might be misspelled
    let matchCount = 0;
    const inputChars = normalized.split('');
    const topicChars = topicLower.split('');
    
    for (const char of inputChars) {
      if (topicChars.includes(char)) {
        matchCount++;
      }
    }
    
    const similarity = inputChars.length > 0 ? matchCount / Math.max(inputChars.length, topicChars.length) : 0;
    
    if (similarity > 0.5) {
      results.push({
        topic,
        similarity
      });
    }
  }
  
  // Sort by similarity and take top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
    .map(result => result.topic);
};

const TopicCarousel: React.FC<TopicCarouselProps> = ({
  subjectName,
  topicList,
  onSelectTopic,
  onBackClick,
  gradeLevel,
  currentGrade
}) => {
  const { language } = useLanguage();
  const { selectedProfile } = useStudentProfile();
  const [currentPage, setCurrentPage] = useState(0);
  const [customTopic, setCustomTopic] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showSubtopics, setShowSubtopics] = useState(false);
  const [topicsWithSubtopics, setTopicsWithSubtopics] = useState<Record<string, Subtopic[]>>({});
  
  // Load subtopics based on curriculum for each topic
  useEffect(() => {
    // This would ideally come from your database, but for now we'll use a static mapping
    const fetchSubtopics = async () => {
      const subtopicsByTopic: Record<string, Subtopic[]> = {};
      
      // Cambridge curriculum-aligned subtopics by subject and grade level
      if (subjectName === 'Science') {
        // Science topics for K-3 (Cambridge Primary Stage 1-3)
        if (gradeLevel === 'k-3') {
          if (topicList.includes('Living Things')) {
            subtopicsByTopic['Living Things'] = [
              { name: 'Characteristics of Living Things', description: 'Features that distinguish living organisms from non-living objects' },
              { name: 'Humans and Animals', description: 'Basic body parts and their functions' },
              { name: 'Plants', description: 'Parts of plants and what they need to grow' },
              { name: 'Living Things in their Environment', description: 'How living things adapt to where they live' },
              { name: 'Senses', description: 'The five senses and how we use them' }
            ];
          }
          if (topicList.includes('Materials')) {
            subtopicsByTopic['Materials'] = [
              { name: 'Properties of Materials', description: 'Identifying and comparing different materials' },
              { name: 'Sorting Materials', description: 'Grouping materials based on their properties' },
              { name: 'Everyday Uses of Materials', description: 'How different materials are used' }
            ];
          }
        }
        // Science topics for 4-6 (Cambridge Primary Stage 4-6)
        else if (gradeLevel === '4-6') {
          if (topicList.includes('Living Things')) {
            subtopicsByTopic['Living Things'] = [
              { name: 'Life Processes', description: 'Key processes that all living things perform' },
              { name: 'Classification of Organisms', description: 'How living things are organized into groups' },
              { name: 'Human Body Systems', description: 'Major body systems and their functions' },
              { name: 'Plants and Photosynthesis', description: 'How plants make their own food' },
              { name: 'Ecosystems and Food Chains', description: 'How energy flows through living systems' }
            ];
          }
          if (topicList.includes('Matter')) {
            subtopicsByTopic['Matter'] = [
              { name: 'States of Matter', description: 'Solids, liquids, gases and their properties' },
              { name: 'Changes of State', description: 'How materials change between states' },
              { name: 'Mixtures and Separation', description: 'Combining materials and separating them again' },
              { name: 'Properties of Materials', description: 'Advanced properties like conductivity and insulation' }
            ];
          }
          if (topicList.includes('Forces and Energy')) {
            subtopicsByTopic['Forces and Energy'] = [
              { name: 'Types of Forces', description: 'Push, pull, friction, gravity and their effects' },
              { name: 'Simple Machines', description: 'Levers, pulleys, inclined planes and how they work' },
              { name: 'Magnets', description: 'Magnetic materials and magnetic fields' },
              { name: 'Forms of Energy', description: 'Light, sound, heat, and electrical energy' }
            ];
          }
        }
        // Science topics for 7-9 (Cambridge Lower Secondary Stage 7-9)
        else if (gradeLevel === '7-9') {
          if (topicList.includes('Living Things')) {
            subtopicsByTopic['Living Things'] = [
              { name: 'Cell Structure and Function', description: 'The basic unit of life and specialized cells' },
              { name: 'Organ Systems', description: 'Complex organ systems in humans and animals' },
              { name: 'Reproduction', description: 'Sexual and asexual reproduction in organisms' },
              { name: 'Inheritance and Variation', description: 'How characteristics are passed from parents to offspring' },
              { name: 'Adaptation and Evolution', description: 'How species change over time to survive' }
            ];
          }
          if (topicList.includes('Chemistry')) {
            subtopicsByTopic['Chemistry'] = [
              { name: 'Atoms, Elements and Compounds', description: 'The building blocks of all matter' },
              { name: 'Chemical Reactions', description: 'How substances combine or break down' },
              { name: 'The Periodic Table', description: 'Organization of elements and their properties' },
              { name: 'Acids and Bases', description: 'Properties and reactions of acids and alkalis' }
            ];
          }
          if (topicList.includes('Physics')) {
            subtopicsByTopic['Physics'] = [
              { name: 'Forces and Motion', description: 'Newton\'s laws and their applications' },
              { name: 'Energy Transfers', description: 'How energy changes from one form to another' },
              { name: 'Waves', description: 'Sound waves, light waves and their properties' },
              { name: 'Electricity and Magnetism', description: 'Electric circuits and electromagnetic effects' }
            ];
          }
        }
      } 
      else if (subjectName === 'Math' || subjectName === 'Mathematics') {
        // Math topics for K-3 (Cambridge Primary Stage 1-3)
        if (gradeLevel === 'k-3') {
          if (topicList.includes('Numbers')) {
            subtopicsByTopic['Numbers'] = [
              { name: 'Counting and Number Patterns', description: 'Counting forwards and backwards, recognizing patterns' },
              { name: 'Place Value', description: 'Understanding tens and ones' },
              { name: 'Addition and Subtraction', description: 'Basic addition and subtraction strategies' },
              { name: 'Simple Fractions', description: 'Introduction to halves and quarters' }
            ];
          }
          if (topicList.includes('Shapes')) {
            subtopicsByTopic['Shapes'] = [
              { name: '2D Shapes', description: 'Identifying and describing common 2D shapes' },
              { name: '3D Shapes', description: 'Identifying and describing common 3D shapes' },
              { name: 'Patterns and Symmetry', description: 'Recognizing and continuing patterns' }
            ];
          }
          if (topicList.includes('Measurement')) {
            subtopicsByTopic['Measurement'] = [
              { name: 'Length', description: 'Measuring and comparing lengths' },
              { name: 'Weight/Mass', description: 'Measuring and comparing weights' },
              { name: 'Time', description: 'Telling time and understanding days, months' },
              { name: 'Money', description: 'Recognizing coins and simple transactions' }
            ];
          }
        }
        // Math topics for 4-6 (Cambridge Primary Stage 4-6)
        else if (gradeLevel === '4-6') {
          if (topicList.includes('Numbers')) {
            subtopicsByTopic['Numbers'] = [
              { name: 'Place Value and Ordering', description: 'Working with thousands, decimals' },
              { name: 'Mental Strategies', description: 'Efficient calculation methods' },
              { name: 'Written Methods', description: 'Standard algorithms for operations' },
              { name: 'Negative Numbers', description: 'Understanding and working with negative values' }
            ];
          }
          if (topicList.includes('Fractions')) {
            subtopicsByTopic['Fractions'] = [
              { name: 'Equivalent Fractions', description: 'Finding fractions that have the same value' },
              { name: 'Adding and Subtracting Fractions', description: 'Operations with like and unlike denominators' },
              { name: 'Decimals and Percentages', description: 'Converting between different forms' },
              { name: 'Fraction of Quantities', description: 'Finding fractions of numbers and amounts' }
            ];
          }
          if (topicList.includes('Geometry')) {
            subtopicsByTopic['Geometry'] = [
              { name: 'Properties of Shapes', description: 'Angles, sides, and vertices of shapes' },
              { name: 'Position and Direction', description: 'Coordinates and transformations' },
              { name: 'Area and Perimeter', description: 'Calculating space and boundaries' },
              { name: 'Angles', description: 'Measuring and classifying angles' }
            ];
          }
        }
        // Math topics for 7-9 (Cambridge Lower Secondary Stage 7-9)
        else if (gradeLevel === '7-9') {
          if (topicList.includes('Algebra')) {
            subtopicsByTopic['Algebra'] = [
              { name: 'Expressions and Formulae', description: 'Using letters to represent numbers' },
              { name: 'Equations and Inequalities', description: 'Solving linear equations and inequalities' },
              { name: 'Sequences and Functions', description: 'Number patterns and relationships' },
              { name: 'Graphs', description: 'Plotting and interpreting linear graphs' }
            ];
          }
          if (topicList.includes('Geometry')) {
            subtopicsByTopic['Geometry'] = [
              { name: 'Angles and Shapes', description: 'Angle properties in polygons and parallel lines' },
              { name: 'Transformations', description: 'Reflection, rotation, translation, and enlargement' },
              { name: 'Pythagoras and Trigonometry', description: 'Right-angled triangle calculations' },
              { name: 'Constructions', description: 'Using compass and straightedge for accurate drawings' }
            ];
          }
          if (topicList.includes('Statistics')) {
            subtopicsByTopic['Statistics'] = [
              { name: 'Data Collection', description: 'Sampling and data gathering methods' },
              { name: 'Data Representation', description: 'Different charts and graphs for data' },
              { name: 'Averages and Spread', description: 'Mean, median, mode, and range' },
              { name: 'Probability', description: 'Calculating the likelihood of events' }
            ];
          }
        }
      }
      else if (subjectName === 'English' || subjectName === 'Language Arts') {
        // English topics for K-3 (Cambridge Primary Stage 1-3)
        if (gradeLevel === 'k-3') {
          if (topicList.includes('Reading')) {
            subtopicsByTopic['Reading'] = [
              { name: 'Phonics', description: 'Letter sounds and blending' },
              { name: 'Word Recognition', description: 'Common sight words and vocabulary' },
              { name: 'Reading Comprehension', description: 'Understanding simple texts' },
              { name: 'Fiction and Non-fiction', description: 'Different types of texts' }
            ];
          }
          if (topicList.includes('Writing')) {
            subtopicsByTopic['Writing'] = [
              { name: 'Letter Formation', description: 'Handwriting and letter shapes' },
              { name: 'Simple Sentences', description: 'Creating basic sentences' },
              { name: 'Story Writing', description: 'Beginning, middle, and end' },
              { name: 'Punctuation', description: 'Capital letters, full stops, question marks' }
            ];
          }
        }
        // English topics for 4-6 (Cambridge Primary Stage 4-6)
        else if (gradeLevel === '4-6') {
          if (topicList.includes('Reading')) {
            subtopicsByTopic['Reading'] = [
              { name: 'Reading Strategies', description: 'Skimming, scanning, and inferring' },
              { name: 'Literary Elements', description: 'Character, setting, plot' },
              { name: 'Informational Texts', description: 'Reading for information' },
              { name: 'Poetry', description: 'Understanding rhythm and rhyme' }
            ];
          }
          if (topicList.includes('Writing')) {
            subtopicsByTopic['Writing'] = [
              { name: 'Paragraphs', description: 'Organizing ideas in paragraphs' },
              { name: 'Narrative Writing', description: 'Creative storytelling techniques' },
              { name: 'Expository Writing', description: 'Explaining and informing' },
              { name: 'Grammar and Punctuation', description: 'More advanced sentence structures' }
            ];
          }
          if (topicList.includes('Speaking and Listening')) {
            subtopicsByTopic['Speaking and Listening'] = [
              { name: 'Oral Presentations', description: 'Speaking clearly to an audience' },
              { name: 'Group Discussions', description: 'Contributing to conversations' },
              { name: 'Listening Skills', description: 'Active listening and responding' },
              { name: 'Drama', description: 'Role-play and performance' }
            ];
          }
        }
        // English topics for 7-9 (Cambridge Lower Secondary Stage 7-9)
        else if (gradeLevel === '7-9') {
          if (topicList.includes('Literature')) {
            subtopicsByTopic['Literature'] = [
              { name: 'Text Analysis', description: 'Analyzing themes and perspectives' },
              { name: 'Literary Devices', description: 'Identifying and using metaphor, simile, etc.' },
              { name: 'Classic Literature', description: 'Studying traditional literary works' },
              { name: 'Modern Literature', description: 'Contemporary authors and styles' }
            ];
          }
          if (topicList.includes('Composition')) {
            subtopicsByTopic['Composition'] = [
              { name: 'Essay Writing', description: 'Structured academic essays' },
              { name: 'Creative Writing', description: 'Developing unique voice and style' },
              { name: 'Argumentative Writing', description: 'Presenting and supporting arguments' },
              { name: 'Research Writing', description: 'Finding and citing sources' }
            ];
          }
          if (topicList.includes('Language Skills')) {
            subtopicsByTopic['Language Skills'] = [
              { name: 'Advanced Grammar', description: 'Complex sentence structures' },
              { name: 'Vocabulary Development', description: 'Building sophisticated word choice' },
              { name: 'Critical Thinking', description: 'Analyzing author intentions and bias' },
              { name: 'Media Literacy', description: 'Understanding different media forms' }
            ];
          }
        }
      }
      
      setTopicsWithSubtopics(subtopicsByTopic);
    };
    
    fetchSubtopics();
  }, [subjectName, topicList, gradeLevel]);
  
  // Predefined allowed educational topics
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
    'continents', 'oceans', 'people', 'communities', 'governments'
  ];
  
  const itemsPerPage = 6;
  const totalPages = Math.ceil(topicList.length / itemsPerPage);
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handleTopicClick = (topic: string) => {
    // Check if the topic has subtopics
    if (topicsWithSubtopics[topic] && topicsWithSubtopics[topic].length > 0) {
      setSelectedTopic(topic);
      setShowSubtopics(true);
    } else {
      // If no subtopics, proceed with the main topic
      onSelectTopic(topic);
    }
  };
  
  const handleSubtopicClick = (subtopic: Subtopic) => {
    if (selectedTopic) {
      onSelectTopic(selectedTopic, subtopic.name);
      setShowSubtopics(false);
      setSelectedTopic(null);
    }
  };
  
  const handleMainTopicSelect = () => {
    if (selectedTopic) {
      onSelectTopic(selectedTopic);
      setShowSubtopics(false);
      setSelectedTopic(null);
    }
  };

  const handleCustomTopicSubmit = async () => {
    if (!customTopic.trim()) {
      toast.error(language === 'id' ? 'Topik tidak boleh kosong' : 'Topic cannot be empty');
      return;
    }

    const normalized = customTopic.toLowerCase();
    // Check if the topic is appropriate and educational
    const isEducational = ALLOWED_TOPICS.some(allowedTopic => 
      normalized.includes(allowedTopic) || 
      allowedTopic.includes(normalized)
    );
    const inappropriateKeywords = ['violence', 'adult', 'drug', 'weapon', 'gun'];
    const hasInappropriate = inappropriateKeywords.some(keyword => normalized.includes(keyword));
    if (!isEducational || hasInappropriate) {
      toast.error(
        language === 'id' 
          ? 'Mohon masukkan topik pendidikan yang sesuai' 
          : 'Please enter an appropriate educational topic'
      );
      return;
    }

    // Get student ID from context
    const studentId = selectedProfile?.id;
    if (!studentId) {
      toast.error(language === 'id' ? 'Profil siswa tidak ditemukan' : 'Student profile not found');
      return;
    }

    // Check for closest matching topic suggestions
    let suggestedMatch = '';
    const allTopics = topicList.concat(Object.keys(topicsWithSubtopics));
    for (const topic of allTopics) {
      if (topic.toLowerCase().includes(normalized) || 
          normalized.includes(topic.toLowerCase())) {
        suggestedMatch = topic;
        break;
      }
    }
    
    // If no exact match but there might be similar topics
    if (!suggestedMatch && customTopic.length > 2) {
      const similarTopics = findSimilarTopics(customTopic, allTopics);
      
      if (similarTopics.length > 0) {
        // Show suggestion toast with the first similar topic
        toast.info(
          <div>
            <p>{language === 'id' ? 'Apakah maksud Anda:' : 'Did you mean:'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {similarTopics.map(topic => (
                <Button 
                  key={topic} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    // Use the suggested topic instead
                    setCustomTopic(topic);
                    // Close the dialog
                    setShowDialog(false);
                    // Navigate with the suggested topic
                    onSelectTopic(topic);
                  }}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>,
          {
            duration: 5000,
            position: 'bottom-center',
          }
        );
      }
    }
    
    // First, close the dialog and proceed with the custom topic in the UI
    onSelectTopic(customTopic);
    setShowDialog(false);
    
    // Attempt to save to database (but don't wait for it or require it to succeed)
    try {
      console.log('Attempting to save custom topic:', {
        student_id: studentId,
        subject: subjectName,
        topic: customTopic,
        grade_level: gradeLevel
      });
      
      // @ts-ignore: custom_topics may not be in the generated types
      const { error } = await supabase
        .from('custom_topics' as any)
        .insert({
          student_id: studentId,
          subject: subjectName,
          topic: customTopic,
          grade_level: gradeLevel
        });
        
      if (error) {
        console.error('Database error saving custom topic:', error);
        
        // Check if this is a 404 error (table doesn't exist)
        if (error.code === '404' || error.message?.includes('Not Found')) {
          console.warn('The custom_topics table does not exist yet. Skipping database save.');
          // Save to localStorage as a fallback
          const saved = saveCustomTopicToLocalStorage({
            student_id: studentId,
            subject: subjectName,
            topic: customTopic,
            grade_level: gradeLevel
          });
          
          if (saved) {
            console.log('Successfully saved custom topic to localStorage');
            toast.success(
              language === 'id' 
                ? 'Topik disimpan secara lokal' 
                : 'Topic saved locally'
            );
          }
        } else {
          // For other errors, log but don't disrupt user flow
          console.error('Other database error:', error.message);
        }
      } else {
        // Only show success if database save worked
        toast.success(language === 'id' ? 'Topik berhasil disimpan!' : 'Topic saved successfully!');
      }
    } catch (err) {
      // Log error but don't disrupt user flow
      console.error('Error with custom topics:', err);
    }
  };
  
  // Get current page items
  const currentPageItems = topicList.slice(
    currentPage * itemsPerPage, 
    (currentPage * itemsPerPage) + itemsPerPage
  );
  
  return (
    <div className="space-y-8">
      <div>
        <Button 
          variant="ghost" 
          onClick={onBackClick} 
          className="mb-4 flex items-center"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {language === 'id' ? 'Kembali' : 'Back'}
        </Button>
        
        <h2 className="text-2xl font-bold">
          {showSubtopics && selectedTopic 
            ? (language === 'id' ? `Subtopik di ${selectedTopic}` : `Subtopics in ${selectedTopic}`)
            : (language === 'id' ? `Topik di ${subjectName}` : `Topics in ${subjectName}`)}
        </h2>
        <p className="text-muted-foreground">
          {showSubtopics
            ? (language === 'id' 
                ? `Pilih subtopik untuk pembelajaran yang lebih spesifik` 
                : `Select a subtopic for more focused learning`)
            : (language === 'id' 
                ? `Pilih topik yang ingin kamu pelajari untuk ${gradeLevel}` 
                : `Select a topic you want to learn for ${gradeLevel}`)}
        </p>
      </div>

      {/* Custom Topic Button - Now Outside Carousel */}
      {!showSubtopics && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full mb-6 border-dashed border-2 border-eduPurple hover:border-primary bg-eduPastel-purple hover:bg-eduPastel-purple/80"
              variant="outline"
            >
              <Plus className="h-5 w-5 mr-2 text-eduPurple" />
              {language === 'id' ? 'Buat Topik Kustom' : 'Create Custom Topic'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'id' ? 'Buat Topik Kustom' : 'Create Custom Topic'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {language === 'id' ? 'Nama Topik' : 'Topic Name'}
                </Label>
                <Input 
                  id="topic"
                  placeholder={language === 'id' ? 'contoh: Fotosintesis' : 'example: Photosynthesis'}
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'id' 
                    ? 'Masukkan topik pendidikan yang sesuai untuk anak-anak' 
                    : 'Enter appropriate educational topics for children'}
                </p>
              </div>
              <Button 
                onClick={handleCustomTopicSubmit} 
                className="w-full bg-eduPurple hover:bg-eduPurple-dark"
              >
                {language === 'id' ? 'Buat dan Lanjutkan' : 'Create and Continue'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {showSubtopics && selectedTopic ? (
        <>
          <div className="mb-4 flex items-center">
            <Button 
              variant="outline" 
              onClick={() => setShowSubtopics(false)}
              className="mr-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {language === 'id' ? 'Kembali ke Topik' : 'Back to Topics'}
            </Button>
            
            <Button
              variant="default"
              onClick={handleMainTopicSelect}
              className="bg-eduPurple hover:bg-eduPurple-dark"
            >
              <BookOpen className="mr-1 h-4 w-4" />
              {language === 'id' 
                ? `Pelajari Semua ${selectedTopic}` 
                : `Learn All ${selectedTopic}`}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {topicsWithSubtopics[selectedTopic] && topicsWithSubtopics[selectedTopic].map((subtopic, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleSubtopicClick(subtopic)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">{subtopic.name}</h3>
                      <Badge className="bg-eduPastel-blue text-blue-800">{index + 1}/{topicsWithSubtopics[selectedTopic].length}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{subtopic.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {currentPageItems.map((topic, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer" onClick={() => handleTopicClick(topic)}>
                    <Card 
                      className="h-full hover:shadow-md transition-all relative"
                    >
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium">{topic}</h3>
                        {topicsWithSubtopics[topic] && topicsWithSubtopics[topic].length > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-eduPastel-purple/30 text-eduPurple border-eduPurple text-xs">
                              {topicsWithSubtopics[topic].length} subtopics
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TooltipTrigger>
                {topicsWithSubtopics[topic] && topicsWithSubtopics[topic].length > 0 && (
                  <TooltipContent>
                    <p className="text-xs">Contains {topicsWithSubtopics[topic].length} curriculum subtopics</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
      
      {totalPages > 1 && !showSubtopics && (
        <div className="flex justify-between items-center mt-6">
          <Button 
            variant="outline" 
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {language === 'id' ? 'Sebelumnya' : 'Previous'}
          </Button>
          
          <span className="text-sm">
            {language === 'id' 
              ? `Halaman ${currentPage + 1} dari ${totalPages}` 
              : `Page ${currentPage + 1} of ${totalPages}`}
          </span>
          
          <Button 
            variant="outline" 
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
          >
            {language === 'id' ? 'Berikutnya' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TopicCarousel;
