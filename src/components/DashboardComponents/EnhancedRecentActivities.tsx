import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentProgressService, LearningActivity } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  Calculator,
  FlaskConical,
  Atom,
  Globe,
  Code,
  Languages,
  Music,
  Palette,
  GraduationCap,
  FileText,
  HeartPulse,
  Search,
  Filter,
  Calendar,
  LucideIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface EnhancedRecentActivitiesProps {
  studentId: string;
}

// Map subject names to icons
const getSubjectIcon = (subject: string): LucideIcon => {
  const s = subject?.toLowerCase() || '';
  
  if (s.includes('math') || s.includes('algebra') || s.includes('geometry')) return Calculator;
  if (s.includes('science') || s.includes('biology')) return FlaskConical;
  if (s.includes('physics') || s.includes('chemistry')) return Atom;
  if (s.includes('social') || s.includes('history')) return GraduationCap;
  if (s.includes('geography') || s.includes('world')) return Globe;
  if (s.includes('english') || s.includes('language') || s.includes('literature') || s.includes('reading')) return BookOpen;
  if (s.includes('art') || s.includes('drawing') || s.includes('painting')) return Palette;
  if (s.includes('computer') || s.includes('programming') || s.includes('coding')) return Code;
  if (s.includes('music')) return Music;
  if (s.includes('health')) return HeartPulse;
  
  // Default icon if no match
  return FileText;
};

// Get activity type icon
const getActivityTypeIcon = (activityType: string): LucideIcon => {
  switch (activityType.toLowerCase()) {
    case 'lesson':
      return BookOpen;
    case 'quiz':
      return FileText;
    default:
      return Clock;
  }
};

// Filter type definition
type FilterPeriod = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const EnhancedRecentActivities: React.FC<EnhancedRecentActivitiesProps> = ({ studentId }) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<LearningActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const pageSize = 6;
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        const data = await studentProgressService.getLearningActivities(studentId);
        
        // Process to remove duplicates and invalid entries
        const uniqueActivitiesMap = new Map<string, LearningActivity>();
        
        data
          .filter(activity => (
            activity && 
            activity.subject && 
            activity.topic && 
            activity.activity_type &&
            activity.last_interaction_at
          ))
          .forEach(activity => {
            const activityKey = `${activity.activity_type}-${activity.subject.toLowerCase()}-${activity.topic.toLowerCase()}`;
            
            if (!uniqueActivitiesMap.has(activityKey)) {
              uniqueActivitiesMap.set(activityKey, activity);
            } else {
              const existingActivity = uniqueActivitiesMap.get(activityKey)!;
              const existingDate = new Date(existingActivity.last_interaction_at || '');
              const currentDate = new Date(activity.last_interaction_at || '');
              
              if (currentDate > existingDate || 
                  (activity.progress && existingActivity.progress && 
                   activity.progress > existingActivity.progress)) {
                uniqueActivitiesMap.set(activityKey, activity);
              }
            }
          });
        
        // Convert map values back to array and sort by date
        const uniqueActivities = Array.from(uniqueActivitiesMap.values())
          .sort((a, b) => {
            const dateA = new Date(a.last_interaction_at || '');
            const dateB = new Date(b.last_interaction_at || '');
            return dateB.getTime() - dateA.getTime();
          });
        
        setActivities(uniqueActivities);
        setFilteredActivities(uniqueActivities);
      } catch (error) {
        console.error("Error fetching learning activities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, [studentId]);
  
  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [filterPeriod, searchTerm, subjectFilter, activityTypeFilter, startDate, endDate, activities]);
  
  // Function to apply all filters to activities
  const applyFilters = () => {
    let result = [...activities];
    
    // Apply date filter
    if (filterPeriod !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter(activity => {
        if (!activity.last_interaction_at) return false;
        
        const activityDate = new Date(activity.last_interaction_at);
        
        switch (filterPeriod) {
          case 'today':
            return activityDate.toDateString() === today.toDateString();
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return activityDate.toDateString() === yesterday.toDateString();
          case 'week':
            const weekAgo = subDays(today, 7);
            return isAfter(activityDate, weekAgo);
          case 'month':
            const monthAgo = subDays(today, 30);
            return isAfter(activityDate, monthAgo);
          case 'custom':
            if (startDate && endDate) {
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              return activityDate >= startDate && activityDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(activity => 
        activity.subject?.toLowerCase().includes(lowerSearchTerm) || 
        activity.topic?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply subject filter
    if (subjectFilter !== 'all') {
      result = result.filter(activity => 
        activity.subject?.toLowerCase() === subjectFilter.toLowerCase()
      );
    }
    
    // Apply activity type filter
    if (activityTypeFilter !== 'all') {
      result = result.filter(activity => 
        activity.activity_type?.toLowerCase() === activityTypeFilter.toLowerCase()
      );
    }
    
    setFilteredActivities(result);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Get unique subjects for filter dropdown
  const getUniqueSubjects = () => {
    const subjects = new Set<string>();
    activities.forEach(activity => {
      if (activity.subject) {
        subjects.add(activity.subject);
      }
    });
    return Array.from(subjects);
  };
  
  // Get unique activity types for filter dropdown
  const getUniqueActivityTypes = () => {
    const types = new Set<string>();
    activities.forEach(activity => {
      if (activity.activity_type) {
        types.add(activity.activity_type);
      }
    });
    return Array.from(types);
  };
  
  const totalPages = Math.ceil(filteredActivities.length / pageSize);
  const currentActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const handleContinueActivity = (activity: LearningActivity) => {
    navigate('/ai-learning', {
      state: {
        gradeLevel: 'k-3', // This should be dynamic based on student data
        subject: activity.subject,
        topic: activity.topic,
        studentId,
        autoStart: true,
        isNewLesson: false,
        continueFromProgress: activity.progress || 0
      }
    });
  };
  
  // Reset filters to default
  const handleResetFilters = () => {
    setFilterPeriod('all');
    setSearchTerm('');
    setSubjectFilter('all');
    setActivityTypeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  // Format date string to localized format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>
              {language === 'id' ? 'Aktivitas Pembelajaran' : 'Learning Activities'}
            </CardTitle>
            <CardDescription>
              {language === 'id' ? 'Riwayat pembelajaran siswa' : 'Learning history of the student'}
            </CardDescription>
          </div>
          
          {/* Search input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'id' ? 'Cari topik...' : 'Search topics...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        {/* Date filter */}
        <div className="flex-1 min-w-[150px]">
          <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
            <SelectTrigger className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder={language === 'id' ? 'Periode' : 'Time Period'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'id' ? 'Semua waktu' : 'All time'}</SelectItem>
              <SelectItem value="today">{language === 'id' ? 'Hari ini' : 'Today'}</SelectItem>
              <SelectItem value="yesterday">{language === 'id' ? 'Kemarin' : 'Yesterday'}</SelectItem>
              <SelectItem value="week">{language === 'id' ? '7 hari terakhir' : 'Last 7 days'}</SelectItem>
              <SelectItem value="month">{language === 'id' ? '30 hari terakhir' : 'Last 30 days'}</SelectItem>
              <SelectItem value="custom">{language === 'id' ? 'Kustom' : 'Custom range'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject filter */}
        <div className="flex-1 min-w-[150px]">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              <SelectValue placeholder={language === 'id' ? 'Mata Pelajaran' : 'Subject'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'id' ? 'Semua pelajaran' : 'All subjects'}</SelectItem>
              {getUniqueSubjects().map((subject) => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity type filter */}
        <div className="flex-1 min-w-[150px]">
          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              <SelectValue placeholder={language === 'id' ? 'Tipe Aktivitas' : 'Activity Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'id' ? 'Semua tipe' : 'All types'}</SelectItem>
              {getUniqueActivityTypes().map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'quiz' ? (language === 'id' ? 'Kuis' : 'Quiz') : 
                   type === 'lesson' ? (language === 'id' ? 'Pelajaran' : 'Lesson') : 
                   type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Custom date range (only shows when custom period is selected) */}
        {filterPeriod === 'custom' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1">
                  {startDate ? format(startDate, 'PP') : (language === 'id' ? 'Dari tanggal' : 'From date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1">
                  {endDate ? format(endDate, 'PP') : (language === 'id' ? 'Sampai tanggal' : 'To date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        {/* Reset filters button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleResetFilters}
          title={language === 'id' ? 'Reset filter' : 'Reset filters'}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="md" />
        </div>
      ) : currentActivities.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {currentActivities.map((activity, index) => {
              const ActivityIcon = getActivityTypeIcon(activity.activity_type);
              const SubjectIcon = getSubjectIcon(activity.subject);
              const isCompleted = activity.completed || activity.progress === 100;
              
              return (
                <Card key={activity.id || index} className={`overflow-hidden ${isCompleted ? 'border-green-200' : ''}`}>
                  <div className="grid grid-cols-[64px_1fr] h-full">
                    <div className={`flex items-center justify-center ${
                      activity.activity_type === 'quiz' ? 'bg-amber-100' : 
                      activity.activity_type === 'lesson' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <SubjectIcon className={`h-6 w-6 ${
                        activity.activity_type === 'quiz' ? 'text-amber-600' : 
                        activity.activity_type === 'lesson' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <ActivityIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs font-medium uppercase text-gray-500">
                            {activity.activity_type === 'quiz' ? (language === 'id' ? 'Kuis' : 'Quiz') : 
                             activity.activity_type === 'lesson' ? (language === 'id' ? 'Pelajaran' : 'Lesson') : 
                             activity.activity_type}
                          </span>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              {language === 'id' ? 'Selesai' : 'Completed'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(activity.last_interaction_at)}</span>
                      </div>
                      
                      <h4 className="font-semibold mb-1">{activity.subject}</h4>
                      <p className="text-sm text-gray-600 mb-3">{activity.topic}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-grow">
                          <div className="h-2 bg-gray-200 rounded-full w-full max-w-32">
                            <div 
                              className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                              style={{ width: `${activity.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{activity.progress || 0}%</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-2"
                          onClick={() => handleContinueActivity(activity)}
                        >
                          {isCompleted ? 
                            (language === 'id' ? 'Lihat Kembali' : 'Review') : 
                            (language === 'id' ? 'Lanjutkan' : 'Continue')
                          }
                          <PlayCircle className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-6 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {language === 'id'
                ? `Menampilkan ${Math.min(filteredActivities.length, (currentPage - 1) * pageSize + 1)}-${Math.min(filteredActivities.length, currentPage * pageSize)} dari ${filteredActivities.length} aktivitas`
                : `Showing ${Math.min(filteredActivities.length, (currentPage - 1) * pageSize + 1)}-${Math.min(filteredActivities.length, currentPage * pageSize)} of ${filteredActivities.length} activities`}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {language === 'id' ? 'Sebelumnya' : 'Previous'}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  // Show current page and two adjacent pages
                  let pageNum = currentPage;
                  if (totalPages <= 3) {
                    // If 3 or fewer pages, show all
                    pageNum = i + 1;
                  } else if (currentPage === 1) {
                    // If on first page, show 1,2,3
                    pageNum = i + 1;
                  } else if (currentPage === totalPages) {
                    // If on last page, show last-2, last-1, last
                    pageNum = totalPages - 2 + i;
                  } else {
                    // Otherwise show curr-1, curr, curr+1
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 3 && currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-1">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {language === 'id' ? 'Selanjutnya' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          {language === 'id' 
            ? 'Belum ada aktivitas pembelajaran. Mulailah belajar untuk melihat kemajuan di sini!' 
            : 'No learning activities yet. Start learning to see your progress here!'}
        </div>
      )}
    </div>
  );
};

export default EnhancedRecentActivities;
