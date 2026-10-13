import React, { useEffect } from 'react';

interface NotificationToastSystemProps {
  onNavigate?: (view: 'shop' | 'gps' | 'clinic', query?: string) => void;
}

// Notifications removed as per user requirement
export const NotificationToastSystem: React.FC<NotificationToastSystemProps> = () => {
  useEffect(() => {
    try {
      localStorage.removeItem('cu_mall_notifications');
    } catch {
      // ignore
    }
  }, []);

  return null;
};

export default NotificationToastSystem;
