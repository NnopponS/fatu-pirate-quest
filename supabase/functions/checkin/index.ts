import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function signCheckin(locId: number, yyyymmdd: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${locId}:${yyyymmdd}`);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId, locationId, signature } = await req.json();

    if (!participantId || !locationId || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secret = Deno.env.get('CHECKIN_SECRET');
    if (!secret) {
      console.error('CHECKIN_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature (allow ±1 day)
    const dates = [todayStr(-1), todayStr(0), todayStr(1)];
    const validSignatures = await Promise.all(
      dates.map(d => signCheckin(locationId, d, secret))
    );
    
    if (!validSignatures.includes(signature)) {
      console.log('Invalid signature:', signature);
      return new Response(
        JSON.stringify({ error: 'Invalid QR code signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get location points
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('points')
      .eq('id', locationId)
      .single();

    if (locError || !location) {
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to insert checkin
    const { error: insertError } = await supabase
      .from('checkins')
      .insert({
        participant_id: participantId,
        location_id: locationId,
        method: 'qr'
      });

    // If already checked in, that's ok
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Checkin insert error:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isNewCheckin = !insertError;

    // Increment points if new checkin
    if (isNewCheckin) {
      const { error: pointsError } = await supabase.rpc('increment_points', {
        pid_in: participantId,
        plus_in: location.points
      });

      if (pointsError) {
        console.error('Points increment error:', pointsError);
      } else {
        console.log(`Participant ${participantId} checked in at location ${locationId}, +${location.points} points`);
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        pointsAdded: isNewCheckin ? location.points : 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
