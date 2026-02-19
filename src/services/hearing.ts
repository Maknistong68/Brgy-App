import * as mock from './__mocks__/hearing.mock';
import * as real from './hearing.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  CreateHearingData,
  CreateAttendeeData,
  ServiceResponse,
} from './hearing.real';

// Re-export functions — mock or real based on env var
export const getHearings = USE_MOCK ? mock.getHearings : real.getHearings;
export const getHearingById = USE_MOCK ? mock.getHearingById : real.getHearingById;
export const createHearing = USE_MOCK ? mock.createHearing : real.createHearing;
export const updateHearing = USE_MOCK ? mock.updateHearing : real.updateHearing;
export const addAttendee = USE_MOCK ? mock.addAttendee : real.addAttendee;
export const updateAttendee = USE_MOCK ? mock.updateAttendee : real.updateAttendee;
export const getUpcomingHearings = USE_MOCK ? mock.getUpcomingHearings : real.getUpcomingHearings;
