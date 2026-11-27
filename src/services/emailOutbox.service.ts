import "server-only";

import {
  buildContactAlertMessage,
  buildDispatchMessage,
  buildOrderConfirmationMessage,
  messageIdForDeduplicationKey,
  type ContactEmailInput,
  type EmailMessage,
  type OrderEmailInput,
} from "@/lib/emailMessages";
import {
  EMAIL_OUTBOX_KINDS,
  EMAIL_OUTBOX_STATUSES,
  isTerminalEmailAttempt,
  type EmailOutboxKind,
  type EmailOutboxRow,
  type EmailOutboxStatus,
} from "@/lib/emailOutbox";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { classifyEmailError, sendEmailMessage } from "@/services/emailTransport.service";

export type OrderEmailRecord = OrderEmailInput & {
  carrier: string;
  trackingReference: string;
  dispatchedAt: string | null;
};

export type EmailOutboxRepository = {
  claim(limit: number): Promise<EmailOutboxRow[]>;
  loadOrder(entityId: string): Promise<OrderEmailRecord | null>;
  loadContact(entityId: string): Promise<ContactEmailInput | null>;
  complete(outboxId: string): Promise<boolean>;
  fail(outboxId: string, safeMessage: string, permanent: boolean): Promise<boolean>;
};

export type EmailOutboxResult = { claimed: number; sent: number; retrying: number; failed: number };

type EmailOutboxLogger = {
  info(message: string, context: Record<string, unknown>): void;
  warn(message: string, context: Record<string, unknown>): void;
};

const defaultLogger: EmailOutboxLogger = {
  info: (message, context) => console.info(message, context),
  warn: (message, context) => console.warn(message, context),
};

class MissingEmailSourceError extends Error {}

function validKind(value: string): value is EmailOutboxKind {
  return EMAIL_OUTBOX_KINDS.includes(value as EmailOutboxKind);
}

function validStatus(value: string): value is EmailOutboxStatus {
  return EMAIL_OUTBOX_STATUSES.includes(value as EmailOutboxStatus);
}

function mapOutboxRow(row: {
  id: string;
  kind: string;
  entity_id: string;
  deduplication_key: string;
  status: string;
  attempt_count: number;
  next_attempt_at: string;
  processing_started_at: string | null;
  sent_at: string | null;
  last_error: string;
  created_at: string;
  updated_at: string;
}): EmailOutboxRow {
  if (!validKind(row.kind) || !validStatus(row.status)) throw new Error("Email outbox contains an unsupported value.");
  return {
    id: row.id,
    kind: row.kind,
    entityId: row.entity_id,
    deduplicationKey: row.deduplication_key,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    processingStartedAt: row.processing_started_at,
    sentAt: row.sent_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const emailOutboxRepository: EmailOutboxRepository = {
  async claim(limit) {
    const { data, error } = await getSupabaseAdmin().rpc("claim_email_outbox", { p_limit: limit });
    if (error) throw new Error("Unable to claim queued emails.");
    return (data ?? []).map(mapOutboxRow);
  },

  async loadOrder(entityId) {
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,reference,customer,subtotal_pence,delivery_pence,discount_pence,total_pence,created_at,carrier,tracking_reference,dispatched_at")
      .eq("id", entityId)
      .maybeSingle();
    if (error) throw new Error("Unable to load the queued order.");
    if (!order) return null;
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("configuration,quantity,line_total_pence")
      .eq("order_id", entityId)
      .order("position", { ascending: true });
    if (itemsError) throw new Error("Unable to load queued order items.");
    const customer = record(order.customer);
    return {
      reference: order.reference,
      customer: {
        firstName: text(customer.firstName),
        lastName: text(customer.lastName),
        email: text(customer.email),
      },
      items: (items ?? []).map((item) => {
        const configuration = record(item.configuration);
        return {
          productName: text(configuration.productName) || "Motorcycle plate",
          registration: text(configuration.registration),
          quantity: item.quantity,
          lineTotalPence: item.line_total_pence,
          useType: text(configuration.useType),
        };
      }),
      subtotalPence: order.subtotal_pence,
      deliveryPence: order.delivery_pence,
      discountPence: order.discount_pence,
      totalPence: order.total_pence,
      createdAt: order.created_at,
      carrier: order.carrier,
      trackingReference: order.tracking_reference,
      dispatchedAt: order.dispatched_at,
    };
  },

  async loadContact(entityId) {
    const { data, error } = await getSupabaseAdmin()
      .from("contact_submissions")
      .select("id,name,email,order_reference,message,created_at")
      .eq("id", entityId)
      .maybeSingle();
    if (error) throw new Error("Unable to load the queued Contact submission.");
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      orderReference: data.order_reference,
      message: data.message,
      createdAt: data.created_at,
    };
  },

  async complete(outboxId) {
    const { data, error } = await getSupabaseAdmin().rpc("complete_email_outbox", { p_id: outboxId });
    if (error) throw new Error("Unable to complete the queued email.");
    return data;
  },

  async fail(outboxId, safeMessage, permanent) {
    const { data, error } = await getSupabaseAdmin().rpc("fail_email_outbox", {
      p_id: outboxId,
      p_error: safeMessage,
      p_permanent: permanent,
    });
    if (error) throw new Error("Unable to record the queued email failure.");
    return data;
  },
};

async function renderMessage(repository: EmailOutboxRepository, row: EmailOutboxRow): Promise<EmailMessage> {
  let message: EmailMessage;
  if (row.kind === "contact_alert") {
    const contact = await repository.loadContact(row.entityId);
    if (!contact) throw new MissingEmailSourceError();
    message = buildContactAlertMessage(contact);
  } else {
    const order = await repository.loadOrder(row.entityId);
    if (!order) throw new MissingEmailSourceError();
    if (row.kind === "order_confirmation") {
      message = buildOrderConfirmationMessage(order);
    } else {
      if (!order.dispatchedAt) throw new MissingEmailSourceError();
      message = buildDispatchMessage({
        reference: order.reference,
        customer: order.customer,
        carrier: order.carrier,
        trackingReference: order.trackingReference,
        dispatchedAt: order.dispatchedAt,
      });
    }
  }
  return { ...message, messageId: messageIdForDeduplicationKey(row.deduplicationKey) };
}

export function createEmailOutboxProcessor(
  repository: EmailOutboxRepository,
  sender: (message: EmailMessage) => Promise<void>,
  logger: EmailOutboxLogger = defaultLogger,
) {
  return async ({ limit = 10 }: { limit?: number } = {}): Promise<EmailOutboxResult> => {
    const rows = await repository.claim(limit);
    const result: EmailOutboxResult = { claimed: rows.length, sent: 0, retrying: 0, failed: 0 };
    for (const row of rows) {
      try {
        const message = await renderMessage(repository, row);
        await sender(message);
        await repository.complete(row.id);
        result.sent += 1;
        logger.info("Transactional email sent", { outboxId: row.id, kind: row.kind, attemptCount: row.attemptCount });
      } catch (error) {
        const failure = error instanceof MissingEmailSourceError
          ? { permanent: true, safeMessage: "Email source record is unavailable." }
          : classifyEmailError(error);
        const permanent = failure.permanent || isTerminalEmailAttempt(row.attemptCount);
        await repository.fail(row.id, failure.safeMessage, permanent);
        if (permanent) result.failed += 1;
        else result.retrying += 1;
        logger.warn("Transactional email delivery failed", {
          outboxId: row.id,
          kind: row.kind,
          attemptCount: row.attemptCount,
          error: failure.safeMessage,
          permanent,
        });
      }
    }
    return result;
  };
}

const productionProcessor = createEmailOutboxProcessor(emailOutboxRepository, sendEmailMessage);

export async function processEmailOutbox(options: { limit?: number } = {}) {
  return productionProcessor(options);
}
