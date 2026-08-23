import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { createAccount } from '../../lib/api';
import { ACCOUNT_TYPES } from '../../lib/formatters';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AccountForm({ open, onClose, onSave }: AccountFormProps) {
  const [form, setForm] = useState({ name: '', type: 'asset', code: '', description: '' });
  const [loading, setLoading] = useState(false);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));

  const handleSubmit = async () => {
    if (!form.name || !form.type) { Alert.alert('Error', 'Name and type are required'); return; }
    setLoading(true);
    try {
      await createAccount(form);
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create account');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Add Account" footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Create Account</Button>
      </>
    }>
      <View style={styles.form}>
        <Select label="Account Type *" value={form.type} onValueChange={setField('type')}>
          {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Input label="Account Name *" value={form.name} onChangeText={setField('name')} placeholder="e.g. Checking Account" />
        <Input label="Account Code" value={form.code} onChangeText={setField('code')} placeholder="e.g. 1010" />
        <Input label="Description" value={form.description} onChangeText={setField('description')} placeholder="Optional description" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { display: 'flex', flexDirection: 'column', gap: Spacing.md },
});