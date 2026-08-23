import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { createCustomer, updateCustomer, getCustomer } from '../../lib/api';
import { CURRENCIES } from '../../lib/formatters';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  customerId?: string;
}

export default function CustomerForm({ open, onClose, onSave, customerId }: CustomerFormProps) {
  const isEdit = !!customerId;
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currency: 'USD',
    address: { street: '', city: '', country: '' },
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (open && isEdit && customerId) {
      setPageLoading(true);
      getCustomer(customerId).then((res) => {
        const c = res.data;
        setForm({
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          currency: c.currency || 'USD',
          address: c.address || { street: '', city: '', country: '' },
          notes: c.notes || '',
        });
        setPageLoading(false);
      }).catch(() => setPageLoading(false));
    } else if (open && !isEdit) {
      setForm({
        name: '',
        email: '',
        phone: '',
        currency: 'USD',
        address: { street: '', city: '', country: '' },
        notes: '',
      });
    }
  }, [open, customerId, isEdit]);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));
  const setAddr = (k: string) => (text: string) => setForm((f) => ({ ...f, address: { ...f.address, [k]: text } }));

  const handleSubmit = async () => {
    if (!form.name) { Alert.alert('Error', 'Customer name is required'); return; }
    setLoading(true);
    try {
      if (isEdit) await updateCustomer(customerId!, form);
      else await createCustomer(form);
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save customer');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add Customer'} footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Save Customer</Button>
      </>
    }>
      {pageLoading ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : (
        <View style={styles.form}>
          <Input label="Full Name *" value={form.name} onChangeText={setField('name')} placeholder="John Smith" />
          <Input label="Email" type="email" value={form.email} onChangeText={setField('email')} placeholder="john@example.com" />
          <Input label="Phone" value={form.phone} onChangeText={setField('phone')} placeholder="+1 555 0100" />
          <Select label="Currency" value={form.currency} onValueChange={setField('currency')}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </Select>
          <Input label="Street" value={form.address.street} onChangeText={setAddr('street')} placeholder="123 Main St" />
          <View style={styles.row}>
            <Input label="City" value={form.address.city} onChangeText={setAddr('city')} />
            <Input label="Country" value={form.address.country} onChangeText={setAddr('country')} />
          </View>
          <Textarea label="Notes" value={form.notes} onChangeText={setField('notes')} rows={2} placeholder="Optional notes" />
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
});