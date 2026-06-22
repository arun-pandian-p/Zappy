export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.error('VITE_RESEND_API_KEY is not set');
    throw new Error('Email service configuration missing');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const emailService = {
  sendDemoNotification: async (data: any) => {
    return sendEmail({
      to: 'zappyscan@gmail.com',
      subject: `New Demo Request - ${data.restaurant_name}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Restaurant:</strong> ${data.restaurant_name}</p>
        <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Branches:</strong> ${data.branches || 1}</p>
        <p><strong>City:</strong> ${data.city}</p>
      `,
    });
  },

  sendDemoConfirmation: async (data: any) => {
    return sendEmail({
      to: data.email,
      subject: 'Demo Request Received',
      html: `
        <p>Hi ${data.name},</p>
        <p>Thank you for requesting a ZAPPY demo.</p>
        <p>Our team will contact you shortly.</p>
        <br/>
        <p>Best regards,</p>
        <p>The ZAPPY Team</p>
      `,
    });
  },

  sendNewsletterWelcome: async (email: string) => {
    return sendEmail({
      to: email,
      subject: 'Welcome to ZAPPY Newsletter!',
      html: `
        <p>Hi there,</p>
        <p>Thanks for subscribing to the ZAPPY newsletter.</p>
        <p>We'll keep you updated with the latest features, news, and restaurant management tips!</p>
        <br/>
        <p>Best regards,</p>
        <p>The ZAPPY Team</p>
      `,
    });
  },
};
