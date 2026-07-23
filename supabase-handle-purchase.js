/**
 * Supabase Edge Function: handle-purchase
 *
 * Deploy to: supabase functions deploy handle-purchase
 *
 * Gumroad pings this on every sale. It inserts the license key into the
 * licenses table so the app can validate it (hardware-locked, one key = one PC).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Gumroad sends application/x-www-form-urlencoded
  let body;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await req.json();
  } else {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const licenseKey = body.license_key;
  const email = body.email;
  const productId = body.product_id;
  const sellerId = body.seller_id;

  console.log("Purchase ping:", { licenseKey: licenseKey?.slice(0, 6) + "...", email, productId });

  if (!licenseKey) {
    return new Response(JSON.stringify({ ok: false, error: "No license_key in payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Require seller_id match to prevent randos from inserting keys
  if (sellerId !== Deno.env.get("GUMROAD_SELLER_ID")) {
    console.log("Rejected — seller_id mismatch:", sellerId);
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Insert the new key (hardware_id NULL = not yet activated)
  const { error } = await supabase
    .from("licenses")
    .insert({
      license_key: licenseKey,
      hardware_id: null,
      activated: false,
      email: email || null
    });

  if (error) {
    // Duplicate key — already exists
    if (error.code === "23505") {
      console.log("Key already exists — skipping");
      return new Response(JSON.stringify({ ok: true, status: "already_exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.error("Insert error:", error);
    return new Response(JSON.stringify({ ok: false, error: "Database error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log("Key inserted:", licenseKey.slice(0, 6) + "...");
  return new Response(JSON.stringify({ ok: true, status: "inserted" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
