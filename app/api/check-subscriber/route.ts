import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email exists in subscribers table
    const { data, error } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }

    if (data && data.length > 0) {
      return NextResponse.json({ status: "subscribed" })
    }

    // New subscriber: add to database
    const { error: insertError } = await supabase
      .from("subscribers")
      .upsert({ email: normalizedEmail, source: "ai_index" }, { onConflict: "email" })

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }

    return NextResponse.json({ status: "new_subscriber" })
  } catch (error) {
    console.error("check-subscriber error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
