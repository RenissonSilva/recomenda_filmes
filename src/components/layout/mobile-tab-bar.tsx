import { MainNavLinks } from './nav-links';

/** Navegação inferior, exibida apenas em telas pequenas. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <MainNavLinks variant="mobile" />
    </nav>
  );
}
