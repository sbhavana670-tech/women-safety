import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const call = await client.calls.create({
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      // Twilio requires a URL that returns TwiML instructions
      url: "http://demo.twilio.com/docs/voice.xml",
    });

    return NextResponse.json({ success: true, sid: call.sid });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}