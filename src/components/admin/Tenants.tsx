'use client';

import { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import type { Tenant } from '@/lib/types';
import { properties } from '@/lib/data';
import { PlusCircle, Edit } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const emptyTenant: Omit<Tenant, 'tenantId'> = {
  name: '',
  contact: '',
  propertyId: '',
  fixedMonthlyRent: 0,
  paysUtilities: false,
};

function TenantForm({ tenant, onSave }: { tenant: Partial<Tenant>, onSave: (tenant: Omit<Tenant, 'tenantId'>) => void }) {
  const t = useTranslation();
  const [formData, setFormData] = useState<Omit<Tenant, 'tenantId'>>(
    {...emptyTenant, ...tenant}
  );

  const handleSave = () => {
    onSave(formData);
  };
  
  return (
     <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('form.name')}</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">{t('form.contact')}</Label>
            <Input id="contact" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">{t('form.property')}</Label>
            <Select value={formData.propertyId} onValueChange={value => setFormData({...formData, propertyId: value})}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                    {properties.map(p => <SelectItem key={p.propertyId} value={p.propertyId}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rent" className="text-right">{t('form.rent')}</Label>
            <Input id="rent" type="number" value={formData.fixedMonthlyRent} onChange={e => setFormData({...formData, fixedMonthlyRent: Number(e.target.value)})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="paysUtilities" className="text-right">{t('form.pays_utilities')}</Label>
            <Checkbox id="paysUtilities" checked={formData.paysUtilities} onCheckedChange={checked => setFormData({...formData, paysUtilities: !!checked})} />
        </div>
        <DialogFooter>
            <Button onClick={handleSave}>{t('action.save')}</Button>
        </DialogFooter>
    </div>
  )
}

function TenantDialog({ tenant, children }: { tenant?: Tenant, children: React.ReactNode}) {
    const t = useTranslation();
    const context = useContext(AppContext);
    const [open, setOpen] = useState(false);
    
    if (!context) return null;
    const { setTenants } = context;

    const handleSave = (formData: Omit<Tenant, 'tenantId'>) => {
        if (tenant) { // Editing
            setTenants(prev => prev.map(t => t.tenantId === tenant.tenantId ? {...tenant, ...formData} : t));
        } else { // Adding
            setTenants(prev => [...prev, { tenantId: `tenant-${Date.now()}`, ...formData }]);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{tenant ? t('action.edit_tenant') : t('action.add_tenant')}</DialogTitle>
                </DialogHeader>
                <TenantForm tenant={tenant || {}} onSave={handleSave} />
            </DialogContent>
        </Dialog>
    )
}

export default function TenantManagement() {
  const t = useTranslation();
  const context = useContext(AppContext);

  if (!context) return null;

  const { tenants } = context;

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.propertyId === propertyId)?.name || 'N/A';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.tenants')}</CardTitle>
        <TenantDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('action.add_tenant')}
            </Button>
        </TenantDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.header.tenant')}</TableHead>
              <TableHead>{t('table.header.property')}</TableHead>
              <TableHead>{t('form.contact')}</TableHead>
              <TableHead className="text-right">{t('table.header.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.tenantId}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{getPropertyName(tenant.propertyId)}</TableCell>
                <TableCell>{tenant.contact}</TableCell>
                <TableCell className="text-right">
                    <TenantDialog tenant={tenant}>
                         <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </TenantDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
