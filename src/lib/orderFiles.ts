import "server-only";
import { ORDER_FILE_MAX_BYTES, UPLOADED_FILE_NAME_MAX } from "@/lib/formLimits";

export type ValidatedOrderFile = {
  bytes: Buffer;
  extension: "pdf" | "jpg" | "png" | "svg";
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/svg+xml";
  originalName: string;
  size: number;
};

const V5C_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ARTWORK_TYPES = new Set([...V5C_TYPES, "image/svg+xml"]);

function detectMimeType(bytes: Buffer): ValidatedOrderFile["mimeType"] | null {
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  const text = bytes.subarray(0, Math.min(bytes.length, 4096)).toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (/^<\?xml[\s\S]*?<svg\b|^<svg\b/i.test(text)) return "image/svg+xml";
  return null;
}

export async function validateOrderFile(file: File, kind: "v5c" | "artwork"): Promise<ValidatedOrderFile> {
  if (!file.size) throw new Error("The selected file is empty.");
  if (file.size > ORDER_FILE_MAX_BYTES) throw new Error("The selected file must be 10 MB or smaller.");
  if (file.name.length > UPLOADED_FILE_NAME_MAX) throw new Error(`File name must be ${UPLOADED_FILE_NAME_MAX} characters or fewer.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMimeType(bytes);
  const allowed = kind === "v5c" ? V5C_TYPES : ARTWORK_TYPES;
  if (!mimeType || !allowed.has(mimeType)) {
    throw new Error(kind === "v5c" ? "Upload a PDF, JPG or PNG V5C document." : "Upload PNG, JPG, SVG or PDF artwork.");
  }
  const extension = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/svg+xml": "svg" }[mimeType] as ValidatedOrderFile["extension"];
  return { bytes, extension, mimeType, originalName: file.name, size: file.size };
}
