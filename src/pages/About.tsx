
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

// Education level information with age ranges
const educationLevels = [
  {
    level: 'K-3',
    name: 'Early Elementary',
    ageRange: '5-8 years',
    grades: 'Kindergarten to 3rd Grade',
    description: 'Foundation for learning through play, basic literacy, numeracy, and discovery.'
  },
  {
    level: '4-6',
    name: 'Upper Elementary',
    ageRange: '9-11 years',
    grades: '4th to 6th Grade',
    description: 'Deeper understanding of core subjects with developing critical thinking skills.'
  },
  {
    level: '7-9',
    name: 'Middle School',
    ageRange: '12-15 years',
    grades: '7th to 9th Grade',
    description: 'Advanced concepts with specialized subject matter and independent learning skills.'
  }
];

const About = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              {language === 'id' ? 'Tentang Kami' : 'About Us'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === 'id' 
                ? 'Platform pendidikan yang dirancang untuk menumbuhkan rasa ingin tahu dan mendorong pembelajaran seumur hidup.' 
                : 'An educational platform designed to nurture curiosity and foster a lifelong love of learning.'}
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'id' ? 'Misi Kami' : 'Our Mission'}
              </CardTitle>
              <CardDescription>
                {language === 'id' ? 'Apa yang kami upayakan untuk dicapai' : 'What we strive to accomplish'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {language === 'id'
                  ? 'Kami berkomitmen untuk menyediakan pengalaman belajar yang dipersonalisasi dan berpusat pada siswa, yang mempersiapkan generasi muda untuk masa depan yang berkembang pesat. Dengan menggabungkan kurikulum yang disusun secara cermat dengan teknologi adaptif, kami bertujuan untuk menginspirasi kecintaan pada pembelajaran dan memberdayakan siswa dari segala usia untuk mencapai potensi penuh mereka.'
                  : 'We are committed to providing personalized, student-centered learning experiences that prepare young minds for a rapidly evolving future. By combining carefully curated curriculum with adaptive technology, we aim to inspire a love of learning and empower students of all ages to reach their full potential.'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'id' ? 'Pendekatan Pendidikan' : 'Educational Approach'}
              </CardTitle>
              <CardDescription>
                {language === 'id' ? 'Bagaimana kami mendukung pembelajaran' : 'How we support learning'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {language === 'id'
                  ? 'Platform kami menggabungkan berbagai pendekatan pembelajaran untuk memenuhi kebutuhan setiap siswa. Dengan memanfaatkan teknologi AI, kami menawarkan konten yang dipersonalisasi yang beradaptasi dengan tingkat pemahaman dan gaya belajar yang unik dari masing-masing siswa.'
                  : 'Our platform combines diverse learning approaches to meet the needs of every student. By leveraging AI technology, we offer personalized content that adapts to each student\'s unique comprehension level and learning style.'}
              </p>
              
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">
                  {language === 'id' ? 'Level Pendidikan' : 'Educational Levels'}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {educationLevels.map((level) => (
                    <Card key={level.level}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{level.name}</CardTitle>
                          <span className="bg-eduPurple text-white text-xs font-semibold px-2 py-1 rounded">
                            {level.level}
                          </span>
                        </div>
                        <CardDescription>
                          {level.ageRange} • {level.grades}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{level.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'id' ? 'Fitur Utama' : 'Key Features'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="bg-eduPastel-green rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                    <span className="text-eduPurple font-bold">✓</span>
                  </div>
                  <span>
                    {language === 'id'
                      ? 'Pembelajaran yang dipersonalisasi berdasarkan kebutuhan dan kemampuan setiap siswa'
                      : "Personalized learning based on each student's needs and abilities"}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-eduPastel-blue rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                    <span className="text-eduPurple font-bold">✓</span>
                  </div>
                  <span>
                    {language === 'id'
                      ? 'Pendampingan AI untuk dukungan belajar 24/7'
                      : 'AI mentorship for 24/7 learning support'}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-eduPastel-peach rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                    <span className="text-eduPurple font-bold">✓</span>
                  </div>
                  <span>
                    {language === 'id'
                      ? 'Kurikulum interaktif yang mencakup berbagai mata pelajaran'
                      : 'Interactive curriculum covering a wide range of subjects'}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-eduPastel-yellow rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                    <span className="text-eduPurple font-bold">✓</span>
                  </div>
                  <span>
                    {language === 'id'
                      ? 'Pelacakan kemajuan mendetail dengan wawasan analitik'
                      : 'Detailed progress tracking with analytical insights'}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-eduPastel-purple rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                    <span className="text-eduPurple font-bold">✓</span>
                  </div>
                  <span>
                    {language === 'id'
                      ? 'Sistem penghargaan yang memotivasi untuk mendorong engagement'
                      : 'Motivational reward system to encourage engagement'}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
