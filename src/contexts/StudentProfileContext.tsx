import React, { createContext, useContext, useState, useEffect } from 'react';

interface StudentProfile {
  id: string;
  name: string;
}

interface StudentProfileContextProps {
  selectedProfile: StudentProfile | null;
  setSelectedProfile: (profile: StudentProfile | null) => void;
}

const StudentProfileContext = createContext<StudentProfileContextProps | undefined>(undefined);

export const StudentProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    // Load the selected profile from localStorage on mount
    const storedProfile = localStorage.getItem('selectedStudentProfile');
    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        setSelectedProfile(parsedProfile);
      } catch (error) {
        console.error('Failed to parse stored student profile:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save the selected profile to localStorage whenever it changes
    if (selectedProfile) {
      localStorage.setItem('selectedStudentProfile', JSON.stringify(selectedProfile));
    } else {
      localStorage.removeItem('selectedStudentProfile');
    }
  }, [selectedProfile]);

  return (
    <StudentProfileContext.Provider value={{ selectedProfile, setSelectedProfile }}>
      {children}
    </StudentProfileContext.Provider>
  );
};

export const useStudentProfile = (): StudentProfileContextProps => {
  const context = useContext(StudentProfileContext);
  if (!context) {
    throw new Error('useStudentProfile must be used within a StudentProfileProvider');
  }
  return context;
};

export { StudentProfileContext };
