import { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { getErrorMessage, getWithRetry, updateProfile, uploadLogo } from '../../lib/api';
import { getInitials, CURRENCIES } from '../../lib/formatters';
import { Button, Input, Select, Textarea } from '../../components/ui/Input';

const TABS = [
  { id: 'profile', label: 'Business Profile' },
  { id: 'invoice', label: 'Invoice Settings' },
  { id: 'account', label: 'Account' },
];

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: '',
    currency: 'USD',
    tax_number: '',
    address: { street: '', city: '', country: '' },
    invoice_prefix: 'INV',
    invoice_notes: '',
    payment_terms: 'Due within 30 days',
    primary_color: '#2D6BE4',
  });
  const fileRef = useRef<any>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await getWithRetry('/users/me');
      setUser(res.data);
      const p = res.data.profile || {};
      setForm({
        business_name: p.business_name || '',
        currency: p.currency || 'USD',
        tax_number: p.tax_number || '',
        address: p.address || { street: '', city: '', country: '' },
        invoice_prefix: p.invoice_prefix || 'INV',
        invoice_notes: p.invoice_notes || '',
        payment_terms: p.payment_terms || 'Due within 30 days',
        primary_color: p.primary_color || '#2D6BE4',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setField = (k: string) => (text: string) => setForm((f: any) => ({ ...f, [k]: text }));
  const setAddr = (k: string) => (text: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: text } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      await load();
      Alert.alert('Success', 'Settings saved!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save settings');
    }
    setSaving(false);
  };

  const handleLogoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setLogoUploading(true);
        try {
          await uploadLogo({ uri: result.assets[0].uri, name: 'logo.jpg', type: 'image/jpeg' });
          Alert.alert('Success', 'Logo updated!');
          await load();
        } catch { Alert.alert('Error', 'Upload failed'); }
        setLogoUploading(false);
      }
    } catch { Alert.alert('Error', 'Could not pick image'); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your business profile and preferences</Text>
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'profile' && (
          <View style={styles.form}>
            {/* Logo */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Business Logo</Text>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  {user?.profile?.logo_url ? (
                    <Image source={{ uri: user.profile.logo_url }} style={styles.logoImage} />
                  ) : (
                    <Text style={styles.logoInitials}>{getInitials(form.business_name || 'My')}</Text>
                  )}
                </View>
                <View style={styles.logoActions}>
                  <Button variant="secondary" icon="📷" loading={logoUploading} onPress={handleLogoUpload} fullWidth>
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <Text style={styles.logoHint}>PNG or JPG, max 5MB</Text>
                </View>
              </View>
            </View>

            {/* Business Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Business Information</Text>
              <Input label="Business Name" value={form.business_name} onChangeText={setField('business_name')} placeholder="Acme Corp" />
              <Input label="Street Address" value={form.address.street} onChangeText={setAddr('street')} placeholder="123 Main St" />
              <View style={styles.row}>
                <Input label="City" value={form.address.city} onChangeText={setAddr('city')} />
                <Input label="Country" value={form.address.country} onChangeText={setAddr('country')} />
              </View>
              <Input label="Tax / VAT Number" value={form.tax_number} onChangeText={setField('tax_number')} placeholder="Optional" />
              <Select label="Default Currency" value={form.currency} onValueChange={setField('currency')}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </Select>
            </View>
          </View>
        )}

        {tab === 'invoice' && (
          <View style={[styles.card, styles.form]}>
            <Text style={styles.cardTitle}>Invoice Customization</Text>
            <Input label="Invoice Prefix" value={form.invoice_prefix} onChangeText={setField('invoice_prefix')} placeholder="e.g. INV-0001" hint="e.g. INV-0001, BILL-0001" />
            <Input label="Default Payment Terms" value={form.payment_terms} onChangeText={setField('payment_terms')} placeholder="Due within 30 days" />
            <Textarea label="Default Invoice Notes" value={form.invoice_notes} onChangeText={setField('invoice_notes')} rows={3} placeholder="Thank you for your business!" />
            <View style={styles.colorRow}>
              <Text style={styles.colorLabel}>Brand Color</Text>
              <View style={styles.colorInput}>
                <Input
                  type="text"
                  value={form.primary_color}
                  onChangeText={setField('primary_color')}
                  style={[styles.colorPicker, { backgroundColor: form.primary_color }]}
                />
                <Text style={styles.colorHint}>Used on invoices and payslips</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'account' && (
          <View style={styles.form}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Email</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Danger Zone</Text>
              <Text style={styles.dangerText}>Deleting your account is irreversible. All your data will be permanently removed.</Text>
              <Button variant="danger" onPress={() => Alert.alert('Not available', 'Account deletion not available in demo')} fullWidth>
                Delete Account
              </Button>
            </View>
          </View>
        )}

        <Button variant="primary" loading={saving} onPress={handleSave} fullWidth style={{ marginTop: Spacing.lg }}>
          Save All Changes
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.text2, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary, borderRadius: Radius.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tabTextActive: { color: 'white', fontWeight: '700' },
  form: { display: 'flex', flexDirection: 'column', gap: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  logoBox: { width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%', borderRadius: Radius.lg },
  logoInitials: { fontWeight: '800', fontSize: 28, color: Colors.primary },
  logoActions: { flex: 1, gap: Spacing.sm },
  logoHint: { fontSize: 12, color: Colors.text3 },
  row: { flexDirection: 'row', gap: Spacing.md },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  colorLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, width: 100 },
  colorInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  colorPicker: { width: 48, height: 42, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  colorHint: { fontSize: 12, color: Colors.text3 },
  accountInfo: { padding: Spacing.md, backgroundColor: Colors.surface2, borderRadius: Radius.md },
  accountLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  accountEmail: { fontSize: 14, color: Colors.text2, marginTop: 4 },
  dangerText: { fontSize: 14, color: Colors.text2, marginBottom: Spacing.md, lineHeight: 20 },
});