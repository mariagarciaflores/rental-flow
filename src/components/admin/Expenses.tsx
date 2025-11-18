'use client';

import { useState, useContext, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import type { Expense, ExpenseType, Property } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppContext } from '@/contexts/AppContext';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';


const EXPENSE_TYPES: ExpenseType[] = ['WATER', 'ELECTRICITY', 'GAS', 'TAXES', 'PHONE', 'OTHER_SERVICES'];

const emptyExpense: Omit<Expense, 'expenseId'> = {
  propertyId: '',
  type: 'OTHER_SERVICES',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
};


function ExpenseForm({ properties, onSave }: { properties: Property[], onSave: (expense: Omit<Expense, 'expenseId'>) => void }) {
  const t = useTranslation();
  
  const ExpenseSchema = useMemo(() => z.object({
    description: z.string().min(1, { message: t('validation.description.required') }),
    amount: z.number().min(0, { message: t('validation.amount.negative') }),
    type: z.enum(EXPENSE_TYPES, { errorMap: () => ({ message: t('validation.type.required') }) }),
    propertyId: z.string().min(1, { message: t('validation.propertyId.required') }),
    date: z.string().min(1, { message: t('validation.date.required') }),
  }), [t]);

  const [formData, setFormData] = useState<Omit<Expense, 'expenseId'>>(emptyExpense);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: string | number | ExpenseType) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (errors[field]) {
      const fieldSchema = ExpenseSchema.shape[field];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (result.success) {
          setErrors(prevErrors => {
            const { [field]: _, ...rest } = prevErrors;
            return rest;
          });
        }
      }
    }
  };

  const handleSave = () => {
    const result = ExpenseSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName) {
          newErrors[fieldName as string] = issue.message;
        }
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
            <Label htmlFor="description" className="text-right">{t('form.description')}</Label>
            <div className="col-span-3">
              <Input id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} />
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">{t('form.amount')}</Label>
             <div className="col-span-3">
              <Input id="amount" type="number" value={formData.amount} onChange={e => handleInputChange('amount', Number(e.target.value))} />
              {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount}</p>}
            </div>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">{t('form.type')}</Label>
            <div className="col-span-3">
              <Select value={formData.type} onValueChange={(value: ExpenseType) => handleInputChange('type', value)}>
                  <SelectTrigger>
                      <SelectValue placeholder={t('form.select_type')} />
                  </SelectTrigger>
                  <SelectContent>
                      {EXPENSE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{t(`expense_type.${type.toLowerCase()}`)}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              {errors.type && <p className="text-destructive text-sm mt-1">{errors.type}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">{t('form.property')}</Label>
             <div className="col-span-3">
              <Select value={formData.propertyId} onValueChange={value => handleInputChange('propertyId', value)}>
                  <SelectTrigger>
                      <SelectValue placeholder={t('form.select_property')} />
                  </SelectTrigger>
                  <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
              </Select>
              {errors.propertyId && <p className="text-destructive text-sm mt-1">{errors.propertyId}</p>}
            </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">{t('form.date')}</Label>
            <div className="col-span-3">
              <Input id="date" type="date" value={formData.date} onChange={e => handleInputChange('date', e.target.value)} />
              {errors.date && <p className="text-destructive text-sm mt-1">{errors.date}</p>}
            </div>
        </div>
        <DialogFooter>
            <Button onClick={handleSave}>{t('action.save')}</Button>
        </DialogFooter>
    </div>
  )
}

export default function ExpenseManagement() {
  const t = useTranslation();
  const context = useContext(AppContext);
  const { user: authUser } = useAuth()!;
  const [open, setOpen] = useState(false);

  if (!context || !authUser) return null;
  const { properties, setExpenses, expenses } = context;

  const userProperties = useMemo(() => {
    return properties.filter(p => p.owners.includes(authUser.uid));
  }, [properties, authUser.uid]);

  const handleSave = (formData: Omit<Expense, 'expenseId'>) => {
    setExpenses(prev => [...prev, { expenseId: `exp-${Date.now()}`, ...formData }]);
    setOpen(false);
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'N/A';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.expenses')}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('action.add_expense')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('action.add_expense')}</DialogTitle>
                </DialogHeader>
                <ExpenseForm properties={userProperties} onSave={handleSave} />
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.header.date')}</TableHead>
              <TableHead>{t('table.header.description')}</TableHead>
              <TableHead>{t('table.header.property')}</TableHead>
              <TableHead className="text-right">{t('table.header.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.expenseId}>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{getPropertyName(expense.propertyId)}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
