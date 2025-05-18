
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { Award } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import CustomBadge from '@/components/Badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { StudentBadge } from '@/services/badgeService';

interface PaginatedBadgesProps {
  badges: StudentBadge[];
  isLoading: boolean;
  pageSize?: number;
}

const PaginatedBadges: React.FC<PaginatedBadgesProps> = ({ 
  badges, 
  isLoading,
  pageSize = 6
}) => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(badges.length / pageSize);
  
  // Get current page badges
  const currentBadges = badges.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return format(date, language === 'id' ? 'dd MMM yyyy' : 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Award className="h-5 w-5 text-amber-500" />
        {language === 'id' ? 'Lencana' : 'Badges'}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : currentBadges.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {currentBadges.map((studentBadge) => (
              <div 
                key={studentBadge.id} 
                className="flex flex-col items-center text-center p-2 border rounded-lg"
              >
                {studentBadge.badge?.image_url ? (
                  <CustomBadge
                    name={studentBadge.badge.name}
                    imageUrl={studentBadge.badge.image_url}
                    className="mb-2"
                  />
                ) : (
                  <CustomBadge
                    type="trophy"
                    name={studentBadge.badge?.name || 'Badge'}
                    className="bg-eduPastel-purple text-eduPurple"
                  />
                )}
                <p className="text-sm font-medium mt-1">{studentBadge.badge?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(studentBadge.earned_at)}
                </p>
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
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index + 1}>
                    <PaginationLink 
                      onClick={() => handlePageChange(index + 1)}
                      isActive={currentPage === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
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
            ? 'Belum ada lencana. Selesaikan aktivitas untuk mendapatkan lencana!' 
            : 'No badges yet. Complete activities to earn badges!'}
        </div>
      )}
    </div>
  );
};

export default PaginatedBadges;
