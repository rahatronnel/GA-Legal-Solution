
'use client';

import { differenceInMinutes, differenceInHours, differenceInDays, parseISO } from 'date-fns';

/**
 * Calculates relative time string and returns a color category.
 * Returns: { text: "3 days, 4 hours ago", color: "text-red-500" }
 */
export function getRelativeTimeInfo(timestamp: string) {
    if (!timestamp) return { text: '', color: '' };
    
    const date = parseISO(timestamp);
    const now = new Date();
    
    const diffDays = Math.abs(differenceInDays(now, date));
    const diffHoursTotal = Math.abs(differenceInHours(now, date));
    const diffMinutesTotal = Math.abs(differenceInMinutes(now, date));
    
    const hours = diffHoursTotal % 24;
    const minutes = diffMinutesTotal % 60;
    
    let text = '';
    let color = 'text-green-500'; // Default: Recent

    if (diffDays > 0) {
        text = `${diffDays} day${diffDays > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (diffDays >= 3) color = 'text-destructive';
        else color = 'text-orange-500';
    } else if (hours > 0) {
        text = `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        color = 'text-green-600';
    } else if (minutes > 0) {
        text = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        color = 'text-green-500';
    } else {
        text = 'Just now';
        color = 'text-green-500';
    }

    return { text, color };
}
