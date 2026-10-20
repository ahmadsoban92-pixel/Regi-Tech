import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { ChoiceCard } from "@/components/configurator/ChoiceCard";
import content from "@/content/design.json";
import { CUSTOM_DIMENSION_MAX, REGISTRATION_MAX, ROAD_LEGAL_REGISTRATION_MAX, SLOGAN_MAX, SPECIAL_REQUIREMENTS_MAX } from "@/lib/formLimits";
import type { ConfiguratorFormValues } from "@/lib/orderSchemas";
import type { BorderOption, CountryFlag, CustomDimensionUnit, FixingId, LogoOption, PlateConfiguration, PlateSize, ProductRule, SloganFont } from "@/types/order";

type StepProps = {
  config: PlateConfiguration;
  rule: ProductRule;
  update: (patch: Partial<PlateConfiguration>) => void;
  register: UseFormRegister<ConfiguratorFormValues>;
  setValue: UseFormSetValue<ConfiguratorFormValues>;
  errors: FieldErrors<ConfiguratorFormValues>;
  onUploadedLogoFileChange: (file: File | null) => void;
};

function formatRoadLegalInput(value: string) {
  const canonical = value.replace(/\s+/g, "").toUpperCase();
  return canonical.length > 4 ? `${canonical.slice(0, 4)} ${canonical.slice(4)}` : canonical;
}

export function RegistrationStep({ config, errors, register, rule, setValue, update }: StepProps) {
  const field = register("registration");
  const isRoadLegal = rule.useType === "road-legal";
  const maximum = isRoadLegal ? ROAD_LEGAL_REGISTRATION_MAX : REGISTRATION_MAX;
  const count = isRoadLegal ? config.registration.replace(/\s+/g, "").length : config.registration.length;
  const displayValue = isRoadLegal ? formatRoadLegalInput(config.registration) : config.registration;

  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium" htmlFor="registration"><span>{content.registration.label}</span><span className="text-xs text-[var(--muted)]">{count}/{maximum}</span></label>
      <input
        aria-invalid={Boolean(errors.registration)}
        className="field mt-3"
        id="registration"
        maxLength={isRoadLegal ? ROAD_LEGAL_REGISTRATION_MAX + 1 : REGISTRATION_MAX}
        name={field.name}
        onBlur={field.onBlur}
        onChange={(event) => {
          const next = isRoadLegal ? event.target.value.replace(/\s+/g, "").toUpperCase().slice(0, ROAD_LEGAL_REGISTRATION_MAX) : event.target.value.toUpperCase().slice(0, REGISTRATION_MAX);
          setValue("registration", next, { shouldDirty: true, shouldValidate: true });
          update({ registration: next });
        }}
        placeholder={content.registration.placeholder}
        ref={field.ref}
        value={displayValue}
      />
      {errors.registration ? <p className="field-error mt-2">{errors.registration.message}</p> : <p className="mt-2 text-xs text-[var(--muted)]">{isRoadLegal ? content.registration.roadLegalHint : content.registration.hint}</p>}
    </div>
  );
}

function convertDimension(value: string, from: CustomDimensionUnit, to: CustomDimensionUnit) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || from === to) return value;
  return (from === "in" ? numeric * 2.54 : numeric / 2.54).toFixed(2).replace(/\.00$/, "");
}

export function SizeStep({ config, errors, register, rule, setValue, update }: StepProps) {
  const widthField = register("customWidth");
  const heightField = register("customHeight");
  const options = content.size.options.filter((option) => rule.sizes.includes(option.value as PlateSize));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => <ChoiceCard badge={option.badge} className={option.value === "Custom" ? "sm:col-span-2" : ""} description={option.description} key={option.value} label={option.value} onClick={() => update({ size: option.value as PlateSize })} price={option.price} selected={config.size === option.value} />)}
      {config.size === "Custom" ? (
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <fieldset className="sm:col-span-2"><legend className="mb-2 text-xs font-medium">{content.size.unitLabel}</legend><div className="inline-flex rounded-md border border-[var(--line-strong)] p-1">{content.size.units.map((unit) => <button className={`rounded px-4 py-2 text-xs ${config.customDimensionUnit === unit.value ? "bg-[var(--accent)] text-[var(--foreground-on-light)]" : "text-[var(--muted)]"}`} key={unit.value} onClick={() => { const nextUnit = unit.value as CustomDimensionUnit; const customWidth = convertDimension(config.customWidth, config.customDimensionUnit, nextUnit); const customHeight = convertDimension(config.customHeight, config.customDimensionUnit, nextUnit); setValue("customWidth", customWidth, { shouldDirty: true, shouldValidate: true }); setValue("customHeight", customHeight, { shouldDirty: true, shouldValidate: true }); setValue("customDimensionUnit", nextUnit); update({ customDimensionUnit: nextUnit, customWidth, customHeight }); }} type="button">{unit.label}</button>)}</div></fieldset>
          <label className="text-xs">{content.size.widthLabel} ({config.customDimensionUnit})<input {...widthField} className="field mt-2" inputMode="decimal" maxLength={CUSTOM_DIMENSION_MAX} onChange={(event) => { widthField.onChange(event); update({ customWidth: event.target.value }); }} /></label>
          <label className="text-xs">{content.size.heightLabel} ({config.customDimensionUnit})<input {...heightField} className="field mt-2" inputMode="decimal" maxLength={CUSTOM_DIMENSION_MAX} onChange={(event) => { heightField.onChange(event); update({ customHeight: event.target.value }); }} /></label>
          {errors.customWidth ? <p className="field-error">{errors.customWidth.message}</p> : null}{errors.customHeight ? <p className="field-error">{errors.customHeight.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function BordersStep({ config, rule, update }: StepProps) {
  const groups: Array<{ label: string; key: "innerBorder" | "outerBorder"; options: BorderOption[] }> = [
    { label: content.borders.innerLabel, key: "innerBorder", options: rule.innerBorders },
    { label: content.borders.outerLabel, key: "outerBorder", options: rule.outerBorders },
  ];
  return (
    <div className="space-y-5">
      {groups.filter((group) => group.options.length > 1).map(({ label, key, options }) => (
        <fieldset key={key}><legend className="mb-3 text-sm font-semibold">{label}</legend><div className="grid gap-3 sm:grid-cols-3">{content.borders.options.filter((option) => options.includes(option.value as BorderOption)).map((option) => <ChoiceCard key={option.value} label={option.value} onClick={() => update({ [key]: option.value as BorderOption })} price={option.price} selected={config[key] === option.value} />)}</div></fieldset>
      ))}
    </div>
  );
}

export function LogoStep({ config, errors, onUploadedLogoFileChange, rule, setValue, update }: StepProps) {
  const options = content.logo.options.filter((option) => rule.logos.includes(option.value as LogoOption));
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <ChoiceCard description={option.description} icon={option.icon} key={option.value} label={option.value} onClick={() => { if (option.value !== "Other Logo") onUploadedLogoFileChange(null); update({ logo: option.value as LogoOption, logoPosition: { x: 50, y: 12 }, ...(option.value !== "Other Logo" ? { uploadedLogoName: "", uploadedLogoMimeType: "", uploadedLogoPreviewUrl: "" } : {}) }); }} price={option.price} selected={config.logo === option.value} />)}</div>
      {config.logo === "Other Logo" ? <label className="mt-4 block text-sm font-medium">{content.logo.uploadLabel}<input accept=".png,.jpg,.jpeg,.svg,.pdf" className="field mt-2 file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-[var(--foreground-on-light)]" onChange={(event) => { const file = event.target.files?.[0] ?? null; const fileName = file?.name ?? ""; if (config.uploadedLogoPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(config.uploadedLogoPreviewUrl); const previewUrl = file?.type.startsWith("image/") ? URL.createObjectURL(file) : ""; onUploadedLogoFileChange(file); setValue("uploadedLogoName", fileName, { shouldDirty: true, shouldValidate: true }); update({ uploadedLogoName: fileName, uploadedLogoMimeType: file?.type ?? "", uploadedLogoPreviewUrl: previewUrl, logoPosition: { x: 50, y: 12 } }); }} type="file" /><span className="mt-2 block text-xs text-[var(--muted)]">{content.logo.uploadHint}</span>{config.uploadedLogoName && !config.uploadedLogoPreviewUrl ? <span className="mt-2 block text-xs text-[var(--accent)]">{content.logo.reselectHint}</span> : null}{errors.uploadedLogoName ? <span className="field-error mt-2 block">{errors.uploadedLogoName.message}</span> : null}</label> : null}
      {config.logo !== "No Logo" ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[var(--muted)]">{content.logo.dragHint}</p><button className="secondary-button min-h-8 px-3 py-1 text-xs" onClick={() => update({ logoPosition: { x: 50, y: 12 } })} type="button">{content.logo.resetPosition}</button></div> : null}
    </div>
  );
}

export function SloganStep({ config, errors, register, update }: StepProps) {
  const field = register("sloganText");
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard label={content.slogan.none} onClick={() => update({ sloganMode: "none" })} price={0} selected={config.sloganMode === "none"} />
        <ChoiceCard description={content.slogan.description} label={content.slogan.add} onClick={() => update({ sloganMode: "custom" })} price={content.slogan.price} selected={config.sloganMode === "custom"} />
      </div>
      {config.sloganMode === "custom" ? <div className="mt-5"><label className="flex items-center justify-between text-sm font-medium" htmlFor="slogan"><span>{content.slogan.textLabel}</span><span className="text-xs text-[var(--muted)]">{config.sloganText.length}/{SLOGAN_MAX}</span></label><input {...field} className="field mt-2" id="slogan" maxLength={SLOGAN_MAX} onChange={(event) => { field.onChange(event); update({ sloganText: event.target.value }); }} placeholder={content.slogan.placeholder} />{errors.sloganText ? <p className="field-error mt-2">{errors.sloganText.message}</p> : null}<fieldset className="mt-5"><legend className="mb-3 text-sm font-medium">{content.slogan.fontLabel}</legend><div className="grid gap-3 sm:grid-cols-3">{content.slogan.fonts.map((font) => { const available = font !== "The Scribbler"; const fontClass = font === "The Boss" ? "plate-slogan-font-boss" : font === "Rebel" ? "plate-slogan-font-rebel" : ""; return <button aria-describedby={available ? undefined : `font-${font.replace(/\s+/g, "-").toLowerCase()}-status`} className={`rounded-md border px-3 py-3 text-sm ${config.sloganFont === font ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)]"} ${available ? "" : "cursor-not-allowed text-[var(--muted)]"}`} disabled={!available} key={font} onClick={() => update({ sloganFont: font as SloganFont })} type="button"><span className={`${fontClass} block text-base`}>{font}</span>{available ? null : <span className="mt-1 block text-[0.65rem]" id={`font-${font.replace(/\s+/g, "-").toLowerCase()}-status`}>{content.slogan.fontPending}</span>}</button>; })}</div></fieldset></div> : null}
    </div>
  );
}

export function CountryFlagStep({ config, rule, update }: StepProps) {
  const options = content.countryFlag.options.filter((option) => rule.countryFlags.includes(option.value as CountryFlag));
  return <div><p className="mb-4 text-sm text-[var(--muted)]">{content.countryFlag.description}</p><div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <ChoiceCard icon={option.icon} key={option.value} label={option.label} onClick={() => update({ countryFlag: option.value as CountryFlag })} price={option.price} selected={config.countryFlag === option.value} />)}</div></div>;
}

export function FixingsStep({ config, errors, register, rule, update }: StepProps) {
  const field = register("specialRequirements");
  const options = content.fixings.options.filter((option) => rule.fixings.includes(option.value as FixingId));
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <ChoiceCard description={option.description} key={option.value} label={option.label} onClick={() => update({ fixing: option.value as FixingId })} price={option.price} selected={config.fixing === option.value} />)}</div>
      <label className="mt-5 block text-sm font-medium" htmlFor="special-requirements">{content.fixings.specialLabel}<textarea {...field} className="field mt-2 min-h-24 resize-y" id="special-requirements" maxLength={SPECIAL_REQUIREMENTS_MAX} onChange={(event) => { field.onChange(event); update({ specialRequirements: event.target.value }); }} placeholder={content.fixings.specialPlaceholder} /></label>
      {errors.specialRequirements ? <p className="field-error mt-2">{errors.specialRequirements.message}</p> : null}
    </div>
  );
}
