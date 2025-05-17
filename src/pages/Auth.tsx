
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [authTab, setAuthTab] = useState<string>('signin');

  // Get the grade level from location state if it exists
  const gradeLevel = location.state?.gradeLevel || null;

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }

    // Set the active tab based on the location state
    if (location.state?.action === 'signup') {
      setAuthTab('signup');
    }
  }, [user, navigate, location.state]);

  // Schemas for form validation
  const signInSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin')),
  });

  const signUpSchema = z.object({
    fullName: z.string().min(2, t('auth.fullNameMin')),
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin')),
  });

  // Form setup
  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (!error) {
        navigate('/dashboard', { state: { gradeLevel } });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(language === 'id' 
        ? 'Terjadi kesalahan saat masuk. Silakan coba lagi.' 
        : 'An error occurred while signing in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password, values.fullName);
      if (!error) {
        // User should be automatically signed in after signup now
        // We'll still redirect to dashboard after a slight delay to ensure the session is set
        setTimeout(() => {
          navigate('/dashboard', { state: { gradeLevel } });
        }, 500);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(language === 'id' 
        ? 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.' 
        : 'An error occurred while signing up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h2>
        <p className="mb-4">There was a problem with the authentication process.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
        >
          Go to Home
        </button>
      </div>
    }>
      <>
        <Header />
        <main className="flex-grow py-12">
          <div className="container max-w-md mx-auto px-4">
            <Card className="rounded-lg shadow-lg border-2 border-eduPurple/20">
              <CardHeader className="pb-6 text-center space-y-1">
                <CardTitle className="text-2xl font-bold text-eduPurple">
                  {authTab === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                </CardTitle>
                <CardDescription>
                  {gradeLevel ? (
                    <>
                      {language === 'id' 
                        ? `Untuk melanjutkan ke materi kelas ${gradeLevel === 'k-3' ? 'K-3' : gradeLevel === '4-6' ? '4-6' : '7-9'}`
                        : `To continue to ${gradeLevel === 'k-3' ? 'K-3' : gradeLevel === '4-6' ? '4-6' : '7-9'} grade material`
                      }
                    </>
                  ) : (
                    t('auth.accessAccount')
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-8">
                    <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                    <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <Form {...signInForm}>
                      <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                        <FormField
                          control={signInForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.email')}</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signInForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.password')}</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-eduPurple hover:bg-eduPurple-dark"
                          disabled={isLoading}
                        >
                          {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                        <FormField
                          control={signUpForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.fullName')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('auth.fullNamePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signUpForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.email')}</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signUpForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.password')}</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit"
                          className="w-full bg-eduPurple hover:bg-eduPurple-dark"
                          disabled={isLoading}
                        >
                          {isLoading ? t('auth.signingUp') : t('auth.signUp')}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 pt-0">
                <div className="text-xs text-center text-muted-foreground">
                  {t('auth.termsNotice')}
                </div>
              </CardFooter>
            </Card>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {language === 'id' 
                  ? 'Email verifikasi telah dimatikan untuk tujuan pengujian.' 
                  : 'Email verification has been disabled for testing purposes.'}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    </ErrorBoundary>
  );
};

export default Auth;
