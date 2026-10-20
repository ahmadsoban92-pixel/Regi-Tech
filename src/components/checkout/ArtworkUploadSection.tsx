import content from "@/content/checkout.json";
import { ORDER_FILE_MAX_BYTES } from "@/lib/formLimits";

type ArtworkUploadSectionProps = {
  error?: string;
  file: File | null;
  inputId?: string;
  plateLabel?: string;
  onFileChange: (file: File | null, error?: string) => void;
};

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/svg+xml"]);

export function ArtworkUploadSection({ error, file, inputId = "order-artwork-upload", onFileChange, plateLabel }: ArtworkUploadSectionProps) {
  return (
    <section className="panel mt-7 p-5">
      <h2 className="text-lg font-semibold">{content.artwork.title}</h2>
      {plateLabel ? <p className="mt-1 text-xs font-semibold text-[var(--accent)]">{plateLabel}</p> : null}
      <p className="mt-2 text-sm text-[var(--muted)]">{content.artwork.body}</p>
      <label className="mt-5 block text-xs font-medium" htmlFor={inputId}>
        {content.artwork.label}
        <input
          accept=".pdf,.jpg,.jpeg,.png,.svg,application/pdf,image/jpeg,image/png,image/svg+xml"
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
              onFileChange(null, content.artwork.typeError);
              event.target.value = "";
              return;
            }
            if (next.size > ORDER_FILE_MAX_BYTES) {
              onFileChange(null, content.artwork.sizeError);
              event.target.value = "";
              return;
            }
            onFileChange(next);
          }}
          type="file"
        />
      </label>
      {file ? <p className="mt-2 text-xs text-[var(--label)]">{content.artwork.selected}: {file.name}</p> : null}
      {error ? <p className="field-error mt-2">{error}</p> : null}
    </section>
  );
}
