/**
 * Google Calendar Sync Service
 *
 * No calendar connector is wired. The previous transport shelled out to a
 * hosting-vendor command-line tool that no longer exists on this host (and
 * was removed on 23 Sep 2026), so every call now fails with a clear
 * "not configured" error and callers keep their local DB copy of meetings.
 */

export class CalendarNotConfiguredError extends Error {
  constructor() {
    super("Calendar sync is not configured on this host.");
    this.name = "CalendarNotConfiguredError";
  }
}

async function mcpCall(toolName: string, _input: Record<string, any>): Promise<any> {
  void toolName;
  throw new CalendarNotConfiguredError();
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: string; // RFC3339
  endTime: string;   // RFC3339
  attendees?: string[];
  reminders?: number[];
  calendarId?: string;
}

export async function searchCalendarEvents(opts: {
  query?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
}): Promise<any> {
  const input: Record<string, any> = {};
  if (opts.query) input.query = opts.query;
  if (opts.timeMin) input.time_min = opts.timeMin;
  if (opts.timeMax) input.time_max = opts.timeMax;
  if (opts.maxResults) input.max_results = opts.maxResults;
  if (opts.calendarId) input.calendar_id = opts.calendarId;
  return mcpCall("google_calendar_search_events", input);
}

export async function createCalendarEvent(event: CalendarEvent): Promise<any> {
  const eventData: Record<string, any> = {
    summary: event.summary,
    start_time: event.startTime,
    end_time: event.endTime,
  };
  if (event.description) eventData.description = event.description;
  if (event.location) eventData.location = event.location;
  if (event.attendees?.length) eventData.attendees = event.attendees;
  if (event.reminders?.length) eventData.reminders = event.reminders;
  if (event.calendarId) eventData.calendar_id = event.calendarId;

  return mcpCall("google_calendar_create_events", {
    events: [eventData],
  });
}

export async function getCalendarEvent(eventId: string, calendarId?: string): Promise<any> {
  const input: Record<string, any> = { event_id: eventId };
  if (calendarId) input.calendar_id = calendarId;
  return mcpCall("google_calendar_get_event", input);
}

export async function updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<any> {
  const input: Record<string, any> = { event_id: eventId };
  if (updates.summary) input.summary = updates.summary;
  if (updates.startTime) input.start_time = updates.startTime;
  if (updates.endTime) input.end_time = updates.endTime;
  if (updates.description) input.description = updates.description;
  if (updates.location) input.location = updates.location;
  if (updates.attendees) input.attendees = updates.attendees;
  if (updates.calendarId) input.calendar_id = updates.calendarId;
  return mcpCall("google_calendar_update_events", input);
}

export async function deleteCalendarEvent(eventId: string, calendarId?: string): Promise<any> {
  const input: Record<string, any> = { event_id: eventId };
  if (calendarId) input.calendar_id = calendarId;
  return mcpCall("google_calendar_delete_events", input);
}

/**
 * Sync meetings from the local DB to Google Calendar.
 * Creates events for meetings that don't have a Google Calendar event ID.
 */
export async function syncMeetingsToCalendar(meetings: any[]): Promise<{
  synced: number;
  failed: number;
  results: Array<{ meetingId: number; status: string; googleEventId?: string }>;
}> {
  const results: Array<{ meetingId: number; status: string; googleEventId?: string }> = [];
  let synced = 0;
  let failed = 0;

  for (const meeting of meetings) {
    if (meeting.googleEventId) {
      results.push({ meetingId: meeting.id, status: "already_synced", googleEventId: meeting.googleEventId });
      continue;
    }

    try {
      const result = await createCalendarEvent({
        summary: meeting.title || meeting.subject || `Meeting with ${meeting.clientName || "Client"}`,
        description: meeting.notes || meeting.description || "",
        location: meeting.location || "",
        startTime: new Date(meeting.startTime || meeting.scheduledAt).toISOString(),
        endTime: new Date(meeting.endTime || new Date(meeting.scheduledAt).getTime() + 3600000).toISOString(),
        attendees: meeting.attendeeEmails || [],
      });
      synced++;
      results.push({ meetingId: meeting.id, status: "synced", googleEventId: result?.id || result?.events?.[0]?.id });
    } catch (e) {
      failed++;
      results.push({ meetingId: meeting.id, status: "failed" });
    }
  }

  return { synced, failed, results };
}
