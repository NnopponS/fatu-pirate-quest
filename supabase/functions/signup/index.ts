import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, age, gradeLevel, school, program } = await req.json();

    if (!firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'firstName and lastName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const encoder = new TextEncoder();
    const toHex = (buffer: ArrayBuffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    const hashPassword = async (password: string) => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));
      return toHex(digest);
    };

    const sanitize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    const baseUsername = (() => {
      const first = sanitize(firstName);
      const last = sanitize(lastName);
      const baseParts = [first, last].filter((part) => part.length > 0);
      if (baseParts.length === 0) {
        return 'pirate';
      }
      return baseParts.join('').slice(0, 12);
    })();

    let username: string | null = null;
    let attempts = 0;
    while (!username && attempts < 10) {
      const suffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidate = `${baseUsername}${suffix}`;
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();

      if (!existing) {
        username = candidate;
      }
      attempts += 1;
    }

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Unable to generate unique username. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const password = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('participants')
      .insert({
        first_name: firstName,
        last_name: lastName,
        age: age || null,
        grade_level: gradeLevel || null,
        school: school || null,
        program: program || null,
        username,
        password_hash: passwordHash,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Signup error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`New participant registered: ${data.id}`);

    return new Response(
      JSON.stringify({ ok: true, participantId: data.id, username, password }),
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
