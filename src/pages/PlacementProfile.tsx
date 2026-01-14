import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ProfileSkeleton } from '../components/ui/loading-skeletons';
import {
  Briefcase,
  Edit,
  Save,
  X,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Award,
  Target,
  AlertCircle,
  Check,
  ExternalLink,
  Plus,
  MapPin,
  ChevronDown,
  Upload,
  Loader2
} from 'lucide-react';
import { auth } from '../firebase/config';
import { apiService, type FullStudentProfile } from '../services/api';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../hooks/useActivityTracker';

// Indian cities list with priority cities first
const INDIAN_CITIES = [
  'Bangalore',
  'Delhi',
  'Gurgaon',
  'Hyderabad',
  'Chennai',
  'Mumbai',
  'Pune',
  'Noida',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Kochi',
  'Indore',
  'Coimbatore',
  'Vadodara',
  'Lucknow',
  'Bhubaneswar',
  'Visakhapatnam',
  'Nagpur',
  'Surat',
  'Mysore',
  'Trivandrum',
  'Mangalore',
  'Nashik',
  'Rajkot',
  'Patna',
  'Ludhiana',
  'Agra',
  'Kanpur',
  'Remote'
];

// Domain options for Preferred Domains and specific domains
const DOMAIN_OPTIONS = [
  'Generalist - Founders office / Strategy / Program / Project',
  'Product Roles',
  'Sales Roles',
  'Marketing Roles',
  'Finance Roles',
  'Investment Role',
  'HR Roles',
  'Consulting Roles'
];

const PlacementProfile: React.FC = () => {
  const [profile, setProfile] = useState<FullStudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FullStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCompany2, setShowCompany2] = useState(false);
  const [showCompany3, setShowCompany3] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [uploadingResume, setUploadingResume] = useState<{[key: string]: boolean}>({});
  const [pendingResumeUploads, setPendingResumeUploads] = useState<{[key: string]: { file: File, domainName?: string }}>({});
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Placement Profile');
  }, [trackPageView]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (editForm) {
      // Show Company 2 section if there's data
      if (editForm.prevCompany2Name || editForm.prevCompany2Role) {
        setShowCompany2(true);
      }
      // Show Company 3 section if there's data
      if (editForm.prevCompany3Name || editForm.prevCompany3Role) {
        setShowCompany3(true);
      }
    }
  }, [editForm]);

  const fetchProfile = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      const result = await apiService.getFullStudentProfile(user.email);

      if (result.success && result.data) {
        setProfile(result.data);
        setEditForm(result.data);
      } else {
        toast.error('Failed to load profile: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching placement profile:', error);
      toast.error('Network error - check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email || !editForm) return;

    // Helper to check if value is filled (handles both strings and numbers)
    const isFilled = (value: any) => {
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return true;
      return false;
    };

    // Validate Company 1 if Experienced - ALL fields required if Name is provided
    if (editForm.experienceType === 'Experienced') {
      if (isFilled(editForm.prevCompany1Name)) {
        if (!isFilled(editForm.prevCompany1Role) || !isFilled(editForm.prevCompany1Duration) || !isFilled(editForm.prevCompany1CTC)) {
          toast.error('Company 1: All fields (Role, Duration, CTC) are required when Company Name is provided');
          return;
        }
      }

      // Validate Company 2 - if Name is filled, all other fields required
      if (isFilled(editForm.prevCompany2Name)) {
        if (!isFilled(editForm.prevCompany2Role) || !isFilled(editForm.prevCompany2Duration) || !isFilled(editForm.prevCompany2CTC)) {
          toast.error('Company 2: All fields (Role, Duration, CTC) are required when Company Name is provided');
          return;
        }
      }

      // Validate Company 3 - if Name is filled, all other fields required
      if (isFilled(editForm.prevCompany3Name)) {
        if (!isFilled(editForm.prevCompany3Role) || !isFilled(editForm.prevCompany3Duration) || !isFilled(editForm.prevCompany3CTC)) {
          toast.error('Company 3: All fields (Role, Duration, CTC) are required when Company Name is provided');
          return;
        }
      }
    }

    // Validate Internships if Fresher - if Company is filled, all other fields required
    if (editForm.experienceType === 'Fresher') {
      // Validate Internship 1
      if (isFilled(editForm.internship1Company)) {
        if (!isFilled(editForm.internship1Role) || !isFilled(editForm.internship1Duration) || !isFilled(editForm.internship1Stipend)) {
          toast.error('Internship 1: All fields (Role, Duration, Stipend) are required when Company is provided');
          return;
        }
      }

      // Validate Internship 2
      if (isFilled(editForm.internship2Company)) {
        if (!isFilled(editForm.internship2Role) || !isFilled(editForm.internship2Duration) || !isFilled(editForm.internship2Stipend)) {
          toast.error('Internship 2: All fields (Role, Duration, Stipend) are required when Company is provided');
          return;
        }
      }

      // Validate Internship 3
      if (isFilled(editForm.internship3Company)) {
        if (!isFilled(editForm.internship3Role) || !isFilled(editForm.internship3Duration) || !isFilled(editForm.internship3Stipend)) {
          toast.error('Internship 3: All fields (Role, Duration, Stipend) are required when Company is provided');
          return;
        }
      }
    }

    try {
      setSaving(true);

      // Upload any pending resumes first
      let updatedForm = { ...editForm };
      const pendingKeys = Object.keys(pendingResumeUploads);
      const uploadErrors: string[] = [];
      const hasResumeUploads = pendingKeys.length > 0;

      // Check if profile data has changed (excluding resume URLs which will be updated by upload)
      const hasProfileChanges = JSON.stringify({
        ...editForm,
        resumeGeneralURL: '',
        domain1ResumeURL: '',
        domain2ResumeURL: '',
        domain3ResumeURL: ''
      }) !== JSON.stringify({
        ...profile,
        resumeGeneralURL: '',
        domain1ResumeURL: '',
        domain2ResumeURL: '',
        domain3ResumeURL: ''
      });

      if (hasResumeUploads) {
        toast.loading(`Uploading ${pendingKeys.length} resume(s)...`, { id: 'save-progress' });

        for (const key of pendingKeys) {
          const { file, domainName } = pendingResumeUploads[key];
          const domainNumber = key === 'general' ? 0 : parseInt(key.replace('domain', ''));

          try {
            console.log(`Uploading ${key} resume:`, file.name, 'Domain:', domainName);

            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
            });

            console.log(`Base64 conversion successful for ${key}, size: ${base64Data.length} characters`);

            // Upload to backend
            const result = await apiService.uploadResumePDF(
              user.email!,
              base64Data,
              domainNumber,
              file.name,
              domainName
            );

            console.log(`Upload result for ${key}:`, result);

            if (result.success && (result as any).fileUrl) {
              // Update the form with the new URL
              const fieldName = domainNumber === 0 ? 'resumeGeneralURL' : `domain${domainNumber}ResumeURL`;
              updatedForm = {
                ...updatedForm,
                [fieldName]: (result as any).fileUrl
              };
              console.log(`Updated ${fieldName}:`, (result as any).fileUrl);
            } else {
              const errorMsg = `Failed to upload ${key} resume: ${result.error || 'Unknown error'}`;
              console.error(errorMsg);
              uploadErrors.push(errorMsg);
            }
          } catch (error) {
            const errorMsg = `Failed to upload ${key} resume: ${error}`;
            console.error(errorMsg, error);
            uploadErrors.push(errorMsg);
          }
        }

        if (uploadErrors.length > 0) {
          toast.error(`Some resumes failed to upload. Check console for details.`, { id: 'save-progress' });
          console.error('Resume upload errors:', uploadErrors);
        } else {
          if (hasProfileChanges) {
            toast.success('Resumes uploaded! Now saving details...', { id: 'save-progress' });
          } else {
            toast.success('All resumes uploaded successfully!', { id: 'save-progress' });
          }
        }

        // Clear pending uploads after upload attempts
        setPendingResumeUploads({});
      }

      // Save profile data if there are changes
      if (hasProfileChanges || hasResumeUploads) {
        console.log('Saving profile data to sheet...');
        console.log('Data being saved:', updatedForm);

        // Show appropriate message
        if (!hasResumeUploads && hasProfileChanges) {
          toast.loading('Saving details...', { id: 'save-progress' });
        } else if (hasResumeUploads && hasProfileChanges) {
          // Message already shown above after resume upload
        }

        const result = await apiService.updateStudentProfile(user.email, updatedForm);

        console.log('Save result:', result);

        if (result.success) {
          if (hasResumeUploads && hasProfileChanges) {
            toast.success('Resumes uploaded and details saved successfully!', { id: 'save-progress' });
          } else if (hasResumeUploads) {
            toast.success('Resumes uploaded successfully!', { id: 'save-progress' });
          } else {
            toast.success('Details saved successfully!', { id: 'save-progress' });
          }
          setProfile(updatedForm);
          setIsEditing(false);
        } else {
          console.error('Failed to save profile:', result.error);
          toast.error('Failed to update profile: ' + (result.error || 'Unknown error'), { id: 'save-progress' });
        }
      } else {
        // No changes to save
        toast.success('No changes to save', { id: 'save-progress' });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating placement profile:', error);
      toast.error('Network error - check your connection');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
    // Clear any pending resume uploads
    setPendingResumeUploads({});
  };

  const updateField = (field: keyof FullStudentProfile, value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  // Update numeric field (CTC) - only allows numbers
  const updateNumericField = (field: keyof FullStudentProfile, value: string) => {
    if (!editForm) return;
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setEditForm({ ...editForm, [field]: numericValue });
  };

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    if (showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCityDropdown]);

  // Get selected cities as array
  const getSelectedCities = (): string[] => {
    if (!editForm?.preferredLocations) return [];
    return editForm.preferredLocations.split(',').map(c => c.trim()).filter(c => c);
  };

  // Handle city selection/deselection
  const toggleCity = (city: string) => {
    const selectedCities = getSelectedCities();

    if (selectedCities.includes(city)) {
      // Remove city
      const newCities = selectedCities.filter(c => c !== city);
      updateField('preferredLocations', newCities.join(', '));
    } else {
      // Add city (max 3)
      if (selectedCities.length >= 3) {
        toast.error('You can select up to 3 locations only');
        return;
      }
      const newCities = [...selectedCities, city];
      updateField('preferredLocations', newCities.join(', '));
    }
  };

  // Remove a selected city
  const removeCity = (city: string) => {
    const selectedCities = getSelectedCities();
    const newCities = selectedCities.filter(c => c !== city);
    updateField('preferredLocations', newCities.join(', '));
  };

  // Handle resume PDF selection (stage for upload)
  const handleResumeUpload = (domainNumber: number, file: File, domainName?: string) => {
    if (!user?.email) {
      toast.error('Please log in to upload resume');
      return;
    }

    // Validate domain is selected (except for general resume)
    if (domainNumber !== 0 && !domainName) {
      toast.error('Please select a domain before uploading resume');
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload only PDF files');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Stage the file for upload when Save Changes is clicked
    const key = domainNumber === 0 ? 'general' : `domain${domainNumber}`;
    setPendingResumeUploads(prev => ({
      ...prev,
      [key]: { file, domainName }
    }));

    toast.success(`Resume ready to upload (${file.name})`, { duration: 2000 });
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile || profile.placementView !== 'Yes') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Placement Profile Not Available</h2>
            <p className="text-muted-foreground">
              Your placement profile section is currently not enabled. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExperienced = editForm?.experienceType === 'Experienced';
  const isFresher = editForm?.experienceType === 'Fresher';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Placement Profile</h1>
            <p className="text-muted-foreground">Manage your placement-related information</p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Experience Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Experience Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Are you a Fresher or Experienced?</Label>
              {isEditing ? (
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => updateField('experienceType', 'Fresher')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editForm?.experienceType === 'Fresher'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    Fresher
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('experienceType', 'Experienced')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editForm?.experienceType === 'Experienced'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    Experienced
                  </button>
                </div>
              ) : (
                <Badge variant={profile?.experienceType ? 'default' : 'secondary'} className="mt-2">
                  {profile?.experienceType || 'Not Set'}
                </Badge>
              )}
            </div>

            <div>
              <Label htmlFor="preferredLocations" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Preferred Locations
              </Label>
              {isEditing ? (
                <div className="mt-2">
                  {/* Selected Cities Display */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {getSelectedCities().map((city) => (
                      <Badge
                        key={city}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-1"
                      >
                        {city}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeCity(city)}
                        />
                      </Badge>
                    ))}
                    {getSelectedCities().length === 0 && (
                      <span className="text-sm text-muted-foreground">No locations selected</span>
                    )}
                  </div>

                  {/* Dropdown */}
                  <div className="relative" ref={cityDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setShowCityDropdown(!showCityDropdown)}
                      disabled={getSelectedCities().length >= 3}
                    >
                      <span>
                        {getSelectedCities().length >= 3
                          ? 'Maximum 3 locations selected'
                          : 'Select locations'}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>

                    {showCityDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {INDIAN_CITIES.map((city) => {
                          const isSelected = getSelectedCities().includes(city);
                          return (
                            <button
                              key={city}
                              type="button"
                              className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between ${
                                isSelected ? 'bg-accent' : ''
                              }`}
                              onClick={() => toggleCity(city)}
                            >
                              <span>{city}</span>
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-foreground">
                  {profile?.preferredLocations || 'Not specified'}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select up to 3 preferred locations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional: Companies Section (for Experienced) */}
      {isExperienced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Previous Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company 1 - MANDATORY */}
            <div className="p-4 border rounded-lg space-y-4 bg-accent/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Company 1
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prevCompany1Name">Company Name</Label>
                  {isEditing ? (
                    <Input
                      id="prevCompany1Name"
                      value={editForm?.prevCompany1Name || ''}
                      onChange={(e) => updateField('prevCompany1Name', e.target.value)}
                      placeholder="Company name"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.prevCompany1Name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prevCompany1Role">
                    Role{editForm?.prevCompany1Name?.trim() && <span className="text-destructive"> *</span>}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="prevCompany1Role"
                      value={editForm?.prevCompany1Role || ''}
                      onChange={(e) => updateField('prevCompany1Role', e.target.value)}
                      placeholder="Your role"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.prevCompany1Role || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prevCompany1Duration">
                    Duration (months){editForm?.prevCompany1Name?.trim() && <span className="text-destructive"> *</span>}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="prevCompany1Duration"
                      value={editForm?.prevCompany1Duration || ''}
                      onChange={(e) => updateField('prevCompany1Duration', e.target.value)}
                      placeholder="e.g., 24"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.prevCompany1Duration || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prevCompany1CTC">
                    CTC (LPA){editForm?.prevCompany1Name?.trim() && <span className="text-destructive"> *</span>}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="prevCompany1CTC"
                      value={editForm?.prevCompany1CTC || ''}
                      onChange={(e) => updateNumericField('prevCompany1CTC', e.target.value)}
                      placeholder="e.g., 12"
                      type="text"
                      inputMode="numeric"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.prevCompany1CTC || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Company 2 - Optional */}
            {(showCompany2 || isEditing) && (
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Company 2</h3>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCompany2(false);
                        updateField('prevCompany2Name', '');
                        updateField('prevCompany2Role', '');
                        updateField('prevCompany2Duration', '');
                        updateField('prevCompany2CTC', '');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prevCompany2Name">Company Name</Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany2Name"
                        value={editForm?.prevCompany2Name || ''}
                        onChange={(e) => updateField('prevCompany2Name', e.target.value)}
                        placeholder="Company name"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany2Name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany2Role">
                      Role{editForm?.prevCompany2Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany2Role"
                        value={editForm?.prevCompany2Role || ''}
                        onChange={(e) => updateField('prevCompany2Role', e.target.value)}
                        placeholder="Your role"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany2Role || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany2Duration">
                      Duration (months){editForm?.prevCompany2Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany2Duration"
                        value={editForm?.prevCompany2Duration || ''}
                        onChange={(e) => updateField('prevCompany2Duration', e.target.value)}
                        placeholder="e.g., 12"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany2Duration || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany2CTC">
                      CTC (LPA){editForm?.prevCompany2Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany2CTC"
                        value={editForm?.prevCompany2CTC || ''}
                        onChange={(e) => updateNumericField('prevCompany2CTC', e.target.value)}
                        placeholder="e.g., 8"
                        type="text"
                        inputMode="numeric"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany2CTC || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Company 3 - Optional */}
            {(showCompany3 || isEditing) && showCompany2 && (
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Company 3</h3>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCompany3(false);
                        updateField('prevCompany3Name', '');
                        updateField('prevCompany3Role', '');
                        updateField('prevCompany3Duration', '');
                        updateField('prevCompany3CTC', '');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prevCompany3Name">Company Name</Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany3Name"
                        value={editForm?.prevCompany3Name || ''}
                        onChange={(e) => updateField('prevCompany3Name', e.target.value)}
                        placeholder="Company name"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany3Name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany3Role">
                      Role{editForm?.prevCompany3Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany3Role"
                        value={editForm?.prevCompany3Role || ''}
                        onChange={(e) => updateField('prevCompany3Role', e.target.value)}
                        placeholder="Your role"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany3Role || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany3Duration">
                      Duration (months){editForm?.prevCompany3Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany3Duration"
                        value={editForm?.prevCompany3Duration || ''}
                        onChange={(e) => updateField('prevCompany3Duration', e.target.value)}
                        placeholder="e.g., 6"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany3Duration || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prevCompany3CTC">
                      CTC (LPA){editForm?.prevCompany3Name?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="prevCompany3CTC"
                        value={editForm?.prevCompany3CTC || ''}
                        onChange={(e) => updateNumericField('prevCompany3CTC', e.target.value)}
                        placeholder="e.g., 6"
                        type="text"
                        inputMode="numeric"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.prevCompany3CTC || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add Company Buttons */}
            {isEditing && !showCompany2 && (
              <Button
                variant="outline"
                onClick={() => setShowCompany2(true)}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Company 2
              </Button>
            )}
            {isEditing && showCompany2 && !showCompany3 && (
              <Button
                variant="outline"
                onClick={() => setShowCompany3(true)}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Company 3
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conditional: Internships Section (for Fresher) */}
      {isFresher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Internships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold text-foreground">Internship {num}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`internship${num}Company`}>Company</Label>
                    {isEditing ? (
                      <Input
                        id={`internship${num}Company`}
                        value={editForm?.[`internship${num}Company` as keyof FullStudentProfile] as string || ''}
                        onChange={(e) => updateField(`internship${num}Company` as keyof FullStudentProfile, e.target.value)}
                        placeholder="Company name"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.[`internship${num}Company` as keyof FullStudentProfile] as string || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`internship${num}Role`}>
                      Role{(editForm?.[`internship${num}Company` as keyof FullStudentProfile] as string)?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id={`internship${num}Role`}
                        value={editForm?.[`internship${num}Role` as keyof FullStudentProfile] as string || ''}
                        onChange={(e) => updateField(`internship${num}Role` as keyof FullStudentProfile, e.target.value)}
                        placeholder="Your role"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.[`internship${num}Role` as keyof FullStudentProfile] as string || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`internship${num}Duration`}>
                      Duration (months){(editForm?.[`internship${num}Company` as keyof FullStudentProfile] as string)?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id={`internship${num}Duration`}
                        value={editForm?.[`internship${num}Duration` as keyof FullStudentProfile] as string || ''}
                        onChange={(e) => updateField(`internship${num}Duration` as keyof FullStudentProfile, e.target.value)}
                        placeholder="e.g., 3"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.[`internship${num}Duration` as keyof FullStudentProfile] as string || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`internship${num}Stipend`}>
                      Stipend (per month){(editForm?.[`internship${num}Company` as keyof FullStudentProfile] as string)?.trim() && <span className="text-destructive"> *</span>}
                    </Label>
                    {isEditing ? (
                      <Input
                        id={`internship${num}Stipend`}
                        value={editForm?.[`internship${num}Stipend` as keyof FullStudentProfile] as string || ''}
                        onChange={(e) => updateField(`internship${num}Stipend` as keyof FullStudentProfile, e.target.value)}
                        placeholder="e.g., 10000"
                      />
                    ) : (
                      <p className="text-foreground">{profile?.[`internship${num}Stipend` as keyof FullStudentProfile] as string || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold text-foreground">Project {num}</h3>
              <div>
                <Label htmlFor={`project${num}Title`}>Title</Label>
                {isEditing ? (
                  <Input
                    id={`project${num}Title`}
                    value={editForm?.[`project${num}Title` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`project${num}Title` as keyof FullStudentProfile, e.target.value)}
                    placeholder="Project title"
                  />
                ) : (
                  <p className="text-foreground">{profile?.[`project${num}Title` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`project${num}Description`}>Description</Label>
                {isEditing ? (
                  <Textarea
                    id={`project${num}Description`}
                    value={editForm?.[`project${num}Description` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`project${num}Description` as keyof FullStudentProfile, e.target.value)}
                    placeholder="Brief description"
                    rows={3}
                  />
                ) : (
                  <p className="text-foreground">{profile?.[`project${num}Description` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`project${num}Link`}>Link</Label>
                {isEditing ? (
                  <Input
                    id={`project${num}Link`}
                    value={editForm?.[`project${num}Link` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`project${num}Link` as keyof FullStudentProfile, e.target.value)}
                    placeholder="https://..."
                  />
                ) : profile?.[`project${num}Link` as keyof FullStudentProfile] ? (
                  <a
                    href={profile[`project${num}Link` as keyof FullStudentProfile] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Project <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-foreground">-</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Other Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Other Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((num) => (
            <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`otherLink${num}Title`}>Link {num} Title</Label>
                {isEditing ? (
                  <Input
                    id={`otherLink${num}Title`}
                    value={editForm?.[`otherLink${num}Title` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`otherLink${num}Title` as keyof FullStudentProfile, e.target.value)}
                    placeholder="e.g., Portfolio"
                  />
                ) : (
                  <p className="text-foreground">{profile?.[`otherLink${num}Title` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`otherLink${num}URL`}>URL</Label>
                {isEditing ? (
                  <Input
                    id={`otherLink${num}URL`}
                    value={editForm?.[`otherLink${num}URL` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`otherLink${num}URL` as keyof FullStudentProfile, e.target.value)}
                    placeholder="https://..."
                  />
                ) : profile?.[`otherLink${num}URL` as keyof FullStudentProfile] ? (
                  <a
                    href={profile[`otherLink${num}URL` as keyof FullStudentProfile] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-foreground">-</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Domain Resumes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Resumes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`domain${num}`}>Domain {num}</Label>
                {isEditing ? (
                  <select
                    id={`domain${num}`}
                    value={editForm?.[`domain${num}` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`domain${num}` as keyof FullStudentProfile, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select domain...</option>
                    {DOMAIN_OPTIONS.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-foreground">{profile?.[`domain${num}` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`domain${num}ResumeURL`}>Resume PDF</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    {editForm?.[`domain${num}ResumeURL` as keyof FullStudentProfile] ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={editForm[`domain${num}ResumeURL` as keyof FullStudentProfile] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          View Current Resume <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <label htmlFor={`resume-upload-${num}`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingResume[`domain${num}`] || !editForm?.[`domain${num}` as keyof FullStudentProfile]}
                          onClick={() => document.getElementById(`resume-upload-${num}`)?.click()}
                          title={!editForm?.[`domain${num}` as keyof FullStudentProfile] ? 'Please select a domain first' : ''}
                        >
                          {uploadingResume[`domain${num}`] ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : pendingResumeUploads[`domain${num}`] ? (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {pendingResumeUploads[`domain${num}`].file.name}
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {editForm?.[`domain${num}ResumeURL` as keyof FullStudentProfile] ? 'Replace PDF' : 'Upload PDF'}
                            </>
                          )}
                        </Button>
                      </label>
                      <input
                        id={`resume-upload-${num}`}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const domainName = editForm?.[`domain${num}` as keyof FullStudentProfile] as string;
                            handleResumeUpload(num, file, domainName);
                          }
                        }}
                      />
                    </div>
                    {pendingResumeUploads[`domain${num}`] && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Ready to upload: {pendingResumeUploads[`domain${num}`].file.name}
                        </span>
                      </div>
                    )}
                    {!editForm?.[`domain${num}` as keyof FullStudentProfile] ? (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Please select a domain before uploading resume
                      </p>
                    ) : !pendingResumeUploads[`domain${num}`] ? (
                      <p className="text-xs text-muted-foreground">
                        Upload PDF only (max 10MB)
                      </p>
                    ) : null}
                  </div>
                ) : profile?.[`domain${num}ResumeURL` as keyof FullStudentProfile] ? (
                  <a
                    href={profile[`domain${num}ResumeURL` as keyof FullStudentProfile] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Resume <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-foreground">-</p>
                )}
              </div>
            </div>
          ))}
          <div>
            <Label htmlFor="resumeGeneralURL">General Resume</Label>
            {isEditing ? (
              <div className="space-y-2">
                {editForm?.resumeGeneralURL ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={editForm.resumeGeneralURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      View Current Resume <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <label htmlFor="resume-upload-general">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingResume['general']}
                      onClick={() => document.getElementById('resume-upload-general')?.click()}
                    >
                      {uploadingResume['general'] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : pendingResumeUploads['general'] ? (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {pendingResumeUploads['general'].file.name}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {editForm?.resumeGeneralURL ? 'Replace PDF' : 'Upload PDF'}
                        </>
                      )}
                    </Button>
                  </label>
                  <input
                    id="resume-upload-general"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResumeUpload(0, file, 'General');
                      }
                    }}
                  />
                </div>
                {pendingResumeUploads['general'] && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Ready to upload: {pendingResumeUploads['general'].file.name}
                    </span>
                  </div>
                )}
                {!pendingResumeUploads['general'] && (
                  <p className="text-xs text-muted-foreground">
                    Upload PDF only (max 10MB)
                  </p>
                )}
              </div>
            ) : profile?.resumeGeneralURL ? (
              <a
                href={profile.resumeGeneralURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                View Resume <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preferred Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Preferred Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((num) => (
            <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`preferredDomain${num}`}>Domain {num}</Label>
                {isEditing ? (
                  <select
                    id={`preferredDomain${num}`}
                    value={editForm?.[`preferredDomain${num}` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`preferredDomain${num}` as keyof FullStudentProfile, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select domain...</option>
                    {DOMAIN_OPTIONS.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-foreground">{profile?.[`preferredDomain${num}` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`preferredDomain${num}RelevantExperienceMonths`}>Relevant Experience (months)</Label>
                {isEditing ? (
                  <Input
                    id={`preferredDomain${num}RelevantExperienceMonths`}
                    value={editForm?.[`preferredDomain${num}RelevantExperienceMonths` as keyof FullStudentProfile] as string || ''}
                    onChange={(e) => updateField(`preferredDomain${num}RelevantExperienceMonths` as keyof FullStudentProfile, e.target.value)}
                    placeholder="e.g., 18"
                  />
                ) : (
                  <p className="text-foreground">{profile?.[`preferredDomain${num}RelevantExperienceMonths` as keyof FullStudentProfile] as string || '-'}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementProfile;
