'use client';

import { useReportEngagement } from '@/hooks/use-report-engagement';

interface ReportEngagementTrackerProps {
  reportId: string;
}

/**
 * Drop-in client component that passively tracks engagement signals
 * on the report page (panel dwell times, scrollbacks, max scroll depth).
 * Sends data via sendBeacon when the user leaves or hides the tab.
 * Renders nothing — zero UI impact.
 */
export function ReportEngagementTracker({ reportId }: ReportEngagementTrackerProps) {
  useReportEngagement(reportId);
  return null;
}
