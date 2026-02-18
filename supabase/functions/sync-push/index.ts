import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '';

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const ALLOWED_TABLES = [
  'complaints', 'complaint_comments', 'complaint_status_history',
  'document_requests', 'document_request_status_history', 'notifications',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { changes } = await req.json();
    const results: Record<string, { created: number; updated: number; errors: string[] }> = {};

    for (const [table, records] of Object.entries(changes as Record<string, any[]>)) {
      // Whitelist allowed table names
      if (!ALLOWED_TABLES.includes(table)) {
        results[table] = { created: 0, updated: 0, errors: [`Table '${table}' is not allowed for sync push`] };
        continue;
      }

      results[table] = { created: 0, updated: 0, errors: [] };

      for (const record of records) {
        const { _status, _changed, ...data } = record;

        // Validate record IDs as UUIDs
        if (data.id && !UUID_RE.test(data.id)) {
          results[table].errors.push(`Invalid UUID: ${data.id}`);
          continue;
        }

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
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
