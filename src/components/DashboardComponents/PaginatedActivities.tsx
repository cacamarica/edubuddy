
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import ActivityDetailCard from './ActivityDetailCard';
import { LearningActivity } from '@/services/studentProgressService';

interface PaginatedActivitiesProps {
  activities: LearningActivity[];
  isLoading: boolean;
  pageSize?: number;
}

const PaginatedActivities: React.FC<PaginatedActivitiesProps> = ({ 
  activities, 
  isLoading,
  pageSize = 5
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  
  // Format the displayed activity data
  const totalPages = Math.ceil(activities.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Current page activities
  const currentActivities = activities.slice(startIndex, endIndex);
  
  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="md" />
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {language === 'id' ? 'Belum ada aktivitas.' : 'No activities yet.'}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {currentActivities.map((activity, index) => (
        <ActivityDetailCard key={activity.id || index} activity={activity} />
      ))}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === 'id' ? 'Sebelumnya' : 'Previous'}
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {language === 'id' ? 'Halaman ' : 'Page '}
            <span className="font-medium">{currentPage}</span>
            {language === 'id' ? ' dari ' : ' of '}
            <span className="font-medium">{totalPages}</span>
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            {language === 'id' ? 'Berikutnya' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginatedActivities;
