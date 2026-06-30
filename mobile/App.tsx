import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tenant = {
  id: string;
  slug: string;
  displayName: string;
  theme: { logoText: string; primary: string; secondary: string; accent: string };
};

type User = {
  id: string;
  role: string;
  fullName: string;
  email: string;
};

type Dashboard = {
  scope: 'tenant' | 'platform';
  stats?: {
    workforce: number;
    upcomingTrainings: number;
    certifications: number;
    auditReadiness: number;
    certStatus: { active: number; expiring: number; expired: number };
  };
};

type Session = {
  token: string;
  user: User;
  tenantSlug: string | null;
};

const DEMO_PASSWORD = 'Passw0rd!';
const SESSION_KEY = 'safeshift.mobile.session.v1';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:4100/api' : 'http://localhost:4100/api');

const BRAND_DEMO_EMAIL: Record<string, string> = {
  shell: 'hse@shell.safeshift.app',
  exxon: 'hse@exxon.safeshift.app',
  chevron: 'hse@chevron.safeshift.app',
};

function prettyRole(role: string) {
  return role.replace('_', ' ');
}

async function apiFetch<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    token?: string | null;
    tenantSlug?: string | null;
    body?: unknown;
  },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) headers.Authorization = `Bearer ${options.token}`;
  if (options?.tenantSlug) headers['X-Tenant'] = options.tenantSlug;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      // ignore parsing errors and keep fallback message
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export default function App() {
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>('shell');
  const [email, setEmail] = useState('admin@safeshift.app');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.slug === selectedSlug) ?? null,
    [tenants, selectedSlug],
  );

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const [{ tenants: tenantList }, rawSession] = await Promise.all([
        apiFetch<{ tenants: Tenant[] }>('/tenants'),
        AsyncStorage.getItem(SESSION_KEY),
      ]);
      setTenants(tenantList);
      if (tenantList.length > 0 && !selectedSlug) setSelectedSlug(tenantList[0].slug);

      if (rawSession) {
        const parsed = JSON.parse(rawSession) as Session;
        setSession(parsed);
        await loadDashboard(parsed.token, parsed.tenantSlug);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingBoot(false);
    }
  }

  async function loadDashboard(token: string, tenantSlug: string | null) {
    const data = await apiFetch<Dashboard>('/dashboard', { token, tenantSlug });
    setDashboard(data);
  }

  function pickBrand(slug: string | null) {
    setSelectedSlug(slug);
    setError(null);
    if (slug) setEmail(BRAND_DEMO_EMAIL[slug] ?? 'admin@safeshift.app');
    else setEmail('admin@safeshift.app');
    setPassword(DEMO_PASSWORD);
  }

  async function login() {
    setLoadingAction(true);
    setError(null);
    try {
      const payload = await apiFetch<{ token: string; user: User; tenant: Tenant | null }>('/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      });

      const tenantSlug = payload.tenant?.slug ?? selectedSlug ?? null;
      const nextSession: Session = { token: payload.token, user: payload.user, tenantSlug };
      setSession(nextSession);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      await loadDashboard(nextSession.token, nextSession.tenantSlug);
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoadingAction(false);
    }
  }

  async function logout() {
    setSession(null);
    setDashboard(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  if (loadingBoot) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Booting SafeShift Mobile…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.kicker}>SafeShift Mobile</Text>
            <Text style={styles.title}>Staff Login</Text>
            <Text style={styles.subtitle}>Expo SDK 54 app connected to your existing SafeShift API.</Text>

            <View style={styles.brandRow}>
              <BrandChip label="Platform" active={selectedSlug === null} onPress={() => pickBrand(null)} />
              {tenants.map((t) => (
                <BrandChip
                  key={t.slug}
                  label={t.theme.logoText}
                  active={selectedSlug === t.slug}
                  onPress={() => pickBrand(t.slug)}
                />
              ))}
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} secureTextEntry onChangeText={setPassword} />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable style={styles.primaryBtn} onPress={login} disabled={loadingAction}>
              <Text style={styles.primaryBtnText}>{loadingAction ? 'Signing in…' : 'Sign in'}</Text>
            </Pressable>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Quick demo account</Text>
              <Pressable
                style={styles.demoBtn}
                onPress={() => setEmail(selectedSlug ? BRAND_DEMO_EMAIL[selectedSlug] : 'admin@safeshift.app')}
              >
                <Text style={styles.demoBtnText}>
                  Use {selectedTenant?.displayName ?? 'platform'} demo email
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.kicker}>{session.tenantSlug ? session.tenantSlug.toUpperCase() : 'PLATFORM'}</Text>
          <Text style={styles.title}>Hello, {session.user.fullName}</Text>
          <Text style={styles.subtitle}>Role: {prettyRole(session.user.role)}</Text>

          {dashboard?.stats ? (
            <View style={styles.metricsGrid}>
              <Metric label="Audit readiness" value={`${dashboard.stats.auditReadiness}%`} />
              <Metric label="Workforce" value={`${dashboard.stats.workforce}`} />
              <Metric label="Upcoming training" value={`${dashboard.stats.upcomingTrainings}`} />
              <Metric label="Certifications" value={`${dashboard.stats.certifications}`} />
            </View>
          ) : (
            <Text style={styles.subtitle}>Platform overview loaded.</Text>
          )}

          <Pressable style={styles.secondaryBtn} onPress={() => loadDashboard(session.token, session.tenantSlug)}>
            <Text style={styles.secondaryBtnText}>Refresh dashboard</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={logout}>
            <Text style={styles.secondaryBtnText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BrandChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.brandChip, active ? styles.brandChipActive : styles.brandChipIdle]}
    >
      <Text style={[styles.brandChipText, active ? styles.brandChipTextActive : styles.brandChipTextIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    color: '#0f172a',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  errorText: {
    marginTop: 4,
    color: '#b91c1c',
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 10,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  brandRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandChipActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  brandChipIdle: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandChipTextActive: {
    color: '#ffffff',
  },
  brandChipTextIdle: {
    color: '#475569',
  },
  demoBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  demoTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  demoBtn: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    paddingVertical: 9,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsGrid: {
    marginTop: 8,
    gap: 10,
  },
  metricCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 4,
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
});
