import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { message, to } = await req.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const from = process.env.TWILIO_PHONE_NUMBER!;

    // 📩 SMS
    await client.messages.create({
      body: message,
      from,
      to,
    });

    // 📞 CALL
    await client.calls.create({
      twiml: `<Response><Say voice="alice">Emergency alert has been triggered. Please check your messages.</Say></Response>`,
      from,
      to,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}