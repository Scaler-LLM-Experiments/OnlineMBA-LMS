import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  User,
  Briefcase,
  Edit2,
  Save,
  Upload,
  Linkedin,
  Github,
  Globe,
  MapPin,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { auth } from '../../firebase/config';
import { apiService, type FullStudentProfile } from '../../services/api';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<FullStudentProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<FullStudentProfile | null>(null);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user?.email) {
      toast.error('Please login to view profile');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.getFullStudentProfile(user.email);

      if (result.success && result.data) {
        setProfile(result.data);
        setEditedProfile(result.data);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email || !editedProfile) {
      return;
    }

    try {
      setSaving(true);
      const result = await apiService.updateStudentProfile(user.email, editedProfile);

      if (result.success) {
        setProfile(editedProfile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const updateField = (field: keyof FullStudentProfile, value: any) => {
    if (editedProfile) {
      setEditedProfile({ ...editedProfile, [field]: value });
    }
  };

  const calculateCompletionPercentage = () => {
    if (!profile) return 0;

    const requiredFields = [
      'fullName', 'rollNo', 'batch', 'phoneNo', 'currentLocation',
      'aboutMe', 'linkedIn', 'experienceType', 'preferredLocations',
      'techSkills', 'preferredDomain1', 'resumeGeneralURL'
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profile[field as keyof FullStudentProfile];
      return value && value.toString().trim() !== '';
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile and placement information
          </p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={() => editing ? handleSave() : setEditing(true)}
            variant={editing ? 'default' : 'outline'}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : editing ? (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 size={16} className="mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Student Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo and Basic Info */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2">
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {calculateCompletionPercentage()}%
              </div>
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-xl font-semibold text-foreground mb-1">
                {profile?.fullName || 'N/A'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {profile?.rollNo || 'N/A'} • {profile?.batch || 'N/A'}
              </p>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                  {editing ? (
                    <Input
                      value={editedProfile?.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="h-8"
                      disabled
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.email || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
                  {editing ? (
                    <Input
                      value={editedProfile?.phoneNo || ''}
                      onChange={(e) => updateField('phoneNo', e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.phoneNo || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Roll Number</Label>
                  <p className="text-sm font-medium text-foreground">{profile?.rollNo || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Batch</Label>
                  <p className="text-sm font-medium text-foreground">{profile?.batch || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Current Location</Label>
                  {editing ? (
                    <Input
                      value={editedProfile?.currentLocation || ''}
                      onChange={(e) => updateField('currentLocation', e.target.value)}
                      className="h-8"
                      placeholder="e.g., Bangalore, India"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <MapPin size={14} className="text-blue-600" />
                      {profile?.currentLocation || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              About Me
            </Label>
            <Textarea
              value={editing ? (editedProfile?.aboutMe || '') : (profile?.aboutMe || '')}
              onChange={(e) => updateField('aboutMe', e.target.value)}
              disabled={!editing}
              rows={3}
              placeholder="Tell us about yourself..."
              className="resize-none"
            />
          </div>

          {/* Professional Links */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Professional Links
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Linkedin size={16} className="absolute left-3 top-3 text-blue-600" />
                <Input
                  value={editing ? (editedProfile?.linkedIn || '') : (profile?.linkedIn || '')}
                  onChange={(e) => updateField('linkedIn', e.target.value)}
                  disabled={!editing}
                  placeholder="LinkedIn URL"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-blue-600" />
                <Input
                  value={editing ? (editedProfile?.portfolioLink || '') : (profile?.portfolioLink || '')}
                  onChange={(e) => updateField('portfolioLink', e.target.value)}
                  disabled={!editing}
                  placeholder="Portfolio URL"
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Github size={16} className="absolute left-3 top-3" />
                <Input
                  value={editing ? (editedProfile?.github || '') : (profile?.github || '')}
                  onChange={(e) => updateField('github', e.target.value)}
                  disabled={!editing}
                  placeholder="GitHub URL"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Education
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Undergraduate College</Label>
                {editing ? (
                  <Input
                    value={editedProfile?.undergraduateCollege || ''}
                    onChange={(e) => updateField('undergraduateCollege', e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{profile?.undergraduateCollege || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Stream</Label>
                {editing ? (
                  <Input
                    value={editedProfile?.undergraduateStream || ''}
                    onChange={(e) => updateField('undergraduateStream', e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{profile?.undergraduateStream || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Graduation Year</Label>
                {editing ? (
                  <Input
                    value={editedProfile?.graduationYear || ''}
                    onChange={(e) => updateField('graduationYear', e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{profile?.graduationYear || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Skills & Interests
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Technical Skills</Label>
                <Textarea
                  value={editing ? (editedProfile?.techSkills || '') : (profile?.techSkills || '')}
                  onChange={(e) => updateField('techSkills', e.target.value)}
                  disabled={!editing}
                  rows={2}
                  placeholder="e.g., React, Python, SQL, Data Analysis"
                  className="resize-none"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Soft Skills</Label>
                <Textarea
                  value={editing ? (editedProfile?.softSkills || '') : (profile?.softSkills || '')}
                  onChange={(e) => updateField('softSkills', e.target.value)}
                  disabled={!editing}
                  rows={2}
                  placeholder="e.g., Leadership, Communication, Problem Solving"
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Languages</Label>
                  <Input
                    value={editing ? (editedProfile?.languages || '') : (profile?.languages || '')}
                    onChange={(e) => updateField('languages', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., English, Hindi, Tamil"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Interests</Label>
                  <Input
                    value={editing ? (editedProfile?.interests || '') : (profile?.interests || '')}
                    onChange={(e) => updateField('interests', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., Gaming, Sports, Reading"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placement Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" />
            Placement Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Experience Level */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Experience Level
            </Label>
            <div className="flex gap-3">
              <button
                onClick={() => editing && updateField('experienceType', 'Fresher')}
                disabled={!editing}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                  (editing ? editedProfile?.experienceType : profile?.experienceType) === 'Fresher'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                Fresher
              </button>
              <button
                onClick={() => editing && updateField('experienceType', 'Experienced')}
                disabled={!editing}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                  (editing ? editedProfile?.experienceType : profile?.experienceType) === 'Experienced'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                Experienced
              </button>
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Preferred Locations
            </Label>
            {editing ? (
              <Input
                value={editedProfile?.preferredLocations || ''}
                onChange={(e) => updateField('preferredLocations', e.target.value)}
                placeholder="e.g., Bangalore, Mumbai, Remote"
                className="h-8"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">{profile?.preferredLocations || 'N/A'}</p>
            )}
          </div>

          {/* Projects */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Projects
            </Label>
            <div className="space-y-3">
              {/* Project 1 */}
              {(editing || profile?.project1Title) && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Project 1 - Title</Label>
                    {editing ? (
                      <Input
                        value={editedProfile?.project1Title || ''}
                        onChange={(e) => updateField('project1Title', e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{profile?.project1Title}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                    {editing ? (
                      <Textarea
                        value={editedProfile?.project1Description || ''}
                        onChange={(e) => updateField('project1Description', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile?.project1Description}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Link</Label>
                    {editing ? (
                      <Input
                        value={editedProfile?.project1Link || ''}
                        onChange={(e) => updateField('project1Link', e.target.value)}
                        className="h-8"
                      />
                    ) : profile?.project1Link ? (
                      <a href={profile.project1Link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        View Project <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferred Domains */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Preferred Domains
            </Label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Preferred Domain 1</Label>
                  {editing ? (
                    <Input
                      value={editedProfile?.preferredDomain1 || ''}
                      onChange={(e) => updateField('preferredDomain1', e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.preferredDomain1 || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Experience (Months)</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editedProfile?.preferredDomain1RelevantExperienceMonths || ''}
                      onChange={(e) => updateField('preferredDomain1RelevantExperienceMonths', e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.preferredDomain1RelevantExperienceMonths || '0'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Preferred Domain 2</Label>
                  {editing ? (
                    <Input
                      value={editedProfile?.preferredDomain2 || ''}
                      onChange={(e) => updateField('preferredDomain2', e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.preferredDomain2 || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Experience (Months)</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editedProfile?.preferredDomain2RelevantExperienceMonths || ''}
                      onChange={(e) => updateField('preferredDomain2RelevantExperienceMonths', e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{profile?.preferredDomain2RelevantExperienceMonths || '0'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload Redirect */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Upload size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    Resume Upload
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For uploading resumes (General or Domain-specific), please head to the Placement Profile page where you can manage all your resume uploads.
                  </p>
                  <Button
                    onClick={() => navigate('/placementprofile')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Go to Placement Profile
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
