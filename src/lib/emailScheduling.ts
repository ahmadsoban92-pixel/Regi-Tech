import "server-only";

import { after } from "next/server";

import { processEmailOutbox, type EmailOutboxResult } from "@/services/emailOutbox.service";

type AfterScheduler = (callback: () => Promise<void>) => void;
type EmailProcessor = (options: { limit: number }) => Promise<EmailOutboxResult>;
type SchedulingLogger = { warn(message: string): void };

export function createEmailOutboxScheduler(
  scheduleAfter: AfterScheduler,
  processor: EmailProcessor,
  logger: SchedulingLogger,
) {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    scheduleAfter(async () => {
      try {
        await processor({ limit: 5 });
      } catch {
        logger.warn("Background email processing failed.");
      } finally {
        scheduled = false;
      }
    });
  };
}

export const scheduleEmailOutboxProcessing = createEmailOutboxScheduler(
  after,
  processEmailOutbox,
  { warn: (message) => console.warn(message) },
);
