import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { createExpense, updateExpense, getExpense } from '../../lib/api';
import { fmt, toCents, toDollars, today, EXPENSE_CATEGORIES } from '../../lib/formatters';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  expenseId?: string;
  currency: string;
}

export default function ExpenseForm({ open, onClose, onSave, expenseId, currency }: ExpenseFormProps) {
  const isEdit = !!expenseId;
  const [form, setForm] = useState({
    date: today(),
    amount: '',
    category: 'Other',
    description: '',
    vendor: '',
    billable: false,
    customer_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (open && isEdit && expenseId) {
      setPageLoading(true);
      getExpense(expenseId).then((res) => {
        const exp = res.data;
        setForm({
          date: exp.date || today(),
          amount: toDollars(exp.amount),
          category: exp.category || 'Other',
          description: exp.description || '',
          vendor: exp.vendor || '',
          billable: exp.billable || false,
          customer_id: exp.customer_id || '',
        });
        setPageLoading(false);
      }).catch(() => setPageLoading(false));
    } else if (open && !isEdit) {
      setForm({
        date: today(),
        amount: '',
        category: 'Other',
        description: '',
        vendor: '',
        billable: false,
        customer_id: '',
      });
    }
  }, [open, expenseId, isEdit]);

  const setField = (k: string) => (text: string | boolean) =>
    setForm((f) => ({ ...f, [k]: text }));

  const handleSubmit = async () => {
    if (!form.amount) { Alert.alert('Error', 'Amount is required'); return; }
    if (!form.category) { Alert.alert('Error', 'Category is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, amount: toCents(form.amount) };
      if (isEdit) await updateExpense(expenseId!, payload);
      else await createExpense(payload);
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save expense');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'} footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Save</Button>
      </>
    }>
      {pageLoading ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : (
        <View style={styles.form}>
          <View style={styles.row}>
            <Input label="Date *" type="date" value={form.date} onChangeText={setField('date')} />
            <Input label="Amount *" type="decimal" value={form.amount} onChangeText={setField('amount')} placeholder="0.00" />
          </View>
          <Select label="Category *" value={form.category} onValueChange={setField('category')}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Vendor" value={form.vendor} onChangeText={setField('vendor')} placeholder="e.g. Amazon, Uber" />
          <Textarea label="Description" value={form.description} onChangeText={setField('description')} rows={2} placeholder="What was this expense for?" />
          <View style={styles.checkboxRow}>
            <Input
              label=""
              value={form.billable ? '1' : '0'}
              onChangeText={(v) => setField('billable')(v === '1')}
              style={styles.checkbox}
            >
              <Text style={styles.checkboxLabel}>Billable to a customer</Text>
            </Input>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: Spacing.xl },
  loadingText: { fontSize: 15, color: Colors.text2 },
  form: { display: 'flex', flexDirection: 'column', gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.sm, marginRight: Spacing.sm },
  checkboxLabel: { fontSize: 14, color: Colors.text },
});