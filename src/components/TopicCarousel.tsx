import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const totalPages = Math.ceil((topicList.length + 1) / itemsPerPage); // +1 for custom topic button
  
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

  const handleCustomTopicSubmit = () => {
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

    // Check for inappropriate keywords
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

    onSelectTopic(customTopic);
    setShowDialog(false);
  };
  
  // Get current page items
  const currentPageItems = topicList.slice(
    currentPage * itemsPerPage, 
    (currentPage * itemsPerPage) + itemsPerPage
  );

  // Topics with custom button
  const displayItemsWithCustom = () => {
    const items = [...currentPageItems];
    
    // Add custom topic button if we're on the first page and not at max capacity
    if (currentPage === 0 && currentPageItems.length < itemsPerPage) {
      // Already has space on the first page
      return [...items, 'custom-topic-button'];
    } 
    else if (currentPage === totalPages - 1) {
      // Check if we have space on the last page
      const remaining = (topicList.length % itemsPerPage);
      if (remaining > 0 && remaining < itemsPerPage) {
        return [...items, 'custom-topic-button'];
      }
    }
    return items;
  };

  const displayItems = displayItemsWithCustom();
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displayItems.map((topic, index) => 
          topic === 'custom-topic-button' ? (
            <Dialog key="custom-topic" open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-all border-dashed border-2 hover:border-primary h-full">
                  <CardContent className="p-6 flex items-center justify-center flex-col h-full">
                    <div className="rounded-full bg-eduPastel-purple p-3 mb-3">
                      <Plus className="h-6 w-6 text-eduPurple" />
                    </div>
                    <h3 className="text-lg font-medium text-center">
                      {language === 'id' ? 'Buat Topik Kustom' : 'Create Custom Topic'}
                    </h3>
                  </CardContent>
                </Card>
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
          ) : (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => onSelectTopic(topic)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-medium">{topic}</h3>
              </CardContent>
            </Card>
          )
        )}
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
