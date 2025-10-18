import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hashPassword = async (password: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return toHex(digest);
};

const ADMIN_SESSION_TTL_HOURS = 12;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return new Response(
        JSON.stringify({ error: "username, password and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const passwordHash = await hashPassword(password);

    if (role === "admin") {
      await supabase.from("admin_sessions").delete().lt("expires_at", new Date().toISOString());

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("id, password_hash, username")
        .eq("username", username)
        .maybeSingle();

      if (adminError || !admin) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (admin.password_hash !== passwordHash) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();

      const { error: sessionError } = await supabase.from("admin_sessions").insert({
        token,
        admin_id: admin.id,
        expires_at: expiresAt,
      });

      if (sessionError) {
        console.error("Failed creating admin session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Unable to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          role: "admin",
          token,
          username: admin.username,
          expiresAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, password_hash, first_name, last_name, username")
      .eq("username", username)
      .maybeSingle();

    if (participantError || !participant) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (participant.password_hash !== passwordHash) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        role: "participant",
        participantId: participant.id,
        username: participant.username,
        displayName: `${participant.first_name} ${participant.last_name}`,
      }),
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
