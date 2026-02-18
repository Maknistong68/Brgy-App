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

    const { lastSyncedAt, tables } = await req.json();
    const since = lastSyncedAt ? new Date(lastSyncedAt).toISOString() : new Date(0).toISOString();

    const syncableTables = ['profiles', 'complaints', 'complaint_comments', 'complaint_status_history',
      'document_requests', 'document_request_status_history', 'notifications', 'announcements'];

    const requestedTables = tables || syncableTables;
    const changes: Record<string, any[]> = {};

    for (const table of requestedTables) {
      if (!syncableTables.includes(table)) continue;
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('updated_at', since)
        .order('updated_at', { ascending: true })
        .limit(1000);

      if (error) {
        console.error(`Error pulling ${table}:`, error);
        changes[table] = [];
      } else {
        changes[table] = data || [];
      }
    }

    return new Response(JSON.stringify({ changes, syncedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
