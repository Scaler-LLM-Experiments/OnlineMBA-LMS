import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, Edit2, Trash2, Save, X, Link as LinkIcon } from 'lucide-react';
import { apiService, EventData, URLLink, FileAttachment } from '../../services/api';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

interface EventFormData extends Omit<EventData, 'files' | 'urls'> {
  files: FileAttachment[];
  urls: URLLink[];
}

const CATEGORY_TYPES = ['EVENTS', 'ANNOUNCEMENTS'];

const EVENT_TYPES = [
  'Workshop',
  'Webinar',
  'Guest Lecture',
  'Networking Event',
  'Career Fair',
  'Hackathon',
  'Cultural Event',
  'Sports Event',
  'Conference',
  'Seminar',
  'Other'
];

const ANNOUNCEMENT_TYPES = [
  'General Announcement',
  'Deadline Reminder',
  'Policy Update',
  'System Maintenance',
  'Holiday Notice',
  'Important Notice',
  'Other'
];

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];

interface EventsManagementCardProps {
  activeTab?: 'all' | 'create';
  onEventCreated?: () => void;
  onSwitchToCreateTab?: () => void;
}

export function EventsManagementCard({ activeTab = 'all', onEventCreated, onSwitchToCreateTab }: EventsManagementCardProps) {
  const { student } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batches, setBatches] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<EventFormData>>({
    title: '',
    subtitle: '',
    description: '',
    categoryType: 'EVENTS',
    eventType: '',
    announcementType: '',
    priority: 'Medium',
    batch: '',
    showOtherBatches: 'No',
    startDateTime: '',
    endDateTime: '',
    location: '',
    agenda: '',
    speakerInfo: '',
    displayInCalendar: 'Yes',
    requiresAcknowledgement: 'No',
    registrationRequired: 'No',
    registrationLink: '',
    maxAttendees: '',
    coverImageUrl: '',
    files: [],
    urls: [],
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchBatches();
  }, []);

  // Refresh events when switching to "View All" tab
  useEffect(() => {
    if (activeTab === 'all') {
      fetchEvents();
    }
  }, [activeTab]);

  // Reset form when switching to "Create New" tab (unless editing)
  useEffect(() => {
    if (activeTab === 'create' && !editingId) {
      resetForm();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] Fetching events from "Events & Announcements Management" sheet...');
      const response = await apiService.getEvents(student.email, {});
      console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] API Response:', response);

      if (response.success && response.data) {
        console.log(`🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ✅ Successfully fetched ${response.data.length} events from backend`);
        console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] Events data:', response.data);
        setEvents(response.data);
      } else {
        console.error('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ❌ API Error:', response.error);
        toast.error(response.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ❌ Exception:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    if (!student?.email) return;

    try {
      console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] Fetching batches from "Term" sheet...');
      const response = await apiService.getTermDropdowns(student.email);
      console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] Batches API Response:', response);

      if (response.success && response.data) {
        // Set batches from Term sheet
        if (response.data.batches && response.data.batches.length > 0) {
          console.log(`🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ✅ Setting ${response.data.batches.length} batches:`, response.data.batches);
          setBatches(response.data.batches);

          // Auto-select first batch if it's not "Other"
          const firstBatch = response.data.batches[0];
          console.log('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] Auto-selecting first batch:', firstBatch);
          if (firstBatch && firstBatch !== 'Other') {
            setFormData(prev => ({ ...prev, batch: firstBatch }));
          }
        } else {
          console.warn('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ⚠️ No batches found in response');
        }
      }
    } catch (error) {
      console.error('🎯 [EVENTS & ANNOUNCEMENTS ADMIN] ❌ Error fetching batches:', error);
      toast.error('Failed to load batch options');
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddURL = () => {
    const currentUrls = formData.urls || [];
    if (currentUrls.length < 5) {
      setFormData(prev => ({
        ...prev,
        urls: [...currentUrls, { name: '', url: '' }]
      }));
    } else {
      toast.error('Maximum 5 URLs allowed');
    }
  };

  const handleUpdateURL = (index: number, field: 'name' | 'url', value: string) => {
    const updatedUrls = [...(formData.urls || [])];
    updatedUrls[index] = { ...updatedUrls[index], [field]: value };
    setFormData(prev => ({ ...prev, urls: updatedUrls }));
  };

  const handleRemoveURL = (index: number) => {
    const updatedUrls = (formData.urls || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, urls: updatedUrls }));
  };

  // Helper function to convert datetime-local format to backend format
  const convertToBackendFormat = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    // Convert "2025-12-22T18:00" to "2025-12-22 18:00"
    return dateTimeLocal.replace('T', ' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;

    // Validation
    if (!formData.title || !formData.description || !formData.batch || !formData.startDateTime || !formData.endDateTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const eventPayload: EventData = {
        title: formData.title!,
        subtitle: formData.subtitle,
        description: formData.description!,
        categoryType: formData.categoryType,
        eventType: formData.eventType,
        announcementType: formData.announcementType,
        priority: formData.priority,
        batch: formData.batch!,
        showOtherBatches: formData.showOtherBatches,
        startDateTime: convertToBackendFormat(formData.startDateTime!),
        endDateTime: convertToBackendFormat(formData.endDateTime!),
        location: formData.location,
        agenda: formData.agenda,
        speakerInfo: formData.speakerInfo,
        displayInCalendar: formData.displayInCalendar,
        requiresAcknowledgement: formData.requiresAcknowledgement,
        registrationRequired: formData.registrationRequired,
        registrationLink: formData.registrationLink,
        maxAttendees: formData.maxAttendees,
        coverImageUrl: formData.coverImageUrl,
        files: formData.files || [],
        urls: formData.urls || [],
        postedBy: student.email,
        editedBy: student.email, // Add editedBy for updates
        status: formData.status || 'Active',
        notes: formData.notes
      };

      console.log('Event payload being sent:', {
        batch: eventPayload.batch,
        startDateTime: eventPayload.startDateTime,
        endDateTime: eventPayload.endDateTime,
        editedBy: eventPayload.editedBy,
        title: eventPayload.title
      });

      let response;
      if (editingId) {
        response = await apiService.updateEvent(student.email, editingId, eventPayload);
      } else {
        response = await apiService.createEvent(student.email, eventPayload);
      }

      if (response.success) {
        toast.success(editingId ? 'Event updated successfully' : 'Event created successfully');
        resetForm();
        fetchEvents();
        // Notify parent to switch to "View All" tab
        if (onEventCreated) {
          onEventCreated();
        }
      } else {
        toast.error(response.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert datetime to input format
  const convertToDateTimeLocal = (dateTimeString: string): string => {
    if (!dateTimeString) return '';

    try {
      // Handle format: "2025-12-22 18:00" or "2025-12-22T18:00"
      const date = new Date(dateTimeString.replace(' ', 'T'));

      if (isNaN(date.getTime())) return '';

      // Format to YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error converting datetime:', error);
      return '';
    }
  };

  const handleEdit = (event: EventData) => {
    setEditingId(event.id || null);
    setFormData({
      ...event,
      startDateTime: convertToDateTimeLocal(event.startDateTime),
      endDateTime: convertToDateTimeLocal(event.endDateTime),
      files: event.files || [],
      urls: event.urls || []
    });
    // Automatically switch to "Create New" tab to show the edit form
    if (onSwitchToCreateTab) {
      onSwitchToCreateTab();
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!student?.email || !window.confirm('Are you sure you want to delete this event?')) return;

    try {
      setLoading(true);
      const response = await apiService.deleteEvent(student.email, eventId);

      if (response.success) {
        toast.success('Event deleted successfully');
        fetchEvents();
      } else {
        toast.error(response.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      categoryType: 'EVENTS',
      eventType: '',
      announcementType: '',
      priority: 'Medium',
      batch: batches[0] || '',
      showOtherBatches: 'No',
      startDateTime: '',
      endDateTime: '',
      location: '',
      agenda: '',
      speakerInfo: '',
      displayInCalendar: 'Yes',
      requiresAcknowledgement: 'No',
      registrationRequired: 'No',
      registrationLink: '',
      maxAttendees: '',
      coverImageUrl: '',
      files: [],
      urls: [],
      status: 'Active',
      notes: ''
    });
    setEditingId(null);
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600/10 rounded-lg">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Events & Announcements</h2>
            <p className="text-sm text-muted-foreground">Manage events and announcements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-accent/30 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'Edit Event' : 'Create New Event/Announcement'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryType || 'EVENTS'}
                onChange={(e) => handleInputChange('categoryType', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {CATEGORY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Event/Announcement Subtype */}
            {formData.categoryType === 'EVENTS' ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Subtype</label>
                <select
                  value={formData.eventType || ''}
                  onChange={(e) => handleInputChange('eventType', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Event Type</option>
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Announcement Subtype</label>
                <select
                  value={formData.announcementType || ''}
                  onChange={(e) => handleInputChange('announcementType', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Announcement Type</option>
                  {ANNOUNCEMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Subtitle */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter subtitle (optional)"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter event description"
                rows={3}
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={formData.priority || 'Medium'}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PRIORITY_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Display in Calendar */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Display in Calendar</label>
              <select
                value={formData.displayInCalendar || 'Yes'}
                onChange={(e) => handleInputChange('displayInCalendar', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Requires Acknowledgement */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Requires Acknowledgement</label>
              <select
                value={formData.requiresAcknowledgement || 'No'}
                onChange={(e) => handleInputChange('requiresAcknowledgement', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Registration Required */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Registration Required</label>
              <select
                value={formData.registrationRequired || 'No'}
                onChange={(e) => handleInputChange('registrationRequired', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Registration Link - Only show if Registration Required */}
            {formData.registrationRequired === 'Yes' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Registration Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.registrationLink || ''}
                  onChange={(e) => handleInputChange('registrationLink', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                  required={formData.registrationRequired === 'Yes'}
                />
              </div>
            )}

            {/* Max Attendees */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Max Attendees</label>
              <input
                type="number"
                value={formData.maxAttendees || ''}
                onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            {/* Cover Image URL */}
            <div className={formData.registrationRequired === 'Yes' ? '' : 'col-span-2'}>
              <label className="block text-sm font-medium text-foreground mb-2">Cover Image URL</label>
              <input
                type="url"
                value={formData.coverImageUrl || ''}
                onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://..."
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.batch || ''}
                onChange={(e) => handleInputChange('batch', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Batch</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>

            {/* Show Other Batches */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Show to Other Batches</label>
              <select
                value={formData.showOtherBatches || 'No'}
                onChange={(e) => handleInputChange('showOtherBatches', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Active">Active</option>
                <option value="Ended">Ended</option>
              </select>
            </div>

            {/* Start DateTime */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime || ''}
                onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* End DateTime */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime || ''}
                onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Event location or virtual link"
              />
            </div>

            {/* Agenda */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Agenda</label>
              <textarea
                value={formData.agenda || ''}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Event agenda or details"
                rows={2}
              />
            </div>

            {/* Speaker Info */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Speaker/Host Information</label>
              <textarea
                value={formData.speakerInfo || ''}
                onChange={(e) => handleInputChange('speakerInfo', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Speaker or host details"
                rows={2}
              />
            </div>

            {/* URLs Section */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Additional URLs (up to 5)
                </label>
                <button
                  type="button"
                  onClick={handleAddURL}
                  disabled={(formData.urls || []).length >= 5}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-3 h-3" />
                  Add URL
                </button>
              </div>

              {(formData.urls || []).map((url, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Link Name"
                      value={url.name}
                      onChange={(e) => handleUpdateURL(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-7">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={url.url}
                      onChange={(e) => handleUpdateURL(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveURL(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(formData.urls || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No additional URLs added. Click "Add URL" to add one.</p>
              )}
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Notes (Internal)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Internal notes (not visible to students)"
                rows={2}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Events & Announcements ({events.length})
          </h3>

          {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading events...
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No events found. Create your first event!</p>
          </div>
        )}

        {events.map(event => (
          <div key={event.id} className="p-4 bg-accent/30 rounded-lg border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{event.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-green-600/10 text-green-600 dark:text-green-400 rounded">
                    {event.eventType}
                  </span>
                  <span>{event.batch}</span>
                  <span>{formatDateTime(event.startDateTime)}</span>
                  <span className={`px-2 py-1 rounded ${
                    event.status === 'Active'
                      ? 'bg-green-600/10 text-green-600 dark:text-green-400'
                      : 'bg-gray-600/10 text-gray-600 dark:text-gray-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
                {event.location && (
                  <p className="text-xs text-muted-foreground mt-2">📍 {event.location}</p>
                )}
                {event.urls && event.urls.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-muted-foreground">
                      {event.urls.length} URL{event.urls.length > 1 ? 's' : ''} attached
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(event)}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
