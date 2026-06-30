import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  clearSession,
  confirmTask,
  getCerts,
  getTasks,
  loadSession,
  login as apiLogin,
  tenantList,
  USE_DEMO,
  type Cert,
  type Session,
  type Task,
  type TaskView,
  type Tenant,
} from './src/api';

const PALETTE = {
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  sub: '#64748b',
  muted: '#94a3b8',
  good: '#16a34a',
  warn: '#d97706',
  bad: '#dc2626',
};

const DEMO_EMAIL: Record<string, string> = {
  shell: 'worker@shell.safeshift.app',
  exxon: 'worker@exxon.safeshift.app',
  chevron: 'worker@chevron.safeshift.app',
};

type Tab = 'home' | 'tasks' | 'certs' | 'profile';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.text} />
        <Text style={styles.mutedText}>Loading SafeShift…</Text>
      </SafeAreaView>
    );
  }

  if (!session) return <LoginScreen onAuthed={setSession} />;
  return <MainApp session={session} onSignOut={() => setSession(null)} />;
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onAuthed }: { onAuthed: (s: Session) => void }) {
  const tenants = useMemo(() => tenantList(), []);
  const [slug, setSlug] = useState<string>('shell');
  const [email, setEmail] = useState(DEMO_EMAIL.shell);
  const [password, setPassword] = useState('Passw0rd!');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = tenants.find((t) => t.slug === slug)?.theme.primary ?? PALETTE.text;

  function pick(t: Tenant) {
    setSlug(t.slug);
    setEmail(DEMO_EMAIL[t.slug] ?? email);
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const s = await apiLogin(email, password);
      onAuthed(s);
    } catch (e) {
      setError((e as Error).message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.logoBadge, { backgroundColor: accent }]}>
          <Text style={styles.logoBadgeText}>S</Text>
        </View>
        <Text style={styles.loginTitle}>SafeShift</Text>
        <Text style={styles.loginSubtitle}>Crew check-in &amp; safety confirmations</Text>

        <View style={styles.brandRow}>
          {tenants.map((t) => {
            const active = t.slug === slug;
            return (
              <Pressable
                key={t.slug}
                onPress={() => pick(t)}
                style={[
                  styles.brandPill,
                  active ? { backgroundColor: t.theme.primary, borderColor: t.theme.primary } : null,
                ]}
              >
                <Text style={[styles.brandPillText, active ? { color: '#fff' } : null]}>{t.theme.logoText}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.safeshift.app"
            placeholderTextColor={PALETTE.muted}
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={PALETTE.muted}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed || busy ? 0.85 : 1 }]}
          >
            <Text style={styles.primaryBtnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>

          <Text style={styles.helperText}>
            Demo accounts: worker@&lt;brand&gt;.safeshift.app · password Passw0rd!
          </Text>
        </View>

        {USE_DEMO ? <Text style={styles.demoNote}>Demo mode · seeded data, no live backend</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Main app shell ────────────────────────────────────────────────────────────
function MainApp({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const accent = session.tenant?.theme.primary ?? PALETTE.text;
  const [tab, setTab] = useState<Tab>('home');

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([getTasks(session), getCerts(session)]);
    setTasks(t);
    setCerts(c);
  }, [session]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function onConfirm(task: Task) {
    const at = await confirmTask(session, task);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, confirmedAt: at } : t)));
  }

  const pending = tasks.filter((t) => !t.confirmedAt);
  const done = tasks.filter((t) => t.confirmedAt);

  async function signOut() {
    await clearSession();
    onSignOut();
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: accent }]}>
        <View>
          <Text style={styles.headerBrand}>
            SafeShift{session.tenant ? ` · ${session.tenant.theme.logoText}` : ''}
          </Text>
          <Text style={styles.headerName}>{session.user.fullName}</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{initials(session.user.fullName)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredFill}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        >
          {tab === 'home' && (
            <HomeTab
              session={session}
              accent={accent}
              pendingCount={pending.length}
              doneCount={done.length}
              certs={certs}
              tasks={pending.slice(0, 3)}
              onConfirm={onConfirm}
              onSeeAll={() => setTab('tasks')}
            />
          )}
          {tab === 'tasks' && (
            <TasksTab accent={accent} pending={pending} done={done} onConfirm={onConfirm} />
          )}
          {tab === 'certs' && <CertsTab certs={certs} />}
          {tab === 'profile' && <ProfileTab session={session} onSignOut={signOut} />}
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <TabButton label="Home" icon="home" active={tab === 'home'} accent={accent} onPress={() => setTab('home')} />
        <TabButton
          label="Tasks"
          icon="tasks"
          active={tab === 'tasks'}
          accent={accent}
          badge={pending.length}
          onPress={() => setTab('tasks')}
        />
        <TabButton label="Certs" icon="certs" active={tab === 'certs'} accent={accent} onPress={() => setTab('certs')} />
        <TabButton
          label="Profile"
          icon="profile"
          active={tab === 'profile'}
          accent={accent}
          onPress={() => setTab('profile')}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function HomeTab({
  session,
  accent,
  pendingCount,
  doneCount,
  certs,
  tasks,
  onConfirm,
  onSeeAll,
}: {
  session: Session;
  accent: string;
  pendingCount: number;
  doneCount: number;
  certs: Cert[];
  tasks: TaskView[];
  onConfirm: (t: Task) => void;
  onSeeAll: () => void;
}) {
  const expiring = certs.filter((c) => c.status !== 'active').length;
  return (
    <View>
      <Text style={styles.greeting}>{greeting()},</Text>
      <Text style={styles.greetingName}>{session.user.fullName.split(' ')[0]}</Text>
      {session.tenant ? <Text style={styles.programLine}>{session.tenant.safetyProgramLabels.programName}</Text> : null}

      <View style={styles.statRow}>
        <StatCard value={pendingCount} label="To confirm" tone={pendingCount ? 'warn' : 'good'} />
        <StatCard value={doneCount} label="Completed" tone="good" />
        <StatCard value={expiring} label="Certs due" tone={expiring ? 'bad' : 'good'} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s tasks</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={[styles.link, { color: accent }]}>See all</Text>
        </Pressable>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>All caught up ✓</Text>
          <Text style={styles.emptySub}>You have no outstanding confirmations.</Text>
        </View>
      ) : (
        tasks.map((t) => <TaskCard key={t.id} task={t} accent={accent} onConfirm={onConfirm} />)
      )}
    </View>
  );
}

function TasksTab({
  accent,
  pending,
  done,
  onConfirm,
}: {
  accent: string;
  pending: TaskView[];
  done: TaskView[];
  onConfirm: (t: Task) => void;
}) {
  return (
    <View>
      <Text style={styles.pageTitle}>My tasks</Text>
      <Text style={styles.pageSub}>Confirm attendance, sign in to talks, and acknowledge safety rules.</Text>

      <Text style={styles.groupLabel}>To confirm ({pending.length})</Text>
      {pending.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing pending ✓</Text>
          <Text style={styles.emptySub}>Great work — everything is confirmed.</Text>
        </View>
      ) : (
        pending.map((t) => <TaskCard key={t.id} task={t} accent={accent} onConfirm={onConfirm} />)
      )}

      {done.length > 0 && (
        <>
          <Text style={[styles.groupLabel, { marginTop: 18 }]}>Completed ({done.length})</Text>
          {done.map((t) => (
            <TaskCard key={t.id} task={t} accent={accent} onConfirm={onConfirm} />
          ))}
        </>
      )}
    </View>
  );
}

function CertsTab({ certs }: { certs: Cert[] }) {
  return (
    <View>
      <Text style={styles.pageTitle}>My certifications</Text>
      <Text style={styles.pageSub}>Keep these current to stay site-ready.</Text>
      {certs.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.taskTitle}>{c.name}</Text>
            <StatusPill status={c.status} />
          </View>
          <Text style={styles.taskMeta}>
            {c.issuer ? `${c.issuer} · ` : ''}
            {c.expiresAt ? `Expires ${c.expiresAt}` : 'No expiry'}
            {c.daysToExpiry !== null
              ? c.daysToExpiry < 0
                ? ` · ${Math.abs(c.daysToExpiry)}d overdue`
                : ` · ${c.daysToExpiry}d left`
              : ''}
          </Text>
        </View>
      ))}
      {certs.length === 0 ? <Text style={styles.mutedText}>No certifications on record.</Text> : null}
    </View>
  );
}

function ProfileTab({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <View>
      <Text style={styles.pageTitle}>Profile</Text>
      <View style={styles.card}>
        <Field label="Name" value={session.user.fullName} />
        <Field label="Email" value={session.user.email} />
        <Field label="Role" value={prettyRole(session.user.role)} />
        <Field label="Company" value={session.tenant?.displayName ?? 'Platform'} />
        {session.tenant ? <Field label="Safety program" value={session.tenant.safetyProgramLabels.programName} /> : null}
      </View>
      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      {USE_DEMO ? <Text style={styles.demoNote}>Demo mode · seeded data, no live backend</Text> : null}
    </View>
  );
}

// ── Reusable pieces ───────────────────────────────────────────────────────────
function TaskCard({ task, accent, onConfirm }: { task: TaskView; accent: string; onConfirm: (t: Task) => void }) {
  const confirmed = Boolean(task.confirmedAt);
  return (
    <View style={[styles.card, confirmed ? styles.cardDone : null]}>
      <View style={styles.rowBetween}>
        <View style={styles.kindTag}>
          <Text style={styles.kindTagText}>{kindLabel(task.kind)}</Text>
        </View>
        {task.mandatory ? (
          <View style={styles.mandatoryTag}>
            <Text style={styles.mandatoryText}>Mandatory</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      {task.detail ? <Text style={styles.taskDetail}>{task.detail}</Text> : null}
      <Text style={styles.taskMeta}>
        {task.whenISO ? formatWhen(task.whenISO) : 'Anytime'}
        {task.location ? ` · ${task.location}` : ''}
      </Text>

      {confirmed ? (
        <View style={styles.confirmedRow}>
          <Text style={[styles.confirmedText, { color: PALETTE.good }]}>✓ Confirmed</Text>
          <Text style={styles.confirmedAt}>{formatWhen(task.confirmedAt as string)}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onConfirm(task)}
          style={({ pressed }) => [styles.confirmBtn, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.confirmBtnText}>{task.confirmLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatCard({ value, label, tone }: { value: number; label: string; tone: 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? PALETTE.good : tone === 'warn' ? PALETTE.warn : PALETTE.bad;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Cert['status'] }) {
  const map = {
    active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
    expiring: { bg: '#fef9c3', fg: '#854d0e', label: 'Expiring' },
    expired: { bg: '#fee2e2', fg: '#991b1b', label: 'Expired' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  accent,
  badge,
  onPress,
}: {
  label: string;
  icon: 'home' | 'tasks' | 'certs' | 'profile';
  active: boolean;
  accent: string;
  badge?: number;
  onPress: () => void;
}) {
  const color = active ? accent : PALETTE.muted;
  return (
    <Pressable style={styles.tabBtn} onPress={onPress}>
      <View>
        <Text style={[styles.tabGlyph, { color }]}>{glyph(icon)}</Text>
        {badge ? (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function prettyRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
function kindLabel(kind: Task['kind']): string {
  return kind === 'toolbox' ? 'Toolbox talk' : kind === 'training' ? 'Training' : 'Acknowledgement';
}
function glyph(icon: 'home' | 'tasks' | 'certs' | 'profile'): string {
  return icon === 'home' ? '⌂' : icon === 'tasks' ? '☑' : icon === 'certs' ? '🛡' : '☺';
}
function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PALETTE.bg },
  centeredFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mutedText: { color: PALETTE.sub, marginTop: 10, fontSize: 14 },

  // Login
  loginScroll: { padding: 24, paddingTop: 64, alignItems: 'center' },
  logoBadge: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoBadgeText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  loginTitle: { fontSize: 30, fontWeight: '800', color: PALETTE.text, marginTop: 14 },
  loginSubtitle: { fontSize: 14, color: PALETTE.sub, marginTop: 4 },
  brandRow: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 4 },
  brandPill: { borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  brandPillText: { fontSize: 13, fontWeight: '700', color: PALETTE.sub },

  card: { width: '100%', backgroundColor: PALETTE.card, borderRadius: 16, borderWidth: 1, borderColor: PALETTE.border, padding: 16, marginTop: 14 },
  cardDone: { backgroundColor: '#f8fafc' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  input: { marginTop: 6, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: PALETTE.text, backgroundColor: '#fff' },
  errorText: { color: PALETTE.bad, fontSize: 13, marginTop: 10 },
  primaryBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  helperText: { color: PALETTE.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  demoNote: { color: PALETTE.muted, fontSize: 12, marginTop: 18, textAlign: 'center' },

  // Header
  header: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  headerName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  content: { padding: 16, paddingBottom: 28 },

  // Home
  greeting: { fontSize: 16, color: PALETTE.sub },
  greetingName: { fontSize: 26, fontWeight: '800', color: PALETTE.text },
  programLine: { fontSize: 13, color: PALETTE.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: PALETTE.card, borderRadius: 14, borderWidth: 1, borderColor: PALETTE.border, padding: 14, alignItems: 'flex-start' },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: PALETTE.sub, marginTop: 2, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text },
  link: { fontSize: 14, fontWeight: '700' },

  pageTitle: { fontSize: 24, fontWeight: '800', color: PALETTE.text },
  pageSub: { fontSize: 14, color: PALETTE.sub, marginTop: 4 },
  groupLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16 },

  // Task card
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kindTag: { backgroundColor: '#eef2f7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  kindTagText: { fontSize: 11, fontWeight: '700', color: PALETTE.sub, textTransform: 'uppercase', letterSpacing: 0.5 },
  mandatoryTag: { backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  mandatoryText: { fontSize: 11, fontWeight: '700', color: '#b91c1c' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text, marginTop: 10, flexShrink: 1 },
  taskDetail: { fontSize: 13, color: PALETTE.sub, marginTop: 4 },
  taskMeta: { fontSize: 12, color: PALETTE.muted, marginTop: 8 },
  confirmBtn: { marginTop: 14, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmedRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirmedText: { fontWeight: '700', fontSize: 14 },
  confirmedAt: { color: PALETTE.muted, fontSize: 12 },

  // Empty
  emptyCard: { backgroundColor: PALETTE.card, borderRadius: 14, borderWidth: 1, borderColor: PALETTE.border, padding: 20, marginTop: 12, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text },
  emptySub: { fontSize: 13, color: PALETTE.sub, marginTop: 4, textAlign: 'center' },

  // Pills / fields
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  field: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  fieldLabel: { fontSize: 12, color: PALETTE.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldValue: { fontSize: 15, color: PALETTE.text, marginTop: 2, fontWeight: '600' },
  signOutBtn: { marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', paddingVertical: 13, alignItems: 'center' },
  signOutText: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: PALETTE.border, paddingTop: 8, paddingBottom: 20 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabGlyph: { fontSize: 20 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabBadge: { position: 'absolute', top: -4, right: -10, backgroundColor: '#dc2626', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
