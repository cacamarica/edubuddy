
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, User, Plus, School } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  age: number | null;
  grade_level: 'k-3' | '4-6' | '7-9';
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchStudents = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('parent_id', user.id);
          
          if (error) {
            throw error;
          }
          
          if (data) {
            setStudents(data as Student[]);
          }
        } catch (error: any) {
          toast.error(language === 'id' 
            ? 'Gagal memuat data siswa: ' + error.message 
            : 'Failed to load student data: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchStudents();
  }, [user, language]);

  const formSchema = z.object({
    name: z.string().min(2, {
      message: language === 'id' ? "Nama minimal 2 karakter" : "Name must be at least 2 characters",
    }),
    age: z.coerce.number().min(5, {
      message: language === 'id' ? "Umur minimal 5 tahun" : "Age must be at least 5 years",
    }).max(15, {
      message: language === 'id' ? "Umur maksimal 15 tahun" : "Age must be at most 15 years",
    }).optional(),
    gradeLevel: z.enum(['k-3', '4-6', '7-9'], {
      required_error: language === 'id' ? "Pilih tingkat kelas" : "Select a grade level",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: undefined,
      gradeLevel: 'k-3',
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!user) return;
      
      const { error } = await supabase.from('students').insert({
        name: data.name,
        age: data.age || null,
        grade_level: data.gradeLevel,
        parent_id: user.id
      });
      
      if (error) throw error;
      
      // Refresh students list
      const { data: newData } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id);
      
      if (newData) {
        setStudents(newData as Student[]);
      }
      
      // Reset form and close dialog
      form.reset();
      setAddDialogOpen(false);
      
      toast.success(language === 'id' 
        ? 'Berhasil menambahkan siswa!' 
        : 'Successfully added student!');
        
    } catch (error: any) {
      toast.error(language === 'id' 
        ? 'Gagal menambahkan siswa: ' + error.message 
        : 'Failed to add student: ' + error.message);
    }
  };

  const getGradeText = (grade: string) => {
    switch(grade) {
      case 'k-3': return language === 'id' ? "Kelas K-3 (5-7 tahun)" : "Grades K-3 (5-7 years)";
      case '4-6': return language === 'id' ? "Kelas 4-6 (8-10 tahun)" : "Grades 4-6 (8-10 years)";
      case '7-9': return language === 'id' ? "Kelas 7-9 (11-15 tahun)" : "Grades 7-9 (11-15 years)";
      default: return grade;
    }
  };

  const goToLessons = (student: Student) => {
    navigate('/lessons', { state: { gradeLevel: student.grade_level, studentId: student.id } });
  };
  
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-eduPurple">
                {language === 'id' ? 'Dashboard' : 'Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'id' 
                  ? 'Kelola siswa dan pantau kemajuan pembelajaran' 
                  : 'Manage students and monitor learning progress'
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-eduPastel-purple/20 border-eduPurple/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-eduPurple" />
                  {language === 'id' ? 'Profil Anda' : 'Your Profile'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      {language === 'id' ? 'Email' : 'Email'}:
                    </span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      {language === 'id' ? 'ID Akun' : 'Account ID'}:
                    </span>
                    <span className="font-mono text-xs">{user?.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-eduPurple flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              {language === 'id' ? 'Siswa' : 'Students'}
            </h2>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-eduPurple hover:bg-eduPurple-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'id' 
                      ? 'Isi informasi untuk menambahkan siswa baru.' 
                      : 'Enter information to add a new student.'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'id' ? 'Nama' : 'Name'}</FormLabel>
                          <FormControl>
                            <Input placeholder={language === 'id' ? "Nama siswa" : "Student name"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'id' ? 'Usia (opsional)' : 'Age (optional)'}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={5} 
                              max={15} 
                              placeholder={language === 'id' ? "Usia siswa" : "Student age"} 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}
                          </FormLabel>
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              type="button"
                              variant={field.value === 'k-3' ? 'default' : 'outline'}
                              className={field.value === 'k-3' ? 'bg-eduPurple hover:bg-eduPurple-dark' : ''}
                              onClick={() => form.setValue('gradeLevel', 'k-3')}
                            >
                              K-3
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === '4-6' ? 'default' : 'outline'}
                              className={field.value === '4-6' ? 'bg-eduPurple hover:bg-eduPurple-dark' : ''}
                              onClick={() => form.setValue('gradeLevel', '4-6')}
                            >
                              4-6
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === '7-9' ? 'default' : 'outline'}
                              className={field.value === '7-9' ? 'bg-eduPurple hover:bg-eduPurple-dark' : ''}
                              onClick={() => form.setValue('gradeLevel', '7-9')}
                            >
                              7-9
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" className="bg-eduPurple hover:bg-eduPurple-dark">
                        {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {language === 'id' ? 'Memuat data...' : 'Loading data...'}
              </p>
            </div>
          ) : (
            <>
              {students.length === 0 ? (
                <Card className="border-dashed border-2 border-muted p-8 text-center">
                  <CardContent className="pt-6">
                    <School className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">
                      {language === 'id' ? 'Belum Ada Siswa' : 'No Students Yet'}
                    </h3>
                    <p className="text-muted-foreground mt-2 mb-6">
                      {language === 'id' 
                        ? 'Klik tombol "Tambah Siswa" untuk memulai' 
                        : 'Click the "Add Student" button to get started'
                      }
                    </p>
                    <Button className="bg-eduPurple hover:bg-eduPurple-dark" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.map((student) => (
                    <Card key={student.id} className="overflow-hidden">
                      <div className={`h-2 ${
                        student.grade_level === 'k-3' ? 'bg-eduPastel-yellow' : 
                        student.grade_level === '4-6' ? 'bg-eduPastel-green' : 
                        'bg-eduPastel-blue'
                      }`} />
                      <CardHeader>
                        <CardTitle>{student.name}</CardTitle>
                        <CardDescription>
                          {student.age ? `${student.age} ${language === 'id' ? 'tahun' : 'years old'}` : ''} 
                          {student.age ? ' • ' : ''} 
                          {getGradeText(student.grade_level)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => goToLessons(student)}>
                          {language === 'id' ? 'Lihat Pelajaran' : 'View Lessons'}
                        </Button>
                        <Button 
                          onClick={() => navigate('/ai-learning', { state: { studentId: student.id, gradeLevel: student.grade_level } })}
                          className="bg-eduPurple hover:bg-eduPurple-dark"
                        >
                          {language === 'id' ? 'Mulai Belajar' : 'Start Learning'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Dashboard;
