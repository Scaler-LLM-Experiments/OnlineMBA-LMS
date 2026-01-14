import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Briefcase, Users, Check, X, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

export function PlacementManagementCard() {
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const result = await apiService.getBatches();

      if (result.success && result.data) {
        setBatches(result.data.batches);
        if (result.data.batches.length > 0) {
          setSelectedBatch(result.data.batches[0]);
        }
      } else {
        toast.error('Failed to load batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlacementView = async (enable: boolean) => {
    if (!selectedBatch) {
      toast.error('Please select a batch first');
      return;
    }

    try {
      setUpdating(true);
      const result = await apiService.enablePlacementViewForBatch(selectedBatch, enable);

      if (result.success) {
        setIsEnabled(enable);
        toast.success(
          `Placement View ${enable ? 'enabled' : 'disabled'} for ${result.data?.count || 0} students in ${selectedBatch}`
        );
      } else {
        toast.error(result.error || 'Failed to update placement view');
      }
    } catch (error) {
      console.error('Error updating placement view:', error);
      toast.error('Failed to update placement view');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading batches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Placement Profile Management
        </CardTitle>
        <CardDescription>
          Enable or disable placement profile access for entire batches
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Batch Selection */}
        <div className="space-y-2">
          <Label htmlFor="batch-select" className="text-sm font-medium">
            Select Batch
          </Label>
          <select
            id="batch-select"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={updating}
          >
            {batches.length === 0 ? (
              <option value="">No batches found</option>
            ) : (
              batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Current Status */}
        {selectedBatch && (
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Current Status for {selectedBatch}:
              </span>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isEnabled ? (
                <>
                  <Check className="h-3 w-3" />
                  Enabled
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleTogglePlacementView(true)}
            disabled={!selectedBatch || updating || isEnabled}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enable for Batch
              </>
            )}
          </Button>
          <Button
            onClick={() => handleTogglePlacementView(false)}
            disabled={!selectedBatch || updating || !isEnabled}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Disable for Batch
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How it works:
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Enabling will set "Placement View" = "Yes" for all students in the selected batch</li>
            <li>• Students can then access and edit their placement profile section</li>
            <li>• Disabling will set "Placement View" = "No" and hide the section</li>
            <li>• All placement data is retained even when disabled</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
