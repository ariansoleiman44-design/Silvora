"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/Field";
import { quoteService } from "@/lib/quote-service";
import { useCopy } from "@/lib/locale-client";
import type { ContactRequest, SubmissionResult } from "@/types/quote";

type Status = "idle" | "sending" | "success" | "error";

const initial = (): Omit<ContactRequest, "submittedAt"> => ({
  name: "",
  company: "",
  phone: "",
  email: "",
  country: "",
  city: "",
  message: "",
});

export function ContactForm() {
  const copy = useCopy();
  const t = copy.contact;
  const f = t.form;
  const reduce = useReducedMotion();
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactRequest, string>>>({});

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = () => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = copy.quote.form.required;
    if (!values.message.trim()) next.message = copy.quote.form.required;
    if (!values.phone.trim() && !values.email.trim()) next.email = "Add a phone number or email";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Check the email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    const res = await quoteService.submitContact({ ...values, submittedAt: new Date().toISOString() });
    setResult(res);

    /*
     * The server validates independently and its rules are the real
     * gate. When it rejects a field the browser was happy with, mark
     * that field instead of showing only a banner — otherwise the
     * sender is told something is wrong with a form where every visible
     * input looks correct, and has no way to find it.
     *
     * `contact` is the server's name for "email or phone is required";
     * it has no input of its own, so it is shown against the email
     * field, which is where the same client-side rule reports.
     */
    if (!res.ok && res.fields?.length) {
      const mapped: typeof errors = {};
      for (const problem of res.fields) {
        const key = (problem.field === "contact" ? "email" : problem.field) as keyof ContactRequest;
        if (key in values) mapped[key] = problem.message;
      }
      if (Object.keys(mapped).length) {
        setErrors(mapped);
        setStatus("idle");
        return;
      }
    }

    setStatus(res.ok ? "success" : "error");
  };

  if (status === "success") {
    return (
      <m.div
        role="status"
        className="flex min-h-[24rem] flex-col items-start justify-center"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full border border-gold text-gold">
          <Check className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </span>
        <h2 className="display-md mt-8">{t.success.headline}</h2>
        <p className="lead mt-4 max-w-md text-ink/65">{t.success.text}</p>
        {result?.mode === "mock" && <p className="mt-4 text-xs text-ink/60">{t.success.demoNote}</p>}
        <Button
          variant="outline-dark"
          icon="none"
          className="mt-8"
          onClick={() => {
            setValues(initial());
            setStatus("idle");
          }}
        >
          {copy.quote.success.secondary}
        </Button>
      </m.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-8 sm:grid-cols-2">
        <TextField label={f.name} required value={values.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <TextField label={f.company} value={values.company} onChange={set("company")} autoComplete="organization" />
        <TextField label={f.phone} type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} autoComplete="tel" />
        <TextField label={f.email} type="email" inputMode="email" value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <TextField label={f.country} value={values.country} onChange={set("country")} autoComplete="country-name" />
        <TextField label={f.city} value={values.city} onChange={set("city")} autoComplete="address-level2" />
        <TextArea label={f.message} required value={values.message} onChange={set("message")} error={errors.message} className="sm:col-span-2" rows={5} />
      </div>
      <AnimatePresence>
        {status === "error" && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-8 flex gap-3 border border-red-700/30 bg-red-700/5 p-4 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            {/* A production build with no endpoint says so plainly — it
                never implies the message was delivered. */}
            {result?.mode === "unconfigured" ? (
              <div>
                <p className="font-medium">{copy.rfq.unconfigured.headline}</p>
                <p className="mt-1 text-red-800/80">{copy.rfq.unconfigured.text}</p>
              </div>
            ) : (
              <p>{result?.error ?? copy.quote.error.text}</p>
            )}
          </m.div>
        )}
      </AnimatePresence>
      <div className="mt-10">
        <Button type="submit" variant="ink" size="lg" disabled={status === "sending"} icon={status === "sending" ? "none" : "arrow"}>
          {status === "sending" ? f.sending : f.submit}
        </Button>
      </div>
    </form>
  );
}
