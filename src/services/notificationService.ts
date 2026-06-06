import { SOUNDS } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'received' | 'preparing' | 'ready' | 'delivered';

class NotificationService {
  private triggeredIds = new Set<string>();

  shouldTrigger(dedupeId: string): boolean {
    if (this.triggeredIds.has(dedupeId)) {
      return false;
    }
    this.triggeredIds.add(dedupeId);
    return true;
  }

  playSound(eventType: NotificationType, _restaurantId?: string): void {
    let soundUrl = SOUNDS.NEW_ORDER;
    if (eventType === 'ready' || eventType === 'delivered') {
      soundUrl = SOUNDS.ORDER_READY;
    }

    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.6;
      audio.play().catch((err) => {
        console.warn('Autoplay prevented or sound error:', err);
      });
    } catch (err) {
      console.warn('Failed to play notification sound:', err);
    }
  }

  async logNotification(log: {
    restaurant_id: string;
    table_id?: string;
    order_id: string;
    title: string;
    message: string;
    event_type: NotificationType;
  }): Promise<void> {
    try {
      const { error } = await supabase.from('customer_events').insert([
        {
          restaurant_id: log.restaurant_id,
          table_id: log.table_id || null,
          event_type: `notification_${log.event_type}`,
          event_data: {
            title: log.title,
            message: log.message,
            order_id: log.order_id,
          },
        },
      ]);
      if (error) {
        console.error('Failed to log notification in customer_events:', error);
      }
    } catch (err) {
      console.error('Failed to log notification:', err);
    }
  }
}

export const notificationService = new NotificationService();
