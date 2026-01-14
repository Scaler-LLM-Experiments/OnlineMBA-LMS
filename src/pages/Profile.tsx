import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ProfileSkeleton } from '../components/ui/loading-skeletons';
import { 
  User, 
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Code,
  Heart,
  Building,
  MapPin,
  Calendar,
  Award,
  Target,
  BookOpen,
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';
import { auth } from '../firebase/config';
import { apiService, type FullStudentProfile } from '../services/api';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../hooks/useActivityTracker';

// Profile page uses FullStudentProfile interface directly

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<FullStudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FullStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlErrors, setUrlErrors] = useState<{
    linkedIn?: string;
    portfolioLink?: string;
    github?: string;
  }>({});
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Profile');
  }, [trackPageView]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      
      // Get full profile from backend
      const result = await apiService.getFullStudentProfile(user.email);
      
      if (result.success && result.data) {
        console.log('Profile page: Full profile data received:', result.data);
        console.log('Profile page: Profile picture URL:', result.data.profilePicture);
        setProfile(result.data);
        setEditForm(result.data);
      } else {
        console.error('❌ API returned error:', result.error);
        console.error('📄 Full API response:', result);
        toast.error('Failed to load profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('💥 Catch block - Network/Parse error:', error);
      console.error('🔧 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast.error('Network error - check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(profile);
  };

  const handleSave = async () => {
    if (!user?.email || !editForm) return;

    // Check for URL validation errors
    if (Object.keys(urlErrors).length > 0) {
      toast.error('Please fix invalid URLs before saving');
      return;
    }

    try {
      setSaving(true);

      // Extract only the editable fields (excluding email, fullName, rollNo, batch)
      const { email, fullName, rollNo, batch, ...editableFields } = editForm;

      // Save to backend
      const result = await apiService.updateStudentProfile(user.email, editableFields);

      if (result.success && result.data) {
        setProfile(result.data);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
    setUrlErrors({});
  };

  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty is allowed
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof FullStudentProfile, value: string) => {
    setEditForm(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);

    // Validate URL fields
    if (field === 'linkedIn' || field === 'portfolioLink' || field === 'github') {
      if (value && !validateUrl(value)) {
        setUrlErrors(prev => ({
          ...prev,
          [field]: 'Please enter a valid URL (must start with http:// or https://)'
        }));
      } else {
        setUrlErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateProfileCompletion = (profile: FullStudentProfile): number => {
    // Calculate completion based on key editable fields
    const fields = [
      profile.aboutMe, profile.phoneNo, profile.currentLocation, profile.linkedIn,
      profile.portfolioLink, profile.undergraduateCollege, profile.undergraduateStream,
      profile.previousCompany, profile.previousRole, profile.techSkills, profile.softSkills
    ];
    const filledFields = fields.filter(field => field && typeof field === 'string' && field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Failed to load profile data</p>
        <Button onClick={fetchProfile}>
          Retry
        </Button>
      </div>
    );
  }

  const completionPercentage = calculateProfileCompletion(profile);

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Profile Information</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your personal and professional details
                </p>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} size="sm" className="bg-primary hover:bg-primary/90">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline" disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage 
                  src={profile.profilePicture}
                  onLoad={() => console.log('Profile image loaded successfully:', profile.profilePicture)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;
                    console.log('Profile image failed to load:', currentSrc);
                    console.log('Original URL from backend:', profile.profilePicture);
                    
                    // Check if we've already retried to prevent infinite loops
                    if (target.dataset.retried === 'true') {
                      console.log('Already retried, showing fallback avatar');
                      target.removeAttribute('src');
                      return;
                    }
                    
                    // Handle both old and new Google Drive URL formats
                    if (currentSrc && (currentSrc.includes('googleusercontent.com') || currentSrc.includes('drive.google.com'))) {
                      let fileId = '';
                      
                      // Extract file ID from different Google Drive URL formats
                      if (currentSrc.includes('googleusercontent.com')) {
                        // Format: https://lh3.googleusercontent.com/d/FILE_ID=w400-h400
                        const match = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        fileId = match?.[1] || '';
                      } else if (currentSrc.includes('drive.google.com')) {
                        // Format: https://drive.google.com/file/d/FILE_ID/view
                        const match = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        fileId = match?.[1] || '';
                      }
                      
                      if (fileId) {
                        const newUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                        console.log('Converting Google Drive URL to direct format:', newUrl);
                        target.dataset.retried = 'true';
                        target.src = newUrl;
                        return;
                      }
                    }
                    
                    // For all other URLs or failed conversions
                    console.log('Unable to load image, showing fallback avatar');
                    target.removeAttribute('src');
                  }}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              
              {/* Profile Completion Badge */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-full">
                <div className="flex items-center space-x-1">
                  {completionPercentage === 100 ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Target className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Basic Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-lg font-semibold">{profile.fullName || 'Not provided'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email Address
                    </Label>
                    <p className="text-muted-foreground">{profile.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Roll Number</Label>
                    <p>{profile.rollNo || 'Not assigned'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Batch</Label>
                    <p>{profile.batch || 'Not assigned'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={editForm?.phoneNo || ''}
                        onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p>{profile.phoneNo || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Current Location
                    </Label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editForm?.currentLocation || ''}
                        onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                      />
                    ) : (
                      <p>{profile.currentLocation || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* About Me Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">About Me</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tell us about yourself</Label>
                    {isEditing && (
                      <span className={`text-xs ${(editForm?.aboutMe?.length || 0) > 2500 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                        {editForm?.aboutMe?.length || 0} / 2500 characters
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={editForm?.aboutMe || ''}
                      onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                      placeholder="Write a brief description about yourself, your goals, and what you're passionate about..."
                      rows={4}
                      className="resize-none"
                      maxLength={2500}
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {profile.aboutMe || 'No information provided yet. Click Edit Profile to add your story!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="h-5 w-5 mr-2 text-primary" />
            Professional Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Linkedin className="h-4 w-4 mr-1 text-blue-600" />
                LinkedIn Profile
              </Label>
              {isEditing ? (
                <>
                  <Input
                    type="url"
                    value={editForm?.linkedIn || ''}
                    onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={urlErrors.linkedIn ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {urlErrors.linkedIn && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {urlErrors.linkedIn}
                    </p>
                  )}
                </>
              ) : (
                <div>
                  {profile.linkedIn ? (
                    <a
                      href={profile.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      View LinkedIn
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not provided</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Globe className="h-4 w-4 mr-1 text-green-600" />
                Portfolio Website
              </Label>
              {isEditing ? (
                <>
                  <Input
                    type="url"
                    value={editForm?.portfolioLink || ''}
                    onChange={(e) => handleInputChange('portfolioLink', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className={urlErrors.portfolioLink ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {urlErrors.portfolioLink && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {urlErrors.portfolioLink}
                    </p>
                  )}
                </>
              ) : (
                <div>
                  {profile.portfolioLink ? (
                    <a
                      href={profile.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline flex items-center"
                    >
                      View Portfolio
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not provided</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Code className="h-4 w-4 mr-1 text-foreground" />
                GitHub Profile
              </Label>
              {isEditing ? (
                <>
                  <Input
                    type="url"
                    value={editForm?.github || ''}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className={urlErrors.github ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {urlErrors.github && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {urlErrors.github}
                    </p>
                  )}
                </>
              ) : (
                <div>
                  {profile.github ? (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline flex items-center"
                    >
                      View GitHub
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not provided</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education & Experience */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Educational Background */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-primary" />
              Educational Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Undergraduate College</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.undergraduateCollege || ''}
                  onChange={(e) => handleInputChange('undergraduateCollege', e.target.value)}
                  placeholder="Enter your college name"
                />
              ) : (
                <p>{profile.undergraduateCollege || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stream/Major</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.undergraduateStream || ''}
                  onChange={(e) => handleInputChange('undergraduateStream', e.target.value)}
                  placeholder="e.g., Computer Science, Business, Engineering"
                />
              ) : (
                <p>{profile.undergraduateStream || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Graduation Year
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.graduationYear || ''}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="e.g., 2023"
                />
              ) : (
                <p>{profile.graduationYear || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-primary" />
              Previous Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Building className="h-4 w-4 mr-1" />
                Previous Company
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.previousCompany || ''}
                  onChange={(e) => handleInputChange('previousCompany', e.target.value)}
                  placeholder="Enter company name"
                />
              ) : (
                <p>{profile.previousCompany || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Previous Role</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.previousRole || ''}
                  onChange={(e) => handleInputChange('previousRole', e.target.value)}
                  placeholder="Enter your role/position"
                />
              ) : (
                <p>{profile.previousRole || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm?.previousDuration || ''}
                  onChange={(e) => handleInputChange('previousDuration', e.target.value)}
                  placeholder="e.g., 2 years (2021-2023)"
                />
              ) : (
                <p>{profile.previousDuration || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills & Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2 text-primary" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  <Code className="h-4 w-4 mr-1 text-blue-600" />
                  Technical Skills
                </Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.techSkills?.length || 0) > 1000 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.techSkills?.length || 0} / 1000
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.techSkills || ''}
                  onChange={(e) => handleInputChange('techSkills', e.target.value)}
                  placeholder="e.g., JavaScript, Python, React, Data Analysis, Machine Learning..."
                  rows={4}
                  className="resize-none"
                  maxLength={1000}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.techSkills || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  Soft Skills
                </Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.softSkills?.length || 0) > 1000 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.softSkills?.length || 0} / 1000
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.softSkills || ''}
                  onChange={(e) => handleInputChange('softSkills', e.target.value)}
                  placeholder="e.g., Leadership, Communication, Teamwork, Problem Solving, Project Management..."
                  rows={4}
                  className="resize-none"
                  maxLength={1000}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.softSkills || 'Not provided'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Achievements & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Achievements & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Achievements</Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.achievements?.length || 0) > 1000 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.achievements?.length || 0} / 1000
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.achievements || ''}
                  onChange={(e) => handleInputChange('achievements', e.target.value)}
                  placeholder="List your key achievements, awards, recognitions..."
                  rows={3}
                  className="resize-none"
                  maxLength={1000}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.achievements || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Certifications</Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.certifications?.length || 0) > 1000 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.certifications?.length || 0} / 1000
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.certifications || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  placeholder="List your professional certifications..."
                  rows={3}
                  className="resize-none"
                  maxLength={1000}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.certifications || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests & Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Interests & Languages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Interests & Hobbies</Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.interests?.length || 0) > 1000 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.interests?.length || 0} / 1000
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.interests || ''}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  placeholder="What are you passionate about outside of work/studies?"
                  rows={3}
                  className="resize-none"
                  maxLength={1000}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.interests || 'Not provided'}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Languages</Label>
                {isEditing && (
                  <span className={`text-xs ${(editForm?.languages?.length || 0) > 500 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                    {editForm?.languages?.length || 0} / 500
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm?.languages || ''}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  placeholder="e.g., English (Fluent), Hindi (Native), Spanish (Beginner)..."
                  rows={3}
                  className="resize-none"
                  maxLength={500}
                />
              ) : (
                <p className="whitespace-pre-wrap">{profile.languages || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Profile Completion
            </div>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-sm">
              {completionPercentage}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Keep building your profile</span>
              <span>{completionPercentage < 100 ? `${100 - completionPercentage}% remaining` : 'Profile Complete!'}</span>
            </div>
            {completionPercentage < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Complete your profile to make the most of your SSB experience and stand out to potential opportunities!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;