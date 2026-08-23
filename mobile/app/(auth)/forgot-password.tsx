import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { api, getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reset email. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrap} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
            <Text style={styles.title}>Klivora</Text>
            <Text style={styles.subtitle}>{success ? 'Check your email' : 'Reset your password'}</Text>
          </View>

          <View style={styles.card}>
            {!success && (
              <>
                <Text style={styles.instruction}>Enter your email address and we'll send you a link to reset your password.</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.text3}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
                <Button variant="primary" loading={loading} onPress={submit} fullWidth disabled={!canSubmit}>
                  {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
                </Button>
              </>
            )}
            {success && (
              <>
                <View style={styles.successIcon}>✓</View>
                <Text style={styles.successTitle}>Email sent!</Text>
                <Text style={styles.successText}>If an account exists for {email}, you'll receive a password reset link shortly.</Text>
                <Button variant="primary" onPress={() => router.replace('/(auth)/index')} fullWidth style={{ marginTop: Spacing.lg }}>
                  Back to Sign In
                </Button>
              </>
            )}
          </View>

          {!success && (
            <TouchableOpacity onPress={() => router.replace('/(auth)/index')} style={styles.footerLink}>
              <Text style={styles.footerText}>Remember your password? <Text style={styles.footerLinkText}>Sign in</Text></Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  wrap: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  scrollContent: { flexGrow: 1 },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: 'white', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { marginTop: 6, color: Colors.text2, fontSize: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  instruction: { fontSize: 13, color: Colors.text2, marginBottom: Spacing.lg, textAlign: 'center', lineHeight: 20 },
  input: { height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.text, marginBottom: 10, backgroundColor: Colors.surface2 },
  error: { color: Colors.danger, marginTop: 2, marginBottom: 6, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '700' },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, alignSelf: 'center' },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.accent, textAlign: 'center', marginBottom: Spacing.sm },
  successText: { fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 20 },
  footerLink: { alignItems: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: 14, color: Colors.text2 },
  footerLinkText: { color: Colors.primary, fontWeight: '700' },
});