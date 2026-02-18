import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface GenerateDocumentPayload {
  documentRequestId: string;
}

serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Verify caller auth — must be secretary+
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

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

    // Look up caller's role
    const { data: callerProfile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    const callerRole = callerProfile?.role || 'resident';
    if ((ROLE_HIERARCHY[callerRole] ?? 0) < ROLE_HIERARCHY['secretary']) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Secretary role or higher required.' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for data operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { documentRequestId } = (await req.json()) as GenerateDocumentPayload;

    if (!documentRequestId) {
      return new Response(
        JSON.stringify({ error: 'documentRequestId is required' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch the document request with related data
    const { data: docRequest, error: requestError } = await supabase
      .from('document_requests')
      .select(`
        *,
        requestor:profiles!document_requests_requestor_id_fkey(
          id, first_name, last_name, email, phone, address, date_of_birth, civil_status
        ),
        barangay:barangays!document_requests_barangay_id_fkey(
          id, name, municipality, province, region
        )
      `)
      .eq('id', documentRequestId)
      .single();

    if (requestError) {
      return new Response(
        JSON.stringify({ error: `Document request not found: ${requestError.message}` }),
        { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const documentTemplates: Record<string, { title: string; description: string }> = {
      barangay_clearance: {
        title: 'Barangay Clearance',
        description: 'Certificate of clearance from the barangay indicating good moral character and no pending cases.',
      },
      barangay_id: {
        title: 'Barangay ID',
        description: 'Official barangay identification card for residents.',
      },
      certificate_of_residency: {
        title: 'Certificate of Residency',
        description: 'Certificate confirming residency within the barangay jurisdiction.',
      },
      certificate_of_indigency: {
        title: 'Certificate of Indigency',
        description: 'Certificate attesting to the financial status of the resident.',
      },
      business_clearance: {
        title: 'Barangay Business Clearance',
        description: 'Clearance for operating a business within the barangay.',
      },
      cedula: {
        title: 'Community Tax Certificate (Cedula)',
        description: 'Community tax certificate required for various transactions.',
      },
    };

    const template = documentTemplates[docRequest.document_type] || {
      title: docRequest.document_type,
      description: 'Barangay document',
    };

    const documentMetadata = {
      documentRequestId: docRequest.id,
      referenceNumber: docRequest.reference_number,
      documentType: docRequest.document_type,
      templateTitle: template.title,
      templateDescription: template.description,
      requestor: {
        fullName: docRequest.requestor
          ? `${docRequest.requestor.first_name} ${docRequest.requestor.last_name}`
          : 'Unknown',
        email: docRequest.requestor?.email || null,
        phone: docRequest.requestor?.phone || null,
        address: docRequest.requestor?.address || null,
        dateOfBirth: docRequest.requestor?.date_of_birth || null,
        civilStatus: docRequest.requestor?.civil_status || null,
      },
      barangay: {
        name: docRequest.barangay?.name || 'Unknown',
        municipality: docRequest.barangay?.municipality || null,
        province: docRequest.barangay?.province || null,
        region: docRequest.barangay?.region || null,
      },
      purpose: docRequest.purpose,
      status: docRequest.status,
      generatedAt: new Date().toISOString(),
      pdfUrl: null,
      message: 'PDF generation is a placeholder. Integrate a PDF library (e.g., pdf-lib) for actual document generation.',
    };

    // Update status to for_release (valid enum value, not ready_for_pickup)
    const { error: updateError } = await supabase
      .from('document_requests')
      .update({
        status: 'for_release',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentRequestId);

    if (updateError) {
      console.error('Error updating document request status:', updateError);
    }

    // Insert status history entry
    const { error: historyError } = await supabase
      .from('document_request_status_history')
      .insert({
        document_request_id: documentRequestId,
        from_status: docRequest.status,
        to_status: 'for_release',
        changed_by: callerProfile?.id ?? null,
        notes: 'Document generated and ready for release',
      });

    if (historyError) {
      console.error('Error inserting status history:', historyError);
    }

    return new Response(JSON.stringify(documentMetadata), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
