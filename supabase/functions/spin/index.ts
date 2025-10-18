import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRIZES = [
  { name: "สติ๊กเกอร์", weight: 40 },
  { name: "พวงกุญแจ", weight: 30 },
  { name: "ของที่ระลึก", weight: 20 },
  { name: "ขอบคุณที่ร่วมสนุก", weight: 10 }
];

const POINTS_REQUIRED = 300;

function drawPrize(): string {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    if (r < p.weight) return p.name;
    r -= p.weight;
  }
  return PRIZES[0].name;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId } = await req.json();

    if (!participantId) {
      return new Response(
        JSON.stringify({ error: 'participantId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check points and if already spun
    const [participantRes, spinRes] = await Promise.all([
      supabase.from('participants').select('points').eq('id', participantId).single(),
      supabase.from('spins').select('id').eq('participant_id', participantId).maybeSingle(),
    ]);

    if (participantRes.error || !participantRes.data) {
      return new Response(
        JSON.stringify({ error: 'Participant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (participantRes.data.points < POINTS_REQUIRED) {
      return new Response(
        JSON.stringify({ error: 'Not enough points' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (spinRes.data) {
      return new Response(
        JSON.stringify({ error: 'Already spun' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Draw prize
    const prize = drawPrize();

    const { error: insertError } = await supabase
      .from('spins')
      .insert({
        participant_id: participantId,
        prize: prize
      });

    if (insertError) {
      console.error('Spin insert error:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Participant ${participantId} won: ${prize}`);

    return new Response(
      JSON.stringify({ ok: true, prize }),
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
