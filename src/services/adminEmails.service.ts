import "server-only";

import {
  EMAIL_OUTBOX_KINDS,
  EMAIL_OUTBOX_STATUSES,
  type EmailOutboxKind,
  type EmailOutboxStatus,
} from "@/lib/emailOutbox";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type AdminEmailRow = {
  id: string;
  kind: EmailOutboxKind;
  entityId: string;
  status: EmailOutboxStatus;
  attemptCount: number;
  nextAttemptAt: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  reference: string;
};

export type AdminEmailFilters = {
  status: EmailOutboxStatus | "all";
  kind: EmailOutboxKind | "all";
  page: number;
};

type RepositoryListFilters = Omit<AdminEmailFilters, "page"> & { offset: number; limit: number };

export type AdminEmailRepository = {
  list(filters: RepositoryListFilters): Promise<{ rows: AdminEmailRow[]; total: number }>;
  getStatus(id: string): Promise<EmailOutboxStatus | null>;
  retry(id: string): Promise<boolean>;
};

function validKind(value: string): value is EmailOutboxKind {
  return EMAIL_OUTBOX_KINDS.includes(value as EmailOutboxKind);
}

function validStatus(value: string): value is EmailOutboxStatus {
  return EMAIL_OUTBOX_STATUSES.includes(value as EmailOutboxStatus);
}

export const adminEmailRepository: AdminEmailRepository = {
  async list(filters) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("email_outbox")
      .select("id,kind,entity_id,status,attempt_count,next_attempt_at,last_error,created_at,updated_at,sent_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);
    if (filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.kind !== "all") query = query.eq("kind", filters.kind);
    const { data, error, count } = await query;
    if (error) throw new Error("Unable to load email delivery records.");
    const orderIds = (data ?? [])
      .filter((item) => item.kind !== "contact_alert")
      .map((item) => item.entity_id);
    const references = new Map<string, string>();
    if (orderIds.length) {
      const orders = await supabase.from("orders").select("id,reference").in("id", orderIds);
      if (orders.error) throw new Error("Unable to load email order references.");
      for (const order of orders.data ?? []) references.set(order.id, order.reference);
    }
    const rows = (data ?? []).flatMap((item): AdminEmailRow[] => {
      if (!validKind(item.kind) || !validStatus(item.status)) return [];
      return [{
        id: item.id,
        kind: item.kind,
        entityId: item.entity_id,
        status: item.status,
        attemptCount: item.attempt_count,
        nextAttemptAt: item.next_attempt_at,
        lastError: item.last_error,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        sentAt: item.sent_at,
        reference: references.get(item.entity_id) ?? (item.kind === "contact_alert" ? `Contact ${item.entity_id.slice(0, 8)}` : "Unavailable order"),
      }];
    });
    return { rows, total: count ?? 0 };
  },

  async getStatus(id) {
    const { data, error } = await getSupabaseAdmin().from("email_outbox").select("status").eq("id", id).maybeSingle();
    if (error) throw new Error("Unable to load this email delivery.");
    return data && validStatus(data.status) ? data.status : null;
  },

  async retry(id) {
    const { data, error } = await getSupabaseAdmin().rpc("retry_email_outbox", { p_id: id });
    if (error) throw new Error("Unable to retry this email.");
    return data;
  },
};

export function createAdminEmailsService(repository: AdminEmailRepository) {
  return {
    async list(filters: AdminEmailFilters) {
      const pageSize = 25;
      const requestedPage = Math.max(1, Math.floor(filters.page) || 1);
      const result = await repository.list({
        status: filters.status,
        kind: filters.kind,
        offset: (requestedPage - 1) * pageSize,
        limit: pageSize,
      });
      const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
      return {
        deliveries: result.rows,
        total: result.total,
        page: Math.min(requestedPage, totalPages),
        pageSize,
        totalPages,
      };
    },

    async retry(id: string) {
      const status = await repository.getStatus(id);
      if (status !== "retry" && status !== "failed") {
        throw new Error("This email cannot be retried in its current state.");
      }
      if (!await repository.retry(id)) throw new Error("Unable to retry this email.");
    },
  };
}

const adminEmailsService = createAdminEmailsService(adminEmailRepository);

export const listEmailDeliveries = adminEmailsService.list;
export const retryEmailDelivery = adminEmailsService.retry;
