import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { 
  MessageSquare, 
  MessageCircle, 
  Calendar,
  BookOpen,
  HelpCircle,
  Star,
  Heart,
  MessageSquareIcon,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { 
  StudentsCornerActivity, 
  ActivityType,
  ACTIVITY_TYPE_CONFIGS,
  EventMetadata,
  SkillExchangeMetadata,
  ActivityEngagements
} from '../../types/studentsCorner';
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils';
import { auth } from '../../firebase/config';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ActivityCardProps {
  activity: StudentsCornerActivity;
  onInteract?: (activityId: string, action: 'like' | 'comment') => void;
  showFullContent?: boolean;
  compact?: boolean;
  onEngagementUpdate?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  onInteract,
  showFullContent = false,
  compact = false,
  onEngagementUpdate
}) => {
  const user = auth.currentUser;
  const isMyActivity = activity.studentEmail === user?.email;
  const [engagements, setEngagements] = useState<ActivityEngagements | null>(null);
  const [loading, setLoading] = useState(false);
  const [engagementsLoading, setEngagementsLoading] = useState(true);

  const getActivityIcon = (type: ActivityType) => {
    const iconMap = {
      POST: MessageSquare,
      FORUM: MessageCircle,
      EVENT: Calendar,
      SKILL_OFFER: BookOpen,
      SKILL_REQUEST: HelpCircle
    };
    return iconMap[type];
  };

  const getActivityTypeColor = (type: ActivityType) => {
    return ACTIVITY_TYPE_CONFIGS[type].color;
  };

  useEffect(() => {
    loadEngagements();
  }, [activity.id]);

  const loadEngagements = async () => {
    if (!user?.email) return;
    
    setEngagementsLoading(true);
    try {
      const response = await apiService.getStudentsCornerEngagements(user.email, activity.id);
      if (response.success && response.data) {        
        setEngagements(response.data);
      }
    } catch (error) {
      console.error('Error loading engagements:', error);
    } finally {
      setEngagementsLoading(false);
    }
  };

  const parseMetadata = () => {
    try {
      return JSON.parse(activity.metadata || '{}');
    } catch {
      return {};
    }
  };

  const renderEventDetails = () => {
    const metadata = parseMetadata() as EventMetadata;
    if (activity.type !== 'EVENT' || !metadata.eventDate) return null;

    return (
      <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Event Details</span>
        </div>
        
        <div className="space-y-1 text-sm">
          {metadata.eventDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>
                {new Date(metadata.eventDate).toLocaleDateString()} 
                {metadata.eventTime && ` at ${metadata.eventTime}`}
              </span>
            </div>
          )}
          
          {metadata.eventLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{metadata.eventLocation}</span>
            </div>
          )}
          
          {metadata.maxAttendees && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>Max {metadata.maxAttendees} attendees</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSkillDetails = () => {
    const metadata = parseMetadata() as SkillExchangeMetadata;
    if ((activity.type !== 'SKILL_OFFER' && activity.type !== 'SKILL_REQUEST') || !metadata.skillLevel) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Skill Details</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {metadata.skillLevel && (
            <Badge variant="outline" className="text-xs">
              {metadata.skillLevel} Level
            </Badge>
          )}
          
          {metadata.duration && (
            <Badge variant="outline" className="text-xs">
              {metadata.duration}
            </Badge>
          )}
          
          {metadata.contactMethod && (
            <Badge variant="outline" className="text-xs">
              Contact: {metadata.contactMethod}
            </Badge>
          )}
          
          {metadata.isRemote && (
            <Badge variant="outline" className="text-xs">
              Remote
            </Badge>
          )}
        </div>
        
        {metadata.subjects && metadata.subjects.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Subjects: </span>
            <span className="text-xs">{metadata.subjects.join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  const handleLike = async () => {
    if (!user?.email) return;
    
    // Don't allow liking your own activities
    if (isMyActivity) {
      toast.error("You can't like your own activity");
      return;
    }
    
    // Don't allow if already liked
    if (engagements?.userLiked) {
      toast('You have already liked this activity');
      return;
    }
    
    setLoading(true);
    try {
      // Only allow liking, no unlike
      const response = await apiService.createStudentsCornerEngagement(
        user.email,
        activity.id,
        'LIKE'
      );
      if (response.success) {
        toast.success(`Liked! +${response.data?.points || 2} points`);
        await loadEngagements();
        onEngagementUpdate?.();
      } else {
        toast.error(response.error || 'Failed to like');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const renderActivityActions = () => {
    if (compact) return null;

    if (engagementsLoading) {
      return (
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between pt-3 border-t">
        {/* Like button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={loading || isMyActivity || engagements?.userLiked}
          className={`flex items-center gap-2 ${
            engagements?.userLiked 
              ? 'text-red-600 cursor-not-allowed opacity-75' 
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <Heart className={`h-4 w-4 ${engagements?.userLiked ? 'fill-current' : ''}`} />
          <span className="text-xs">
            {engagements?.likes || 0} {engagements?.likes === 1 ? 'like' : 'likes'}
          </span>
        </Button>
        
        {/* Discuss button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onInteract?.(activity.id, 'comment')}
          className="flex items-center gap-2"
        >
          <MessageSquareIcon className="h-4 w-4" />
          <span className="text-xs">
            Discuss ({engagements?.comments?.length || 0})
          </span>
        </Button>
      </div>
    );
  };

  const Icon = getActivityIcon(activity.type);

  return (
    <Card className={`hover:shadow-md transition-shadow ${compact ? '' : 'mb-4'}`}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${getActivityTypeColor(activity.type)}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={`${compact ? 'text-base' : 'text-lg'} leading-tight truncate`}>
                {activity.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <CardDescription className="truncate">
                  by {activity.fullName}
                </CardDescription>
                <Badge variant="outline" className="text-xs shrink-0">
                  {activity.batch}
                </Badge>
                {isMyActivity && (
                  <Badge variant="default" className="text-xs shrink-0">
                    <Star className="h-3 w-3 mr-1" />
                    Mine
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <Badge className={`${getActivityTypeColor(activity.type)} mb-1`}>
              {ACTIVITY_TYPE_CONFIGS[activity.type].label}
            </Badge>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(activity.timestamp)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? "pt-0" : "pt-0"}>
        <div className={`text-sm text-muted-foreground mb-4 ${
          showFullContent ? '' : 'line-clamp-3'
        }`}>
          {activity.content}
        </div>
        
        {/* Event-specific details */}
        {renderEventDetails()}
        
        {/* Skill exchange details */}
        {renderSkillDetails()}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatDateTime(activity.timestamp)}</span>
            {activity.category && activity.category !== 'General' && (
              <Badge variant="outline" className="text-xs">
                {activity.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              +{activity.points} pts
            </Badge>
          </div>
        </div>
        
        {/* Activity actions (like, discuss) */}
        {renderActivityActions()}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;