import { AnimatePresence, motion } from 'framer-motion';
import { COPY } from '../content/copy';

const C = COPY.security;

/** A clearly simulated push notification. */
export function NotificationDemo({ visible }: { visible: boolean }) {
  return (
    <div aria-live="polite" className="pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="w-[min(360px,calc(100vw-56px))] rounded-[22px] border border-white/15 bg-[#15130f]/85 p-4 text-[#f3ede6] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)] backdrop-blur-xl"
            role="status"
          >
            <div className="flex items-center gap-2 text-[12px] text-white/60">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-[#3200ff] text-[10px] font-bold text-white">S</span>
              <span>Smartic</span>
              <span className="ml-auto">{C.notifNow}</span>
            </div>
            <div className="mt-2.5 flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <path d="M6 20V4h9l3 2v14M6 20h12M14 12h.01" />
                </svg>
              </span>
              <div>
                <p className="text-[15.5px] font-semibold leading-snug">{C.notifTitle}</p>
                <p className="mt-0.5 text-[13px] text-white/65">{C.notifSource}</p>
              </div>
            </div>
            <span className="mt-3 inline-block rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-white/70">
              {C.demoBadge}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
