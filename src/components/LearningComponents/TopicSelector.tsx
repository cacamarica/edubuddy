
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface TopicSelectorProps {
  subject: string;
  subjectOptions: string[];
  topicSuggestions: string[];
  customTopic: string;
  onSubjectChange: (subject: string) => void;
  onTopicSelect: (topic: string) => void;
  onCustomTopicChange: (topic: string) => void;
  onCreateContent: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  subject,
  subjectOptions,
  topicSuggestions,
  customTopic,
  onSubjectChange,
  onTopicSelect,
  onCustomTopicChange,
  onCreateContent,
}) => {
  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display">Create Your Learning Content</CardTitle>
        <CardDescription>
          Tell us what you want to learn about and we'll create custom content just for you!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((subjectOption) => (
              <Button 
                key={subjectOption}
                type="button"
                variant={subject === subjectOption ? "default" : "outline"}
                className={subject === subjectOption ? "bg-eduPurple hover:bg-eduPurple-dark" : ""}
                onClick={() => onSubjectChange(subjectOption)}
              >
                {subjectOption}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input 
            id="customTopic"
            placeholder="Enter any topic you want to learn about..."
            value={customTopic}
            onChange={(e) => onCustomTopicChange(e.target.value)}
          />
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">Or select a suggested topic for {subject}:</p>
            <div className="flex flex-wrap gap-2">
              {topicSuggestions?.map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => onTopicSelect(suggestion)}
                  className="bg-eduPastel-purple hover:bg-eduPastel-purple/80"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={onCreateContent} 
          disabled={!customTopic.trim()}
          className="bg-eduPurple hover:bg-eduPurple-dark"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Create Learning Content
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TopicSelector;
