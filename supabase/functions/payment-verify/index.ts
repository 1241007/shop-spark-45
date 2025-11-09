import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type VerifyRequest = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  amount: number
  currency?: string
  address?: Record<string, unknown> | string
  productIds?: string[]
}

async function computeHmacSHA256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const keyData = enc.encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
  // Convert ArrayBuffer to hex string
  const bytes = new Uint8Array(signature)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Require user auth (used for user_id attribution under RLS)
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency = 'INR',
      address,
      productIds = [],
    }: VerifyRequest = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay env not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify signature according to Razorpay docs: hmac_sha256(order_id|payment_id)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignatureHex = await computeHmacSHA256Hex(RAZORPAY_KEY_SECRET, payload)
    const receivedSignatureHex = razorpay_signature

    if (expectedSignatureHex !== receivedSignatureHex) {
      // Store failed order for audit
      await persistOrder({
        req,
        status: 'failed',
        amount,
        currency,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        address,
        productIds,
      })
      return new Response(JSON.stringify({ success: false, error: 'Signature mismatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optionally fetch payment details from Razorpay for additional validation
    // Skipped here to keep latency low; can be added if needed.

    const orderRecord = await persistOrder({
      req,
      status: 'processing',
      amount,
      currency,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      address,
      productIds,
    })

    return new Response(JSON.stringify({ success: true, order: orderRecord }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function persistOrder(args: {
  req: Request
  status: 'processing' | 'failed'
  amount: number
  currency: string
  orderId: string
  paymentId: string
  address?: Record<string, unknown> | string
  productIds?: string[]
}) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env not configured')
  }

  // We use the service role to write the order row reliably, but we still
  // extract the user from the Bearer token for attribution and RLS compliance.
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  })

  const userToken = args.req.headers.get('Authorization')?.replace('Bearer ', '') || ''

  const userClient = createClient(SUPABASE_URL, userToken, { auth: { persistSession: false } })
  const { data: userData } = await userClient.auth.getUser()
  const userId = userData?.user?.id || null

  const insertPayload = {
    user_id: userId,
    product_ids: args.productIds || [],
    amount: args.amount,
    currency: args.currency,
    payment_id: args.paymentId,
    payment_gateway_order_id: args.orderId,
    order_status: args.status === 'processing' ? 'Processing' : 'Failed',
    address: typeof args.address === 'string' ? args.address : JSON.stringify(args.address || {}),
  }

  const { data, error } = await serviceClient
    .from('orders')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to insert order: ${error.message}`)
  }

  return data
}


