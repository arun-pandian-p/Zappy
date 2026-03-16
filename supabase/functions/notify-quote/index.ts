import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const WHATSAPP_TO = 'whatsapp:+919994093784';
const WHATSAPP_FROM = 'whatsapp:+14155238886'; // Twilio Sandbox
const NOTIFY_EMAIL = 'zappyscan@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, restaurant_name, city, num_tables, current_system, features_needed, message } = await req.json();

    // Format the quote message
    const lines = [
      `🆕 *New Quote Request*`,
      ``,
      `👤 *Name:* ${name}`,
      `📧 *Email:* ${email}`,
    ];
    if (phone) lines.push(`📱 *Phone:* ${phone}`);
    if (restaurant_name) lines.push(`🏨 *Restaurant:* ${restaurant_name}`);
    if (city) lines.push(`📍 *City:* ${city}`);
    if (num_tables) lines.push(`🪑 *Tables:* ${num_tables}`);
    if (current_system) lines.push(`💻 *Current System:* ${current_system}`);
    if (features_needed?.length) lines.push(`✅ *Features:* ${features_needed.join(', ')}`);
    if (message) lines.push(`\n💬 *Message:*\n${message}`);

    const whatsappMessage = lines.join('\n');

    // Send WhatsApp via Twilio Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    if (!TWILIO_API_KEY) throw new Error('TWILIO_API_KEY is not configured');

    const whatsappResponse = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: WHATSAPP_TO,
        From: WHATSAPP_FROM,
        Body: whatsappMessage,
      }),
    });

    const whatsappData = await whatsappResponse.json();
    if (!whatsappResponse.ok) {
      console.error('Twilio WhatsApp error:', JSON.stringify(whatsappData));
    }

    // Send Email notification
    // For now, log the email notification - email domain setup is pending
    console.log(`Email notification would be sent to ${NOTIFY_EMAIL}:`, whatsappMessage);

    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_sent: whatsappResponse.ok,
        email_sent: false, // Pending email domain setup
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
