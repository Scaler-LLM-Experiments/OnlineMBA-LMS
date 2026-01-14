import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BookOpen,
  FileText,
  Video,
  Users,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  Download,
  BookMarked
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'template' | 'guide';
  url?: string;
  icon: React.ReactNode;
}

const ResourcesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Resume Writing Guide',
      description: 'Learn how to craft a compelling resume that stands out to recruiters',
      category: 'Resume',
      type: 'guide',
      icon: <FileText size={24} className="text-blue-600" />
    },
    {
      id: '2',
      title: 'ATS-Friendly Resume Template',
      description: 'Professional resume template optimized for Applicant Tracking Systems',
      category: 'Resume',
      type: 'template',
      icon: <Download size={24} className="text-green-600" />
    },
    {
      id: '3',
      title: 'Interview Preparation Checklist',
      description: 'Complete checklist to prepare for your upcoming interviews',
      category: 'Interview',
      type: 'guide',
      icon: <CheckCircle2 size={24} className="text-purple-600" />
    },
    {
      id: '4',
      title: 'Common Interview Questions',
      description: 'Practice answers to the most frequently asked interview questions',
      category: 'Interview',
      type: 'article',
      icon: <BookOpen size={24} className="text-orange-600" />
    },
    {
      id: '5',
      title: 'Behavioral Interview Techniques',
      description: 'Master the STAR method for behavioral interview questions',
      category: 'Interview',
      type: 'video',
      icon: <Video size={24} className="text-red-600" />
    },
    {
      id: '6',
      title: 'Salary Negotiation Tips',
      description: 'Learn effective strategies for negotiating your job offer',
      category: 'Career',
      type: 'article',
      icon: <TrendingUp size={24} className="text-green-600" />
    },
    {
      id: '7',
      title: 'LinkedIn Profile Optimization',
      description: 'Build a professional LinkedIn presence to attract recruiters',
      category: 'Networking',
      type: 'guide',
      icon: <Users size={24} className="text-blue-600" />
    },
    {
      id: '8',
      title: 'Cover Letter Templates',
      description: 'Customizable cover letter templates for different industries',
      category: 'Resume',
      type: 'template',
      icon: <FileText size={24} className="text-indigo-600" />
    },
    {
      id: '9',
      title: 'First Day at Work Guide',
      description: 'Tips for making a great impression on your first day',
      category: 'Career',
      type: 'article',
      icon: <Lightbulb size={24} className="text-yellow-600" />
    },
    {
      id: '10',
      title: 'Technical Interview Prep',
      description: 'Resources for preparing technical coding interviews',
      category: 'Interview',
      type: 'guide',
      icon: <BookMarked size={24} className="text-teal-600" />
    }
  ];

  const categories = [
    { id: 'all', label: 'All Resources', count: resources.length },
    { id: 'Resume', label: 'Resume', count: resources.filter(r => r.category === 'Resume').length },
    { id: 'Interview', label: 'Interview', count: resources.filter(r => r.category === 'Interview').length },
    { id: 'Career', label: 'Career', count: resources.filter(r => r.category === 'Career').length },
    { id: 'Networking', label: 'Networking', count: resources.filter(r => r.category === 'Networking').length },
  ];

  const filteredResources = activeCategory === 'all'
    ? resources
    : resources.filter(r => r.category === activeCategory);

  const getTypeBadge = (type: string) => {
    const badgeColors = {
      article: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      video: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      template: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      guide: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };
    return (
      <Badge className={`${badgeColors[type as keyof typeof badgeColors]} text-xs`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Placement Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interview preparation, resume templates, and career guidance
        </p>
      </div>

      {/* Category Tabs */}
      <div className="border-b">
        <div className="flex gap-8 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === category.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
              {activeCategory === category.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-muted rounded-lg">
                  {resource.icon}
                </div>
                <div className="flex-1">
                  {getTypeBadge(resource.type)}
                </div>
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2 group-hover:text-blue-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {resource.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {resource.category}
                </Badge>
                <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
                  {resource.type === 'template' ? (
                    <>
                      <Download size={14} />
                      Download
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      View
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Lightbulb size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg mb-2">
                Need personalized career guidance?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule a one-on-one session with our placement team for personalized advice on your career journey.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Schedule a Session
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourcesPage;
