import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SETTINGS_KEY_POINTS = "points_required_for_wheel";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action, payload } = await req.json();

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: "token and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("token, admin_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("admin_sessions").delete().eq("token", token);
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    switch (action) {
      case "get-dashboard-data": {
        const [participantsRes, locationsRes, prizesRes, settingsRes] = await Promise.all([
          supabase
            .from("participants")
            .select(
              "id, first_name, last_name, username, points, created_at, age, grade_level, school, program",
            )
            .order("created_at", { ascending: false }),
          supabase.from("locations").select("*").order("id"),
          supabase.from("prizes").select("*").order("created_at", { ascending: true }),
          supabase.from("app_settings").select("key, value").eq("key", SETTINGS_KEY_POINTS).maybeSingle(),
        ]);

        const pointsRequired =
          (settingsRes.data?.value && (settingsRes.data.value as Record<string, unknown>).value) ?? 300;

        return new Response(
          JSON.stringify({
            ok: true,
            participants: participantsRes.data ?? [],
            locations: locationsRes.data ?? [],
            prizes: prizesRes.data ?? [],
            settings: {
              pointsRequiredForWheel: pointsRequired,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "update-location": {
        const { id, name, lat, lng, points } = payload ?? {};
        if (!id || !name || typeof lat !== "number" || typeof lng !== "number" || typeof points !== "number") {
          return new Response(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { error } = await supabase
          .from("locations")
          .update({ name, lat, lng, points })
          .eq("id", id);

        if (error) {
          console.error("Update location error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "create-prize": {
        const { name, weight } = payload ?? {};
        if (!name || typeof weight !== "number" || weight <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { error } = await supabase.from("prizes").insert({ name, weight });
        if (error) {
          console.error("Create prize error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "update-prize": {
        const { id, name, weight } = payload ?? {};
        if (!id || !name || typeof weight !== "number" || weight <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { error } = await supabase.from("prizes").update({ name, weight }).eq("id", id);
        if (error) {
          console.error("Update prize error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "delete-prize": {
        const { id } = payload ?? {};
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { error } = await supabase.from("prizes").delete().eq("id", id);
        if (error) {
          console.error("Delete prize error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      case "set-spin-threshold": {
        const { pointsRequired } = payload ?? {};
        if (typeof pointsRequired !== "number" || pointsRequired < 0) {
          return new Response(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { error } = await supabase
          .from("app_settings")
          .upsert([{ key: SETTINGS_KEY_POINTS, value: { value: pointsRequired } }], {
            onConflict: "key",
          });

        if (error) {
          console.error("Update settings error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
