import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PRIZES = [
  { name: "�,��,�,'�1S�,?�1?�,?�,-�,��1O", weight: 40 },
  { name: "�,z�,�,؅,?�,,�,?�1?�,^", weight: 30 },
  { name: "�,,�,-�,؅,-�,�1^�,��,��,��,�,?", weight: 20 },
  { name: "�,,�,-�,s�,,�,,�,\"�,-�,�1^�,��1^�,�,��,��,T�,,�,?", weight: 10 },
];

function drawPrize(prizePool: { name: string; weight: number }[]): string {
  const total = prizePool.reduce((sum, prize) => sum + prize.weight, 0);
  let random = Math.random() * total;
  for (const prize of prizePool) {
    if (random < prize.weight) {
      return prize.name;
    }
    random -= prize.weight;
  }
  return prizePool[0].name;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId } = await req.json();

    if (!participantId) {
      return new Response(
        JSON.stringify({ error: "participantId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const [settingsRes, prizesRes] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "points_required_for_wheel").maybeSingle(),
      supabase.from("prizes").select("name, weight"),
    ]);

    const pointsRequired = (() => {
      const settingValue = settingsRes.data?.value;
      if (settingValue && typeof settingValue === "object" && settingValue !== null && "value" in settingValue) {
        const maybeNumber = (settingValue as Record<string, unknown>).value;
        if (typeof maybeNumber === "number") {
          return maybeNumber;
        }
      }
      return 300;
    })();

    const prizePool = (() => {
      if (prizesRes.data && prizesRes.data.length > 0) {
        return prizesRes.data.filter((p) => typeof p.weight === "number" && p.weight > 0);
      }
      return DEFAULT_PRIZES;
    })();

    if (prizePool.length === 0) {
      return new Response(
        JSON.stringify({ error: "No prizes configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [participantRes, spinRes] = await Promise.all([
      supabase.from("participants").select("points").eq("id", participantId).single(),
      supabase.from("spins").select("id").eq("participant_id", participantId).maybeSingle(),
    ]);

    if (participantRes.error || !participantRes.data) {
      return new Response(
        JSON.stringify({ error: "Participant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (participantRes.data.points < pointsRequired) {
      return new Response(
        JSON.stringify({ error: "Not enough points" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (spinRes.data) {
      return new Response(
        JSON.stringify({ error: "Already spun" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prize = drawPrize(prizePool);

    const { error: insertError } = await supabase.from("spins").insert({
      participant_id: participantId,
      prize,
    });

    if (insertError) {
      console.error("Spin insert error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Participant ${participantId} won: ${prize}`);

    return new Response(
      JSON.stringify({ ok: true, prize }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
