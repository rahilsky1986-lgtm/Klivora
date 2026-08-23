import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { createEmployee, updateEmployee, getEmployee } from '../../lib/api';
import { toCents, toDollars, today, PAY_FREQUENCIES } from '../../lib/formatters';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId?: string;
  currency: string;
}

export default function EmployeeForm({ open, onClose, onSave, employeeId, currency }: EmployeeFormProps) {
  const isEdit = !!employeeId;
  const [form, setForm] = useState({
    name: '',
    email: '',
    salary: '',
    frequency: 'monthly',
    tax_info: { tax_rate: '20' },
    start_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (open && isEdit && employeeId) {
      setPageLoading(true);
      getEmployee(employeeId).then((res) => {
        const e = res.data;
        setForm({
          name: e.name || '',
          email: e.email || '',
          salary: toDollars(e.salary),
          frequency: e.frequency || 'monthly',
          tax_info: e.tax_info || { tax_rate: '20' },
          start_date: e.start_date || '',
        });
        setPageLoading(false);
      }).catch(() => setPageLoading(false));
    } else if (open && !isEdit) {
      setForm({
        name: '',
        email: '',
        salary: '',
        frequency: 'monthly',
        tax_info: { tax_rate: '20' },
        start_date: '',
      });
    }
  }, [open, employeeId, isEdit]);

  const setField = (k: string) => (text: string) => setForm((f) => ({ ...f, [k]: text }));
  const setTax = (k: string) => (text: string) => setForm((f) => ({ ...f, tax_info: { ...f.tax_info, [k]: text } }));

  const handleSubmit = async () => {
    if (!form.name || !form.salary) { Alert.alert('Error', 'Name and salary are required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, salary: toCents(form.salary), tax_info: form.tax_info };
      if (isEdit) await updateEmployee(employeeId!, payload);
      else await createEmployee(payload);
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save employee');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add Employee'} footer={
      <>
        <Button variant="ghost" onPress={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>Save</Button>
      </>
    }>
      {pageLoading ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : (
        <View style={styles.form}>
          <Input label="Full Name *" value={form.name} onChangeText={setField('name')} placeholder="Jane Smith" />
          <Input label="Email" type="email" value={form.email} onChangeText={setField('email')} />
          <View style={styles.row}>
            <Input label="Salary *" type="decimal" value={form.salary} onChangeText={setField('salary')} placeholder="0.00" />
            <Select label="Frequency" value={form.frequency} onValueChange={setField('frequency')}>
              {PAY_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </View>
          <Input label="Tax Rate %" type="decimal" value={form.tax_info.tax_rate} onChangeText={setTax('tax_rate')} placeholder="20" />
          <Input label="Start Date" type="date" value={form.start_date} onChangeText={setField('start_date')} />
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