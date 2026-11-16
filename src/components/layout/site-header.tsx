import { UserMenu } from '@/features/account/components/user-menu';

import { Container } from './container';
import { Logo } from './logo';
import { MainNavLinks } from './nav-links';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-4">
          <nav aria-label="Principal" className="hidden md:block">
            <MainNavLinks variant="desktop" />
          </nav>
          <UserMenu />
        </div>
      </Container>
    </header>
  );
}
