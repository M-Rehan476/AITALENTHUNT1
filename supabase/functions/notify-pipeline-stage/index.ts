import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import nodemailer from "npm:nodemailer@6.9.13";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Edge Function Invoked: notify-pipeline-stage');
    const { pipeline_id, stage, notes } = await req.json();
    console.log(`Received payload: pipeline_id=${pipeline_id}, stage=${stage}`);

    if (!pipeline_id || !stage) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // IMPORTANT: We must use the SERVICE_ROLE_KEY to bypass Row Level Security (RLS) inside the Edge Function.
    // If we use ANON_KEY without passing the user's JWT, the database queries will return NO DATA and fail silently.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching pipeline data...');
    // Fetch the pipeline, job, and candidate data
    const { data: pipelineData, error: pipelineError } = await supabaseClient
      .from('pipeline_stages')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .eq('id', pipeline_id)
      .single();

    if (pipelineError || !pipelineData) {
      throw new Error('Pipeline data not found');
    }

    console.log(`Querying recruiter with ID: ${pipelineData.candidate.submitted_by}`);
    // Fetch the recruiter details using the submitted_by ID from the candidate
    const { data: recruiterData } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', pipelineData.candidate.submitted_by)
      .single();

    const candidateEmail = pipelineData.candidate.email;
    const candidateName = pipelineData.candidate.full_name;
    const recruiterEmail = recruiterData?.email || Deno.env.get('SMTP_USER');
    const recruiterName = recruiterData?.full_name || 'Recruiter';
    const jobTitle = pipelineData.job?.title || 'a position';

    console.log(`Preparing to send emails to Candidate: ${candidateEmail} and Recruiter: ${recruiterEmail}`);

    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
    const smtpPort = Number(Deno.env.get('SMTP_PORT') || 465);
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
       console.error('SMTP credentials missing!');
       throw new Error('SMTP credentials not configured properly in Edge Function secrets.');
    }

    console.log(`Configuring Nodemailer Transport: ${smtpHost}:${smtpPort}`);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      }
    });
    console.log('SMTP transporter created successfully.');

    // -------------------------------------------------------------
    // EMAIL TEMPLATES & HTML DESIGN
    // -------------------------------------------------------------
    
    let subject = `Update on your application for ${jobTitle}`;
    let messageText = `Your application status has been updated to: ${stage}.`;
    
    if (stage === 'Interview') {
      subject = `Interview Invitation: ${jobTitle}`;
      messageText = `Great news! We would like to invite you to an interview for the ${jobTitle} position.`;
    } else if (stage === 'Offer') {
      subject = `Job Offer: ${jobTitle}`;
      messageText = `Congratulations! We are thrilled to extend an offer for the ${jobTitle} position to you.`;
    } else if (stage === 'Rejected') {
      subject = `Application Update: ${jobTitle}`;
      messageText = `Thank you for applying for the ${jobTitle} position. We regret to inform you that we will not be moving forward with your application at this time.`;
    }

    const candidateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Update</title>
      </head>
      <body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: #60a5fa;">AI</span> Talent Hunt
              </h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px;">
              <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px;">Application Update</h2>
              <p style="margin-bottom: 24px;">Hello ${candidateName},</p>
              <p style="margin-bottom: 24px;">${messageText}</p>
              ${notes ? 
              '<div style="margin-bottom: 24px; padding: 16px; background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 4px;">' +
                '<p style="margin: 0; color: #475569; font-style: italic;">"' + notes + '"</p>' +
              '</div>' : ''}
              <p style="margin-bottom: 0; color: #334155;">Best regards,<br><strong>The AI Talent Hunt Team</strong></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">This is an automated message regarding your application for ${jobTitle}.</p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} AI Talent Hunt. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const recruiterHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Candidate Progress Alert</title>
      </head>
      <body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                <span style="color: #60a5fa;">AI</span> Talent Hunt
              </h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px;">
              <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px;">Candidate Progress Alert</h2>
              <p style="margin-bottom: 24px;">Hello ${recruiterName},</p>
              <p style="margin-bottom: 24px;">Your candidate <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position has been moved to the <strong>${stage}</strong> stage.</p>
              
              <div style="margin-bottom: 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #94a3b8; border-radius: 4px;">
                <p style="margin: 0; color: #475569; font-size: 15px;"><strong>System Notes:</strong><br>${notes ? '<i>"' + notes + '"</i>' : 'None'}</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} AI Talent Hunt. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 1. Send HTML Email to Candidate
    console.log('Sending Candidate Email...');
    await transporter.sendMail({
      from: smtpUser,
      to: candidateEmail,
      subject: subject,
      text: messageText, // Fallback plain text
      html: candidateHtml,  // Rich HTML design
    });

    // 2. Send HTML Email to Recruiter
    console.log('Sending Recruiter Email...');
    await transporter.sendMail({
      from: smtpUser,
      to: recruiterEmail,
      subject: `[Pipeline Update] ${candidateName} - ${stage}`,
      text: `Your candidate ${candidateName} was moved to ${stage}.`,
      html: recruiterHtml,
    });

    console.log('Emails dispatched successfully.');

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});