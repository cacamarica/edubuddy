import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { Student } from '@/types/learning';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, User, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentProfileSelectorProps {
  onStudentChange: (studentId: string) => void;
  initialStudentId?: string;
}

const StudentProfileSelector: React.FC<StudentProfileSelectorProps> = ({ 
  onStudentChange,
  initialStudentId
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(initialStudentId);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { language } = useLanguage();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);
          
        if (error) {
          console.error('Error fetching students:', error);
        } else if (data) {
          // Convert database records to Student type
          const fetchedStudents: Student[] = data.map(item => ({
            id: item.id,
            name: item.name,
            grade_level: item.grade_level,
            parent_id: item.parent_id,
            created_at: item.created_at,
            avatar_url: item.avatar_url || undefined,
            age: item.age || undefined  // Convert null to undefined
          }));
          
          setStudents(fetchedStudents);
          
          // If no initial student is selected, select the first one
          if (!initialStudentId && fetchedStudents.length > 0) {
            setSelectedStudentId(fetchedStudents[0].id);
            onStudentChange(fetchedStudents[0].id);
          }
        }
      } catch (error) {
        console.error('Error in student fetch operation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [user, initialStudentId, onStudentChange]);
  
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    onStudentChange(studentId);
  };

  const getGradeLevelText = (gradeLevel: string) => {
    if (language === 'id') {
      switch (gradeLevel) {
        case 'k-3': return 'Kelas Awal (K-3)';
        case '4-6': return 'Kelas Menengah (4-6)';
        case '7-9': return 'Kelas Atas (7-9)';
        default: return gradeLevel;
      }
    } else {
      switch (gradeLevel) {
        case 'k-3': return 'Early Grades (K-3)';
        case '4-6': return 'Middle Grades (4-6)';
        case '7-9': return 'Upper Grades (7-9)';
        default: return gradeLevel;
      }
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getGradeLevelColor = (gradeLevel: string): string => {
    switch (gradeLevel) {
      case 'k-3': return 'bg-blue-100 text-blue-800';
      case '4-6': return 'bg-green-100 text-green-800';
      case '7-9': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which students to display
  const displayedStudents = showAllProfiles 
    ? filteredStudents 
    : filteredStudents.slice(0, 1);

  // Find the selected student
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  return (
    <div className="w-full">
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-4">
            <Spinner size="sm" />
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-muted-foreground text-sm">
              {language === 'id' ? 'Tidak ada profil siswa' : 'No student profiles'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Quick selector for mobile */}
          <div className="block md:hidden">
            <Select value={selectedStudentId} onValueChange={handleStudentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'id' ? 'Pilih Siswa' : 'Select Student'} />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center">
                      <span>{student.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({getGradeLevelText(student.grade_level)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Enhanced card-based selector for larger screens */}
          <div className="hidden md:block">
            {students.length > 1 && (
              <div className="flex gap-2 mb-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={language === 'id' ? 'Cari siswa...' : 'Search students...'}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllProfiles(!showAllProfiles)}
                  className="flex items-center gap-1"
                >
                  {showAllProfiles ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {language === 'id' ? 'Sembunyikan' : 'Hide'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {language === 'id' ? 'Tampilkan Semua' : 'Show All'}
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {selectedStudent && !showAllProfiles && (
                <Card 
                  key={selectedStudent.id}
                  className={`overflow-hidden transition-all cursor-pointer ${
                    selectedStudent.id === selectedStudentId 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleStudentChange(selectedStudent.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {selectedStudent.avatar_url ? (
                        <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedStudent.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex-grow">
                      <div className="font-medium">{selectedStudent.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {selectedStudent.age && `${selectedStudent.age} ${language === 'id' ? 'tahun' : 'years old'}`}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={getGradeLevelColor(selectedStudent.grade_level)}>
                        {getGradeLevelText(selectedStudent.grade_level)}
                      </Badge>
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {showAllProfiles && filteredStudents.map((student) => (
                <Card 
                  key={student.id}
                  className={`overflow-hidden transition-all cursor-pointer ${
                    student.id === selectedStudentId 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleStudentChange(student.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      {student.avatar_url ? (
                        <AvatarImage src={student.avatar_url} alt={student.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex-grow">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {student.age && `${student.age} ${language === 'id' ? 'tahun' : 'years old'}`}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={getGradeLevelColor(student.grade_level)}>
                        {getGradeLevelText(student.grade_level)}
                      </Badge>
                      {student.id === selectedStudentId && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfileSelector;
