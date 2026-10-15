import { useEffect, useRef } from 'react';
import GlissformBrand from './GlissformBrand';
import { navigationSections } from './sectionNavigation';
import './compact-navigation.scss';

/** Native disclosure keeps section links usable before hydration and without JS. */
export default function CompactNavigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const menu = menuRef.current!;
    const close = (event: PointerEvent) => {
      if (!menu.contains(event.target as Node)) menu.open = false;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', key);
    };
  }, []);

  return <header className="compact-navigation">
    <a className="compact-navigation__home" href={import.meta.env.BASE_URL} aria-label="Glissform home"><GlissformBrand /></a>
    <details className="compact-navigation__menu" ref={menuRef}>
      <summary>Explore <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></summary>
      <nav aria-label="Website navigation">
        {navigationSections.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={() => { if (menuRef.current) menuRef.current.open = false; }}>{label}</a>)}
      </nav>
    </details>
  </header>;
}
