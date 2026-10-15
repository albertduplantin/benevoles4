'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CalendarIcon, CheckCircle2Icon, ListIcon, UserIcon } from 'lucide-react';

const ITEMS = [
  { label: 'Missions', href: '/dashboard/missions', icon: ListIcon, match: 'missions' },
  { label: 'Mes missions', href: '/dashboard/missions?filter=my', icon: CheckCircle2Icon, match: 'mine' },
  { label: 'Calendrier', href: '/dashboard', icon: CalendarIcon, match: 'calendar' },
  { label: 'Profil', href: '/dashboard/profile', icon: UserIcon, match: 'profile' },
] as const;

function Items() {
  const pathname = usePathname();
  const params = useSearchParams();
  const mine = params.get('filter') === 'my';

  const isActive = (match: string) => {
    if (match === 'mine') return pathname === '/dashboard/missions' && mine;
    if (match === 'missions') return pathname.startsWith('/dashboard/missions') && !mine;
    if (match === 'calendar') return pathname === '/dashboard';
    return pathname.startsWith('/dashboard/profile') || pathname.startsWith('/dashboard/preferences');
  };

  return (
    <ul className="mx-auto grid max-w-md grid-cols-4">
      {ITEMS.map(({ label, href, icon: Icon, match }) => {
        const active = isActive(match);
        return (
          <li key={label}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-blue-800' : 'text-muted-foreground'
              }`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-gold-200' : ''}`}>
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Navigation principale sur mobile : les 4 actions courantes d'un bénévole, à portée de pouce */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <Suspense fallback={null}>
        <Items />
      </Suspense>
    </nav>
  );
}
