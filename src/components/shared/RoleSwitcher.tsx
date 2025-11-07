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

  const { role, setRole } = context;

  return (
    <Select value={role} onValueChange={(value: Role) => setRole(value)}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={t('role.admin')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{t('role.admin')}</SelectItem>
        <SelectItem value="tenant">{t('role.tenant')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
