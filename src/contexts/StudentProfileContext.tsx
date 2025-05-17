
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the selected profile from localStorage on mount with improved error handling
    setIsLoading(true);
    try {
      const storedProfile = localStorage.getItem('selectedStudentProfile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        if (parsedProfile && typeof parsedProfile === 'object' && 'id' in parsedProfile && 'name' in parsedProfile) {
          setSelectedProfile(parsedProfile);
        } else {
          console.error('Invalid student profile format in localStorage');
          localStorage.removeItem('selectedStudentProfile');
        }
      }
    } catch (error) {
      console.error('Failed to parse stored student profile:', error);
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('selectedStudentProfile');
      } catch (clearError) {
        console.error('Failed to clear corrupted profile data:', clearError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Save the selected profile to localStorage whenever it changes with improved error handling
    if (isLoading) return; // Skip initial load
    
    try {
      if (selectedProfile) {
        localStorage.setItem('selectedStudentProfile', JSON.stringify(selectedProfile));
      } else {
        localStorage.removeItem('selectedStudentProfile');
      }
    } catch (error) {
      console.error('Failed to store student profile:', error);
    }
  }, [selectedProfile, isLoading]);

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
