import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardParams {
  barangayId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  role?: string;
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

    const { barangayId, dateRange, role } = (await req.json()) as DashboardParams;

    if (!barangayId) {
      return new Response(JSON.stringify({ error: 'barangayId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startDate = dateRange?.start || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    // Complaint counts by status
    const { data: complaintsByStatus, error: complaintsError } = await supabase
      .from('complaints')
      .select('status')
      .eq('barangay_id', barangayId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (complaintsError) {
      console.error('Error fetching complaints:', complaintsError);
    }

    const complaintCounts: Record<string, number> = {};
    (complaintsByStatus || []).forEach((c: any) => {
      complaintCounts[c.status] = (complaintCounts[c.status] || 0) + 1;
    });

    // Document request counts by status
    const { data: documentsByStatus, error: documentsError } = await supabase
      .from('document_requests')
      .select('status')
      .eq('barangay_id', barangayId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
    }

    const documentCounts: Record<string, number> = {};
    (documentsByStatus || []).forEach((d: any) => {
      documentCounts[d.status] = (documentCounts[d.status] || 0) + 1;
    });

    // Monthly trends - complaints created per month
    const { data: monthlyComplaints, error: monthlyComplaintsError } = await supabase
      .from('complaints')
      .select('created_at')
      .eq('barangay_id', barangayId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (monthlyComplaintsError) {
      console.error('Error fetching monthly complaints:', monthlyComplaintsError);
    }

    const monthlyTrends: Record<string, { complaints: number; documents: number }> = {};
    (monthlyComplaints || []).forEach((c: any) => {
      const month = c.created_at.substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) monthlyTrends[month] = { complaints: 0, documents: 0 };
      monthlyTrends[month].complaints++;
    });

    // Monthly trends - document requests created per month
    const { data: monthlyDocuments, error: monthlyDocumentsError } = await supabase
      .from('document_requests')
      .select('created_at')
      .eq('barangay_id', barangayId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (monthlyDocumentsError) {
      console.error('Error fetching monthly documents:', monthlyDocumentsError);
    }

    (monthlyDocuments || []).forEach((d: any) => {
      const month = d.created_at.substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) monthlyTrends[month] = { complaints: 0, documents: 0 };
      monthlyTrends[month].documents++;
    });

    // Resolution metrics - average resolution time for resolved complaints
    const { data: resolvedComplaints, error: resolvedError } = await supabase
      .from('complaints')
      .select('created_at, resolved_at')
      .eq('barangay_id', barangayId)
      .eq('status', 'resolved')
      .not('resolved_at', 'is', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (resolvedError) {
      console.error('Error fetching resolved complaints:', resolvedError);
    }

    let avgResolutionTimeHours = 0;
    const resolved = resolvedComplaints || [];
    if (resolved.length > 0) {
      const totalHours = resolved.reduce((sum: number, c: any) => {
        const created = new Date(c.created_at).getTime();
        const resolvedAt = new Date(c.resolved_at).getTime();
        return sum + (resolvedAt - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionTimeHours = Math.round((totalHours / resolved.length) * 10) / 10;
    }

    // Top complaint categories
    const { data: categoryCounts, error: categoryError } = await supabase
      .from('complaints')
      .select('category')
      .eq('barangay_id', barangayId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
    }

    const categoryMap: Record<string, number> = {};
    (categoryCounts || []).forEach((c: any) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Total counts
    const totalComplaints = complaintsByStatus?.length || 0;
    const totalDocuments = documentsByStatus?.length || 0;
    const totalResolved = resolved.length;

    const stats = {
      summary: {
        totalComplaints,
        totalDocuments,
        totalResolved,
        resolutionRate: totalComplaints > 0
          ? Math.round((totalResolved / totalComplaints) * 100)
          : 0,
      },
      complaintsByStatus: complaintCounts,
      documentsByStatus: documentCounts,
      monthlyTrends,
      resolutionMetrics: {
        averageResolutionTimeHours: avgResolutionTimeHours,
        totalResolved,
        totalPending: (complaintCounts['pending'] || 0) + (complaintCounts['in_progress'] || 0),
      },
      topCategories,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
