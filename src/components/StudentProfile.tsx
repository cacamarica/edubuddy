
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Trash2, PlusCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getAIEducationContent } from '@/services/aiEducationService';

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
  const [students, setStudents] = useState<Student[]>(() => {
    const savedStudents = localStorage.getItem('eduAppStudents');
    return savedStudents ? JSON.parse(savedStudents) : [
      { id: '1', name: 'Emma', age: 7, gradeLevel: 'k-3', avatar: '👧' }
    ];
  });
  
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({
    name: '',
    age: 6,
    gradeLevel: 'k-3',
    avatar: DEFAULT_AVATARS[0]
  });

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

  // Save students to local storage when they change
  useEffect(() => {
    localStorage.setItem('eduAppStudents', JSON.stringify(students));
  }, [students]);

  const handleAddStudent = () => {
    if (!newStudent.name.trim()) {
      toast.error("Please enter a student name");
      return;
    }
    
    const id = `student_${Date.now()}`;
    const student = { ...newStudent, id };
    
    setStudents([...students, student]);
    setActiveStudent(student);
    if (onStudentChange) onStudentChange(student);
    setIsAddingStudent(false);
    setNewStudent({ name: '', age: 6, gradeLevel: 'k-3', avatar: DEFAULT_AVATARS[0] });
    
    toast.success(`${student.name}'s profile has been created!`);
  };

  const handleUpdateStudent = () => {
    if (!activeStudent) return;
    
    if (!newStudent.name.trim()) {
      toast.error("Please enter a student name");
      return;
    }
    
    const updatedStudents = students.map(s => 
      s.id === activeStudent.id ? { ...s, ...newStudent, id: s.id } : s
    );
    
    setStudents(updatedStudents);
    setActiveStudent({ ...activeStudent, ...newStudent });
    if (onStudentChange) onStudentChange({ ...activeStudent, ...newStudent });
    setIsEditingStudent(false);
    
    toast.success(`${newStudent.name}'s profile has been updated!`);
  };

  const handleRemoveStudent = (id: string) => {
    const studentToRemove = students.find(s => s.id === id);
    if (!studentToRemove) return;
    
    if (students.length === 1) {
      toast.error("You can't remove the only student profile");
      return;
    }
    
    const updatedStudents = students.filter(s => s.id !== id);
    setStudents(updatedStudents);
    
    // If removing active student, set first available as active
    if (activeStudent && activeStudent.id === id) {
      setActiveStudent(updatedStudents[0]);
      if (onStudentChange) onStudentChange(updatedStudents[0]);
    }
    
    toast.success(`${studentToRemove.name}'s profile has been removed`);
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
    switch (grade) {
      case 'k-3': return 'Early Learners (K-3)';
      case '4-6': return 'Intermediate (4-6)';
      case '7-9': return 'Advanced (7-9)';
    }
  };

  const cancelForm = () => {
    setIsAddingStudent(false);
    setIsEditingStudent(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Student Profiles</CardTitle>
        <CardDescription>Manage student profiles and select active student</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {isAddingStudent || isEditingStudent ? (
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-display font-medium mb-4">
                {isAddingStudent ? 'Add New Student' : 'Edit Student'}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="avatar">Avatar</Label>
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
                  <Label htmlFor="name">Student Name</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="Enter student name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
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
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select
                    value={newStudent.gradeLevel}
                    onValueChange={(value: 'k-3' | '4-6' | '7-9') => setNewStudent({...newStudent, gradeLevel: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="k-3">Early Learners (K-3)</SelectItem>
                      <SelectItem value="4-6">Intermediate (4-6)</SelectItem>
                      <SelectItem value="7-9">Advanced (7-9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" onClick={cancelForm}>Cancel</Button>
                  <Button 
                    onClick={isAddingStudent ? handleAddStudent : handleUpdateStudent}
                    className="bg-eduPurple hover:bg-eduPurple-dark"
                  >
                    {isAddingStudent ? 'Add Student' : 'Update Student'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Student</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingStudent(true)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" /> Add Student
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
                        Age: {activeStudent.age} • {getGradeLabel(activeStudent.gradeLevel)}
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
                  No student profile selected
                </div>
              )}
              
              {students.length > 1 && (
                <>
                  <h3 className="text-lg font-medium pt-2">Other Students</h3>
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
                                Age: {student.age} • {getGradeLabel(student.gradeLevel)}
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
