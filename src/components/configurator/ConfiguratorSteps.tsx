import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { ChoiceCard } from "@/components/configurator/ChoiceCard";
import content from "@/content/design.json";
import { SLOGAN_MAX } from "@/lib/formLimits";
import type { ConfiguratorFormValues } from "@/lib/orderSchemas";
import type { BorderOption, FixingOption, LogoOption, PlateConfiguration, PlateSize, SloganFont } from "@/types/order";

type StepProps = {
  config: PlateConfiguration;
  update: (patch: Partial<PlateConfiguration>) => void;
  register: UseFormRegister<ConfiguratorFormValues>;
  errors: FieldErrors<ConfiguratorFormValues>;
};

export function RegistrationStep({ errors, register, update }: StepProps) {
  const field = register("registration");
  return (
    <div>
      <label className="text-sm font-medium" htmlFor="registration">{content.registration.label}</label>
      <input {...field} aria-invalid={Boolean(errors.registration)} className="field mt-3 uppercase" id="registration" onChange={(event) => { field.onChange(event); update({ registration: event.target.value.toUpperCase() }); }} placeholder={content.registration.placeholder} />
      {errors.registration ? <p className="field-error mt-2">{errors.registration.message}</p> : <p className="mt-2 text-xs text-[var(--muted)]">{content.registration.hint}</p>}
    </div>
  );
}

export function SizeStep({ config, errors, register, update }: StepProps) {
  const widthField = register("customWidth");
  const heightField = register("customHeight");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {content.size.options.map((option) => <ChoiceCard badge={option.badge} className={option.value === "Custom" ? "sm:col-span-2" : ""} description={option.description} key={option.value} label={option.value} onClick={() => update({ size: option.value as PlateSize })} price={option.price} selected={config.size === option.value} />)}
      {config.size === "Custom" ? (
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <label className="text-xs">Width in inches<input {...widthField} className="field mt-2" inputMode="decimal" onChange={(event) => { widthField.onChange(event); update({ customWidth: event.target.value }); }} /></label>
          <label className="text-xs">Height in inches<input {...heightField} className="field mt-2" inputMode="decimal" onChange={(event) => { heightField.onChange(event); update({ customHeight: event.target.value }); }} /></label>
          {errors.customWidth ? <p className="field-error">{errors.customWidth.message}</p> : null}{errors.customHeight ? <p className="field-error">{errors.customHeight.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function BordersStep({ config, update }: StepProps) {
  return (
    <div className="space-y-5">
      {([[content.borders.innerLabel, "innerBorder"], [content.borders.outerLabel, "outerBorder"]] as const).map(([label, key]) => (
        <fieldset key={key}><legend className="mb-3 text-sm font-semibold">{label}</legend><div className="grid gap-3 sm:grid-cols-3">{content.borders.options.map((option) => <ChoiceCard key={option.value} label={option.value} onClick={() => update({ [key]: option.value as BorderOption })} price={option.price} selected={config[key] === option.value} />)}</div></fieldset>
      ))}
    </div>
  );
}

export function LogoStep({ config, errors, setValue, update }: StepProps & { setValue: UseFormSetValue<ConfiguratorFormValues> }) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">{content.logo.options.map((option) => <ChoiceCard description={option.description} icon={option.icon} key={option.value} label={option.value} onClick={() => update({ logo: option.value as LogoOption })} price={option.price} selected={config.logo === option.value} />)}</div>
      {config.logo === "Other Logo" ? <label className="mt-4 block text-sm font-medium">{content.logo.uploadLabel}<input accept=".png,.jpg,.jpeg,.svg,.pdf" className="field mt-2 file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-[var(--foreground-on-light)]" onChange={(event) => { const fileName = event.target.files?.[0]?.name ?? ""; setValue("uploadedLogoName", fileName, { shouldValidate: true }); update({ uploadedLogoName: fileName }); }} type="file" /><span className="mt-2 block text-xs text-[var(--muted)]">{content.logo.uploadHint}</span>{errors.uploadedLogoName ? <span className="field-error mt-2 block">{errors.uploadedLogoName.message}</span> : null}</label> : null}
    </div>
  );
}

export function SloganStep({ config, errors, register, update }: StepProps) {
  const field = register("sloganText");
  return (
    <div>
      <ChoiceCard description={content.slogan.description} label={content.slogan.toggle} onClick={() => update({ sloganEnabled: !config.sloganEnabled })} price={content.slogan.price} selected={config.sloganEnabled} />
      {config.sloganEnabled ? <div className="mt-5"><label className="flex items-center justify-between text-sm font-medium" htmlFor="slogan"><span>{content.slogan.textLabel}</span><span className="text-xs text-[var(--muted)]">{config.sloganText.length}/{SLOGAN_MAX}</span></label><input {...field} className="field mt-2" id="slogan" onChange={(event) => { field.onChange(event); update({ sloganText: event.target.value }); }} placeholder={content.slogan.placeholder} />{errors.sloganText ? <p className="field-error mt-2">{errors.sloganText.message}</p> : null}<fieldset className="mt-5"><legend className="mb-3 text-sm font-medium">{content.slogan.fontLabel}</legend><div className="grid gap-3 sm:grid-cols-3">{content.slogan.fonts.map((font) => <button className={`rounded-md border px-3 py-3 text-sm ${config.sloganFont === font ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)]"}`} key={font} onClick={() => update({ sloganFont: font as SloganFont })} type="button">{font}</button>)}</div></fieldset></div> : null}
    </div>
  );
}

export function FixingsStep({ config, errors, register, update }: StepProps) {
  const field = register("specialRequirements");
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">{content.fixings.options.map((option) => <ChoiceCard description={option.description} key={option.value} label={option.value} onClick={() => update({ fixing: option.value as FixingOption })} price={option.price} selected={config.fixing === option.value} />)}</div>
      <label className="mt-5 block text-sm font-medium" htmlFor="special-requirements">{content.fixings.specialLabel}<textarea {...field} className="field mt-2 min-h-24 resize-y" id="special-requirements" onChange={(event) => { field.onChange(event); update({ specialRequirements: event.target.value }); }} placeholder={content.fixings.specialPlaceholder} /></label>
      {errors.specialRequirements ? <p className="field-error mt-2">{errors.specialRequirements.message}</p> : null}
    </div>
  );
}
