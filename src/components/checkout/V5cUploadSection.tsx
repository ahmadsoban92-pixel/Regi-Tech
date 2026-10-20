import content from "@/content/checkout.json";
import { ORDER_FILE_MAX_BYTES } from "@/lib/formLimits";

type V5cUploadSectionProps = {
  error?: string;
  file: File | null;
  inputId?: string;
  plateLabel?: string;
  onFileChange: (file: File | null, error?: string) => void;
};

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export function V5cUploadSection({ error, file, inputId = "v5c-upload", onFileChange, plateLabel }: V5cUploadSectionProps) {
  return (
    <section className="panel mt-7 p-5">
      <h2 className="text-lg font-semibold">{content.v5c.title}</h2>
      {plateLabel ? <p className="mt-1 text-xs font-semibold text-[var(--accent)]">{plateLabel}</p> : null}
      <p className="mt-2 text-sm text-[var(--muted)]">{content.v5c.body}</p>
      <label className="mt-5 block text-xs font-medium" htmlFor={inputId}>
        {content.v5c.label}
        <input
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          aria-invalid={Boolean(error)}
          className="field mt-2 file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-[var(--foreground-on-light)]"
          id={inputId}
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            if (!next) {
              onFileChange(null);
              return;
            }
            if (!ALLOWED_TYPES.has(next.type)) {
              onFileChange(null, content.v5c.typeError);
              event.target.value = "";
              return;
            }
            if (next.size > ORDER_FILE_MAX_BYTES) {
              onFileChange(null, content.v5c.sizeError);
              event.target.value = "";
              return;
            }
            onFileChange(next);
          }}
          type="file"
        />
      </label>
      {file ? <p className="mt-2 text-xs text-[var(--label)]">{content.v5c.selected}: {file.name}</p> : null}
      {error ? <p className="field-error mt-2">{error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{content.v5c.privacy}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{content.v5c.dispatch}</p>
    </section>
  );
}
