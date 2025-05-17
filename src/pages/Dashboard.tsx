
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, BookOpen, Award, Star, Clock, Calendar, BarChart } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <section className="bg-eduPastel-purple py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4"
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">Parent Dashboard</h1>
                <p className="text-muted-foreground">Monitor your child's learning progress</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-8">
          <div className="container px-4 md:px-6">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-center mb-8">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Clock className="h-5 w-5 text-eduPurple" />
                        Learning Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">3.5 hrs</div>
                      <p className="text-xs text-muted-foreground">This week</p>
                      <div className="mt-2 text-sm text-green-600">↑ 22% from last week</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-eduPurple" />
                        Lessons Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">8</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                      <div className="mt-2 text-sm text-green-600">↑ 3 from last month</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Star className="h-5 w-5 text-eduPurple" />
                        Stars Earned
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">24</div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <div className="mt-2 text-sm text-green-600">↑ 8 this week</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Award className="h-5 w-5 text-eduPurple" />
                        Badges Earned
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">5</div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <div className="mt-2 text-sm text-green-600">↑ 1 new badge</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6 mt-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-eduPurple" />
                        Subject Progress
                      </CardTitle>
                      <CardDescription>
                        Progress across all subjects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Math</span>
                            <span className="text-sm text-muted-foreground">30%</span>
                          </div>
                          <Progress value={30} />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">English</span>
                            <span className="text-sm text-muted-foreground">45%</span>
                          </div>
                          <Progress value={45} />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Science</span>
                            <span className="text-sm text-muted-foreground">20%</span>
                          </div>
                          <Progress value={20} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-eduPurple" />
                        Weekly Activity
                      </CardTitle>
                      <CardDescription>
                        Learning sessions per day
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 h-56">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                          // Example heights for the bars
                          const heights = [25, 40, 10, 60, 35, 80, 45];
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                              <div 
                                className="w-full bg-eduPurple rounded-t-md" 
                                style={{ height: `${heights[i]}%` }}
                              />
                              <span className="text-xs">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="font-display">Recommendations</CardTitle>
                    <CardDescription>Based on your child's learning pattern</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-eduPastel-green p-1 mt-0.5">
                          <Star className="h-3 w-3 text-eduPurple" />
                        </div>
                        <span>
                          Your child is making excellent progress in English! Consider exploring more advanced reading materials.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-eduPastel-yellow p-1 mt-0.5">
                          <Star className="h-3 w-3 text-eduPurple" />
                        </div>
                        <span>
                          Math scores have been improving consistently. Practice with multiplication tables would be beneficial.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-eduPastel-blue p-1 mt-0.5">
                          <Star className="h-3 w-3 text-eduPurple" />
                        </div>
                        <span>
                          Science engagement is growing! Consider exploring the 'Plant Life Cycles' lesson next.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Progress Tab */}
              <TabsContent value="progress">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Learning Progress</CardTitle>
                    <CardDescription>Detailed breakdown by subject and topic</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Math Progress */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-display font-bold">Mathematics</h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Counting Numbers</span>
                              <span className="text-sm text-muted-foreground">80%</span>
                            </div>
                            <Progress value={80} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Shapes & Patterns</span>
                              <span className="text-sm text-muted-foreground">65%</span>
                            </div>
                            <Progress value={65} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Addition</span>
                              <span className="text-sm text-muted-foreground">45%</span>
                            </div>
                            <Progress value={45} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Subtraction</span>
                              <span className="text-sm text-muted-foreground">20%</span>
                            </div>
                            <Progress value={20} />
                          </div>
                        </div>
                      </div>
                      
                      {/* English Progress */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-display font-bold">English</h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Letter Recognition</span>
                              <span className="text-sm text-muted-foreground">90%</span>
                            </div>
                            <Progress value={90} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Phonics</span>
                              <span className="text-sm text-muted-foreground">75%</span>
                            </div>
                            <Progress value={75} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Sight Words</span>
                              <span className="text-sm text-muted-foreground">60%</span>
                            </div>
                            <Progress value={60} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Reading Comprehension</span>
                              <span className="text-sm text-muted-foreground">30%</span>
                            </div>
                            <Progress value={30} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Science Progress */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-display font-bold">Science</h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Animals</span>
                              <span className="text-sm text-muted-foreground">55%</span>
                            </div>
                            <Progress value={55} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Plants</span>
                              <span className="text-sm text-muted-foreground">40%</span>
                            </div>
                            <Progress value={40} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Weather</span>
                              <span className="text-sm text-muted-foreground">25%</span>
                            </div>
                            <Progress value={25} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Five Senses</span>
                              <span className="text-sm text-muted-foreground">70%</span>
                            </div>
                            <Progress value={70} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Recent Activity Tab */}
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Recent Activity</CardTitle>
                    <CardDescription>Your child's learning sessions in the past 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          date: "Today",
                          activities: [
                            {
                              type: "quiz",
                              title: "Addition Quiz",
                              subject: "Math",
                              score: "8/10",
                              time: "10:23 AM",
                              duration: "15 mins"
                            },
                            {
                              type: "lesson",
                              title: "Letter Sounds",
                              subject: "English",
                              time: "9:45 AM",
                              duration: "20 mins"
                            }
                          ]
                        },
                        {
                          date: "Yesterday",
                          activities: [
                            {
                              type: "badge",
                              title: "Science Explorer Badge Earned",
                              subject: "Science",
                              time: "4:15 PM"
                            },
                            {
                              type: "lesson",
                              title: "Animal Habitats",
                              subject: "Science",
                              time: "3:30 PM",
                              duration: "25 mins"
                            },
                            {
                              type: "quiz",
                              title: "Shapes Quiz",
                              subject: "Math",
                              score: "5/5",
                              time: "10:15 AM",
                              duration: "10 mins"
                            }
                          ]
                        },
                        {
                          date: "May 15, 2025",
                          activities: [
                            {
                              type: "lesson",
                              title: "Reading Practice",
                              subject: "English",
                              time: "5:20 PM",
                              duration: "30 mins"
                            }
                          ]
                        }
                      ].map((day) => (
                        <div key={day.date} className="space-y-3">
                          <h3 className="font-medium text-sm text-muted-foreground">{day.date}</h3>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="divide-y">
                              {day.activities.map((activity, i) => (
                                <div key={i} className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      activity.type === 'quiz' 
                                        ? 'bg-eduPastel-green' 
                                        : activity.type === 'badge'
                                          ? 'bg-eduPastel-yellow'
                                          : 'bg-eduPastel-blue'
                                    }`}>
                                      {activity.type === 'quiz' ? (
                                        <BookOpen className="h-5 w-5 text-eduPurple" />
                                      ) : activity.type === 'badge' ? (
                                        <Award className="h-5 w-5 text-eduPurple" />
                                      ) : (
                                        <BookOpen className="h-5 w-5 text-eduPurple" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{activity.title}</p>
                                      <p className="text-sm text-muted-foreground">{activity.subject} • {activity.time}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {activity.score && (
                                      <p className="text-sm font-medium text-green-600">{activity.score}</p>
                                    )}
                                    {activity.duration && (
                                      <p className="text-xs text-muted-foreground">{activity.duration}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Account Settings</CardTitle>
                    <CardDescription>Manage your child's account and preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Child Profile</h3>
                        <div className="border rounded-lg p-4">
                          <p className="text-sm font-medium">Name: Emma Johnson</p>
                          <p className="text-sm text-muted-foreground">Age: 7 years</p>
                          <p className="text-sm text-muted-foreground">Grade Level: K-3 (Early Learners)</p>
                          <p className="mt-2 text-xs text-eduPurple">Edit Profile</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Learning Preferences</h3>
                        <div className="border rounded-lg p-4 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Daily Learning Goal</p>
                              <p className="text-xs text-muted-foreground">Target learning time per day</p>
                            </div>
                            <Button variant="outline" size="sm">30 minutes</Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Difficulty Level</p>
                              <p className="text-xs text-muted-foreground">Adjust the challenge level</p>
                            </div>
                            <Button variant="outline" size="sm">Standard</Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Learning Focus</p>
                              <p className="text-xs text-muted-foreground">Areas to prioritize</p>
                            </div>
                            <Button variant="outline" size="sm">Math & Reading</Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Notifications</h3>
                        <div className="border rounded-lg p-4 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Weekly Progress Reports</p>
                              <p className="text-xs text-muted-foreground">Receive weekly updates via email</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-eduPastel-green">Enabled</Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Achievement Alerts</p>
                              <p className="text-xs text-muted-foreground">Get notified when your child earns a badge</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-eduPastel-green">Enabled</Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Inactivity Reminders</p>
                              <p className="text-xs text-muted-foreground">Notify me if no activity for 3 days</p>
                            </div>
                            <Button variant="outline" size="sm">Disabled</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
