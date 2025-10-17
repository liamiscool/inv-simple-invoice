import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
}

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    add: (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = {
        id,
        duration: 5000, // Default 5 seconds
        ...notification
      };

      update(notifications => [...notifications, newNotification]);

      // Auto-dismiss if duration is set
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          update(notifications => notifications.filter(n => n.id !== id));
        }, newNotification.duration);
      }

      return id;
    },
    remove: (id: string) => {
      update(notifications => notifications.filter(n => n.id !== id));
    },
    clear: () => {
      update(() => []);
    }
  };
}

export const notifications = createNotificationStore();

// Helper functions for common notification types
export const notify = {
  success: (title: string, message?: string) => 
    notifications.add({ type: 'success', title, message }),
  
  error: (title: string, message?: string) => 
    notifications.add({ type: 'error', title, message }),
  
  info: (title: string, message?: string) => 
    notifications.add({ type: 'info', title, message }),
  
  warning: (title: string, message?: string) => 
    notifications.add({ type: 'warning', title, message })
};
