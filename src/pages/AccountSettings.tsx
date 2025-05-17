
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, Shield, Lock, Globe, Bell } from 'lucide-react';

const accountFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileData = {
  id: string;
  full_name: string | null;
  is_teacher: boolean | null;
  created_at: string;
};

const AccountSettings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  // Initialize the account form with default values
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  // Initialize the password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchProfileData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        toast.error(language === 'id' ? 'Gagal mengambil data profil' : 'Failed to fetch profile data');
      } else if (data) {
        setProfileData(data);
        accountForm.setValue('fullName', data.full_name || '');
        accountForm.setValue('email', user.email || '');
      }
    };
    
    fetchProfileData();
  }, [user, loading, navigate, language, accountForm]);

  const onSaveAccount = async (data: z.infer<typeof accountFormSchema>) => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Update profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('id', user.id);
      
      if (profileError) {
        throw profileError;
      }
      
      // Update user metadata if email needs to be changed
      if (data.email && data.email !== user.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: data.email,
        });
        
        if (updateError) {
          throw updateError;
        }
        
        toast.success(
          language === 'id'
            ? 'Email berhasil diubah. Silakan konfirmasi email baru Anda.'
            : 'Email changed successfully. Please confirm your new email.'
        );
      } else {
        toast.success(
          language === 'id'
            ? 'Profil berhasil diperbarui'
            : 'Profile updated successfully'
        );
      }
      
      // Refresh profile data
      const { data: refreshedData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (refreshedData) {
        setProfileData(refreshedData);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(
        language === 'id'
          ? 'Gagal memperbarui profil: ' + error.message
          : 'Failed to update profile: ' + error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async (data: z.infer<typeof passwordFormSchema>) => {
    if (!user) return;
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(
        language === 'id'
          ? 'Kata sandi berhasil diubah'
          : 'Password changed successfully'
      );
      
      // Reset form
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(
        language === 'id'
          ? 'Gagal mengubah kata sandi: ' + error.message
          : 'Failed to change password: ' + error.message
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold font-display">
              {language === 'id' ? 'Pengaturan Akun' : 'Account Settings'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'id'
                ? 'Kelola preferensi dan informasi akun Anda'
                : 'Manage your account preferences and information'}
            </p>
          </div>
          
          <div className="grid gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'id' ? 'Profil' : 'Profile'}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'id' ? 'Keamanan' : 'Security'}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'id' ? 'Preferensi' : 'Preferences'}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'id' ? 'Notifikasi' : 'Notifications'}
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {language === 'id' ? 'Informasi Profil' : 'Profile Information'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'id'
                          ? 'Perbarui informasi profil dan alamat email Anda'
                          : 'Update your profile information and email address'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {profileData && (
                        <Form {...accountForm}>
                          <form onSubmit={accountForm.handleSubmit(onSaveAccount)} className="space-y-6">
                            <FormField
                              control={accountForm.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'id' ? 'Nama Lengkap' : 'Full Name'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={accountForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {language === 'id' ? 'Alamat Email' : 'Email Address'}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      placeholder={user?.email || ''}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {language === 'id'
                                      ? 'Mengubah email akan mengirimkan email konfirmasi ke alamat baru'
                                      : 'Changing email will send a confirmation to your new address'}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div>
                              <Button
                                type="submit"
                                className="bg-eduPurple hover:bg-eduPurple-dark"
                                disabled={isSaving}
                              >
                                {isSaving
                                  ? language === 'id'
                                    ? 'Menyimpan...'
                                    : 'Saving...'
                                  : language === 'id'
                                    ? 'Simpan Perubahan'
                                    : 'Save Changes'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {language === 'id' ? 'Ubah Kata Sandi' : 'Change Password'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'id'
                          ? 'Perbarui kata sandi untuk meningkatkan keamanan akun Anda'
                          : 'Update your password to enhance your account security'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'id' ? 'Kata Sandi Saat Ini' : 'Current Password'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    autoComplete="current-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'id' ? 'Kata Sandi Baru' : 'New Password'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    autoComplete="new-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'id' ? 'Konfirmasi Kata Sandi' : 'Confirm Password'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    autoComplete="new-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div>
                            <Button
                              type="submit"
                              className="bg-eduPurple hover:bg-eduPurple-dark"
                              disabled={isChangingPassword}
                            >
                              {isChangingPassword
                                ? language === 'id'
                                  ? 'Memperbarui...'
                                  : 'Updating...'
                                : language === 'id'
                                  ? 'Ubah Kata Sandi'
                                  : 'Change Password'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {language === 'id' ? 'Preferensi' : 'Preferences'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'id'
                          ? 'Kelola preferensi akun Anda'
                          : 'Manage your account preferences'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6 px-2">
                        <h3 className="text-lg font-medium">
                          {language === 'id' ? 'Pengaturan Bahasa' : 'Language Settings'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'id'
                            ? 'Bahasa saat ini: Indonesia'
                            : 'Current language: English'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'id'
                            ? 'Anda dapat mengubah bahasa dari pemilih bahasa di bilah navigasi'
                            : 'You can change the language from the language selector in the navigation bar'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {language === 'id' ? 'Pengaturan Notifikasi' : 'Notification Settings'}
                      </CardTitle>
                      <CardDescription>
                        {language === 'id'
                          ? 'Kelola preferensi notifikasi Anda'
                          : 'Manage your notification preferences'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 py-2">
                        <div className="rounded-lg bg-muted p-6 text-center">
                          <Bell className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {language === 'id'
                              ? 'Pengaturan notifikasi akan tersedia pada pembaruan mendatang'
                              : 'Notification settings will be available in a future update'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AccountSettings;
