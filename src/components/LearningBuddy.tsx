
import React from 'react';
import { Card, CardContent } from "@/components/ui/card"; 

interface LearningBuddyProps {
  subject?: string;
  topic?: string;
}

const LearningBuddy: React.FC<LearningBuddyProps> = ({ subject, topic }) => {
  return (
    <div className="learning-buddy">
      <div className="learning-buddy-content">
        <h3 className="text-lg font-semibold mb-2">Learning Buddy</h3>
        {subject && topic ? (
          <p>I can help you learn about {topic} in {subject}!</p>
        ) : (
          <p>Hi! I'm your Learning Buddy. Select a topic to start learning together!</p>
        )}
      </div>
    </div>
  );
};

export default LearningBuddy;
