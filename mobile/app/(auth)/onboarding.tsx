import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { api, getErrorMessage, setAccessToken, getAccessToken } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Profile {
  business_name: string;
  currency: string;
  tax_number: string;
  address: { street: string; city: string; country: string };
  invoice_prefix: string;
  invoice_notes: string;
  payment_terms: string;
  primary_color: string;
  onboarding_complete: boolean;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business info
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('USD');
  // Step 2: Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  // Step 3: Invoice defaults
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [paymentTerms, setPaymentTerms] = useState('Due within 30 days');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2D6BE4');

  const CURRENCIES = [
    { code: 'USD', label: 'USD ($)' },
    { code: 'EUR', label: 'EUR (€)' },
    { code: 'GBP', label: 'GBP (£)' },
    { code: 'CAD', label: 'CAD ($)' },
    { code: 'AUD', label: 'AUD ($)' },
  ];

  const nextStep = () => {
    if (step === 1 && !businessName.trim()) { setError('Business name is required'); return; }
    if (step === 2 && !street.trim()) { setError('Street address is required'); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const prevStep = () => { setError(null); setStep((s) => s - 1); };

  const finish = async () => {
    if (!invoicePrefix.trim()) { setError('Invoice prefix is required'); return; }
    setLoading(true);
    try {
      setError(null);
      const profile: Partial<Profile> = {
        business_name: businessName.trim(),
        currency,
        tax_number: taxNumber.trim(),
        address: { street: street.trim(), city: city.trim(), country: country.trim() },
        invoice_prefix: invoicePrefix.trim().toUpperCase(),
        invoice_notes: invoiceNotes.trim(),
        payment_terms: paymentTerms.trim(),
        primary_color: primaryColor,
        onboarding_complete: true,
      };
      await api.put('/users/me', profile);
      await setAccessToken((await getAccessToken()) || '');
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to complete onboarding'));
    }
    setLoading(false);
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Business</Text>
      <Text style={styles.stepSubtitle}>Tell us about your business to personalize Klivora</Text>
      <Input label="Business Name *" value={businessName} onChangeText={setBusinessName} placeholder="Acme Corp" />
      <Select label="Default Currency" value={currency} onValueChange={setCurrency}>
        {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
      </Select>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address & Tax</Text>
      <Text style={styles.stepSubtitle}>Used on invoices and for tax calculations</Text>
      <Input label="Street Address *" value={street} onChangeText={setStreet} placeholder="123 Main St" />
      <View style={styles.row}>
        <Input label="City *" value={city} onChangeText={setCity} />
        <Input label="Country *" value={country} onChangeText={setCountry} />
      </View>
      <Input label="Tax / VAT Number" value={taxNumber} onChangeText={setTaxNumber} placeholder="Optional" />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Invoice Defaults</Text>
      <Text style={styles.stepSubtitle}>These will be used for new invoices</Text>
      <Input label="Invoice Prefix *" value={invoicePrefix} onChangeText={setInvoicePrefix} placeholder="INV" hint="e.g. INV-0001, BILL-0001" />
      <Input label="Default Payment Terms" value={paymentTerms} onChangeText={setPaymentTerms} placeholder="Due within 30 days" />
      <Textarea label="Default Invoice Notes" value={invoiceNotes} onChangeText={setInvoiceNotes} rows={3} placeholder="Thank you for your business!" />
      <View style={styles.colorRow}>
        <Text style={styles.colorLabel}>Brand Color</Text>
        <View style={styles.colorInput}>
          <Input
            type="text"
            value={primaryColor}
            onChangeText={setPrimaryColor}
            style={[styles.colorPicker, { backgroundColor: primaryColor }]}
          />
          <Text style={styles.colorHint}>Used on invoices and payslips</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrap} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
            <Text style={styles.title}>Welcome to Klivora</Text>
            <Text style={styles.subtitle}>Let's set up your account in 3 quick steps</Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progress}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={[styles.progressStep, s <= step && styles.progressStepActive]}>
                <View style={[styles.progressCircle, s <= step && styles.progressCircleActive]} />
                <Text style={[styles.progressLabel, s === step && styles.progressLabelActive]}>{s === 1 ? 'Business' : s === 2 ? 'Address' : 'Invoices'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.stepActions}>
              {step > 1 && (
                <Button variant="ghost" onPress={prevStep} fullWidth>
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                loading={loading}
                onPress={step < 3 ? nextStep : finish}
                fullWidth
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : step < 3
                  ? <Text style={styles.buttonText}>Next</Text>
                  : <Text style={styles.buttonText}>Get Started</Text>}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reuse Input, Select, Textarea from components
const Input = ({ label, value, onChangeText, placeholder, type, style, hint }: any) => (
  <View style={[styles.field, style]}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <TextInput
      style={[
        styles.input,
        type === 'color' && styles.colorPickerInput,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text3}
      autoCapitalize={type === 'email' ? 'none' : 'words'}
      keyboardType={type === 'email' ? 'email-address' : 'default'}
    />
    {hint && <Text style={styles.fieldHint}>{hint}</Text>}
  </View>
);

const Select = ({ label, value, onValueChange, children, style }: any) => (
  <View style={[styles.field, style]}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <TextInput
      style={styles.selectInput}
      value={value}
      onChangeText={onValueChange}
      editable={false}
      caretHidden
    >
      {children}
    </TextInput>
  </View>
);

const Textarea = ({ label, value, onChangeText, placeholder, rows, style }: any) => (
  <View style={[styles.field, style]}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <TextInput
      style={[styles.input, styles.textarea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text3}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  wrap: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  scrollContent: { flexGrow: 1 },
  brand: { alignItems: 'center', marginBottom: Spacing.lg },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: 'white', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { marginTop: 6, color: Colors.text2, fontSize: 14 },
  progress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl, paddingHorizontal: Spacing.md },
  progressStep: { flex: 1, alignItems: 'center' },
  progressStepActive: {},
  progressCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  progressLabel: { fontSize: 10, color: Colors.text3, marginTop: 4, textAlign: 'center' },
  progressLabelActive: { color: Colors.primary, fontWeight: '700' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  stepContent: { gap: Spacing.md },
  stepTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: Colors.text2, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  input: { height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface2 },
  textarea: { height: undefined, minHeight: 100, paddingVertical: Spacing.md },
  selectInput: { height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface2 },
  fieldHint: { fontSize: 11, color: Colors.text3, marginTop: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  colorLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, width: 100 },
  colorInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  colorPicker: { width: 48, height: 42, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  colorPickerInput: { width: 48, height: 42 },
  colorHint: { fontSize: 12, color: Colors.text3 },
  error: { color: Colors.danger, marginTop: 2, marginBottom: 6, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stepActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '700' },
});