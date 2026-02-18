import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateDocumentPayload {
  documentRequestId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { documentRequestId } = (await req.json()) as GenerateDocumentPayload;

    if (!documentRequestId) {
      return new Response(
        JSON.stringify({ error: 'documentRequestId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the document request with related data
    const { data: docRequest, error: requestError } = await supabase
      .from('document_requests')
      .select(`
        *,
        requestor:profiles!document_requests_requestor_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          date_of_birth,
          civil_status
        ),
        barangay:barangays!document_requests_barangay_id_fkey(
          id,
          name,
          municipality,
          province,
          region
        )
      `)
      .eq('id', documentRequestId)
      .single();

    if (requestError) {
      console.error('Error fetching document request:', requestError);
      return new Response(
        JSON.stringify({ error: `Document request not found: ${requestError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Document type configurations
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
      business_permit: {
        title: 'Barangay Business Permit',
        description: 'Permit for operating a business within the barangay.',
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

    // Build document metadata
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
      // Placeholder: In production, this would be the URL to the generated PDF
      pdfUrl: null,
      message: 'PDF generation is a placeholder. Integrate a PDF library (e.g., pdf-lib, puppeteer) for actual document generation.',
    };

    // Update the document request status to indicate document was generated
    const { error: updateError } = await supabase
      .from('document_requests')
      .update({
        status: 'ready_for_pickup',
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
        to_status: 'ready_for_pickup',
        changed_by: null, // System action
        notes: 'Document generated and ready for pickup',
      });

    if (historyError) {
      console.error('Error inserting status history:', historyError);
    }

    return new Response(JSON.stringify(documentMetadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
