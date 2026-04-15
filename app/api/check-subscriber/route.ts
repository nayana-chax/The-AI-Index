import { NextRequest, NextResponse } from "next/server"

const AUTOSEND_API_KEY = process.env.AUTOSEND_API_KEY || ""
const AUTOSEND_LIST_ID = process.env.AUTOSEND_LIST_ID || ""
const AUTOSEND_TEMPLATE_ID = process.env.AUTOSEND_TEMPLATE_ID || ""
const SITE_URL = process.env.SITE_URL || "http://localhost:3000"
const SENDER_EMAIL = process.env.SENDER_EMAIL || "team@firstdollar.money"
const SENDER_NAME = process.env.SENDER_NAME || "The AI Index"

async function autosendFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.autosend.io/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AUTOSEND_API_KEY}`,
      ...options.headers,
    },
  })
  return res
}

async function isSubscribed(email: string): Promise<boolean> {
  const res = await autosendFetch(
    `/contacts/search?email=${encodeURIComponent(email)}&listId=${AUTOSEND_LIST_ID}`
  )
  if (!res.ok) return false
  const data = await res.json()
  return data.contacts && data.contacts.length > 0
}

async function addContact(email: string): Promise<void> {
  await autosendFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email,
      listIds: [AUTOSEND_LIST_ID],
    }),
  })
}

async function sendUnlockEmail(email: string): Promise<void> {
  const unlockUrl = `${SITE_URL}?unlocked=IC2026`

  await autosendFetch("/mail/send", {
    method: "POST",
    body: JSON.stringify({
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email }],
      templateId: AUTOSEND_TEMPLATE_ID,
      dynamicData: { unlockUrl },
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const subscribed = await isSubscribed(email)

    if (subscribed) {
      return NextResponse.json({ status: "subscribed" })
    }

    // New subscriber: add to list and send verification email
    await addContact(email)
    await sendUnlockEmail(email)

    return NextResponse.json({ status: "verification_sent" })
  } catch (error) {
    console.error("check-subscriber error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
