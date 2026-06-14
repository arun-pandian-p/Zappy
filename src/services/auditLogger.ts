import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  restaurantId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
}

export async function logActivity({
  restaurantId,
  action,
  tableName,
  recordId,
  oldValues,
  newValues
}: AuditLogParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let ipAddress = 'unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip || 'unknown';
    } catch {
      // silent fallback
    }
    
    const userAgent = navigator.userAgent || 'unknown';
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        restaurant_id: restaurantId,
        user_id: user?.id || null,
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress,
        device: userAgent
      });
      
    if (error) {
      console.error("[AuditLogger] Failed to write log:", error);
    }
  } catch (err) {
    console.error("[AuditLogger] Error in logging activity:", err);
  }
}
