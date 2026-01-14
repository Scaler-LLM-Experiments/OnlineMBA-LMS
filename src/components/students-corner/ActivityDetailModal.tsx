import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { 
  X,
  MessageSquare, 
  MessageCircle, 
  Calendar,
  BookOpen,
  HelpCircle,
  Star,
  Heart,
  Send,
  MapPin,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { 
  StudentsCornerActivity, 
  ActivityType,
  ACTIVITY_TYPE_CONFIGS,
  EventMetadata,
  SkillExchangeMetadata,
  ActivityEngagements,
  StudentMention
} from '../../types/studentsCorner';
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils';
import { auth } from '../../firebase/config';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ActivityDetailModalProps {
  activity: StudentsCornerActivity;
  isOpen: boolean;
  onClose: () => void;
  onEngagementUpdate?: () => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ 
  activity, 
  isOpen, 
  onClose,
  onEngagementUpdate
}) => {
  const user = auth.currentUser;
  const isMyActivity = activity.studentEmail === user?.email;
  const [engagements, setEngagements] = useState<ActivityEngagements | null>(null);
  const [commentText, setCommentText] = useState('');
  const [students, setStudents] = useState<StudentMention[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [engagementsLoading, setEngagementsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEngagements();
      loadStudentsForMentions();
    }
  }, [isOpen, activity.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadStudentsForMentions = async () => {
    if (!user?.email) return;
    
    try {
      const response = await apiService.getStudentsForMentions(user.email);
      if (response.success && response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const parseMetadata = () => {
    try {
      return JSON.parse(activity.metadata || '{}');
    } catch {
      return {};
    }
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

  const handleCommentSubmit = async () => {
    if (!user?.email || !commentText.trim()) return;
    
    if (commentText.length > 200) {
      toast.error('Comment must be 200 characters or less');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await apiService.createStudentsCornerEngagement(
        user.email,
        activity.id,
        'COMMENT',
        commentText.trim()
      );
      
      if (response.success) {
        toast.success(`Comment posted! +${response.data?.points || 3} points`);
        setCommentText('');
        await loadEngagements();
        onEngagementUpdate?.();
      } else {
        toast.error(response.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMentionSelect = (student: StudentMention) => {
    const beforeAt = commentText.substring(0, commentText.lastIndexOf('@'));
    const afterAt = commentText.substring(commentText.lastIndexOf('@') + mentionSearch.length + 1);
    setCommentText(`${beforeAt}@${student.fullName} ${afterAt}`);
    setShowMentions(false);
    setMentionSearch('');
  };

  const handleCommentTextChange = (text: string) => {
    setCommentText(text);
    
    // Check for @ mentions
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1) {
      const searchText = text.substring(atIndex + 1);
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const renderMentionDropdown = () => {
    if (!showMentions) return null;

    const filteredStudents = mentionSearch 
      ? students.filter(student => 
          student.fullName.toLowerCase().includes(mentionSearch.toLowerCase())
        ).slice(0, 5)
      : students.slice(0, 5);

    if (filteredStudents.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
        {filteredStudents.map(student => (
          <button
            key={student.email}
            onClick={() => handleMentionSelect(student)}
            className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2"
          >
            <span className="font-medium text-foreground">{student.fullName}</span>
            <Badge variant="outline" className="text-xs">{student.batch}</Badge>
          </button>
        ))}
      </div>
    );
  };

  const renderEventDetails = () => {
    const metadata = parseMetadata() as EventMetadata;
    if (activity.type !== 'EVENT' || !metadata.eventDate) return null;

    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Event Details</span>
        </div>
        
        <div className="space-y-2 text-sm">
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
      <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2">
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

  const renderComments = () => {
    if (!engagements?.comments.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {engagements.comments.map(comment => (
          <div key={comment.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-foreground">{comment.fullName}</span>
                <Badge variant="outline" className="text-xs">{comment.batch}</Badge>
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
              </div>
              <p className="text-sm text-foreground">
                {comment.text.split(/(@\w+\s*\w*)/).map((part, index) => 
                  part.startsWith('@') ? (
                    <span key={index} className="text-primary font-medium">{part}</span>
                  ) : (
                    <span key={index} className="text-foreground">{part}</span>
                  )
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const Icon = getActivityIcon(activity.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getActivityTypeColor(activity.type)}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{activity.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-foreground">by {activity.fullName}</span>
                <Badge variant="outline" className="text-xs">{activity.batch}</Badge>
                {isMyActivity && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Mine
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold text-blue-800 dark:text-blue-100">Discussion Guidelines</h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-200 text-xs">
                  <li>• Use respectful and professional language at all times</li>
                  <li>• Be kind and supportive to your fellow students</li>
                  <li>• No offensive, discriminatory, or inappropriate content</li>
                  <li>• Keep discussions relevant and constructive</li>
                  <li>• Use @ to mention students and notify them of your comment</li>
                  <li>• Comments are limited to 200 characters</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Activity Content */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Badge className={getActivityTypeColor(activity.type)}>
                {ACTIVITY_TYPE_CONFIGS[activity.type].label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getRelativeTime(activity.timestamp)}
              </span>
            </div>
            
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {activity.content}
            </div>
            
            {/* Event/Skill Details */}
            {renderEventDetails()}
            {renderSkillDetails()}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                {formatDateTime(activity.timestamp)}
              </span>
              <Badge variant="secondary" className="text-xs">
                +{activity.points} pts
              </Badge>
            </div>
          </div>

          {/* Engagement Actions */}
          <div className="space-y-4">
            {engagementsLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
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
                  <span className="text-sm">
                    {engagements?.likes || 0} {engagements?.likes === 1 ? 'like' : 'likes'}
                  </span>
                </Button>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">
                    {engagements?.comments?.length || 0} {engagements?.comments?.length === 1 ? 'comment' : 'comments'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Discussion</h3>
            
            {/* Comment Input */}
            <div className="relative">
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => handleCommentTextChange(e.target.value)}
                    placeholder="Join the discussion... Use @ to mention students"
                    className="w-full px-4 py-3 text-sm border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    maxLength={200}
                    disabled={submittingComment}
                  />
                  {renderMentionDropdown()}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {commentText.length}/200 characters
                  </div>
                  <Button 
                    onClick={handleCommentSubmit}
                    disabled={submittingComment || !commentText.trim()}
                    size="sm"
                  >
                    {submittingComment ? (
                      'Posting...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {engagementsLoading ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Skeleton className="h-4 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              renderComments()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;