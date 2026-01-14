import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  X,
  MessageSquare, 
  MessageCircle, 
  Calendar,
  BookOpen,
  HelpCircle,
  Send
} from 'lucide-react';
import { 
  ActivityType, 
  CreateActivityFormData, 
  ACTIVITY_TYPE_CONFIGS,
  ACTIVITY_CATEGORIES
} from '../../types/studentsCorner';
import { apiService } from '../../services/api';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateActivityModal: React.FC<CreateActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const user = auth.currentUser;
  const [step, setStep] = useState<'select-type' | 'fill-form'>('select-type');
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateActivityFormData>({
    type: 'POST',
    title: '',
    content: '',
    category: 'General'
  });

  const resetModal = () => {
    setStep('select-type');
    setSelectedType(null);
    setFormData({
      type: 'POST',
      title: '',
      content: '',
      category: 'General'
    });
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetModal();
      onClose();
    }
  };

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, type }));
    setStep('fill-form');
  };

  const handleInputChange = (field: keyof CreateActivityFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email || !selectedType) {
      toast.error('Authentication required');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare metadata
      const metadata: Record<string, any> = {};
      
      if (selectedType === 'EVENT' && formData.eventDate) {
        metadata.eventDate = formData.eventDate;
        metadata.eventTime = formData.eventTime || '';
        metadata.eventLocation = formData.eventLocation || '';
        metadata.eventType = 'Other';
      }
      
      if ((selectedType === 'SKILL_OFFER' || selectedType === 'SKILL_REQUEST') && formData.skillLevel) {
        metadata.skillLevel = formData.skillLevel;
        metadata.duration = formData.duration || '';
        metadata.preferredTime = formData.preferredTime || '';
        metadata.contactMethod = 'Email';
      }

      const response = await apiService.createStudentsCornerPost(
        user.email,
        selectedType,
        formData.title.trim(),
        formData.content.trim(),
        undefined, // targetBatch will default to user's batch in backend
        formData.category || 'General',
        JSON.stringify(metadata)
      );

      if (response.success) {
        toast.success(
          `${ACTIVITY_TYPE_CONFIGS[selectedType].label} created successfully! +${response.data?.points || 0} points`
        );
        resetModal();
        onSuccess();
        onClose();
      } else {
        toast.error(response.error || 'Failed to create activity');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelection = () => {
    const activityTypes: ActivityType[] = ['POST', 'FORUM', 'EVENT', 'SKILL_OFFER', 'SKILL_REQUEST'];
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">What would you like to create?</h3>
          <p className="text-sm text-muted-foreground">
            Choose the type of activity you want to share with your fellow students
          </p>
        </div>
        
        <div className="grid gap-3">
          {activityTypes.map((type) => {
            const config = ACTIVITY_TYPE_CONFIGS[type];
            const IconComponent = type === 'POST' ? MessageSquare :
                                type === 'FORUM' ? MessageCircle :
                                type === 'EVENT' ? Calendar :
                                type === 'SKILL_OFFER' ? BookOpen : HelpCircle;
            
            return (
              <Card 
                key={type}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                onClick={() => handleTypeSelect(type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${config.color} shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{config.label}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{config.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderForm = () => {
    if (!selectedType) return null;
    
    const config = ACTIVITY_TYPE_CONFIGS[selectedType];
    const IconComponent = selectedType === 'POST' ? MessageSquare :
                        selectedType === 'FORUM' ? MessageCircle :
                        selectedType === 'EVENT' ? Calendar :
                        selectedType === 'SKILL_OFFER' ? BookOpen : HelpCircle;

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Create {config.label}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder={`Enter ${config.label.toLowerCase()} title...`}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder={`Describe your ${config.label.toLowerCase()}...`}
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isSubmitting}
          >
            {ACTIVITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>


        {/* Event-specific fields */}
        {selectedType === 'EVENT' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Date</label>
                <input
                  type="date"
                  value={formData.eventDate || ''}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event Time</label>
                <input
                  type="time"
                  value={formData.eventTime || ''}
                  onChange={(e) => handleInputChange('eventTime', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={formData.eventLocation || ''}
                onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                placeholder="Enter event location..."
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        {/* Skill exchange fields */}
        {(selectedType === 'SKILL_OFFER' || selectedType === 'SKILL_REQUEST') && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Skill Level</label>
              <select
                value={formData.skillLevel || 'Beginner'}
                onChange={(e) => handleInputChange('skillLevel', e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration/Time Commitment</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 1 hour, Flexible, Weekly sessions..."
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('select-type')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
            className="flex-1"
          >
            {isSubmitting ? (
              'Creating...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create Activity
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Create New Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {step === 'select-type' ? renderTypeSelection() : renderForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateActivityModal;