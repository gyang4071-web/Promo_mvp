import { AnimatePresence, motion } from 'framer-motion';
import { COPY, categoryById, type CategoryId } from '../content/copy';
import { useInterests } from '../state/interests';

/** "Հետաքրքրում է" ↔ "Ընտրված է" toggle for one solution category. */
export function ProductInterestButton({ id, sectionId }: { id: CategoryId; sectionId: string }) {
  const { has, toggle } = useInterests();
  const on = has(id);
  const name = categoryById(id).name;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${name}․ ${on ? COPY.interest.selected : COPY.interest.add}`}
      title={on ? COPY.interest.removeHint : undefined}
      onClick={() => toggle(id, sectionId)}
      className={`btn group border ${on ? 'border-transparent' : ''}`}
      style={
        on
          ? { background: 'rgb(var(--accent-rgb) / 0.14)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1.5px var(--accent)' }
          : { borderColor: 'rgb(var(--ink-rgb) / 0.3)', color: 'var(--ink)' }
      }
    >
      <span
        aria-hidden
        className="relative grid h-6 w-6 place-items-center rounded-full border transition-colors duration-300"
        style={{
          borderColor: on ? 'var(--accent)' : 'rgb(var(--ink-rgb) / 0.35)',
          background: on ? 'var(--accent)' : 'transparent',
        }}
      >
        <AnimatePresence initial={false}>
          {on ? (
            <motion.svg
              key="check"
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            >
              <path
                d="M3.5 8.5l3 3 6-7"
                fill="none"
                stroke="var(--accent-ink)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          ) : (
            <motion.svg key="plus" viewBox="0 0 16 16" className="h-3 w-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      <span>{on ? COPY.interest.selected : COPY.interest.add}</span>
    </button>
  );
}
