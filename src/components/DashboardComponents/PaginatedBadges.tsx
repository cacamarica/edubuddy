
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentBadge } from '@/services/badgeService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface PaginatedBadgesProps {
  badges: StudentBadge[];
  isLoading: boolean;
  pageSize?: number;
}

const PaginatedBadges: React.FC<PaginatedBadgesProps> = ({ badges, isLoading, pageSize = 4 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  
  const totalPages = Math.ceil(badges.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentBadges = badges.slice(startIndex, endIndex);
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Helper function to format dates safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            {language === 'id' 
              ? 'Anda belum mendapatkan lencana apapun.' 
              : 'You haven\'t earned any badges yet.'}
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {language === 'id' 
              ? 'Selesaikan pelajaran dan kuis untuk mendapatkan lencana!' 
              : 'Complete lessons and quizzes to earn badges!'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentBadges.map((badge) => (
          <Card key={badge.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{badge.badge?.name || 'Unknown Badge'}</CardTitle>
              <CardDescription className="text-xs">
                {language === 'id' 
                  ? `Diperoleh pada: ${formatDate(badge.awarded_at)}` 
                  : `Earned on: ${formatDate(badge.awarded_at)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{badge.badge?.description || 'No description available'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {language === 'id' ? 'Sebelumnya' : 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {language === 'id' 
              ? `Halaman ${currentPage} dari ${totalPages}` 
              : `Page ${currentPage} of ${totalPages}`}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            {language === 'id' ? 'Berikutnya' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginatedBadges;
