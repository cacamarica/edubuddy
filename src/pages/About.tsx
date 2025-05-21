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
              <CardTitle className="flex items-center">
                <span className="mr-2">✉️</span>
                {language === 'id' ? 'Surat dari Pendiri' : 'Letter from the Founder'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose">
                <p className="mb-4">
                  {language === 'id' 
                    ? 'Hai, nama saya Danish Adlanahza Hartono. Saya berusia 11 tahun dan saat ini duduk di kelas 4.'
                    : 'Hi, my name is Danish Adlanahza Hartono. I\'m 11 years old and currently in 4th grade.'}
                </p>
                
                <p className="mb-4">
                  {language === 'id'
                    ? 'Saya membuat platform ini karena saya memperhatikan sesuatu yang membuat saya khawatir—semakin banyak anak-anak saat ini menghabiskan sebagian besar waktu mereka bermain game mobile dan menonton video yang tidak membantu mereka belajar atau berkembang. Banyak teman saya merasa bosan dengan sekolah atau tidak lagi menikmati belajar. Saya percaya ini dapat mengarah pada apa yang saya sebut sebagai "generasi brainrot," di mana anak-anak lupa betapa menyenangkan dan pentingnya pembelajaran sejati.'
                    : 'I created this platform because I noticed something that made me worried—more and more kids today spend most of their time playing mobile games and watching videos that don\'t help them learn or grow. Many of my friends feel bored with school or don\'t enjoy learning anymore. I believe this could lead to what I call a "brainrot generation," where children forget how fun and important real learning can be.'}
                </p>
                
                <p className="mb-4">
                  {language === 'id'
                    ? 'Itulah mengapa saya ingin membangun sesuatu yang berbeda. Sebuah tempat di mana belajar sama menariknya dengan bermain game, di mana pelajaran menjadi hidup melalui cerita, video, gambar, kuis, dan bahkan pendamping AI—seperti memiliki guru virtual yang selalu siap membantu.'
                    : 'That\'s why I wanted to build something different. A place where learning is just as exciting as playing games, where lessons come to life through stories, videos, pictures, quizzes, and even AI companions—like having a virtual teacher that\'s always ready to help.'}
                </p>
                
                <p className="mb-4">
                  {language === 'id'
                    ? 'Platform ini juga dirancang untuk orang tua. Saya ingin memastikan Anda dapat memahami bagaimana perkembangan anak Anda tanpa perlu memeriksa setiap jawaban. AI kami dapat merangkum kemajuan belajar mereka, menunjukkan kekuatan mereka dan apa yang perlu mereka kerjakan—sehingga Anda dapat mendukung mereka dengan lebih baik tanpa stres.'
                    : 'This platform is also designed for parents. I wanted to make sure you can understand how your child is doing without needing to check every answer. Our AI can summarize their learning progress, show their strengths and what they need to work on—so you can support them better without stress.'}
                </p>
                
                <p className="mb-4">
                  {language === 'id'
                    ? 'Impian saya adalah untuk mengembalikan rasa ingin tahu dan kegembiraan dalam belajar—untuk anak-anak seperti saya, di seluruh dunia.'
                    : 'My dream is to bring back curiosity and joy in learning—for kids like me, everywhere in the world.'}
                </p>
                
                <p className="mb-4">
                  {language === 'id'
                    ? 'Mari kita belajar, jelajahi, dan tumbuh bersama.'
                    : 'Let\'s learn, explore, and grow together.'}
                </p>
                
                <div className="mt-6 border-t pt-4">
                  <p className="font-medium">
                    {language === 'id' ? 'Dengan cinta,' : 'With love,'}
                  </p>
                  <p className="font-semibold text-lg">Danish Adlanahza Hartono</p>
                  <p className="text-muted-foreground">
                    {language === 'id' ? 'Pendiri' : 'Founder'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
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
                  : "Our platform combines diverse learning approaches to meet the needs of every student. By leveraging AI technology, we offer personalized content that adapts to each student's unique comprehension level and learning style."}
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
