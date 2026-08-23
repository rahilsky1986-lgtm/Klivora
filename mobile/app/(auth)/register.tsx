import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { api, getErrorMessage, setAccessToken } from '../../lib/api';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = businessName.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && password === confirmPassword && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register', {
        email: email.trim(),
        password,
        businessName: businessName.trim(),
      });
      const token = res.data?.session?.access_token;
      if (!token) throw new Error('Missing access token from registration response.');
      await setAccessToken(token);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
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
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              style={styles.input}
              placeholder="Business Name"
              autoCapitalize="words"
              placeholderTextColor={Colors.text3}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.text3}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Password (min 6 chars)"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={Colors.text3}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={Colors.text3}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Button variant="primary" loading={loading} onPress={submit} fullWidth disabled={!canSubmit}>
              {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </Button>
          </View>

          <TouchableOpacity onPress={() => router.replace('/(auth)/index')} style={styles.footerLink}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLinkText}>Sign in</Text></Text>
          </TouchableOpacity>
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
  input: { height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.text, marginBottom: 10, backgroundColor: Colors.surface2 },
  error: { color: Colors.danger, marginTop: 2, marginBottom: 6, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '700' },
  footerLink: { alignItems: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: 14, color: Colors.text2 },
  footerLinkText: { color: Colors.primary, fontWeight: '700' },
});