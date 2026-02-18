import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode as djwtDecode } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '';
const ROLE_HIERARCHY: Record<string, number> = {
  resident: 0, staff: 1, secretary: 2, treasurer: 2, captain: 3, system_admin: 4,
};

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  sendPush?: boolean;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(expoPushToken: string, title: string, body: string, data?: Record<string, any>) {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending Expo push:', error);
    return null;
  }
}

serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Verify caller auth — extract JWT and check role is staff+
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Decode JWT (verification happens via Supabase client)
    let callerRole = 'resident';
    try {
      const [, payload] = djwtDecode(token);
      callerRole = (payload as any)?.user_metadata?.role || 'resident';
    } catch {
      // If we can't decode, fall back to checking via Supabase
    }

    // Use anon key to verify JWT via Supabase for the caller check
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Look up caller's role from profiles
    const { data: callerProfile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (callerProfile) {
      callerRole = callerProfile.role;
    }

    if ((ROLE_HIERARCHY[callerRole] ?? 0) < ROLE_HIERARCHY['staff']) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Staff role or higher required.' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for inserting notifications (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId, title, body, type, data, sendPush } = (await req.json()) as NotificationPayload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, title, and body are required' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // Validate length limits
    if (title.length > MAX_TITLE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }
    if (body.length > MAX_BODY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Body must be ${MAX_BODY_LENGTH} characters or fewer` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // Insert notification
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type || 'system',
        title,
        body,
        data: data || {},
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting notification:', insertError);
      return new Response(
        JSON.stringify({ error: `Failed to create notification: ${insertError.message}` }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // Optionally send push notification via Expo
    let pushResult = null;
    if (sendPush !== false) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile for push token:', profileError);
      } else if (profile?.expo_push_token) {
        pushResult = await sendExpoPush(profile.expo_push_token, title, body, data);
      }
    }

    return new Response(
      JSON.stringify({ notification, pushSent: pushResult !== null, pushResult }),
      { headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
