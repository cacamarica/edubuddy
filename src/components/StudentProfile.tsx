
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Student } from '@/contexts/StudentProfileContext';
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarDays } from "lucide-react";

interface StudentProfileProps {
  student: Student;
  currentClass?: string;
  ageGroup?: string;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Helper function to translate grade level to readable text
const translateGradeLevel = (gradeLevel: string): string => {
  switch (gradeLevel) {
    case 'k-3':
      return 'Kindergarten - Grade 3';
    case '4-6':
      return 'Grade 4-6';
    case '7-9':
      return 'Grade 7-9';
    default:
      return gradeLevel;
  }
};

const StudentProfile: React.FC<StudentProfileProps> = ({ 
  student, 
  currentClass = 'Not Set',
  ageGroup = 'Not Set'
}) => {
  // Let's handle empty student data gracefully
  if (!student || !student.name) {
    return (
      <Card className="w-full border-none shadow-none">
        <CardContent className="p-4 flex items-center space-x-4">
          <Avatar className="h-16 w-16 border">
            <AvatarFallback>NA</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">No student data</h2>
            <p className="text-sm text-muted-foreground">
              Please select a student profile
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4">
        <Avatar className="h-24 w-24 border">
          {/* Only use AvatarImage if there's an avatar URL */}
          {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.name} />}
          <AvatarFallback className="text-lg font-semibold">{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-3 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <p className="text-muted-foreground text-sm flex items-center justify-center md:justify-start gap-1">
              <CalendarDays className="h-3 w-3" />
              {student.age ? `Age ${student.age}` : 'Age not set'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
              {translateGradeLevel(student.grade_level)}
            </Badge>
            {currentClass && (
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                {currentClass}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProfile;
