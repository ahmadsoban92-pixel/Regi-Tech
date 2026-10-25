"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { ConfiguratorIntro } from "@/components/configurator/ConfiguratorIntro";
import { ConfiguratorPreview } from "@/components/configurator/ConfiguratorPreview";
import { BordersStep, CountryFlagStep, FixingsStep, LogoStep, RegistrationStep, SizeStep, SloganStep } from "@/components/configurator/ConfiguratorSteps";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import { PriceSummary } from "@/components/order/PriceSummary";
import content from "@/content/design.json";
import { createConfiguratorSchema, type ConfiguratorFormValues } from "@/lib/orderSchemas";
import { getProductRule } from "@/lib/productCatalog";
import type { ConfiguratorStepKey, PlateConfiguration } from "@/types/order";

export function PlateConfigurator({ productId, startFresh = false }: { productId: string; startFresh?: boolean }) {
  const { addOrUpdateCartItem, beginNewPlate, config, editingItemId, editorRevision, selectProduct, setCartOpen, setConfig, setUploadedLogoFile, uploadedLogoFile } = useOrderFlow();
  const rule = getProductRule(productId);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [cartError, setCartError] = useState("");
  const reduceMotion = useReducedMotion();
  const currentStep = rule.steps[stepIndex] ?? rule.steps[0];
  const { formState: { errors }, handleSubmit, register, reset, setError, setValue, trigger } = useForm<ConfiguratorFormValues>({
    resolver: zodResolver(createConfiguratorSchema(rule.useType)),
    defaultValues: {
      registration: config.registration,
      customWidth: config.customWidth,
      customHeight: config.customHeight,
      customDimensionUnit: config.customDimensionUnit,
      uploadedLogoName: config.uploadedLogoName,
      sloganText: config.sloganText,
      specialRequirements: config.specialRequirements,
    },
  });

  useEffect(() => {
    if (startFresh && !editingItemId) beginNewPlate(productId);
    else selectProduct(productId);
    setStepIndex(0);
  }, [beginNewPlate, editingItemId, productId, selectProduct, startFresh]);

  useEffect(() => {
    reset({
      registration: config.registration,
      customWidth: config.customWidth,
      customHeight: config.customHeight,
      customDimensionUnit: config.customDimensionUnit,
      uploadedLogoName: config.uploadedLogoName,
      sloganText: config.sloganText,
      specialRequirements: config.specialRequirements,
    });
  }, [editorRevision, reset]);

  function update(patch: Partial<PlateConfiguration>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  async function validateCurrentStep() {
    if (currentStep === "registration") return trigger("registration");
    if (currentStep === "size" && config.size === "Custom") {
      const valid = await trigger(["customWidth", "customHeight"]);
      if (!config.customWidth) setError("customWidth", { message: "Enter a custom width." });
      if (!config.customHeight) setError("customHeight", { message: "Enter a custom height." });
      return valid && Boolean(config.customWidth) && Boolean(config.customHeight);
    }
    if (currentStep === "logo" && config.logo === "Other Logo" && (!config.uploadedLogoName || !uploadedLogoFile)) {
      setError("uploadedLogoName", { message: "Upload your logo artwork." });
      return false;
    }
    if (currentStep === "slogan" && config.sloganMode === "custom") return trigger("sloganText");
    return true;
  }

  async function goForward() {
    if (!(await validateCurrentStep())) return;
    setDirection(1);
    setStepIndex((current) => Math.min(rule.steps.length - 1, current + 1));
  }

  function changeStep(nextStepIndex: number) {
    setDirection(nextStepIndex >= stepIndex ? 1 : -1);
    setStepIndex(nextStepIndex);
  }

  function goBack() {
    setDirection(-1);
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function addToCart(values: ConfiguratorFormValues) {
    if (config.size === "Custom" && (!config.customWidth || !config.customHeight)) {
      setError("customWidth", { message: "Enter a custom width." });
      setError("customHeight", { message: "Enter a custom height." });
      setStepIndex(rule.steps.indexOf("size"));
      return;
    }
    if (config.logo === "Other Logo" && (!config.uploadedLogoName || !uploadedLogoFile)) {
      setError("uploadedLogoName", { message: "Upload your logo artwork." });
      setStepIndex(rule.steps.indexOf("logo"));
      return;
    }
    if (config.sloganMode === "custom" && !config.sloganText.trim()) {
      setError("sloganText", { message: "Enter a slogan or choose No Slogan." });
      setStepIndex(rule.steps.indexOf("slogan"));
      return;
    }
    const nextConfig = { ...config, ...values };
    setConfig(nextConfig);
    if (!addOrUpdateCartItem(nextConfig)) {
      setCartError(content.cartLimitError);
      return;
    }
    setCartError("");
    setCartOpen(true);
  }

  const stepProps = { config, errors, onUploadedLogoFileChange: setUploadedLogoFile, register, rule, setValue, update };
  const stepComponents: Record<ConfiguratorStepKey, React.ReactNode> = {
    registration: <RegistrationStep {...stepProps} />,
    size: <SizeStep {...stepProps} />,
    borders: <BordersStep {...stepProps} />,
    logo: <LogoStep {...stepProps} />,
    slogan: <SloganStep {...stepProps} />,
    countryFlag: <CountryFlagStep {...stepProps} />,
    fixings: <FixingsStep {...stepProps} />,
  };
  const lastStep = stepIndex === rule.steps.length - 1;

  return (
    <div className="site-container py-10 sm:py-14">
      <ConfiguratorIntro config={config} onStepChange={changeStep} stepIndex={stepIndex} steps={rule.steps} />
      <ConfiguratorPreview config={config} onChange={update} />
      <form className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.95fr)]" onSubmit={(event) => event.preventDefault()}>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{content.stepLabels[currentStep]}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Step {stepIndex + 1} of {rule.steps.length}</p>
          <AnimatePresence initial={false} mode="wait">
            <m.div animate={{ opacity: 1, x: 0 }} className="mt-6" exit={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : direction * -8 }} initial={reduceMotion ? false : { opacity: 0, x: direction * 10 }} key={currentStep} transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
              {stepComponents[currentStep]}
            </m.div>
          </AnimatePresence>
          {cartError ? <p aria-live="polite" className="field-error mt-5">{cartError}</p> : null}
          <div className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-5">
            <button className="inline-flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-40" disabled={stepIndex === 0} onClick={goBack} type="button"><ArrowLeft aria-hidden size={15} />{content.back}</button>
            {!lastStep ? <button className="primary-button min-h-9 gap-2 py-1 text-sm" onClick={goForward} type="button">{content.continue}<ArrowRight aria-hidden size={15} /></button> : <button className="primary-button min-h-9 gap-2 py-1 text-sm" onClick={handleSubmit(addToCart)} type="button">{editingItemId ? content.updateCart : content.addToCart}<ArrowRight aria-hidden size={15} /></button>}
          </div>
        </section>
        <PriceSummary config={config} />
      </form>
    </div>
  );
}
