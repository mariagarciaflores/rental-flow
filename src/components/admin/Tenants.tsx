'use client';

import { useState, useContext, useEffect, useTransition, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import type { Tenant, Property, User } from '@/lib/types';
import { createTenantAction, updateTenantAction, deleteTenantAction } from '@/app/actions';
import { PlusCircle, Edit, Trash2, Mail, Loader2 } from 'lucide-react';
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
import { auth } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';


const emptyTenantData: z.infer<typeof TenantSchemaForCreation> = {
  name: '',
  email: '',
  phone: '',
  propertyId: '',
  fixedMonthlyRent: 0,
  paysUtilities: false,
  startDate: new Date().toISOString().split('T')[0], // Default to today
};


function TenantForm({ tenant, properties, onSave, isEditing }: { tenant?: Tenant & { user?: User }, properties: Property[], onSave: (tenantData: any) => void, isEditing: boolean }) {
  const t = useTranslation();
  const initialData = isEditing && tenant ? {
      // For editing, we don't change user details, only tenancy details
      propertyId: tenant.propertyId,
      fixedMonthlyRent: tenant.fixedMonthlyRent,
      paysUtilities: tenant.paysUtilities,
      startDate: tenant.startDate,
      // User details for display, but can be part of the form state for editing tenancy-related user fields like phone
      name: tenant.user?.name || '',
      email: tenant.user?.email || '',
      phone: tenant.user?.phone || '',
  } : emptyTenantData;

  const [formData, setFormData] = useState(initialData);
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
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isEditing} />
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
                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
            <Label htmlFor="startDate" className="text-right">Start Date</Label>
            <Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="col-span-3" />
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

function TenantDialog({ tenant, properties, children }: { tenant?: Tenant & { user?: User }, properties: Property[], children: React.ReactNode}) {
    const t = useTranslation();
    const context = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    if (!context) return null;
    const { refreshData } = context;

    const handleSave = async (data: any) => {
        try {
            let result;
            if (tenant?.id) { // Editing
                result = await updateTenantAction(tenant.id, data);
                 if (result.success) {
                    toast({ title: 'Tenant Updated' });
                } else {
                    throw new Error(result.error);
                }
            } else { // Adding
                result = await createTenantAction(data);
                if (result.success) {
                     if (result.isNewUser) {
                        // The email will be sent by Firebase automatically if configured
                        // or can be sent manually from the client.
                        toast({ 
                            title: 'New Tenant Created', 
                            description: `An email will be sent to ${data.email} to set their password.`
                        });
                        // Client-side sending
                        await sendPasswordResetEmail(auth, data.email);
                    } else {
                        toast({
                            title: 'Tenancy Added to Existing User',
                            description: 'The user can now see this tenancy in their account.'
                        });
                    }
                } else {
                    throw new Error(result.error);
                }
            }
            await refreshData();
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
                <TenantForm tenant={tenant} properties={properties} onSave={handleSave} isEditing={!!tenant} />
            </DialogContent>
        </Dialog>
    )
}

export default function TenantManagement() {
  const t = useTranslation();
  const context = useContext(AppContext);
  const { user: authUser } = useAuth()!;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  useEffect(() => {
    context?.refreshData();
  }, []);

  if (!context || !authUser) return null;
  const { tenants, properties, refreshData } = context;

  const userProperties = useMemo(() => {
    return properties.filter(p => p.owners.includes(authUser.uid));
  }, [properties, authUser.uid]);

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'N/A';
  }
  
  const handleDelete = async (userId: string, tenantId: string) => {
    try {
      const result = await deleteTenantAction(userId, tenantId);
      if (result.success) {
        await refreshData();
        toast({ title: 'Tenant Deleted' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast({ variant: 'destructive', title: 'Failed to delete tenant', description: (error as Error).message });
    }
  };

  const handleSendResetEmail = (tenantUser: User) => {
    if (!tenantUser?.email) return;
    setSendingFor(tenantUser.id);
    startTransition(async () => {
        try {
            await sendPasswordResetEmail(auth, tenantUser.email);
            toast({ 
                title: 'Password Reset Email Sent', 
                description: `An email has been sent to ${tenantUser.email}.`
            });
        } catch (error: any) {
            console.error("Failed to send password reset email:", error);
            toast({ variant: 'destructive', title: 'Failed to send email', description: error.message });
        } finally {
            setSendingFor(null);
        }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.tenants')}</CardTitle>
        <TenantDialog properties={userProperties}>
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
            {tenants.map((tenancy) => (
              <TableRow key={tenancy.id}>
                <TableCell className="font-medium">{tenancy.user?.name}</TableCell>
                <TableCell>{getPropertyName(tenancy.propertyId)}</TableCell>
                <TableCell>{tenancy.user?.email}</TableCell>
                <TableCell>{tenancy.user?.phone}</TableCell>
                <TableCell className="text-right space-x-2">
                    {tenancy.user && (
                        <Button variant="ghost" size="icon" onClick={() => handleSendResetEmail(tenancy.user!)} disabled={isPending && sendingFor === tenancy.user.id}>
                            {isPending && sendingFor === tenancy.user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4"/>}
                            <span className="sr-only">Send password reset email</span>
                        </Button>
                    )}
                    <TenantDialog tenant={tenancy} properties={userProperties}>
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
                          <AlertDialogAction onClick={() => handleDelete(tenancy.userId, tenancy.id)}>Continue</AlertDialogAction>
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
