import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../lib/dateUtils';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: 'follow' | 'video' | 'comment' | 'video_like' | 'general';
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      console.log('🔔 [BELL] Fetching notifications for user:', user.id);
      const response = await api.get('/push/notifications');
      console.log('🔔 [BELL] Response:', response.data);
      const notifications = response.data.notifications || [];
      console.log('🔔 [BELL] Setting notifications:', notifications.length);
      setNotifications(notifications);
      setUnreadCount(response.data.unreadCount || 0);
      console.log('🔔 [BELL] Unread count:', response.data.unreadCount || 0);
    } catch (error: any) {
      console.error('🔔 [BELL] Failed to fetch notifications:', error);
      console.error('🔔 [BELL] Error details:', {
        status: error?.response?.status,
        message: error?.response?.data?.error || error.message,
      });
      // If table doesn't exist, just show empty state (graceful degradation)
      if (error?.response?.status !== 500) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    
    // Poll for new notifications every 60 seconds (reasonable for production)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/push/notifications/${notificationId}/read`);
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/push/notifications/read-all');
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await api.delete(`/push/notifications/${notificationId}`);
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // On mobile, position it with some padding from the edges
        setDropdownPosition({
          top: rect.bottom + 8,
          right: 16 // 16px from right edge
        });
      } else {
        // On desktop, align with the button
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    }
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6 text-charcoal dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed w-[calc(100vw-32px)] max-w-sm md:max-w-md lg:w-[420px] bg-white dark:bg-petflix-dark rounded-lg shadow-xl border border-gray-200 dark:border-transparent z-50 max-h-96 overflow-hidden flex flex-col"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-charcoal dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition"
                title="Refresh notifications"
              >
                🔄
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-petflix-orange dark:text-petflix-orange hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No notifications yet</p>
                <p className="text-sm mt-2">You'll see notifications here when someone follows you, comments on your videos, or likes your content.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative flex items-start gap-3 p-4 transition-colors ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-petflix-gray/50 hover:bg-blue-100 dark:hover:bg-petflix-gray/70' 
                        : 'hover:bg-gray-50 dark:hover:bg-petflix-gray/30'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.read ? 'bg-petflix-orange dark:bg-petflix-orange' : 'bg-transparent'
                    }`} />
                    <Link
                      to={notification.link || '/'}
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 min-w-0"
                    >
                      <p className={`text-sm font-semibold ${!notification.read ? 'text-charcoal dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-sm mt-1 ${!notification.read ? 'font-medium text-charcoal dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </Link>
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

