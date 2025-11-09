'use client';

import { useState, useContext, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useTranslation } from '@/lib/i18n';
import { AppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Property } from '@/lib/types';
import { updatePropertyAction, deletePropertyAction, addPropertyAction } from '@/app/actions';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const emptyProperty: Omit<Property, 'id' | 'owners' | 'createdAt' | 'updatedAt'> = {
  name: '',
  address: '',
};

function PropertyForm({ property, onSave }: { property: Partial<Property>, onSave: (property: Omit<Property, 'id' | 'owners' | 'createdAt' | 'updatedAt'>) => void }) {
  const t = useTranslation();
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'owners' | 'createdAt' | 'updatedAt'>>(
    {...emptyProperty, ...property}
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
            <Label htmlFor="address" className="text-right">{t('table.header.address')}</Label>
            <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="col-span-3" />
        </div>
        <DialogFooter>
            <Button onClick={handleSave}>{t('action.save')}</Button>
        </DialogFooter>
    </div>
  )
}

function PropertyDialog({ property, children }: { property?: Property, children: React.ReactNode}) {
    const t = useTranslation();
    const context = useContext(AppContext);
    const { user } = useAuth()!;
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    if (!context) return null;
    const { refreshData } = context;

    const handleSave = async (formData: Omit<Property, 'id' | 'owners' | 'createdAt' | 'updatedAt'>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to save a property.' });
            return;
        }

        try {
            if (property?.id) { // Editing
                const result = await updatePropertyAction(property.id, formData);
                 if (result.success) {
                    toast({ title: 'Property Updated' });
                } else {
                    throw new Error(result.error);
                }
            } else { // Adding
                await addPropertyAction(formData, user.uid);
                toast({ title: 'Property Added' });
            }
            await refreshData();
            setOpen(false);
        } catch (error) {
            console.error("Failed to save property:", error);
            toast({ variant: 'destructive', title: 'Failed to save property', description: (error as Error).message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{property ? 'Edit Property' : 'Add Property'}</DialogTitle>
                </DialogHeader>
                <PropertyForm property={property || {}} onSave={handleSave} />
            </DialogContent>
        </Dialog>
    )
}

export default function PropertyList() {
  const t = useTranslation();
  const context = useContext(AppContext);
  const { user: authUser } = useAuth()!;
  const { toast } = useToast();

  if (!context || !authUser) return null;
  const { properties, refreshData } = context;

  const userProperties = useMemo(() => {
    return properties.filter(p => p.owners.includes(authUser.uid));
  }, [properties, authUser.uid]);

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (propertyId: string) => {
    try {
      const result = await deletePropertyAction(propertyId);
      if (result.success) {
        await refreshData();
        toast({ title: 'Property Deleted' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast({ variant: 'destructive', title: 'Failed to delete property', description: (error as Error).message });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.properties')}</CardTitle>
        <PropertyDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Property
            </Button>
        </PropertyDialog>
      </CardHeader>
      <CardContent>
        {userProperties.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.header.property')}</TableHead>
                <TableHead>{t('table.header.address')}</TableHead>
                <TableHead className="text-right">{t('table.header.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell className="text-right space-x-2">
                      <PropertyDialog property={property}>
                           <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                      </PropertyDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the property.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(property.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Agrega tu propiedad</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
