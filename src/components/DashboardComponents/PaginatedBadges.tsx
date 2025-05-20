
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge from '@/components/Badge';
import { StudentBadge } from '@/services/badgeService';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';

interface PaginatedBadgesProps {
  badges: StudentBadge[];
  isLoading?: boolean;
  itemsPerPage?: number;
}

const PaginatedBadges: React.FC<PaginatedBadgesProps> = ({
  badges = [],
  isLoading = false,
  itemsPerPage = 8
}) => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = React.useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(badges.length / itemsPerPage);
  
  // Get current badges
  const indexOfLastBadge = currentPage * itemsPerPage;
  const indexOfFirstBadge = indexOfLastBadge - itemsPerPage;
  const currentBadges = badges.slice(indexOfFirstBadge, indexOfLastBadge);
  
  // Format date based on language
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', {
        locale: language === 'id' ? id : enUS
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }
  
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {language === 'id' ? 'Belum ada badge yang diperoleh' : 'No badges earned yet'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 place-items-center">
        {currentBadges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center text-center space-y-1">
            <Badge 
              type={badge.badge?.type === 'star' ? 'star' : 
                    badge.badge?.type === 'check' ? 'check' :
                    badge.badge?.type === 'trophy' ? 'trophy' : 'award'}
              name={badge.badge?.name || ''}
              imageUrl={badge.badge?.image_url}
            />
            <p className="text-xs text-muted-foreground">
              {formatDate(badge.earned_at || badge.awarded_at)}
            </p>
          </div>
        ))}
      </div>
      
      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaginatedBadges;
