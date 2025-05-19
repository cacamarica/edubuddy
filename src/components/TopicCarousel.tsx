import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface TopicCarouselProps {
  subjectName: string;
  topicList: string[];
  onSelectTopic: (topic: string) => void;
  onBackClick: () => void;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  currentGrade?: string;
}

const TopicCarousel: React.FC<TopicCarouselProps> = ({
  subjectName,
  topicList,
  onSelectTopic,
  onBackClick,
  gradeLevel,
  currentGrade
}) => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [customTopic, setCustomTopic] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  
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
    'continents', 'oceans', 'people', 'communities', 'government', 'landmarks',
    
    // Other academic subjects
    'music', 'art', 'physical education', 'health', 'technology', 'computer science', 'coding'
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

    // Save the new topic in the database for this student and subject
    try {
      // Assume studentId is available via props or context (add as needed)
      const studentId = window.localStorage.getItem('selectedStudentId'); // fallback if not passed
      if (!studentId) {
        toast.error(language === 'id' ? 'Profil siswa tidak ditemukan' : 'Student profile not found');
        return;
      }
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
        toast.error(language === 'id' ? 'Gagal menyimpan topik' : 'Failed to save topic');
        return;
      }
      // Add the new topic to the carousel
      onSelectTopic(customTopic);
      setShowDialog(false);
      toast.success(language === 'id' ? 'Topik berhasil ditambahkan!' : 'Topic added successfully!');
    } catch (err) {
      toast.error(language === 'id' ? 'Gagal menyimpan topik' : 'Failed to save topic');
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
          {language === 'id' ? `Topik di ${subjectName}` : `Topics in ${subjectName}`}
        </h2>
        <p className="text-muted-foreground">
          {language === 'id' 
            ? `Pilih topik yang ingin kamu pelajari untuk ${gradeLevel}` 
            : `Select a topic you want to learn for ${gradeLevel}`}
        </p>
      </div>

      {/* Custom Topic Button - Now Outside Carousel */}
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {currentPageItems.map((topic, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => onSelectTopic(topic)}
          >
            <CardContent className="p-6">
              <h3 className="text-lg font-medium">{topic}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {totalPages > 1 && (
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
