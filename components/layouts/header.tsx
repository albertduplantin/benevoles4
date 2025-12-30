'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getInitials, getAvatarColor } from '@/lib/utils/avatar';
import { InstallPWAButton } from '@/components/features/pwa/install-pwa-button';
import { NotificationBell } from '@/components/features/notifications/notification-bell';
import {
  MenuIcon,
  HomeIcon,
  ListIcon,
  CalendarIcon,
  UsersIcon,
  LogOutIcon,
  UserIcon,
  CheckCircle2Icon,
  LayoutGridIcon,
  MailIcon,
  HeartIcon,
  WrenchIcon,
  SearchIcon,
  BellIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('volunteer' | 'category_responsible' | 'admin')[];
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/overview',
    icon: HomeIcon,
    roles: ['volunteer', 'category_responsible', 'admin'],
  },
  {
    label: 'Calendrier',
    href: '/dashboard',
    icon: CalendarIcon,
    roles: ['volunteer', 'category_responsible', 'admin'],
  },
  {
    label: 'Missions',
    href: '/dashboard/missions',
    icon: ListIcon,
    roles: ['volunteer', 'category_responsible', 'admin'],
  },
  {
    label: 'Mes missions',
    href: '/dashboard/missions?filter=my',
    icon: CheckCircle2Icon,
    roles: ['volunteer', 'category_responsible'],
  },
  {
    label: 'Mes préférences',
    href: '/dashboard/preferences',
    icon: HeartIcon,
    roles: ['volunteer', 'category_responsible', 'admin'],
  },
  {
    label: 'Responsables',
    href: '/dashboard/admin/category-responsibles',
    icon: UsersIcon,
    roles: ['admin'],
  },
  {
    label: 'Catégories',
    href: '/dashboard/admin/categories',
    icon: ListIcon,
    roles: ['admin'],
  },
  {
    label: 'Bénévoles',
    href: '/dashboard/volunteers',
    icon: UsersIcon,
    roles: ['admin'],
  },
  {
    label: 'Bénévoles Email',
    href: '/dashboard/admin/email-only',
    icon: MailIcon,
    roles: ['admin'],
  },
  {
    label: 'Affectations',
    href: '/dashboard/affectations',
    icon: LayoutGridIcon,
    roles: ['admin'],
  },
];

export function Header() {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Filtrer les items de navigation selon le rôle
  const visibleNavItems = navigation.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    // Gérer le cas spécial de "Mes missions" avec le paramètre URL
    if (href.includes('?filter=my')) {
      return pathname === '/dashboard/missions' && typeof window !== 'undefined' && window.location.search.includes('filter=my');
    }
    return pathname.startsWith(href.split('?')[0]);
  };

  if (!user) {
    return null; // Ne pas afficher le header si pas connecté
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo et titre */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <span className="hidden sm:inline">Festival Bénévoles</span>
            <span className="sm:hidden">FB</span>
          </Link>
        </div>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profil utilisateur & Déconnexion Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* Recherche bénévoles (Admin only) */}
          {user.role === 'admin' && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/search-volunteers">
                <SearchIcon className="h-4 w-4 mr-2" />
                Recherche
              </Link>
            </Button>
          )}
          
          {/* Maintenance (Admin only) */}
          {user.role === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <WrenchIcon className="h-4 w-4 mr-2" />
                  Maintenance
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Outils de maintenance</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin/notifications" className="cursor-pointer">
                    <BellIcon className="mr-2 h-4 w-4" />
                    Envoyer notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/debug-notifications" className="cursor-pointer">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Debug notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin/cleanup-auth" className="cursor-pointer">
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    Nettoyage Auth
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Notifications en temps réel (admins et responsables) */}
          <NotificationBell />
          
          <div className="hidden md:block">
            <InstallPWAButton />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || undefined} alt={user.firstName} />
                  <AvatarFallback style={{ backgroundColor: getAvatarColor(user.uid) }}>
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">
                    {user.role === 'volunteer' && 'Bénévole'}
                    {user.role === 'category_responsible' && 'Responsable'}
                    {user.role === 'admin' && 'Administrateur'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile/notifications" className="cursor-pointer">
                  <BellIcon className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menu Burger Mobile */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              {/* Profil utilisateur en haut */}
              <div className="flex items-center gap-3 pb-4 border-b mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photoURL || undefined} alt={user.firstName} />
                  <AvatarFallback style={{ backgroundColor: getAvatarColor(user.uid) }}>
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">
                    {user.role === 'volunteer' && 'Bénévole'}
                    {user.role === 'category_responsible' && 'Responsable'}
                    {user.role === 'admin' && 'Administrateur'}
                  </p>
                </div>
              </div>

              {/* Navigation Mobile */}
              <nav className="flex flex-col gap-2">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="border-t my-4" />

                {/* Installer l'application (PWA) */}
                <div className="px-2">
                  <InstallPWAButton />
                </div>

                <div className="border-t my-4" />

                {/* Mon profil */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <UserIcon className="h-5 w-5" />
                  Mon profil
                </Link>

                {/* Notifications */}
                <Link
                  href="/dashboard/profile/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <BellIcon className="h-5 w-5" />
                  Notifications
                </Link>

                {/* Déconnexion */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOutIcon className="h-5 w-5" />
                  Se déconnecter
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

