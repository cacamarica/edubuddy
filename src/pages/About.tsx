
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, BookOpen, Star, Users, Sparkles, BarChart } from 'lucide-react';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-eduPastel-purple to-white py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-eduPurple p-6 mb-6">
                <Brain className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                🧠 About Us
              </h1>
              <p className="max-w-3xl text-xl">
                Hi! 👋 Welcome to EduBuddy, a learning platform built by kids, for kids!
              </p>
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <Card className="mb-8 overflow-hidden">
              <div className="bg-eduPastel-blue p-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Star className="h-6 w-6 text-eduPurple" />
                  Our Story
                </h2>
              </div>
              <CardContent className="p-6 text-lg space-y-4">
                <p>
                  This platform was dreamed up by an 11-year-old 4th grader named Danish Adlanahza Hartono. Danish noticed something troubling: many kids today are more excited about mobile games than learning new things. While games are fun, Danish believes that too much screen time without learning can lead to what he calls "brainrot" — where our minds forget how to grow and explore.
                </p>
                <p>
                  That's why this educational platform was born — a fun, smart, and interactive learning space made by a kid, for kids. It helps students learn useful subjects like Math, Science, and English, all through games, quizzes, and exciting AI-powered lessons.
                </p>
                <p>
                  But it's not just for kids — it's also built for the new generation of parents. Using AI, parents and teachers can monitor each child's progress, see detailed reports, and understand how their kids are learning — almost like having a virtual teacher assistant by their side!
                </p>
              </CardContent>
            </Card>
            
            {/* Educational levels info */}
            <Card className="mb-8 overflow-hidden">
              <div className="bg-eduPastel-green p-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-eduPurple" />
                  Our Educational Levels
                </h2>
              </div>
              <CardContent className="p-6 text-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-eduPastel-blue/20 rounded-lg">
                    <h3 className="text-xl font-bold text-eduPurple mb-2">K-3 (Ages 5-8)</h3>
                    <p>Early learning concepts focused on building fundamental knowledge through interactive and playful activities. Perfect for kindergarten through 3rd grade students just starting their educational journey.</p>
                  </div>
                  
                  <div className="p-4 bg-eduPastel-green/20 rounded-lg">
                    <h3 className="text-xl font-bold text-eduPurple mb-2">4-6 (Ages 9-11)</h3>
                    <p>Intermediate learning that builds on basics while introducing more complex topics. Designed for 4th through 6th grade students who are developing critical thinking and independent learning skills.</p>
                  </div>
                  
                  <div className="p-4 bg-eduPastel-peach/20 rounded-lg">
                    <h3 className="text-xl font-bold text-eduPurple mb-2">7-9 (Ages 12-15)</h3>
                    <p>Advanced concepts that prepare students for higher education. Created for 7th through 9th grade students who are ready for more challenging material and deeper understanding of subjects.</p>
                  </div>
                </div>
                
                <p className="text-center font-medium text-eduPurple">
                  Each level is carefully designed with age-appropriate content, vocabulary, and learning approaches to ensure the best possible educational experience!
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-eduPastel-yellow overflow-hidden">
                <div className="flex justify-center py-6">
                  <BookOpen className="h-12 w-12 text-eduPurple" />
                </div>
                <CardContent className="text-center p-6">
                  <h3 className="text-xl font-display font-bold mb-2">
                    Fun Learning
                  </h3>
                  <p>Interactive lessons and games that make education exciting.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-eduPastel-green overflow-hidden">
                <div className="flex justify-center py-6">
                  <Users className="h-12 w-12 text-eduPurple" />
                </div>
                <CardContent className="text-center p-6">
                  <h3 className="text-xl font-display font-bold mb-2">
                    For Parents Too
                  </h3>
                  <p>Track your child's progress and guide their learning journey.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-eduPastel-blue overflow-hidden">
                <div className="flex justify-center py-6">
                  <Sparkles className="h-12 w-12 text-eduPurple" />
                </div>
                <CardContent className="text-center p-6">
                  <h3 className="text-xl font-display font-bold mb-2">
                    AI-Powered
                  </h3>
                  <p>Smart technology that adapts to how each child learns best.</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <BarChart className="h-16 w-16 text-eduPurple mb-4" />
                  <h2 className="text-2xl font-display font-bold mb-4">Our Mission</h2>
                  <p className="text-xl font-medium text-eduPurple-dark mb-4">
                    "Help kids love learning again — and give parents the tools to guide them."
                  </p>
                  <p>
                    Welcome to the future of smart, safe, and fun education — powered by young minds, smart tech, and big dreams. 🚀
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
