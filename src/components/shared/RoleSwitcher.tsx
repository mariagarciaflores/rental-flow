'use client';

import { useContext } from 'react';
import { AppContext, Role } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RoleSwitcher() {
  const t = useTranslation();
  const context = useContext(AppContext);

  if (!context) {
    return null;
  }

  const { role, setRole, currentUser } = context;

  // Don't show switcher if user only has one role
  if (!currentUser || currentUser.roles.length < 2) {
    return null;
  }

  return (
    <Select value={role || undefined} onValueChange={(value: Role) => setRole(value)}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={t('role.owner')} />
      </SelectTrigger>
      <SelectContent>
        {currentUser.roles.map(r => (
            <SelectItem key={r} value={r}>{t(`role.${r}`)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
