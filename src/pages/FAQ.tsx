
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ = () => {
  const { t, language } = useLanguage();
  
  const faqItems = [
    {
      question: language === 'id' ? 'Apa itu EduBuddy?' : 'What is EduBuddy?',
      answer: language === 'id' 
        ? 'EduBuddy adalah platform pembelajaran interaktif yang dirancang untuk anak-anak berusia 5-15 tahun, dengan konten yang disesuaikan untuk tiap kelompok umur. Platform ini menawarkan pelajaran interaktif, kuis, dan pembelajaran berbantuan AI untuk membantu anak-anak belajar dengan cara yang menyenangkan.'
        : 'EduBuddy is an interactive learning platform designed for children aged 5-15, with content tailored to each age group. The platform offers interactive lessons, quizzes, and AI-assisted learning to help children learn in a fun and engaging way.'
    },
    {
      question: language === 'id' ? 'Bagaimana cara mendaftar?' : 'How do I sign up?',
      answer: language === 'id'
        ? 'Orang tua atau guru dapat mendaftar menggunakan alamat email dan kata sandi. Setelah mendaftar, Anda dapat menambahkan profil siswa untuk anak-anak Anda.'
        : 'Parents or teachers can sign up using an email and password. After registering, you can add student profiles for your children.'
    },
    {
      question: language === 'id' ? 'Apa saja rentang usia yang didukung?' : 'What age ranges are supported?',
      answer: language === 'id'
        ? 'EduBuddy mendukung tiga kelompok usia: Pemula (5-7 tahun, kelas K-3), Menengah (8-10 tahun, kelas 4-6), dan Lanjutan (11-15 tahun, kelas 7-9). Setiap kelompok memiliki konten yang disesuaikan dengan tingkat perkembangan mereka.'
        : 'EduBuddy supports three age groups: Early Learners (5-7 years old, grades K-3), Intermediate (8-10 years old, grades 4-6), and Advanced (11-15 years old, grades 7-9). Each group has content tailored to their developmental level.'
    },
    {
      question: language === 'id' ? 'Apa itu AI Learning Buddy?' : 'What is the AI Learning Buddy?',
      answer: language === 'id'
        ? 'AI Learning Buddy adalah asisten pembelajaran berbasis AI yang membantu siswa belajar konsep baru. Asisten ini menyesuaikan diri dengan tingkat pemahaman anak dan memberikan penjelasan yang ramah anak untuk membantu mereka memahami materi dengan lebih baik.'
        : 'The AI Learning Buddy is an AI-based learning assistant that helps students learn new concepts. The assistant adapts to the child\'s level of understanding and provides child-friendly explanations to help them better understand the material.'
    },
    {
      question: language === 'id' ? 'Bagaimana cara pantau kemajuan anak saya?' : 'How can I monitor my child\'s progress?',
      answer: language === 'id'
        ? 'Dashboard orang tua/guru menyediakan gambaran tentang aktivitas dan kemajuan anak Anda. Anda dapat melihat pelajaran yang telah diselesaikan, skor kuis, dan rekomendasi untuk area yang perlu ditingkatkan.'
        : 'The parent/teacher dashboard provides an overview of your child\'s activity and progress. You can see lessons completed, quiz scores, and recommendations for areas that need improvement.'
    },
    {
      question: language === 'id' ? 'Apakah konten tersedia dalam bahasa lain?' : 'Is content available in other languages?',
      answer: language === 'id'
        ? 'Ya, EduBuddy tersedia dalam bahasa Inggris dan bahasa Indonesia. Anda dapat mengubah bahasa dari menu pengaturan.'
        : 'Yes, EduBuddy is available in both English and Bahasa Indonesia. You can switch languages from the settings menu.'
    },
    {
      question: language === 'id' ? 'Apakah EduBuddy aman untuk anak-anak?' : 'Is EduBuddy safe for children?',
      answer: language === 'id'
        ? 'Keamanan adalah prioritas utama kami. EduBuddy dirancang dengan memperhatikan keamanan dan privasi anak-anak, mematuhi standar kepatuhan keamanan seperti COPPA dan GDPR-K. Semua konten dimoderasi dan disesuaikan untuk kelompok umur tertentu.'
        : 'Safety is our top priority. EduBuddy is designed with children\'s safety and privacy in mind, adhering to safety compliance standards such as COPPA and GDPR-K. All content is moderated and tailored for specific age groups.'
    },
    {
      question: language === 'id' ? 'Bagaimana cara menambahkan profil siswa?' : 'How do I add a student profile?',
      answer: language === 'id'
        ? 'Setelah masuk ke akun Anda, kunjungi Dashboard dan klik tombol "Tambah Siswa". Anda kemudian dapat memasukkan nama, usia, dan tingkat kelas siswa.'
        : 'After signing into your account, visit the Dashboard and click the "Add Student" button. You can then enter the student\'s name, age, and grade level.'
    }
  ];
  
  return (
    <>
      <Header />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-eduPurple">
            {language === 'id' ? 'Pertanyaan Umum (FAQ)' : 'Frequently Asked Questions'}
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white rounded-lg border border-eduPurple/20 px-4"
                >
                  <AccordionTrigger className="text-lg font-medium py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="mt-12 p-6 bg-eduPastel-blue/20 rounded-lg text-center">
              <h2 className="text-xl font-bold text-eduPurple mb-3">
                {language === 'id' ? 'Masih Punya Pertanyaan?' : 'Still Have Questions?'}
              </h2>
              <p className="mb-4 text-muted-foreground">
                {language === 'id' 
                  ? 'Kami siap membantu. Hubungi tim dukungan kami.'
                  : 'We\'re here to help. Contact our support team.'
                }
              </p>
              <a 
                href="mailto:support@edubuddy.example" 
                className="inline-flex items-center bg-eduPurple text-white px-4 py-2 rounded-md hover:bg-eduPurple-dark transition-colors"
              >
                {language === 'id' ? 'Hubungi Kami' : 'Contact Us'}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FAQ;
