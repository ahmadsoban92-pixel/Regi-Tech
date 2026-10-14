"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { ConfiguratorIntro } from "@/components/configurator/ConfiguratorIntro";
import { ConfiguratorPreview } from "@/components/configurator/ConfiguratorPreview";
import { BordersStep, FixingsStep, LogoStep, RegistrationStep, SizeStep, SloganStep } from "@/components/configurator/ConfiguratorSteps";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import { PriceSummary } from "@/components/order/PriceSummary";
import content from "@/content/design.json";
import { configuratorSchema, type ConfiguratorFormValues } from "@/lib/orderSchemas";
import type { PlateConfiguration } from "@/types/order";

export function PlateConfigurator({ productId }: { productId: string }) {
  const { config, selectProduct, setCartOpen, setConfig, setHasCartItem } = useOrderFlow();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reduceMotion = useReducedMotion();
  const { formState: { errors }, handleSubmit, register, setError, setValue, trigger } = useForm<ConfiguratorFormValues>({
    resolver: zodResolver(configuratorSchema),
    defaultValues: {
      registration: config.registration,
      customWidth: config.customWidth,
      customHeight: config.customHeight,
      uploadedLogoName: config.uploadedLogoName,
      sloganText: config.sloganText,
      specialRequirements: config.specialRequirements,
    },
  });

  useEffect(() => selectProduct(productId), [productId, selectProduct]);

  function update(patch: Partial<PlateConfiguration>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  async function goForward() {
    if (step === 1 && !(await trigger("registration"))) return;
    if (step === 2 && config.size === "Custom") {
      const valid = await trigger(["customWidth", "customHeight"]);
      if (!config.customWidth) setError("customWidth", { message: "Enter a custom width." });
      if (!config.customHeight) setError("customHeight", { message: "Enter a custom height." });
      if (!valid || !config.customWidth || !config.customHeight) return;
    }
    if (step === 4 && config.logo === "Other Logo" && !config.uploadedLogoName) {
      setError("uploadedLogoName", { message: "Upload your logo artwork." });
      return;
    }
    if (step === 5 && config.sloganEnabled && !(await trigger("sloganText"))) return;
    setDirection(1);
    setStep((current) => Math.min(6, current + 1));
  }

  function changeStep(nextStep: number) {
    setDirection(nextStep >= step ? 1 : -1);
    setStep(nextStep);
  }

  function goBack() {
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  }

  function addToCart(values: ConfiguratorFormValues) {
    setConfig((current) => ({ ...current, ...values }));
    setHasCartItem(true);
    setCartOpen(true);
  }

  const stepProps = { config, errors, register, update };

  return (
    <div className="site-container py-10 sm:py-14">
      <ConfiguratorIntro config={config} onStepChange={changeStep} step={step} />
      <ConfiguratorPreview config={config} />
      <form className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.95fr)]" onSubmit={handleSubmit(addToCart)}>
        <section className="panel p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{content.steps[step - 1]}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Step {step} of 6</p>
          <AnimatePresence initial={false} mode="wait">
            <m.div
              animate={{ opacity: 1, x: 0 }}
              className="mt-6"
              exit={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : direction * -8 }}
              initial={reduceMotion ? false : { opacity: 0, x: direction * 10 }}
              key={step}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 ? <RegistrationStep {...stepProps} /> : null}
              {step === 2 ? <SizeStep {...stepProps} /> : null}
              {step === 3 ? <BordersStep {...stepProps} /> : null}
              {step === 4 ? <LogoStep {...stepProps} setValue={setValue} /> : null}
              {step === 5 ? <SloganStep {...stepProps} /> : null}
              {step === 6 ? <FixingsStep {...stepProps} /> : null}
            </m.div>
          </AnimatePresence>
          <div className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-5">
            <button className="inline-flex items-center gap-2 text-sm text-[var(--muted)] disabled:opacity-40" disabled={step === 1} onClick={goBack} type="button"><ArrowLeft aria-hidden size={15} />{content.back}</button>
            {step < 6 ? <button className="primary-button min-h-9 gap-2 py-1 text-sm" onClick={goForward} type="button">{content.continue}<ArrowRight aria-hidden size={15} /></button> : <button className="primary-button min-h-9 gap-2 py-1 text-sm" type="submit">{content.addToCart}<ArrowRight aria-hidden size={15} /></button>}
          </div>
        </section>
        <PriceSummary config={config} />
      </form>
    </div>
  );
}
