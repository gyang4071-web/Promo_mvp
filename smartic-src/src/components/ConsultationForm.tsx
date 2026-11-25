import { useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, COPY } from '../content/copy';
import { useInterests } from '../state/interests';
import { atmosphere } from '../atmosphere/store';
import { captureAttribution } from '../analytics/attribution';
import { track } from '../analytics/track';
import { CONFIG } from '../config';

const F = COPY.consultation;

type Status = 'idle' | 'sending' | 'success' | 'demo' | 'error';

/** Armenian mobile/landline, +374 or 0 prefix, or any international number. */
export function normalizePhone(raw: string) {
  return raw.replace(/[\s\-().]/g, '');
}
export function isValidPhone(raw: string) {
  const p = normalizePhone(raw);
  return /^(\+?374|0)\d{8}$/.test(p) || /^\+\d{8,15}$/.test(p);
}

export function ConsultationForm() {
  const { selected, toggle } = useInterests();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [status, setStatus] = useState<Status>('idle');
  const started = useRef(false);
  const inFlight = useRef(false);

  const onStart = () => {
    if (started.current) return;
    started.current = true;
    track('consultation_form_start', { selected_category_count: selected.length });
  };

  const validate = () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = F.errors.name;
    if (!isValidPhone(phone)) e.phone = F.errors.phone;
    setErrors(e);
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (inFlight.current) return; // no duplicate submissions
    const e = validate();
    if (e.name || e.phone) {
      document.getElementById(e.name ? 'lead-name' : 'lead-phone')?.focus();
      return;
    }
    if (!CONFIG.leadEndpoint) {
      // Prototype: nothing is sent and nothing pretends to be.
      setStatus('demo');
      return;
    }
    inFlight.current = true;
    setStatus('sending');
    try {
      const res = await fetch(CONFIG.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizePhone(phone),
          interests: selected,
          comment: comment.trim(),
          lighting_mood: atmosphere.get().mood.id,
          attribution: captureAttribution(),
          submitted_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      track('consultation_form_submit_success', {
        selected_category_count: selected.length,
        product_category: selected.join(',') || 'general',
        lighting_mood: atmosphere.get().mood.id,
      });
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  };

  if (status === 'success') {
    return (
      <div role="status" className="card p-8">
        <p className="font-serif text-[26px] leading-snug">{F.success}</p>
      </div>
    );
  }

  const field =
    'mt-2 w-full rounded-2xl border bg-transparent px-4 py-3.5 text-[16px] outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--accent)]';

  return (
    <form noValidate onSubmit={submit} onFocus={onStart} className="card p-6 sm:p-8" aria-describedby="lead-privacy">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="text-[14px] font-medium">
            {F.fields.name}
          </label>
          <input
            id="lead-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => errors.name && validate()}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'lead-name-err' : undefined}
            className={field}
            style={{ borderColor: errors.name ? '#d2554a' : 'var(--line)' }}
          />
          {/* space is reserved so the layout never jumps under the cursor */}
          <p id="lead-name-err" className="mt-1.5 min-h-[20px] text-[13px] leading-snug text-[#e06a5f]" aria-live="polite">
            {errors.name ?? ''}
          </p>
        </div>
        <div>
          <label htmlFor="lead-phone" className="text-[14px] font-medium">
            {F.fields.phone}
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+374 __ ______"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => errors.phone && validate()}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'lead-phone-err' : undefined}
            className={field}
            style={{ borderColor: errors.phone ? '#d2554a' : 'var(--line)' }}
          />
          {/* space is reserved so the layout never jumps under the cursor */}
          <p id="lead-phone-err" className="mt-1.5 min-h-[20px] text-[13px] leading-snug text-[#e06a5f]" aria-live="polite">
            {errors.phone ?? ''}
          </p>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-[14px] font-medium">
          {F.fields.interests} <span className="font-normal text-muted">· {F.fields.interestsHint}</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = selected.includes(c.id);
            return (
              <label
                key={c.id}
                className="chip cursor-pointer select-none"
                style={{ borderColor: on ? 'var(--accent)' : 'var(--line)', background: on ? 'rgb(var(--accent-rgb) / 0.12)' : 'transparent' }}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id, 'consultation')} />
                <span
                  aria-hidden
                  className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border text-[11px]"
                  style={{ borderColor: on ? 'var(--accent)' : 'rgb(var(--ink-rgb) / 0.35)', background: on ? 'var(--accent)' : 'transparent', color: 'var(--accent-ink)' }}
                >
                  {on ? '✓' : ''}
                </span>
                {c.name}
              </label>
            );
          })}
        </div>
        {selected.length === 0 && <p className="mt-2 text-[13px] text-muted">{F.general}</p>}
      </fieldset>

      <div className="mt-6">
        <label htmlFor="lead-comment" className="text-[14px] font-medium">
          {F.fields.comment} <span className="font-normal text-muted">· {F.fields.optional}</span>
        </label>
        <textarea
          id="lead-comment"
          name="comment"
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={F.fields.commentPlaceholder}
          className={`${field} resize-y`}
          style={{ borderColor: 'var(--line)' }}
        />
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" className="btn btn-primary min-w-[220px]" disabled={status === 'sending'} aria-busy={status === 'sending'}>
          {status === 'sending' ? F.sending : F.submit}
        </button>
        <p id="lead-privacy" className="text-[12.5px] leading-relaxed text-muted">
          {F.privacy}{' '}
          <a href={CONFIG.privacyUrl} target="_blank" rel="noopener" className="underline underline-offset-2">
            {F.privacyLink}
          </a>
        </p>
      </div>

      <AnimatePresence>
        {(status === 'demo' || status === 'error') && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border p-4 text-[14.5px] leading-relaxed"
            style={{ borderColor: status === 'error' ? '#d2554a' : 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.08)' }}
          >
            {status === 'demo' ? (
              <>
                <strong className="block">{F.demoTitle}</strong>
                {F.demoText}{' '}
                <a href={CONFIG.showroom.phoneHref} className="underline underline-offset-2">
                  {CONFIG.showroom.phoneDisplay}
                </a>
                {' · '}
                <a href={`mailto:${CONFIG.showroom.email}`} className="underline underline-offset-2">
                  {CONFIG.showroom.email}
                </a>
              </>
            ) : (
              F.errors.network
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
