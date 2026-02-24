/**
 * Version History Component
 * 
 * Displays version history for a workbook and allows restoring previous versions.
 * 
 * Features:
 * - List all versions with timestamps and descriptions
 * - Preview version details
 * - Restore previous versions
 * - Create manual snapshots
 * 
 * @see Requirements 3.2.4
 */

import React, { useState, useEffect } from 'react';
import { storageService, type Version } from '@/services/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Clock, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  workbookId: string;
  onVersionRestore?: (versionId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  workbookId,
  onVersionRestore,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const { toast } = useToast();

  // Load version history
  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await storageService.getVersionHistory(workbookId);
      setVersions(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load version history';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [workbookId]);

  // Create new version
  const handleCreateVersion = async () => {
    if (!newVersionDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await storageService.saveVersion(workbookId, newVersionDescription);
      setNewVersionDescription('');
      setShowCreateDialog(false);
      await loadVersions();
      toast({
        title: 'Success',
        description: 'Version saved successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save version';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore version
  const handleRestoreVersion = async (versionId: string) => {
    try {
      setRestoring(versionId);
      await storageService.restoreVersion(workbookId, versionId);
      toast({
        title: 'Success',
        description: 'Version restored successfully',
      });
      onVersionRestore?.(versionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore version';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Version
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading && versions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Loading versions...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">No versions yet</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {version.description || 'Untitled version'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreVersion(version.id)}
                    disabled={restoring === version.id || loading}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {restoring === version.id ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Create a snapshot of the current workbook state
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter version description..."
              value={newVersionDescription}
              onChange={(e) => setNewVersionDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateVersion();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVersion}
              disabled={loading || !newVersionDescription.trim()}
            >
              {loading ? 'Saving...' : 'Save Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
