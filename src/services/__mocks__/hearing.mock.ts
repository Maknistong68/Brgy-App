import type {
  Hearing,
  HearingWithRelations,
  HearingAttendee,
  Profile,
} from '@/types';
import { HearingStatus } from '@/types';
import type {
  CreateHearingData,
  CreateAttendeeData,
  ServiceResponse,
} from '../hearing.real';
import {
  hearings,
  hearingAttendees,
  complaints,
  profilesById,
  MOCK_BARANGAY_ID,
  delay,
} from './mockDataStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function attachRelations(h: Hearing): HearingWithRelations {
  const presiding_officer = profilesById.get(h.presiding_officer_id);
  const attendees = Array.from(hearingAttendees.values())
    .filter((a) => a.hearing_id === h.id)
    .map((a) => ({ ...a, profile: profilesById.get(a.profile_id) }));
  const complaint = complaints.get(h.complaint_id);
  return { ...h, presiding_officer, attendees, complaint } as HearingWithRelations;
}

let hearingCounter = hearings.size;

// ---------------------------------------------------------------------------
// Hearings
// ---------------------------------------------------------------------------

export async function getHearings(
  complaintId: string,
): Promise<ServiceResponse<HearingWithRelations[]>> {
  await delay(200);
  const items = Array.from(hearings.values())
    .filter((h) => h.complaint_id === complaintId)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .map(attachRelations);
  return { data: items, error: null };
}

export async function getHearingById(
  id: string,
): Promise<ServiceResponse<HearingWithRelations>> {
  await delay(200);
  const h = hearings.get(id);
  if (!h) return { data: null, error: new Error('Hearing not found') };
  return { data: attachRelations(h), error: null };
}

export async function createHearing(
  input: CreateHearingData,
): Promise<ServiceResponse<Hearing>> {
  await delay(300);
  hearingCounter++;
  const now = new Date().toISOString();
  const hearing: Hearing = {
    id: `hearing-new-${hearingCounter}`,
    complaint_id: input.complaint_id,
    barangay_id: input.barangay_id,
    scheduled_date: input.scheduled_date,
    scheduled_time: input.scheduled_time,
    venue: input.venue,
    presiding_officer_id: input.presiding_officer_id,
    notes: input.notes ?? undefined,
    status: HearingStatus.SCHEDULED,
    created_at: now,
    updated_at: now,
  };
  hearings.set(hearing.id, hearing);
  return { data: { ...hearing }, error: null };
}

export async function updateHearing(
  id: string,
  updates: Partial<Hearing>,
): Promise<ServiceResponse<Hearing>> {
  await delay(200);
  const h = hearings.get(id);
  if (!h) return { data: null, error: new Error('Hearing not found') };
  Object.assign(h, updates, { updated_at: new Date().toISOString() });
  return { data: { ...h }, error: null };
}

// ---------------------------------------------------------------------------
// Attendees
// ---------------------------------------------------------------------------

export async function addAttendee(
  hearingId: string,
  input: Omit<CreateAttendeeData, 'hearing_id'>,
): Promise<ServiceResponse<HearingAttendee>> {
  await delay(200);
  const now = new Date().toISOString();
  const attendee: HearingAttendee = {
    id: `ha-new-${Date.now()}`,
    hearing_id: hearingId,
    profile_id: input.profile_id,
    role: input.role,
    is_present: input.is_present ?? false,
    remarks: input.remarks ?? undefined,
    created_at: now,
    updated_at: now,
  };
  hearingAttendees.set(attendee.id, attendee);
  return { data: { ...attendee }, error: null };
}

export async function updateAttendee(
  id: string,
  updates: Partial<HearingAttendee>,
): Promise<ServiceResponse<HearingAttendee>> {
  await delay(200);
  const a = hearingAttendees.get(id);
  if (!a) return { data: null, error: new Error('Attendee not found') };
  Object.assign(a, updates, { updated_at: new Date().toISOString() });
  return { data: { ...a }, error: null };
}

// ---------------------------------------------------------------------------
// Upcoming Hearings
// ---------------------------------------------------------------------------

export async function getUpcomingHearings(
  barangayId: string,
): Promise<ServiceResponse<HearingWithRelations[]>> {
  await delay(200);
  const now = new Date().toISOString();
  const items = Array.from(hearings.values())
    .filter(
      (h) =>
        h.barangay_id === barangayId &&
        h.status === HearingStatus.SCHEDULED &&
        h.scheduled_date > now,
    )
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .map(attachRelations);
  return { data: items, error: null };
}
