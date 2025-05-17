
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { studentProgressService, StudentProgress, LearningActivity } from '@/services/studentProgressService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { Filter, Calendar, Clock, BookOpen, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface StudentProgressSummaryProps {
  studentId: string;
}

const COLORS = ['#845EF7', '#FF6B6B', '#4D9DE0', '#33A1FD', '#22B8CF', '#51CF66'];

const StudentProgressSummary: React.FC<StudentProgressSummaryProps> = ({ studentId }) => {
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [filteredData, setFilteredData] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [activitiesData, setActivitiesData] = useState<LearningActivity[]>([]);  const [streakData, setStreakData] = useState<{day: string; count: number}[]>([]);
  const [timeSpentData, setTimeSpentData] = useState<{day: string; minutes: number}[]>([]);
  const [completionData, setCompletionData] = useState<{subject: string; lessons: number; quizzes: number; total: number; completed: number; timeSpent: number}[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const { language } = useLanguage();
  // Process real data to derive statistics
  const processActivitiesData = (activities: LearningActivity[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    // Initialize data structures
    const dailyActivitiesCount = new Array(7).fill(0);
    const dailyTimeSpent = new Array(7).fill(0);
    const subjectCompletion: Record<string, {
      lessons: number, 
      quizzes: number, 
      completed: number, 
      total: number,
      timeSpent: number
    }> = {};
    
    // Track consecutive days with activities
    const lastSevenDays: boolean[] = new Array(7).fill(false);
    
    // Process each activity
    activities.forEach(activity => {
      if (!activity.last_interaction_at) return;
      
      // Get day index of activity
      const activityDate = new Date(activity.last_interaction_at);
      const dayIndex = activityDate.getDay();
      const daysSinceActivity = Math.floor((new Date().getTime() - activityDate.getTime()) / (1000 * 3600 * 24));
      
      // Count activities by day for the last 7 days
      if (daysSinceActivity < 7) {
        dailyActivitiesCount[dayIndex]++;
        lastSevenDays[daysSinceActivity] = true;
      }
      
      // Calculate time spent (if the activity has a start and end)
      let timeSpent = 0;
      if (activity.started_at && activity.completed_at) {
        timeSpent = (new Date(activity.completed_at).getTime() - new Date(activity.started_at).getTime()) / (1000 * 60);
        timeSpent = Math.min(timeSpent, 120); // Cap at 2 hours to avoid outliers
        
        if (daysSinceActivity < 7) {
          dailyTimeSpent[dayIndex] += timeSpent;
        }
      } else {
        // If we don't have both timestamps, estimate based on activity type
        timeSpent = activity.activity_type === 'quiz' ? 10 : 20;
      }
      
      // Track completion by subject
      if (!subjectCompletion[activity.subject]) {
        subjectCompletion[activity.subject] = {
          lessons: 0,
          quizzes: 0,
          completed: 0,
          total: 0,
          timeSpent: 0
        };
      }
      
      // Count by activity type
      if (activity.activity_type === 'lesson') {
        subjectCompletion[activity.subject].lessons++;
      } else if (activity.activity_type === 'quiz') {
        subjectCompletion[activity.subject].quizzes++;
      }
      
      // Count completions
      subjectCompletion[activity.subject].total++;
      if (activity.completed) {
        subjectCompletion[activity.subject].completed++;
      }
      
      // Add time spent to subject
      subjectCompletion[activity.subject].timeSpent += timeSpent;
    });
    
    // Format data for charts
    const streakData = days.map((day, i) => {
      // Reorder days so that today is the last day in the chart
      const adjustedIndex = (i + 7 - today) % 7;
      return {
        day,
        count: dailyActivitiesCount[(i + today) % 7]
      };
    });
    
    const timeSpentData = days.map((day, i) => {
      // Reorder days so that today is the last day in the chart
      const adjustedIndex = (i + 7 - today) % 7;
      return {
        day,
        minutes: Math.round(dailyTimeSpent[(i + today) % 7])
      };
    });
      const completionData = Object.keys(subjectCompletion).map(subject => ({
      subject,
      lessons: subjectCompletion[subject].lessons,
      quizzes: subjectCompletion[subject].quizzes,
      total: subjectCompletion[subject].total,
      completed: subjectCompletion[subject].completed,
      timeSpent: Math.round(subjectCompletion[subject].timeSpent)
    }));
    
    // Calculate current streak from the last seven days data
    // This counts consecutive days with at least one activity
    let currentStreak = 0;
    for (let i = 0; i < lastSevenDays.length; i++) {
      if (lastSevenDays[i]) {
        currentStreak++;
      } else {
        // If we hit a day with no activity, break the streak
        // unless it's a future day
        if (i === 0) {
          // Today has no activity yet, continue counting previous days
          continue;
        } else {
          break;
        }
      }
    }
    
    return {
      streakData,
      timeSpentData,
      completionData,
      currentStreak
    };
  };
  
  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);      
      
      // Fetch actual data from services
      const data = await studentProgressService.getSubjectProgress(studentId);
      const activities = await studentProgressService.getLearningActivities(studentId, 50); // Get more activities for better stats
      const quizScores = await studentProgressService.getQuizScores(studentId, 20);
      
      // Set state for progress data
      setProgressData(data);
      setFilteredData(data);
      setActivitiesData(activities);
        // Process activities to generate real metrics
      const { streakData: realStreakData, timeSpentData: realTimeData, completionData: realCompletionData, currentStreak: realStreak } = 
        processActivitiesData(activities);
      
      setStreakData(realStreakData);
      setTimeSpentData(realTimeData);
      setCompletionData(realCompletionData);
      setCurrentStreak(realStreak);
      
      setIsLoading(false);
    };
    
    if (studentId) {
      fetchProgress();
    }
  }, [studentId]);
  
  // Apply filtering
  useEffect(() => {
    if (subjectFilter === 'all') {
      setFilteredData(progressData);
    } else {
      setFilteredData(progressData.filter(item => item.subject === subjectFilter));
    }
  }, [subjectFilter, progressData]);
  
  // Process data for chart
  const chartData = filteredData.map((item, index) => ({
    name: item.subject,
    value: item.progress,
    color: COLORS[index % COLORS.length]
  }));
  
  // Calculate overall progress
  const overallProgress = filteredData.length > 0 
    ? Math.round(filteredData.reduce((sum, item) => sum + item.progress, 0) / filteredData.length) 
    : 0;
  
  // Get unique subjects for filter
  const subjects = Array.from(new Set(progressData.map(item => item.subject)));
    return (
    <div className="h-full">
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview" className="flex gap-1 items-center">
            <BookOpen className="h-4 w-4" />
            {language === 'id' ? 'Ikhtisar' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="completion" className="flex gap-1 items-center">
            <Award className="h-4 w-4" />
            {language === 'id' ? 'Penyelesaian' : 'Completion'}
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex gap-1 items-center">
            <Calendar className="h-4 w-4" />
            {language === 'id' ? 'Aktivitas' : 'Activity'}
          </TabsTrigger>
          <TabsTrigger value="time" className="flex gap-1 items-center">
            <Clock className="h-4 w-4" />
            {language === 'id' ? 'Waktu' : 'Time'}
          </TabsTrigger>
        </TabsList>
        
        {/* Subject Progress Overview Tab */}
        <TabsContent value="overview">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-medium text-lg">
                {language === 'id' ? 'Kemajuan Mata Pelajaran' : 'Subject Progress'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'id' ? 'Kemajuan belajar berdasarkan mata pelajaran' : 'Learning progress by subject'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={language === 'id' ? "Filter" : "Filter"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'id' ? 'Semua' : 'All'}
                  </SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="lg" />
            </div>
          ) : filteredData.length > 0 ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {language === 'id' ? 'Kemajuan Keseluruhan' : 'Overall Progress'}
                  </span>
                  <span className="text-sm font-bold">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
              
              <div className="grid gap-4">
                {filteredData.map((subject) => (
                  <div key={subject.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{subject.subject}</span>
                      <span className="text-sm">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
              </div>
              
              {filteredData.length >= 2 && (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada data kemajuan. Mulai belajar untuk melihat perkembangan!' 
                : 'No progress data yet. Start learning to see your progress!'}
            </div>
          )}
        </TabsContent>
        
        {/* Completion Tab */}
        <TabsContent value="completion">
          <div className="mb-4">
            <h3 className="font-medium text-lg">
              {language === 'id' ? 'Penyelesaian Pelajaran & Kuis' : 'Lesson & Quiz Completion'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'id' ? 'Persentase penyelesaian pembelajaran' : 'Learning completion percentage'}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="lg" />
            </div>
          ) : completionData.length > 0 ? (
            <div className="space-y-8">
              {/* Completion by Subject */}
              <div className="space-y-4">
                {completionData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.subject}</span>
                      <span className="text-sm">
                        {item.completed}/{item.total} ({Math.round((item.completed/item.total)*100)}%)
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span>{language === 'id' ? 'Pelajaran:' : 'Lessons:'} {item.lessons}</span>
                      <span>•</span>
                      <span>{language === 'id' ? 'Kuis:' : 'Quizzes:'} {item.quizzes}</span>
                    </div>
                    <Progress 
                      value={(item.completed/item.total)*100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
              
              {/* Completion Chart */}
              <div className="h-60 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name={language === 'id' ? "Pelajaran" : "Lessons"} dataKey="lessons" stackId="a" fill="#8884d8" />
                    <Bar name={language === 'id' ? "Kuis" : "Quizzes"} dataKey="quizzes" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada data penyelesaian. Mulai belajar untuk melihat perkembangan!' 
                : 'No completion data yet. Start learning to see your progress!'}
            </div>
          )}
        </TabsContent>
        
        {/* Streaks Tab */}
        <TabsContent value="streaks">
          <div className="mb-4">
            <h3 className="font-medium text-lg">
              {language === 'id' ? 'Aktivitas Harian & Mingguan' : 'Daily & Weekly Activity'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'id' ? 'Riwayat aktivitas belajar' : 'Learning activity history'}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="lg" />
            </div>
          ) : streakData.length > 0 ? (
            <div className="space-y-8">              {/* Current Streak */}
              <div className="p-4 bg-muted rounded-lg flex flex-col items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'id' ? 'Streak Saat Ini' : 'Current Streak'}
                </span>
                <div className="text-3xl font-bold">{currentStreak} {language === 'id' ? 'Hari' : 'Days'}</div>
              </div>
              
              {/* Streak Chart */}
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={streakData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      name={language === 'id' ? "Aktivitas" : "Activities"} 
                      dataKey="count" 
                      fill="#FF6B6B"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
                {/* Weekly Stats */}
              <div>
                <h4 className="font-medium mb-2">
                  {language === 'id' ? 'Statistik Mingguan' : 'Weekly Stats'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {language === 'id' ? 'Total Aktivitas' : 'Total Activities'}
                    </div>
                    <div className="text-xl font-bold">{streakData.reduce((sum, day) => sum + day.count, 0)}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {language === 'id' ? 'Hari Aktif' : 'Active Days'}
                    </div>
                    <div className="text-xl font-bold">{streakData.filter(day => day.count > 0).length}/7</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada data aktivitas. Mulai belajar untuk melihat riwayat aktivitas!' 
                : 'No activity data yet. Start learning to see your activity history!'}
            </div>
          )}
        </TabsContent>
        
        {/* Time Spent Tab */}
        <TabsContent value="time">
          <div className="mb-4">
            <h3 className="font-medium text-lg">
              {language === 'id' ? 'Waktu Belajar' : 'Learning Time'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'id' ? 'Waktu yang dihabiskan untuk belajar' : 'Time spent learning'}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="lg" />
            </div>
          ) : timeSpentData.length > 0 ? (
            <div className="space-y-8">
              {/* Daily Time Chart */}
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSpentData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      name={language === 'id' ? "Menit" : "Minutes"} 
                      dataKey="minutes" 
                      stroke="#845EF7" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Time Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Waktu Belajar Hari Ini' : 'Today\'s Learning Time'}
                  </div>
                  <div className="text-2xl font-bold">
                    {timeSpentData[new Date().getDay()].minutes} {language === 'id' ? 'menit' : 'minutes'}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Total Minggu Ini' : 'This Week\'s Total'}
                  </div>
                  <div className="text-2xl font-bold">
                    {timeSpentData.reduce((sum, item) => sum + item.minutes, 0)} {language === 'id' ? 'menit' : 'minutes'}
                  </div>
                </div>
              </div>                {/* Subject Time Distribution */}
              <div>
                <h4 className="font-medium mb-2">
                  {language === 'id' ? 'Distribusi Waktu per Mata Pelajaran' : 'Time by Subject'}
                </h4>
                <div className="space-y-2">                  {completionData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{item.subject}</span>
                      <span className="font-medium">{item.timeSpent} {language === 'id' ? 'menit' : 'minutes'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada data waktu belajar. Mulai belajar untuk melihat statistik waktu!' 
                : 'No learning time data yet. Start learning to see your time statistics!'}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProgressSummary;
