/** Editorial chapter marker: number, category, headline. */
export function ChapterHeader({ num, category, headline, id }: { num: string; category: string; headline: string; id: string }) {
  return (
    <header>
      <p className="kicker">
        <span className="num">{num}</span>
        <span aria-hidden className="h-px w-8" style={{ background: 'var(--line)' }} />
        <span>{category}</span>
      </p>
      <h2 id={id} className="h-section mt-5">
        {headline}
      </h2>
    </header>
  );
}
