import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Trash2, PlusCircle, UserPlus, Loader } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  name: string;
  age: number;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  avatar?: string;
}

interface StudentProfileProps {
  onStudentChange?: (student: Student) => void;
  currentStudentId?: string;
}

const DEFAULT_AVATARS = [
  '👦', '👧', '👨‍🎓', '👩‍🎓', '🧒', '👶', '🧑'
];

const StudentProfile = ({ onStudentChange, currentStudentId }: StudentProfileProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({
    name: '',
    age: 6,
    gradeLevel: 'k-3',
    avatar: DEFAULT_AVATARS[0]
  });

  const { user } = useAuth();
  const { language } = useLanguage();

  // Fetch students from database if user is logged in, otherwise use local storage
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      
      if (user) {
        // Fetch from database
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);
          
        if (error) {
          console.error('Error fetching students:', error);
          toast.error(language === 'id' ? 'Gagal memuat data siswa' : 'Failed to load student data');
        } else if (data) {
          const formattedStudents = data.map(item => ({
            id: item.id,
            name: item.name,
            age: item.age || 6,
            gradeLevel: item.grade_level as 'k-3' | '4-6' | '7-9',
            avatar: DEFAULT_AVATARS[item.id.charCodeAt(0) % DEFAULT_AVATARS.length] // Generate avatar based on ID
          }));
          
          setStudents(formattedStudents);
          
          // If no students, prompt to create one
          if (formattedStudents.length === 0) {
            setIsAddingStudent(true);
          }
        }
      } else {
        // Use local storage fallback
        const savedStudents = localStorage.getItem('eduAppStudents');
        const localStudents = savedStudents ? JSON.parse(savedStudents) : [
          { id: '1', name: 'Emma', age: 7, gradeLevel: 'k-3', avatar: '👧' }
        ];
        
        setStudents(localStudents);
      }
      
      setIsLoading(false);
    };
    
    fetchStudents();
  }, [user, language]);

  // Set active student on mount or when currentStudentId changes
  useEffect(() => {
    if (currentStudentId) {
      const student = students.find(s => s.id === currentStudentId);
      if (student) {
        setActiveStudent(student);
        if (onStudentChange) onStudentChange(student);
      }
    } else if (students.length > 0 && !activeStudent) {
      setActiveStudent(students[0]);
      if (onStudentChange) onStudentChange(students[0]);
    }
  }, [currentStudentId, students, activeStudent, onStudentChange]);

  // Save students to local storage when they change (for non-logged-in users)
  useEffect(() => {
    if (!user && students.length > 0) {
      localStorage.setItem('eduAppStudents', JSON.stringify(students));
    }
  }, [students, user]);

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error(language === 'id' ? 'Harap masukkan nama siswa' : 'Please enter a student name');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (user) {
        // Add to database
        const { data, error } = await supabase
          .from('students')
          .insert([{
            name: newStudent.name,
            age: newStudent.age,
            grade_level: newStudent.gradeLevel,
            parent_id: user.id
          }])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        const student = {
          id: data.id,
          name: data.name,
          age: data.age,
          gradeLevel: data.grade_level as 'k-3' | '4-6' | '7-9',
          avatar: newStudent.avatar
        };
        
        setStudents([...students, student]);
        setActiveStudent(student);
        if (onStudentChange) onStudentChange(student);
      } else {
        // Use local storage fallback
        const id = `student_${Date.now()}`;
        const student = { ...newStudent, id };
        
        setStudents([...students, student]);
        setActiveStudent(student);
        if (onStudentChange) onStudentChange(student);
      }
      
      setIsAddingStudent(false);
      setNewStudent({ name: '', age: 6, gradeLevel: 'k-3', avatar: DEFAULT_AVATARS[0] });
      toast.success(language === 'id' ? 'Profil siswa berhasil dibuat!' : 'Student profile successfully created!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(language === 'id' ? 'Gagal menambahkan siswa' : 'Failed to add student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!activeStudent) return;
    
    if (!newStudent.name.trim()) {
      toast.error(language === 'id' ? 'Harap masukkan nama siswa' : 'Please enter a student name');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (user) {
        // Update in database
        const { error } = await supabase
          .from('students')
          .update({
            name: newStudent.name,
            age: newStudent.age,
            grade_level: newStudent.gradeLevel
          })
          .eq('id', activeStudent.id);
          
        if (error) {
          throw error;
        }
      }
      
      // Update in local state
      const updatedStudents = students.map(s => 
        s.id === activeStudent.id ? { ...s, ...newStudent, id: s.id } : s
      );
      
      setStudents(updatedStudents);
      setActiveStudent({ ...activeStudent, ...newStudent });
      if (onStudentChange) onStudentChange({ ...activeStudent, ...newStudent });
      
      setIsEditingStudent(false);
      toast.success(language === 'id' ? 'Profil siswa berhasil diperbarui!' : 'Student profile successfully updated!');
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(language === 'id' ? 'Gagal memperbarui siswa' : 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveStudent = async (id: string) => {
    const studentToRemove = students.find(s => s.id === id);
    if (!studentToRemove) return;
    
    if (students.length === 1) {
      toast.error(language === 'id' ? 'Anda tidak dapat menghapus profil siswa satu-satunya' : "You can't remove the only student profile");
      return;
    }
    
    try {
      if (user) {
        // Remove from database
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id);
          
        if (error) {
          throw error;
        }
      }
      
      const updatedStudents = students.filter(s => s.id !== id);
      setStudents(updatedStudents);
      
      // If removing active student, set first available as active
      if (activeStudent && activeStudent.id === id) {
        setActiveStudent(updatedStudents[0]);
        if (onStudentChange) onStudentChange(updatedStudents[0]);
      }
      
      toast.success(language === 'id' ? 'Profil siswa berhasil dihapus' : 'Student profile successfully removed');
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error(language === 'id' ? 'Gagal menghapus siswa' : 'Failed to remove student');
    }
  };

  const handleSelectStudent = (student: Student) => {
    setActiveStudent(student);
    if (onStudentChange) onStudentChange(student);
  };

  const startEditing = () => {
    if (!activeStudent) return;
    setNewStudent({
      name: activeStudent.name,
      age: activeStudent.age,
      gradeLevel: activeStudent.gradeLevel,
      avatar: activeStudent.avatar || DEFAULT_AVATARS[0]
    });
    setIsEditingStudent(true);
  };

  const getGradeLabel = (grade: 'k-3' | '4-6' | '7-9') => {
    if (language === 'id') {
      switch (grade) {
        case 'k-3': return 'Tingkat Awal (K-3)';
        case '4-6': return 'Tingkat Menengah (4-6)';
        case '7-9': return 'Tingkat Lanjut (7-9)';
      }
    } else {
      switch (grade) {
        case 'k-3': return 'Early Learners (K-3)';
        case '4-6': return 'Intermediate (4-6)';
        case '7-9': return 'Advanced (7-9)';
      }
    }
  };

  const cancelForm = () => {
    setIsAddingStudent(false);
    setIsEditingStudent(false);
  };

  const translations = {
    studentProfiles: language === 'id' ? 'Profil Siswa' : 'Student Profiles',
    manageProfiles: language === 'id' ? 'Kelola profil siswa dan pilih siswa aktif' : 'Manage student profiles and select active student',
    addNewStudent: language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student',
    editStudent: language === 'id' ? 'Edit Siswa' : 'Edit Student',
    avatar: language === 'id' ? 'Avatar' : 'Avatar',
    studentName: language === 'id' ? 'Nama Siswa' : 'Student Name',
    age: language === 'id' ? 'Usia' : 'Age',
    gradeLevel: language === 'id' ? 'Tingkat Kelas' : 'Grade Level',
    cancel: language === 'id' ? 'Batal' : 'Cancel',
    addStudent: language === 'id' ? 'Tambah Siswa' : 'Add Student',
    updateStudent: language === 'id' ? 'Perbarui Siswa' : 'Update Student',
    activeStudent: language === 'id' ? 'Siswa Aktif' : 'Active Student',
    otherStudents: language === 'id' ? 'Siswa Lainnya' : 'Other Students',
    noStudent: language === 'id' ? 'Tidak ada profil siswa yang dipilih' : 'No student profile selected'
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">{translations.studentProfiles}</CardTitle>
        <CardDescription>{translations.manageProfiles}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {isAddingStudent || isEditingStudent ? (
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-display font-medium mb-4">
                {isAddingStudent ? translations.addNewStudent : translations.editStudent}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="avatar">{translations.avatar}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DEFAULT_AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        className={`w-10 h-10 text-xl flex items-center justify-center rounded-full border ${
                          newStudent.avatar === avatar ? 'border-eduPurple bg-eduPastel-purple' : 'border-gray-200'
                        }`}
                        onClick={() => setNewStudent({...newStudent, avatar})}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="name">{translations.studentName}</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder={language === 'id' ? 'Masukkan nama siswa' : 'Enter student name'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age">{translations.age}</Label>
                  <Input
                    id="age"
                    type="number"
                    min="3"
                    max="15"
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({...newStudent, age: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">{translations.gradeLevel}</Label>
                  <Select
                    value={newStudent.gradeLevel}
                    onValueChange={(value: 'k-3' | '4-6' | '7-9') => setNewStudent({...newStudent, gradeLevel: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={language === 'id' ? 'Pilih tingkat kelas' : 'Select grade level'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="k-3">{language === 'id' ? 'Tingkat Awal (K-3)' : 'Early Learners (K-3)'}</SelectItem>
                      <SelectItem value="4-6">{language === 'id' ? 'Tingkat Menengah (4-6)' : 'Intermediate (4-6)'}</SelectItem>
                      <SelectItem value="7-9">{language === 'id' ? 'Tingkat Lanjut (7-9)' : 'Advanced (7-9)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" onClick={cancelForm} disabled={isSaving}>
                    {translations.cancel}
                  </Button>
                  <Button 
                    onClick={isAddingStudent ? handleAddStudent : handleUpdateStudent}
                    className="bg-eduPurple hover:bg-eduPurple-dark"
                    disabled={isSaving}
                  >
                    {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    {isAddingStudent ? translations.addStudent : translations.updateStudent}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{translations.activeStudent}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingStudent(true)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" /> {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                </Button>
              </div>
              
              {activeStudent ? (
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-eduPastel-purple flex items-center justify-center text-2xl">
                      {activeStudent.avatar || '👦'}
                    </div>
                    <div>
                      <h4 className="font-medium">{activeStudent.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {language === 'id' ? 'Usia' : 'Age'}: {activeStudent.age} • {getGradeLabel(activeStudent.gradeLevel)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={startEditing}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveStudent(activeStudent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {translations.noStudent}
                </div>
              )}
              
              {students.length > 1 && (
                <>
                  <h3 className="text-lg font-medium pt-2">{translations.otherStudents}</h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {students.filter(s => activeStudent && s.id !== activeStudent.id).map((student) => (
                        <div 
                          key={student.id}
                          className="border rounded-md p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-eduPastel-blue flex items-center justify-center text-xl">
                              {student.avatar || '👦'}
                            </div>
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {language === 'id' ? 'Usia' : 'Age'}: {student.age} • {getGradeLabel(student.gradeLevel)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProfile;
