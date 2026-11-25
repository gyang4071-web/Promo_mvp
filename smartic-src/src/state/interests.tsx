/**
 * Selected solution categories (zero, one, several or all five).
 * Stable ids, persisted for the session, independent from lighting state.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CATEGORIES, type CategoryId } from '../content/copy';
import { track } from '../analytics/track';

const KEY = 'smartic.interests';
const ORDER = CATEGORIES.map((c) => c.id);

interface InterestsApi {
  selected: CategoryId[];
  has: (id: CategoryId) => boolean;
  toggle: (id: CategoryId, sectionId?: string) => void;
  set: (ids: CategoryId[]) => void;
}

const Ctx = createContext<InterestsApi | null>(null);

function read(): CategoryId[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? ORDER.filter((id) => v.includes(id)) : [];
  } catch {
    return [];
  }
}

export function InterestsProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CategoryId[]>(read);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(selected));
    } catch {
      /* ignore */
    }
  }, [selected]);

  const toggle = useCallback(
    (id: CategoryId, sectionId?: string) => {
      const on = selected.includes(id);
      const next = on ? selected.filter((x) => x !== id) : ORDER.filter((x) => x === id || selected.includes(x));
      setSelected(next);
      track(on ? 'solution_interest_removed' : 'solution_interest_selected', {
        product_category: id,
        selected_category_count: next.length,
        section_id: sectionId,
      });
    },
    [selected],
  );

  const api = useMemo<InterestsApi>(
    () => ({
      selected,
      has: (id) => selected.includes(id),
      toggle,
      set: (ids) => setSelected(ORDER.filter((x) => ids.includes(x))),
    }),
    [selected, toggle],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useInterests() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInterests outside InterestsProvider');
  return v;
}
