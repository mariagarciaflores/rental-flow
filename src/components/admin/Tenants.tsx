'use client';

import { useState, useContext, useEffect, useTransition } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import type { Tenant, Property } from '@/lib/types';
import { createTenantAction, updateTenantAction, deleteTenantAction, generateAndCopyTenantPasswordLinkAction } from '@/app/actions';
import { PlusCircle, Edit, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TenantSchemaForCreation, TenantSchemaForEditing } from '@/lib/schemas';


const emptyTenant: z.infer<typeof TenantSchemaForCreation> = {
  name: '',
  email: '',
  phone: '',
  propertyId: '',
  fixedMonthlyRent: 0,
  paysUtilities: false,
};


function TenantForm({ tenant, properties, onSave, isEditing }: { tenant: Partial<Tenant>, properties: Property[], onSave: (tenantData: any) => void, isEditing: boolean }) {
  const t = useTranslation();
  const [formData, setFormData] = useState(
    {...emptyTenant, ...tenant}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const schema = isEditing ? TenantSchemaForEditing : TenantSchemaForCreation;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        newErrors[issue.path[0]] = issue.message;
      }
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSave(result.data);
  };
  
  return (
     <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('form.name')}</Label>
            <div className="col-span-3">
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
             <div className="col-span-3">
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isEditing} />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">{t('form.property')}</Label>
            <div className="col-span-3">
                <Select value={formData.propertyId} onValueChange={value => setFormData({...formData, propertyId: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map(p => <SelectItem key={p.propertyId} value={p.propertyId}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                {errors.propertyId && <p className="text-destructive text-sm mt-1">{errors.propertyId}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rent" className="text-right">{t('form.rent')}</Label>
             <div className="col-span-3">
                <Input id="rent" type="number" value={formData.fixedMonthlyRent} onChange={e => setFormData({...formData, fixedMonthlyRent: Number(e.target.value)})} />
                {errors.fixedMonthlyRent && <p className="text-destructive text-sm mt-1">{errors.fixedMonthlyRent}</p>}
            </div>
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

function TenantDialog({ tenant, properties, children }: { tenant?: Tenant, properties: Property[], children: React.ReactNode}) {
    const t = useTranslation();
    const context = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    if (!context) return null;
    const { refreshTenants } = context;

    const handleSave = async (tenantData: any) => {
        try {
            let result;
            if (tenant?.tenantId) { // Editing
                result = await updateTenantAction(tenant.tenantId, tenantData);
                 if (result.success) {
                    toast({ title: 'Tenant Updated' });
                } else {
                    throw new Error(result.error);
                }
            } else { // Adding
                result = await createTenantAction(tenantData);
                if (result.success && result.link) {
                    toast({ 
                        title: 'Tenant Created Successfully', 
                        description: (
                            <div className="space-y-2">
                                <p>Share this link with the tenant to set their password:</p>
                                <Input type="text" readOnly value={result.link} className="bg-muted" />
                            </div>
                        ),
                        duration: 20000,
                    });
                } else {
                    throw new Error(result.error);
                }
            }
            await refreshTenants();
            setOpen(false);
        } catch (error) {
            console.error("Failed to save tenant:", error);
            toast({ variant: 'destructive', title: 'Failed to save tenant', description: (error as Error).message });
        }
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
                <TenantForm tenant={tenant || {}} properties={properties} onSave={handleSave} isEditing={!!tenant} />
            </DialogContent>
        </Dialog>
    )
}

export default function TenantManagement() {
  const t = useTranslation();
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    context?.refreshTenants();
  }, []);

  if (!context) return null;
  const { tenants, properties, refreshTenants } = context;

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.propertyId === propertyId)?.name || 'N/A';
  }
  
  const handleDelete = async (tenantId: string) => {
    try {
      const result = await deleteTenantAction(tenantId);
      if (result.success) {
        await refreshTenants();
        toast({ title: 'Tenant Deleted' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast({ variant: 'destructive', title: 'Failed to delete tenant', description: (error as Error).message });
    }
  };

  const handleGenerateLink = (tenant: Tenant) => {
    setGeneratingFor(tenant.tenantId);
    startTransition(async () => {
        const result = await generateAndCopyTenantPasswordLinkAction(tenant.email);
        if (result.success && result.link) {
            toast({ 
                title: 'Password Link Generated', 
                description: (
                    <div className="space-y-2">
                        <p>Please copy and share this link with {tenant.name}:</p>
                        <Input type="text" readOnly value={result.link} className="bg-muted"/>
                    </div>
                ),
                duration: 20000,
            });
        } else {
            toast({ variant: 'destructive', title: 'Failed to generate link', description: result.error });
        }
        setGeneratingFor(null);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.tenants')}</CardTitle>
        <TenantDialog properties={properties}>
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
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">{t('table.header.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.tenantId}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{getPropertyName(tenant.propertyId)}</TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleGenerateLink(tenant)} disabled={isPending && generatingFor === tenant.tenantId}>
                        {isPending && generatingFor === tenant.tenantId ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4"/>}
                        <span className="sr-only">Generate password link</span>
                    </Button>
                    <TenantDialog tenant={tenant} properties={properties}>
                         <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </TenantDialog>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the tenant and their associated login.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(tenant.tenantId)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
