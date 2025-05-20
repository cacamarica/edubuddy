import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Plus, Pencil, Trash2, User, UserPlus, Mail, Lock, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Student as StudentBase, convertToStudentProfile } from '@/types/learning';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Get initials of name for avatar
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface StudentFormData {
  name: string;
  grade_level: string;
  age?: number;
  avatar_url?: string;
  email?: string;
  password?: string;
}

// Enhanced Student type that includes auth_user_id
interface Student extends StudentBase {
  auth_user_id?: string;
}

const ITEMS_PER_PAGE = 5;

const ManageStudentProfilesPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setSelectedProfile } = useStudentProfile();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StudentFormData>();

  const fetchStudents = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .order('name');
        
      if (error) {
        console.error('Error fetching students:', error);
        toast.error(language === 'id' ? 'Gagal memuat data siswa' : 'Failed to load student data');
      } else if (data) {
        setStudents(data as Student[]);
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error in student fetch operation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStudents();
  }, [user]);
  
  const handleAddNewStudent = () => {
    setEditingStudent(null);
    reset({
      name: '',
      grade_level: 'k-3',
      age: undefined,
      avatar_url: undefined,
      email: '',
      password: ''
    });
    setShowAddDialog(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setValue('name', student.name);
    setValue('grade_level', student.grade_level);
    setValue('age', student.age);
    setValue('avatar_url', student.avatar_url);
    setShowEditDialog(true);
  };
  
  const handleConfirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setIsSubmitting(true);
    
    try {
      // Delete the student record
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);
        
      if (error) {
        console.error('Error deleting student:', error);
        toast.error(language === 'id' ? 'Gagal menghapus data siswa' : 'Failed to delete student');
      } else {
        toast.success(language === 'id' ? 'Siswa berhasil dihapus' : 'Student deleted successfully');
        // Refresh the student list
        fetchStudents();
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast.error(language === 'id' ? 'Terjadi kesalahan saat menghapus' : 'An error occurred during deletion');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };
  
  const onSubmit = async (data: StudentFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Process student data
      const studentData = {
        name: data.name,
        grade_level: data.grade_level,
        age: data.age || undefined,
        avatar_url: data.avatar_url || undefined,
        parent_id: user.id
      };
      
      let studentId: string;
      
      if (editingStudent) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id);
          
        if (error) {
          console.error('Error updating student:', error);
          toast.error(language === 'id' ? 'Gagal memperbarui data siswa' : 'Failed to update student');
          return;
        }
        
        studentId = editingStudent.id;
        toast.success(language === 'id' ? 'Data siswa berhasil diperbarui' : 'Student updated successfully');
      } else {
        // Create new student
        const { data: newStudent, error } = await supabase
          .from('students')
          .insert([studentData])
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating student:', error);
          toast.error(language === 'id' ? 'Gagal membuat data siswa' : 'Failed to create student');
          return;
        }
        
        studentId = newStudent.id;
        toast.success(language === 'id' ? 'Siswa baru berhasil dibuat' : 'New student created successfully');
      }
      
      // If account creation is requested, create a new Supabase auth account
      if (showAccountForm && data.email && data.password) {
        try {
          // Create a new auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true
          });
          
          if (authError) {
            console.error('Error creating user account:', authError);
            toast.error(language === 'id' ? 'Gagal membuat akun pengguna' : 'Failed to create user account');
          } else if (authData.user) {
            // Link the new auth user to the student - use generic object instead of typed update
            const { error: linkError } = await supabase
              .from('students')
              .update({ 
                // Using a generic object that will be accepted by Supabase
                auth_user_id: authData.user.id 
              } as any)
              .eq('id', studentId);
              
            if (linkError) {
              console.error('Error linking user to student:', linkError);
            } else {
              toast.success(language === 'id' ? 'Akun pengguna berhasil dibuat' : 'User account created successfully');
            }
          }
        } catch (error) {
          console.error('Error in account creation:', error);
        }
      }
      
      // Reset form and refresh students list
      reset();
      fetchStudents();
      setEditingStudent(null);
      setShowAddDialog(false);
      setShowEditDialog(false);
      setShowAccountForm(false);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSelectStudent = (student: Student) => {
    setSelectedProfile(convertToStudentProfile(student));
    navigate('/dashboard');
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Calculate pagination
  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const renderPaginationLinks = () => {
    const pages: React.ReactNode[] = [];
    
    // Add first page
    if (currentPage > 2) {
      pages.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add previous page if not on first page
    if (currentPage > 1) {
      pages.push(
        <PaginationItem key={currentPage - 1}>
          <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
            {currentPage - 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add current page
    pages.push(
      <PaginationItem key={currentPage}>
        <PaginationLink isActive onClick={() => handlePageChange(currentPage)}>
          {currentPage}
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add next page if not on last page
    if (currentPage < totalPages) {
      pages.push(
        <PaginationItem key={currentPage + 1}>
          <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
            {currentPage + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add last page
    if (currentPage < totalPages - 1 && totalPages > 1) {
      pages.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pages;
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {language === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
              </Button>
              <h1 className="text-2xl font-bold">
                {language === 'id' ? 'Profil Siswa' : 'Student Profiles'}
              </h1>
            </div>
            <Button onClick={handleAddNewStudent} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student'}
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{language === 'id' ? 'Daftar Siswa' : 'Student List'}</CardTitle>
              <CardDescription>
                {language === 'id' 
                  ? 'Kelola profil siswa yang terdaftar pada akun Anda' 
                  : 'Manage the student profiles registered to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  {language === 'id' 
                    ? 'Belum ada siswa yang terdaftar. Tambahkan siswa baru.' 
                    : 'No students registered yet. Add a new student.'}
                  <div className="mt-4">
                    <Button onClick={handleAddNewStudent}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedStudents.map(student => (
                    <Card key={student.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border">
                              {student.avatar_url ? 
                                <AvatarImage src={student.avatar_url} alt={student.name} /> :
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                              }
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {student.grade_level === 'k-3' ? 'Kindergarten - Grade 3' : 
                                 student.grade_level === '4-6' ? 'Grade 4-6' : 
                                 student.grade_level === '7-9' ? 'Grade 7-9' : student.grade_level}
                                {student.age && ` • Age ${student.age}`}
                                {student.auth_user_id && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {language === 'id' ? 'Memiliki Akun' : 'Has Account'}
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectStudent(student)}
                            >
                              {language === 'id' ? 'Pilih' : 'Select'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              {language === 'id' ? 'Edit' : 'Edit'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleConfirmDelete(student)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              {language === 'id' ? 'Hapus' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {!isLoading && students.length > ITEMS_PER_PAGE && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {renderPaginationLinks()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {language === 'id'
                ? 'Isi formulir untuk menambahkan informasi siswa baru'
                : 'Fill out the form to add new student information'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {language === 'id' ? 'Nama Siswa' : 'Student Name'} *
                </Label>
                <Input
                  id="name"
                  placeholder={language === 'id' ? 'Masukkan nama lengkap' : 'Enter full name'}
                  {...register('name', { required: true })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {language === 'id' ? 'Nama siswa harus diisi' : 'Student name is required'}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade_level">
                    {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'} *
                  </Label>
                  <Select
                    defaultValue="k-3"
                    onValueChange={(value) => setValue('grade_level', value)}
                  >
                    <SelectTrigger id="grade_level">
                      <SelectValue placeholder={language === 'id' ? 'Pilih tingkat kelas' : 'Select grade level'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="k-3">Kindergarten - Grade 3</SelectItem>
                      <SelectItem value="4-6">Grade 4-6</SelectItem>
                      <SelectItem value="7-9">Grade 7-9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">
                    {language === 'id' ? 'Usia' : 'Age'}
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={language === 'id' ? 'Masukkan usia' : 'Enter age'}
                    {...register('age', { valueAsNumber: true, min: 3, max: 18 })}
                    className={errors.age ? 'border-destructive' : ''}
                  />
                  {errors.age && (
                    <p className="text-destructive text-sm">
                      {language === 'id' ? 'Usia harus antara 3-18 tahun' : 'Age must be between 3-18 years'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar_url">
                  {language === 'id' ? 'URL Avatar (opsional)' : 'Avatar URL (optional)'}
                </Label>
                <Input
                  id="avatar_url"
                  placeholder={language === 'id' ? 'URL gambar profil (opsional)' : 'Profile image URL (optional)'}
                  {...register('avatar_url')}
                />
              </div>
              
              <div className="pt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAccountForm(!showAccountForm)}
                  >
                    {showAccountForm 
                      ? (language === 'id' ? 'Sembunyikan Form Akun' : 'Hide Account Form') 
                      : (language === 'id' ? 'Buat Akun untuk Siswa' : 'Create Account for Student')}
                  </Button>
                </div>
                
                {showAccountForm && (
                  <div className="space-y-4 border p-3 rounded-md bg-muted/30">
                    <h4 className="font-semibold text-sm">
                      {language === 'id' ? 'Informasi Akun Pengguna' : 'User Account Information'}
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {language === 'id' ? 'Email' : 'Email'} *
                      </Label>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={language === 'id' ? 'Masukkan email' : 'Enter email'}
                          {...register('email', { required: showAccountForm })}
                          className={errors.email && showAccountForm ? 'border-destructive' : ''}
                        />
                      </div>
                      {errors.email && showAccountForm && (
                        <p className="text-destructive text-sm">
                          {language === 'id' ? 'Email harus diisi' : 'Email is required'}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        {language === 'id' ? 'Kata Sandi' : 'Password'} *
                      </Label>
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder={language === 'id' ? 'Masukkan kata sandi' : 'Enter password'}
                          {...register('password', { required: showAccountForm, minLength: 6 })}
                          className={errors.password && showAccountForm ? 'border-destructive' : ''}
                        />
                      </div>
                      {errors.password && showAccountForm && (
                        <p className="text-destructive text-sm">
                          {language === 'id' 
                            ? 'Kata sandi minimal 6 karakter' 
                            : 'Password must be at least 6 characters'}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {language === 'id'
                        ? 'Akun ini dapat digunakan oleh orang tua atau siswa untuk masuk ke aplikasi.'
                        : 'This account can be used by parents or students to log into the application.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setShowAccountForm(false);
                  setShowAddDialog(false);
                }}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                  </>
                ) : (
                  language === 'id' ? 'Tambah Siswa' : 'Add Student'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'id' ? 'Edit Siswa' : 'Edit Student'}
            </DialogTitle>
            <DialogDescription>
              {language === 'id'
                ? 'Edit informasi siswa'
                : 'Edit student information'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  {language === 'id' ? 'Nama Siswa' : 'Student Name'} *
                </Label>
                <Input
                  id="edit-name"
                  placeholder={language === 'id' ? 'Masukkan nama lengkap' : 'Enter full name'}
                  {...register('name', { required: true })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {language === 'id' ? 'Nama siswa harus diisi' : 'Student name is required'}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-grade-level">
                    {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'} *
                  </Label>
                  <Select
                    defaultValue={editingStudent?.grade_level || 'k-3'}
                    onValueChange={(value) => setValue('grade_level', value)}
                  >
                    <SelectTrigger id="edit-grade-level">
                      <SelectValue placeholder={language === 'id' ? 'Pilih tingkat kelas' : 'Select grade level'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="k-3">Kindergarten - Grade 3</SelectItem>
                      <SelectItem value="4-6">Grade 4-6</SelectItem>
                      <SelectItem value="7-9">Grade 7-9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-age">
                    {language === 'id' ? 'Usia' : 'Age'}
                  </Label>
                  <Input
                    id="edit-age"
                    type="number"
                    placeholder={language === 'id' ? 'Masukkan usia' : 'Enter age'}
                    {...register('age', { valueAsNumber: true, min: 3, max: 18 })}
                    className={errors.age ? 'border-destructive' : ''}
                  />
                  {errors.age && (
                    <p className="text-destructive text-sm">
                      {language === 'id' ? 'Usia harus antara 3-18 tahun' : 'Age must be between 3-18 years'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-avatar-url">
                  {language === 'id' ? 'URL Avatar (opsional)' : 'Avatar URL (optional)'}
                </Label>
                <Input
                  id="edit-avatar-url"
                  placeholder={language === 'id' ? 'URL gambar profil (opsional)' : 'Profile image URL (optional)'}
                  {...register('avatar_url')}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                }}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                  </>
                ) : (
                  language === 'id' ? 'Perbarui Siswa' : 'Update Student'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'id' ? 'Konfirmasi Hapus' : 'Confirm Deletion'}
            </DialogTitle>
            <DialogDescription>
              {language === 'id'
                ? `Apakah Anda yakin ingin menghapus siswa "${studentToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`
                : `Are you sure you want to delete student "${studentToDelete?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  {language === 'id' ? 'Menghapus...' : 'Deleting...'}
                </>
              ) : (
                language === 'id' ? 'Hapus' : 'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default ManageStudentProfilesPage;
