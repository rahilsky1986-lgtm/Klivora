import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { createTransaction, getAccounts } from '../../lib/api';
import { toCents, today, TRANSACTION_TYPES } from '../../lib/formatters';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  accounts: { id: string; name: string }[];
}

export default function TransactionForm({ open, onClose, onSave, accounts }: TransactionFormProps) {
  const [form, setForm] = useState({
    account_id: '',
    date: today(),
    amount: '',
    type: 'debit',
    description: '',
    reference: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        account_id: '',
        date: today(),
        amount: '',
        type: 'debit',
        description: '',
        reference: '',
      });
    }
  }, [open]);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));

  const handleSubmit = async () => {
    if (!form.amount) { Alert.alert('Error', 'Amount is required'); return; }
    setLoading(true);
    try {
      await createTransaction({ ...form, amount: toCents(form.amount) });
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to record transaction');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Add Transaction" footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Save Transaction</Button>
      </>
    }>
      <View style={styles.form}>
        <Select label="Account" value={form.account_id} onValueChange={setField('account_id')}>
          <option value="">No specific account</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <View style={styles.row}>
          <Input label="Date" type="date" value={form.date} onChangeText={setField('date')} />
          <Input label="Amount *" type="decimal" value={form.amount} onChangeText={setField('amount')} placeholder="0.00" />
        </View>
        <Select label="Type" value={form.type} onValueChange={setField('type')}>
          {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Input label="Description" value={form.description} onChangeText={setField('description')} placeholder="Transaction description" />
        <Input label="Reference" value={form.reference} onChangeText={setField('reference')} placeholder="Optional reference" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { display: 'flex', flexDirection: 'column', gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
});