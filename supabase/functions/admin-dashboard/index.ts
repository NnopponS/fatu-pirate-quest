import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Fetch dashboard data
      const [participantsRes, locationsRes, spinsRes, settingsRes] = await Promise.all([
        supabase.from('participants').select('*').order('created_at', { ascending: false }),
        supabase.from('locations').select('*').order('id'),
        supabase.from('spins').select('prize').order('created_at', { ascending: false }),
        supabase.from('event_settings').select('*').single(),
      ]);

      if (participantsRes.error || locationsRes.error || spinsRes.error) {
        console.error('Error fetching data:', { participantsRes, locationsRes, spinsRes });
        throw new Error('Failed to fetch dashboard data');
      }

      // Calculate prize distribution from spins
      const prizeWeights: Record<string, number> = {};
      const prizeNames = new Set(spinsRes.data?.map((s: any) => s.prize) || []);
      
      // Default prizes
      const defaultPrizes = [
        { name: 'Pirate Sticker Set', weight: 40 },
        { name: 'FATU Tote Bag', weight: 30 },
        { name: 'Limited Edition T-Shirt', weight: 20 },
        { name: 'Grand Prize Mystery Box', weight: 10 },
      ];

      prizeNames.forEach(name => {
        const count = spinsRes.data?.filter((s: any) => s.prize === name).length || 0;
        prizeWeights[name] = count;
      });

      const prizes = Array.from(prizeNames).map((name, idx) => ({
        id: `prize-${idx}`,
        name: name as string,
        weight: prizeWeights[name] || defaultPrizes.find(p => p.name === name)?.weight || 10,
        created_at: new Date().toISOString(),
      }));

      // Add default prizes if none exist
      if (prizes.length === 0) {
        defaultPrizes.forEach((p, idx) => {
          prizes.push({
            id: `prize-${idx}`,
            ...p,
            created_at: new Date().toISOString(),
          });
        });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          participants: participantsRes.data || [],
          locations: locationsRes.data || [],
          prizes,
          settings: {
            pointsRequiredForWheel: settingsRes.data?.points_for_spin || 300,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      if (action === 'update_location') {
        const { id, name, lat, lng, points, image_url, description } = body;
        const { error } = await supabase
          .from('locations')
          .update({ name, lat, lng, points, image_url, description })
          .eq('id', id);

        if (error) throw error;
        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'adjust_points') {
        const { participant_id, points_delta } = body;
        const { error } = await supabase.rpc('adjust_participant_points', {
          p_participant_id: participant_id,
          p_points_delta: points_delta,
        });

        if (error) throw error;
        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update_settings') {
        const { points_for_spin, event_name, event_description, event_logo_url } = body;
        
        // Get current settings
        const { data: currentSettings } = await supabase
          .from('event_settings')
          .select('*')
          .single();
        
        if (!currentSettings) throw new Error('Event settings not found');
        
        const { error } = await supabase
          .from('event_settings')
          .update({
            points_for_spin,
            event_name,
            event_description,
            event_logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSettings.id);

        if (error) throw error;
        return new Response(
          JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});