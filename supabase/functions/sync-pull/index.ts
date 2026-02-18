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

const SYNCABLE_TABLES = [
  'profiles', 'complaints', 'complaint_comments', 'complaint_status_history',
  'document_requests', 'document_request_status_history', 'notifications', 'announcements',
];

const PAGE_SIZE = 1000;

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

    const { lastSyncedAt, tables, cursor } = await req.json();

    // Validate lastSyncedAt is a valid ISO date if provided
    let since: string;
    if (lastSyncedAt) {
      const parsed = new Date(lastSyncedAt);
      if (isNaN(parsed.getTime())) {
        return new Response(JSON.stringify({ error: 'Invalid lastSyncedAt date format' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      since = parsed.toISOString();
    } else {
      since = new Date(0).toISOString();
    }

    // Only allow whitelisted tables
    const requestedTables: string[] = tables || SYNCABLE_TABLES;
    const changes: Record<string, any[]> = {};
    let hasMore = false;

    for (const table of requestedTables) {
      if (!SYNCABLE_TABLES.includes(table)) continue;

      // Cursor-based pagination: use cursor.updated_at per table if provided
      const tableCursor = cursor?.[table] || since;

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('updated_at', tableCursor)
        .order('updated_at', { ascending: true })
        .limit(PAGE_SIZE);

      if (error) {
        console.error(`Error pulling ${table}:`, error);
        changes[table] = [];
      } else {
        changes[table] = data || [];
        if (data && data.length === PAGE_SIZE) {
          hasMore = true;
        }
      }
    }

    return new Response(
      JSON.stringify({ changes, syncedAt: new Date().toISOString(), hasMore }),
      { headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
