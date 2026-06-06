import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Standard fallback VAPID public key.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BF3B3qJqYQ3z4Y4uWw3c1k9m_4Wn4S-6z3mD3J6X-X3Y4z3mD3J6X-X3Y4z3mD3J6X-X3Y4z3mD3J6X';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(restaurantId?: string, tableId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermissionStatus(Notification.permission);
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const subscribeUser = async () => {
    if (!isSupported) return null;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const jsonSubscription = JSON.parse(JSON.stringify(subscription.toJSON()));
      const keys = jsonSubscription.keys;

      if (!keys || !keys.p256dh || !keys.auth) {
        throw new Error('Push subscription returned invalid keys structure');
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Log subscription in the database
      const { error } = await supabase.from('notification_subscriptions' as any).insert([
        {
          user_id: user?.id || null,
          restaurant_id: restaurantId,
          table_id: tableId || null,
          endpoint: subscription.endpoint,
          keys: keys,
        },
      ]);

      if (error) {
        console.error('Failed to log push subscription to database:', error);
        throw error;
      }

      setIsSubscribed(true);
      return subscription;
    } catch (err) {
      console.error('Failed to register push subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    if (!isSupported) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Delete subscription from DB
        const { error } = await supabase
          .from('notification_subscriptions' as any)
          .delete()
          .eq('endpoint', subscription.endpoint);

        if (error) {
          console.warn('Failed to delete push subscription record from database:', error);
        }

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Error during push unsubscription:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permissionStatus,
    isSubscribed,
    subscribeUser,
    unsubscribeUser,
    loading,
  };
}
