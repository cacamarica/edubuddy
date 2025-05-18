export const handleAuthError = (error: any, language: string): string => {
  const errorMessages: Record<string, { en: string; id: string }> = {
    'Email not confirmed': {
      en: 'Email not confirmed. Please check your inbox.',
      id: 'Email belum dikonfirmasi. Silakan periksa kotak masuk Anda.'
    },
    'Invalid login credentials': {
      en: 'Invalid email or password.',
      id: 'Email atau kata sandi tidak valid.'
    },
    'User already registered': {
      en: 'This email is already registered.',
      id: 'Email ini sudah terdaftar.'
    },
    'Password should be at least 6 characters': {
      en: 'Password must be at least 6 characters long.',
      id: 'Kata sandi harus minimal 6 karakter.'
    },
    'Invalid email': {
      en: 'Please enter a valid email address.',
      id: 'Silakan masukkan alamat email yang valid.'
    }
  };

  const defaultMessage = {
    en: 'An error occurred. Please try again.',
    id: 'Terjadi kesalahan. Silakan coba lagi.'
  };

  const errorKey = Object.keys(errorMessages).find(key => 
    error.message?.toLowerCase().includes(key.toLowerCase())
  );

  if (errorKey) {
    return errorMessages[errorKey][language as 'en' | 'id'];
  }

  return defaultMessage[language as 'en' | 'id'];
};

export const handleApiError = (error: any, language: string): string => {
  if (error.status === 404) {
    return language === 'id' 
      ? 'Data tidak ditemukan.' 
      : 'Data not found.';
  }

  if (error.status === 403) {
    return language === 'id'
      ? 'Anda tidak memiliki akses ke fitur ini.'
      : 'You do not have access to this feature.';
  }

  if (error.status === 500) {
    return language === 'id'
      ? 'Terjadi kesalahan server. Silakan coba lagi nanti.'
      : 'Server error occurred. Please try again later.';
  }

  return language === 'id'
    ? 'Terjadi kesalahan. Silakan coba lagi.'
    : 'An error occurred. Please try again.';
}; 