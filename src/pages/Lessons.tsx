import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BookOpen, GraduationCap, BrainCircuit, Lightbulb, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { studentProgressService } from '@/services/studentProgressService';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import { Spinner } from '@/components/ui/spinner';

const Lessons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { selectedProfile } = useStudentProfile();
  
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  
  const { 
    gradeLevel,
    subjectOptions,
    getTopicSuggestionsForSubject,
    updateGradeLevelFromStudent
  } = useLearningGradeLevel();
  
  const selectedStudentId = selectedProfile?.id;
  
  useEffect(() => {
    // Set grade level from navigation or student profile
    const navGradeLevel = location.state?.gradeLevel;
    if (navGradeLevel) {
      setSelectedGradeLevel(navGradeLevel);
    } else if (selectedProfile?.gradeLevel) {
      setSelectedGradeLevel(selectedProfile.gradeLevel);
    }
  }, [location.state, selectedProfile]);
  
  useEffect(() => {
    // Update grade level in hook when student profile changes
    if (selectedProfile) {
      updateGradeLevelFromStudent(selectedProfile);
    }
  }, [selectedProfile, updateGradeLevelFromStudent]);
  
  const handleStartQuiz = () => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    if (!selectedGradeLevel) {
      toast.error(language === 'id' ? 'Pilih tingkat kelas terlebih dahulu' : 'Please select a grade level first');
      return;
    }
    
    if (!selectedSubject) {
      toast.error(language === 'id' ? 'Pilih mata pelajaran terlebih dahulu' : 'Please select a subject first');
      return;
    }
    
    if (!topic) {
      toast.error(language === 'id' ? 'Masukkan topik terlebih dahulu' : 'Please enter a topic first');
      return;
    }
    
    navigate('/quiz', {
      state: {
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel,
        topic: topic,
        studentId: selectedStudentId
      }
    });
  };
  
  const handleViewDetailedHistory = () => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    navigate('/detailed-quiz-history', {
      state: {
        studentId: selectedStudentId,
        gradeLevel: selectedGradeLevel,
        subject: selectedSubject
      }
    });
  };
  
  const handleGetRecommendations = () => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    if (!selectedSubject) {
      toast.error(language === 'id' ? 'Pilih mata pelajaran terlebih dahulu' : 'Please select a subject first');
      return;
    }
    
    setIsRecommendationLoading(true);
    
    // Simulate fetching recommendations
    setTimeout(() => {
      const topicSuggestions = getTopicSuggestionsForSubject(selectedSubject);
      setRecommendations(topicSuggestions);
      setShowRecommendationDialog(true);
      setIsRecommendationLoading(false);
    }, 800);
  };

  // Inside the component where the error is happening:
  const handleRecommendationClick = (recommendation: string, type: string) => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    setIsProcessing(true);
    
    // Record the recommendation
    studentProgressService.recordAIRecommendation({
      student_id: selectedStudentId,
      recommendation: recommendation,
      recommendation_type: type,
      read: true // Mark as read since it's created by direct interaction
    }).then((success) => {
      if (success) {
        toast.success(language === 'id' ? 'Rekomendasi ditambahkan ke dasbor siswa' : 'Recommendation added to student dashboard');
      }
      setIsProcessing(false);
    });
  };

  const handleViewLesson = () => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    if (!selectedGradeLevel) {
      toast.error(language === 'id' ? 'Pilih tingkat kelas terlebih dahulu' : 'Please select a grade level first');
      return;
    }
    
    if (!selectedSubject) {
      toast.error(language === 'id' ? 'Pilih mata pelajaran terlebih dahulu' : 'Please select a subject first');
      return;
    }
    
    if (!topic) {
      toast.error(language === 'id' ? 'Masukkan topik terlebih dahulu' : 'Please enter a topic first');
      return;
    }
    
    navigate('/lesson', {
      state: {
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel,
        topic: topic,
        studentId: selectedStudentId
      }
    });
  };

  // Fix the handleViewQuiz function issue with string | number argument
  const handleViewQuiz = (subjectId: string) => {
    if (!selectedStudentId) {
      toast.error(language === 'id' ? 'Pilih profil siswa terlebih dahulu' : 'Please select a student profile first');
      return;
    }
    
    if (typeof subjectId !== 'string') {
      subjectId = String(subjectId); // Convert number to string
    }
    
    navigate('/quiz', {
      state: {
        subject: subjectId,
        gradeLevel: selectedGradeLevel,
        studentId: selectedStudentId
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {language === 'id' ? 'Pilih Pelajaran' : 'Choose a Lesson'}
          </CardTitle>
          <CardDescription>
            {language === 'id' ? 'Pilih mata pelajaran, topik, dan mulai belajar!' : 'Select a subject, topic, and start learning!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">{language === 'id' ? 'Mata Pelajaran' : 'Subject'}</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'id' ? 'Pilih mata pelajaran' : 'Select a subject'} />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions?.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="topic">{language === 'id' ? 'Topik' : 'Topic'}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="topic"
                placeholder={language === 'id' ? 'Masukkan topik' : 'Enter topic'}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <Button 
                variant="outline"
                size="sm"
                onClick={handleGetRecommendations}
                disabled={!selectedSubject || isRecommendationLoading}
              >
                {isRecommendationLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {language === 'id' ? 'Mencari...' : 'Searching...'}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {language === 'id' ? 'Cari Topik' : 'Find Topics'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="bg-eduPurple hover:bg-eduPurple-dark" onClick={handleStartQuiz}>
              <GraduationCap className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Mulai Kuis' : 'Start Quiz'}
            </Button>
            <Button className="bg-eduGreen hover:bg-eduGreen-dark" onClick={handleViewLesson}>
              <BookOpen className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Lihat Pelajaran' : 'View Lesson'}
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium">{language === 'id' ? 'Opsi Lanjutan' : 'Advanced Options'}</h3>
            <div className="mt-2 space-y-2">
              <Button 
                variant="secondary"
                onClick={handleViewDetailedHistory}
                disabled={!selectedSubject}
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Lihat Riwayat Kuis' : 'View Quiz History'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showRecommendationDialog} onOpenChange={setShowRecommendationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{language === 'id' ? 'Rekomendasi Topik' : 'Topic Recommendations'}</DialogTitle>
            <DialogDescription>
              {language === 'id' ? 'Pilih topik yang direkomendasikan untuk memulai.' : 'Choose a recommended topic to get started.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] mb-4">
            <div className="divide-y divide-border">
              {recommendations.map((rec, index) => (
                <div key={index} className="py-2 px-1">
                  <button
                    className="w-full text-left hover:bg-secondary rounded-md p-2"
                    onClick={() => {
                      setTopic(rec);
                      setShowRecommendationDialog(false);
                    }}
                  >
                    {rec}
                  </button>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleRecommendationClick(rec, 'topic')}
                    >
                      {isProcessing ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          {language === 'id' ? 'Memproses...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Lightbulb className="mr-2 h-4 w-4" />
                          {language === 'id' ? 'Rekomendasikan' : 'Recommend'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button onClick={() => setShowRecommendationDialog(false)}>{language === 'id' ? 'Tutup' : 'Close'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lessons;
