import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';
import { setAccessToken } from '../../lib/api';

type MenuItemProps = {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  color?: string;
  right?: React.ReactNode;
};

const MenuItem = ({ icon, label, sub, onPress, color = Colors.text, right }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={styles.menuInfo}>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    {right ?? <Text style={styles.chevron}>{'>'}</Text>}
  </TouchableOpacity>
);

export default function MoreScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173';

  const openWeb = () => {
    Linking.openURL(webUrl);
  };

  const signOut = async () => {
    try {
      await setAccessToken(null);
      router.replace('/(auth)/index');
    } catch {
      Alert.alert('Sign out failed', 'Could not clear local session. Please try again.');
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Do you want to sign out of Klivora on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <View>
            <Text style={styles.appName}>Klivora</Text>
            <Text style={styles.tagline}>Mobile accounting workspace</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PRODUCTIVITY</Text>
        <View style={styles.section}>
          <MenuItem icon="RN" label="Push notifications" sub="Invoice due and payment updates" right={<Switch value={pushEnabled} onValueChange={setPushEnabled} />} />
          <MenuItem icon="EM" label="Email alerts" sub="Daily summary and overdue reminders" right={<Switch value={emailAlerts} onValueChange={setEmailAlerts} />} />
        </View>

        <Text style={styles.sectionLabel}>WORKSPACE</Text>
        <View style={styles.section}>
          <MenuItem icon="WB" label="Open Web App" sub="Run full workflow in browser" onPress={openWeb} />
          <MenuItem icon="RP" label="Reports" sub="P&L, tax and balance overview" onPress={openWeb} />
          <MenuItem icon="AC" label="Accounting" sub="Chart of accounts and journals" onPress={openWeb} />
        </View>

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.section}>
          <MenuItem icon="HP" label="Help Center" onPress={() => Linking.openURL('https://klivora.app/help')} />
          <MenuItem icon="PP" label="Privacy Policy" onPress={() => Linking.openURL('https://klivora.app/privacy')} />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.section}>
          <MenuItem icon="SO" label="Sign out" sub="Clear local session from this device" onPress={confirmSignOut} color={Colors.danger} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Klivora v1.0.0</Text>
          <Text style={styles.footerSub}>Operational tools for small businesses</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: 'white', fontWeight: '800', fontSize: 22 },
  appName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  tagline: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  section: { backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: Spacing.xl, overflow: 'hidden', ...Shadow.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: { fontSize: 12, marginRight: Spacing.md, width: 30, fontWeight: '700', color: Colors.text3 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  chevron: { fontSize: 18, color: Colors.text3, marginLeft: 8 },
  footer: { alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: 13, color: Colors.text3, fontWeight: '500' },
  footerSub: { fontSize: 12, color: Colors.text3, marginTop: 4 },
});
