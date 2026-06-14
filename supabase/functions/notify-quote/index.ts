import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const WHATSAPP_TO = 'whatsapp:+919994093784';
const WHATSAPP_FROM = 'whatsapp:+14155238886'; // Twilio Sandbox
const NOTIFY_EMAIL = 'sales@zappy.ind.in';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { 
      name, 
      email, 
      phone, 
      restaurant_name, 
      city, 
      num_tables, 
      current_system, 
      features_needed, 
      message,
      is_demo_request,
      branches 
    } = payload;

    const isDemo = !!is_demo_request || current_system === 'demo_request';
    const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Format the quote/demo message for logging and WhatsApp
    const lines = [];
    if (isDemo) {
      lines.push(`🆕 *New Demo Request - ZAPPY*`);
    } else {
      lines.push(`🆕 *New Quote Request*`);
    }
    lines.push(``);
    lines.push(`👤 *Name:* ${name}`);
    lines.push(`📧 *Email:* ${email}`);
    if (phone) lines.push(`📱 *Phone:* ${phone}`);
    if (restaurant_name) lines.push(`🏨 *Restaurant:* ${restaurant_name}`);
    if (city) lines.push(`📍 *City:* ${city}`);
    if (isDemo) {
      lines.push(`🏢 *Branches:* ${branches || 1}`);
    } else {
      if (num_tables) lines.push(`🪑 *Tables:* ${num_tables}`);
      if (current_system) lines.push(`💻 *Current System:* ${current_system}`);
      if (features_needed?.length) lines.push(`✅ *Features:* ${features_needed.join(', ')}`);
    }
    if (message) lines.push(`\n💬 *Message:*\n${message}`);
    lines.push(`\n📅 *Timestamp:* ${timestampStr}`);

    const whatsappMessage = lines.join('\n');

    // Send WhatsApp via Twilio Gateway (try-catch, fail silently if keys are missing)
    let whatsappSent = false;
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
      
      if (LOVABLE_API_KEY && TWILIO_API_KEY) {
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
        whatsappSent = whatsappResponse.ok;
        if (!whatsappResponse.ok) {
          const errData = await whatsappResponse.json();
          console.error('Twilio WhatsApp error:', JSON.stringify(errData));
        }
      } else {
        console.log('Skipping Twilio WhatsApp: Credentials not found in environment.');
      }
    } catch (err) {
      console.error('Failed to dispatch Twilio WhatsApp:', err);
    }

    // Send Email notification via Resend
    let emailSent = false;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        const subject = isDemo ? 'New Demo Request - ZAPPY' : 'New Quote Request - ZAPPY';
        const htmlBody = isDemo ? `
          <h2>New Demo Request - ZAPPY</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Restaurant:</strong> ${restaurant_name}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Branches:</strong> ${branches || 1}</p>
          <p><strong>City:</strong> ${city || 'N/A'}</p>
          <p><strong>Timestamp:</strong> ${timestampStr}</p>
        ` : `
          <h2>New Quote Request - ZAPPY</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Restaurant:</strong> ${restaurant_name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Tables:</strong> ${num_tables || 'N/A'}</p>
          <p><strong>Current System:</strong> ${current_system || 'N/A'}</p>
          <p><strong>Features Needed:</strong> ${features_needed?.length ? features_needed.join(', ') : 'N/A'}</p>
          <p><strong>Message:</strong> ${message || 'N/A'}</p>
          <p><strong>Timestamp:</strong> ${timestampStr}</p>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Zappy Restaurant OS <onboarding@resend.dev>',
            to: [NOTIFY_EMAIL],
            subject: subject,
            html: htmlBody,
          }),
        });

        emailSent = emailResponse.ok;
        if (!emailResponse.ok) {
          const errData = await emailResponse.text();
          console.error('Resend email error:', errData);
        } else {
          console.log(`Email successfully dispatched via Resend to ${NOTIFY_EMAIL}`);
        }
      } catch (err) {
        console.error('Failed to send email via Resend:', err);
      }
    } else {
      console.log(`[MOCK EMAIL LOG] Send to: ${NOTIFY_EMAIL}`);
      console.log(`Subject: ${isDemo ? 'New Demo Request - ZAPPY' : 'New Quote Request - ZAPPY'}`);
      console.log(`Body:\n${whatsappMessage}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_sent: whatsappSent,
        email_sent: emailSent,
        message: 'Request processed successfully.'
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
