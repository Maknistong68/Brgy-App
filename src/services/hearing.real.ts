import { supabase } from '@/lib/supabase';
import type {
  Hearing,
  HearingWithRelations,
  HearingAttendee,
  Profile,
} from '@/types';
import { HearingStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateHearingData {
  complaint_id: string;
  barangay_id: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  presiding_officer_id: string;
  notes?: string;
}

export interface CreateAttendeeData {
  hearing_id: string;
  profile_id: string;
  role: string;
  is_present?: boolean;
  remarks?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Hearings
// ---------------------------------------------------------------------------

/**
 * List all hearings for a specific complaint, ordered by scheduled date.
 */
export async function getHearings(
  complaintId: string,
): Promise<ServiceResponse<HearingWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('hearings')
      .select(
        `
        *,
        presiding_officer:profiles!presiding_officer_id (
          id, first_name, last_name, avatar_url, role
        )
      `,
      )
      .eq('complaint_id', complaintId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as HearingWithRelations[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a single hearing with its presiding officer and attendees.
 */
export async function getHearingById(
  id: string,
): Promise<ServiceResponse<HearingWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('hearings')
      .select(
        `
        *,
        presiding_officer:profiles!presiding_officer_id (
          id, first_name, last_name, avatar_url, role
        ),
        attendees:hearing_attendees (
          *,
          profile:profiles!profile_id (
            id, first_name, last_name, avatar_url
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as HearingWithRelations, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new hearing.
 */
export async function createHearing(
  input: CreateHearingData,
): Promise<ServiceResponse<Hearing>> {
  try {
    const { data, error } = await supabase
      .from('hearings')
      .insert({
        complaint_id: input.complaint_id,
        barangay_id: input.barangay_id,
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time,
        venue: input.venue,
        presiding_officer_id: input.presiding_officer_id,
        notes: input.notes ?? null,
        status: HearingStatus.SCHEDULED,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Hearing, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update fields on an existing hearing.
 */
export async function updateHearing(
  id: string,
  updates: Partial<Hearing>,
): Promise<ServiceResponse<Hearing>> {
  try {
    const { data, error } = await supabase
      .from('hearings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Hearing, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Attendees
// ---------------------------------------------------------------------------

/**
 * Add an attendee to a hearing.
 */
export async function addAttendee(
  hearingId: string,
  input: Omit<CreateAttendeeData, 'hearing_id'>,
): Promise<ServiceResponse<HearingAttendee>> {
  try {
    const { data, error } = await supabase
      .from('hearing_attendees')
      .insert({
        hearing_id: hearingId,
        profile_id: input.profile_id,
        role: input.role,
        is_present: input.is_present ?? false,
        remarks: input.remarks ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as HearingAttendee, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing attendee record (e.g. mark attendance).
 */
export async function updateAttendee(
  id: string,
  updates: Partial<HearingAttendee>,
): Promise<ServiceResponse<HearingAttendee>> {
  try {
    const { data, error } = await supabase
      .from('hearing_attendees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as HearingAttendee, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Upcoming Hearings
// ---------------------------------------------------------------------------

/**
 * Return all future scheduled hearings for a barangay, including the
 * presiding officer profile.
 */
export async function getUpcomingHearings(
  barangayId: string,
): Promise<ServiceResponse<HearingWithRelations[]>> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('hearings')
      .select(
        `
        *,
        presiding_officer:profiles!presiding_officer_id (
          id, first_name, last_name, avatar_url, role
        ),
        complaint:complaints!complaint_id (
          id, reference_number, respondent_name, category
        )
      `,
      )
      .eq('barangay_id', barangayId)
      .eq('status', HearingStatus.SCHEDULED)
      .gt('scheduled_date', now)
      .order('scheduled_date', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as HearingWithRelations[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
