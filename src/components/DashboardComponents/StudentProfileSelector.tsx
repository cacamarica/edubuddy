
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  age: number;
  grade_level: string;
}

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
          setStudents(data);
          
          // If no initial student is selected, select the first one
          if (!initialStudentId && data.length > 0) {
            setSelectedStudentId(data[0].id);
            onStudentChange(data[0].id);
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
  
  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    onStudentChange(value);
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
  
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        ) : students.length > 0 ? (
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
        ) : (
          <div className="text-center py-2 text-muted-foreground text-sm">
            {language === 'id' ? 'Tidak ada profil siswa' : 'No student profiles'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentProfileSelector;
