import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { AuditEvent } from '../types';
import { Pagination } from '../utils/pagination';

export interface AuditEventInput {
  eventType: string;
  sessionId?: string | null;
  memberId?: string | null;
  actorId?: string | null;
  actorType?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action: string;
  payload?: unknown;
  ipAddress?: string | null;
}

/**
 * Append an audit event. Audit logging must never break the primary request,
 * so failures are swallowed and logged rather than thrown.
 */
export async function logEvent(input: AuditEventInput): Promise<AuditEvent | null> {
  const row = {
    event_type: input.eventType,
    session_id: input.sessionId ?? null,
    member_id: input.memberId ?? null,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? null,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    action: input.action,
    payload: input.payload ?? null,
    ip_address: input.ipAddress ?? null,
  };

  const { data, error } = await supabase.from('audit_events').insert(row).select().single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write event', input.action, error.message);
    return null;
  }
  return data as AuditEvent;
}

/** Insert an audit event and surface failures (used by POST /audit/events). */
export async function createEvent(input: AuditEventInput): Promise<AuditEvent> {
  const event = await logEvent(input);
  if (!event) throw AppError.internal('Failed to record audit event');
  return event;
}

export interface AuditFilters {
  actorId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
  eventType?: string;
}

export async function listEvents(
  filters: AuditFilters,
  pagination: Pagination
): Promise<{ items: AuditEvent[]; total: number }> {
  let query = supabase
    .from('audit_events')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (filters.actorId) query = query.eq('actor_id', filters.actorId);
  if (filters.sessionId) query = query.eq('session_id', filters.sessionId);
  if (filters.eventType) query = query.eq('event_type', filters.eventType);
  if (filters.from) query = query.gte('timestamp', filters.from);
  if (filters.to) query = query.lte('timestamp', filters.to);

  const { data, error, count } = await query.range(pagination.from, pagination.to);
  if (error) throw AppError.internal(`Failed to list audit events: ${error.message}`);

  return { items: (data as AuditEvent[]) ?? [], total: count ?? 0 };
}
