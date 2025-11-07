'use client';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, LogOut } from 'lucide-react';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import RoleSwitcher from '../shared/RoleSwitcher';
import { Button } from '@/components/ui/button';

export default function Header() {
  const t = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('app.title')}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <LanguageSwitcher />
                <RoleSwitcher />
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
