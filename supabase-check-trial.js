// ══════════════════════════════════════════════════════════════
// VELOCE AI — check-trial Edge Function
// Deploy to Supabase: supabase functions deploy check-trial
//
// Requires a "trials" table:
//   CREATE TABLE trials (
//     hwid TEXT PRIMARY KEY,
//     first_seen TIMESTAMPTZ DEFAULT NOW()
//   );
// ══════════════════════════════════════════════════════════════

const TRIAL_DAYS = 3;

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, apikey, Authorization',
      },
    });
  }

  try {
    const { hardware_id } = await req.json();
    if (!hardware_id || hardware_id.length < 10) {
      return new Response(
        JSON.stringify({ trial: false, error: 'Invalid hardware ID' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Use Supabase client from built-in env
    const supabase = Deno.env.get('SUPABASE_URL')
      ? (await import('https://esm.sh/@supabase/supabase-js@2')).createClient(
          Deno.env.get('SUPABASE_URL'),
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        )
      : null;

    if (!supabase) {
      return new Response(
        JSON.stringify({ trial: false, error: 'Server configuration error' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const now = new Date();
    const serverTime = now.toISOString();

    // Check if this HWID already exists
    const { data: existing, error: lookupErr } = await supabase
      .from('trials')
      .select('first_seen')
      .eq('hwid', hardware_id)
      .maybeSingle();

    if (lookupErr) {
      return new Response(
        JSON.stringify({ trial: false, error: 'Database error', server_time: serverTime }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!existing) {
      // First time — insert and grant trial
      const { error: insertErr } = await supabase
        .from('trials')
        .insert({ hwid: hardware_id, first_seen: now.toISOString() });

      if (insertErr) {
        // Race condition — another request already inserted. Treat as existing.
        console.log('Insert race:', insertErr.message);
      }

      return new Response(
        JSON.stringify({ trial: true, days_left: TRIAL_DAYS, server_time: serverTime }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Existing trial — calculate days elapsed
    const firstSeen = new Date(existing.first_seen);
    const elapsedMs = now.getTime() - firstSeen.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));

    if (daysLeft <= 0) {
      return new Response(
        JSON.stringify({ trial: false, days_left: 0, server_time: serverTime }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(
      JSON.stringify({ trial: true, days_left: daysLeft, server_time: serverTime }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ trial: false, error: 'Server error: ' + e.message }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
