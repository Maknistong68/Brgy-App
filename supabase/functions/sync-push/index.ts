import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { changes } = await req.json();
    const results: Record<string, { created: number; updated: number; errors: string[] }> = {};

    for (const [table, records] of Object.entries(changes as Record<string, any[]>)) {
      results[table] = { created: 0, updated: 0, errors: [] };

      for (const record of records) {
        const { _status, _changed, ...data } = record;

        if (_status === 'created') {
          const { error } = await supabase.from(table).insert(data);
          if (error) results[table].errors.push(`Insert ${data.id}: ${error.message}`);
          else results[table].created++;
        } else if (_status === 'updated') {
          const { error } = await supabase.from(table).update(data).eq('id', data.id);
          if (error) results[table].errors.push(`Update ${data.id}: ${error.message}`);
          else results[table].updated++;
        }
      }
    }

    return new Response(JSON.stringify({ results, syncedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
