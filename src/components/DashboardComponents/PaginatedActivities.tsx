import React, { useState } from 'react';
import { LearningActivity } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, formatDistance } from 'date-fns';
import { BookOpen, PencilRuler, Gamepad, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter activities based on selected filter
  const filteredActivities = filter 
    ? activities.filter(activity => 
        filter === 'activity_type' ? true : activity[filter as keyof LearningActivity] === filter)
    : activities;

  // Calculate total pages
  const totalPages = Math.ceil(filteredActivities.length / pageSize);
  
  // Get current page activities
  const currentActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'quiz':
        return <PencilRuler className="h-4 w-4 text-purple-500" />;
      case 'game':
        return <Gamepad className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  const getActivityTypeText = (type: string) => {
    if (language === 'id') {
      switch (type) {
        case 'lesson': return 'Belajar';
        case 'quiz': return 'Kuis';
        case 'game': return 'Permainan';
        default: return type;
      }
    } else {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // If date is within the last 7 days, show relative time (e.g., "2 days ago")
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return formatDistance(date, now, { addSuffix: true });
      }
      
      // Otherwise show date format
      return format(date, language === 'id' ? 'dd MMM yyyy' : 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  const handleActivityClick = (activity: LearningActivity) => {
    // Navigate to AI Learning with the activity details
    navigate('/ai-learning', {
      state: {
        subject: activity.subject,
        topic: activity.topic,
        gradeLevel: 'k-3', // Default grade level
        studentId: activity.student_id,
        autoStart: true
      }
    });
  };

  // Generate pagination items
  const paginationItems = [];
  const maxVisible = 5; // Maximum visible page numbers
  
  if (totalPages <= maxVisible) {
    // Show all pages if total is less than maxVisible
    for (let i = 1; i <= totalPages; i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    // Always show first page
    paginationItems.push(
      <PaginationItem key={1}>
        <PaginationLink 
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Calculate start and end of visible pages
    let startPage = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 3);
    
    // Adjust if at edges
    if (endPage - startPage < maxVisible - 3) {
      startPage = Math.max(2, totalPages - maxVisible + 2);
    }
    
    // Show ellipsis after first page if needed
    if (startPage > 2) {
      paginationItems.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      paginationItems.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page
    paginationItems.push(
      <PaginationItem key={totalPages}>
        <PaginationLink 
          onClick={() => handlePageChange(totalPages)}
          isActive={currentPage === totalPages}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">
          {language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activities'}
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter || ''} onValueChange={value => {
            setFilter(value || null);
            setCurrentPage(1); // Reset to first page when filter changes
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'id' ? "Filter" : "Filter"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                {language === 'id' ? 'Semua' : 'All'}
              </SelectItem>
              <SelectItem value="quiz">
                {language === 'id' ? 'Kuis' : 'Quiz'}
              </SelectItem>
              <SelectItem value="lesson">
                {language === 'id' ? 'Pelajaran' : 'Lesson'}
              </SelectItem>
              <SelectItem value="game">
                {language === 'id' ? 'Permainan' : 'Game'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : currentActivities.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{activity.topic}</p>
                    <Badge variant="outline" className="text-xs">
                      {getActivityTypeText(activity.activity_type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.subject}</p>
                  {activity.progress !== undefined && (
                    <p className="text-xs mt-1">
                      {language === 'id' ? 'Kemajuan: ' : 'Progress: '}
                      {activity.progress}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.last_interaction_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
                
                {paginationItems}
                
                <PaginationNext 
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {language === 'id' 
            ? 'Belum ada aktivitas. Mulai belajar untuk melihat aktivitas di sini!' 
            : 'No activities yet. Start learning to see activities here!'}
        </div>
      )}
    </div>
  );
};

export default PaginatedActivities;
