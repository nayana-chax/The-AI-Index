import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabase"

const SUBSTACK_URL = "https://innercirclesignal.substack.com"

async function subscribeToSubstack(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUBSTACK_URL}/api/v1/free`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_url: `${SUBSTACK_URL}/`,
        first_referrer: "",
        current_url: `${SUBSTACK_URL}/`,
        current_referrer: "",
        referral_code: "",
        source: "embed",
      }),
    })
    return res.ok
  } catch {
    console.error("Substack subscription failed for:", email)
    return false
  }
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email exists in subscribers table
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, verified")
      .eq("email", normalizedEmail)
      .limit(1)

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }

    if (data && data.length > 0) {
      if (data[0].verified) {
        // Already verified: instant unlock
        return NextResponse.json({ status: "subscribed" })
      }

      // Email exists but not verified yet: user is coming back after confirming on Substack
      // Mark as verified and unlock
      await supabase
        .from("subscribers")
        .update({ verified: true })
        .eq("email", normalizedEmail)

      return NextResponse.json({ status: "subscribed" })
    }

    // Brand new email: save to DB + subscribe to Substack
    const [insertResult, substackResult] = await Promise.all([
      supabase
        .from("subscribers")
        .upsert(
          { email: normalizedEmail, source: "ai_index", verified: false },
          { onConflict: "email" }
        ),
      subscribeToSubstack(normalizedEmail),
    ])

    if (insertResult.error) {
      console.error("Supabase insert error:", insertResult.error)
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }

    return NextResponse.json({
      status: "verification_pending",
      substackSubscribed: substackResult,
    })
  } catch (error) {
    console.error("check-subscriber error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
