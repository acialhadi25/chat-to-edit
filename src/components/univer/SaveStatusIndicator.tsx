/**
 * Save Status Indicator Component
 * 
 * Displays the current save status of the workbook with visual feedback.
 * 
 * Features:
 * - Real-time status updates (idle, saving, saved, error)
 * - Last saved timestamp
 * - Error messages
 * - Auto-hide after successful save
 */

import { useEffect, useState } from 'react';
import { storageService, type SaveStatusInfo } from '@/services/storageService';
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';

export interface SaveStatusIndicatorProps {
  /** Auto-hide after successful save (milliseconds) */
  autoHideDelay?: number;
  /** Show last saved time */
  showLastSaved?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
}

export function SaveStatusIndicator({
  autoHideDelay = 3000,
  showLastSaved = true,
  compact = false,
}: SaveStatusIndicatorProps) {
  const [statusInfo, setStatusInfo] = useState<SaveStatusInfo>(
    storageService.getSaveStatus()
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = storageService.onStatusChange((info) => {
      setStatusInfo(info);
      setVisible(true);

      // Auto-hide after successful save
      if (info.status === 'saved' && autoHideDelay > 0) {
        setTimeout(() => {
          setVisible(false);
        }, autoHideDelay);
      }
    });

    return unsubscribe;
  }, [autoHideDelay]);

  // Don't render if idle and not visible
  if (statusInfo.status === 'idle' && !visible) {
    return null;
  }

  const getStatusIcon = () => {
    switch (statusInfo.status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (statusInfo.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (statusInfo.status) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-1"
        title={statusInfo.error || getStatusText()}
      >
        {getStatusIcon()}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-opacity ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {getStatusIcon()}
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {showLastSaved && statusInfo.lastSaved && statusInfo.status === 'saved' && (
        <span className="text-xs text-gray-500">
          {formatLastSaved(statusInfo.lastSaved)}
        </span>
      )}
      {statusInfo.error && (
        <span className="text-xs text-red-500" title={statusInfo.error}>
          {statusInfo.error}
        </span>
      )}
    </div>
  );
}
