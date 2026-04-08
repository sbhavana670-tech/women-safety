import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { message, to } = await req.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    // Use provided number(s) OR fallback to env
    let recipients: string[] = [];

    if (to) {
      // allow single or multiple numbers
      recipients = Array.isArray(to) ? to : [to];
    } else if (process.env.RECIPIENT_PHONE_NUMBER) {
      recipients = [process.env.RECIPIENT_PHONE_NUMBER];
    } else {
      throw new Error("No recipient phone number provided");
    }

    const results = [];

    for (const number of recipients) {
      const sms = await client.messages.create({
        body: message || "🚨 SOS Alert! Emergency detected.",
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: number,
      });

      results.push(sms.sid);
    }

    return NextResponse.json({
      success: true,
      sids: results,
    });
  } catch (error: any) {
    console.error("SMS Error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}