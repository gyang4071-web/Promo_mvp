import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { SmarticHeader } from './SmarticHeader';
import { HeroSection } from './HeroSection';
import { LightingSection } from './LightingSection';
import { RotaryControllerSection } from './RotaryControllerSection';
import { HeatingSection } from './HeatingSection';
import { WindowsSection } from './WindowsSection';
import { CentralControlSection } from './CentralControlSection';
import { SecuritySection } from './SecuritySection';
import { SelectedSolutionsSummary } from './SelectedSolutionsSummary';
import { ConsultationSection } from './ConsultationSection';
import { SmarticClosingTransition } from './SmarticClosingTransition';
import { SmarticFooter } from './SmarticFooter';
import { track } from '../analytics/track';

const TRACKED_SECTIONS = ['lighting', 'atmosphere', 'heating', 'windows', 'central', 'security', 'summary', 'consultation', 'closing'];

function usePageAnalytics() {
  useEffect(() => {
    track('promo_page_view', { page_location: window.location.pathname });

    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !seen.has(e.target.id)) {
            seen.add(e.target.id);
            track('section_view', { section_id: e.target.id });
          }
        }),
      { threshold: 0.3 },
    );
    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    // scroll depth via sentinels (no scroll listener)
    const marks = [25, 50, 75, 100];
    const sentinels = marks.map((m) => {
      const s = document.createElement('div');
      // spans from the mark to the end of the page, so fast jumps past it still count
      s.style.cssText = `position:absolute;left:0;width:1px;top:calc(${m}% - 4px);bottom:0;pointer-events:none`;
      s.dataset.depth = String(m);
      document.getElementById('root')!.appendChild(s);
      return s;
    });
    const depthIo = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          track('scroll_depth', { percent_scrolled: Number((e.target as HTMLElement).dataset.depth) });
          depthIo.unobserve(e.target);
        }
      }),
    );
    sentinels.forEach((s) => depthIo.observe(s));
    return () => {
      io.disconnect();
      depthIo.disconnect();
      sentinels.forEach((s) => s.remove());
    };
  }, []);
}

export function SmarticLayout() {
  usePageAnalytics();
  return (
    <MotionConfig reducedMotion="user">
      <SmarticHeader />
      <main id="main">
        <HeroSection />
        <LightingSection />
        <RotaryControllerSection />
        <HeatingSection />
        <WindowsSection />
        <CentralControlSection />
        <SecuritySection />
        <SelectedSolutionsSummary />
        <ConsultationSection />
        <SmarticClosingTransition />
      </main>
      <SmarticFooter />
    </MotionConfig>
  );
}
