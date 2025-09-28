import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  clientName: string;
  meetingDate: string;
  pdfBase64: string;
  agentData: {
    name: string;
    email: string | null;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { to, subject, clientName, meetingDate, pdfBase64, agentData }: EmailRequest = await req.json();

    console.log('Sending email with PDF attachment...');

    const fileName = `סיכום-ביטוח-${clientName}-${new Date(meetingDate).toLocaleDateString('he-IL')}.pdf`;
    
    const emailPayload = {
      from: `${agentData.name} <onboarding@resend.dev>`,
      to: [to],
      subject: subject,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">שלום ${clientName},</h2>
          <p style="font-size: 16px; color: #374151;">מצורף סיכום הפגישה שקיימנו ביום ${new Date(meetingDate).toLocaleDateString('he-IL')}.</p>
          <p style="font-size: 16px; color: #374151;">הדוח כולל את כל הפרטים והמלצות שדנו עליהן במהלך הפגישה.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">📎 מצורף קובץ PDF עם הסיכום המלא</p>
          </div>
          <br>
          <p style="font-size: 16px; color: #374151;">בברכה,<br><strong>${agentData.name}</strong></p>
          ${agentData.email ? `<p style="color: #6b7280; font-size: 14px;">לשאלות נוספות ניתן לפנות אלי במייל: <a href="mailto:${agentData.email}" style="color: #2563eb;">${agentData.email}</a></p>` : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">מערכת דיגיטלית לניהול ביטוח</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
          type: 'application/pdf',
        },
      ],
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "האימייל נשלח בהצלחה עם הדוח המצורף",
        emailId: result.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-report-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "שגיאה בשליחת האימייל" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);