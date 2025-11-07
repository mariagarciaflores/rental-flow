'use client';

import { useState } from 'react';
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
import type { Expense, ExpenseType } from '@/lib/types';
import { properties, expenses as initialExpenses } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const emptyExpense: Omit<Expense, 'expenseId'> = {
  propertyId: '',
  type: 'MAINTENANCE_OTHER',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
};

function ExpenseForm({ onSave }: { onSave: (expense: Omit<Expense, 'expenseId'>) => void }) {
  const t = useTranslation();
  const [formData, setFormData] = useState<Omit<Expense, 'expenseId'>>(emptyExpense);

  const handleSave = () => {
    onSave(formData);
  };
  
  return (
     <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">{t('form.description')}</Label>
            <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">{t('form.amount')}</Label>
            <Input id="amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="col-span-3" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">{t('form.type')}</Label>
            <Select value={formData.type} onValueChange={(value: ExpenseType) => setFormData({...formData, type: value})}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="FIXED_SERVICE">Fixed Service</SelectItem>
                    <SelectItem value="MAINTENANCE_OTHER">Maintenance / Other</SelectItem>
                </SelectContent>
            </Select>
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
            <Label htmlFor="date" className="text-right">{t('form.date')}</Label>
            <Input id="date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="col-span-3" />
        </div>
        <DialogFooter>
            <Button onClick={handleSave}>{t('action.save')}</Button>
        </DialogFooter>
    </div>
  )
}

export default function ExpenseManagement() {
  const t = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [open, setOpen] = useState(false);

  const handleSave = (formData: Omit<Expense, 'expenseId'>) => {
    setExpenses(prev => [...prev, { expenseId: `exp-${Date.now()}`, ...formData }]);
    setOpen(false);
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.propertyId === propertyId)?.name || 'N/A';
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
                <ExpenseForm onSave={handleSave} />
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
