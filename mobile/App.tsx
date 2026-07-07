import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, FeaturedIcon, LogoMark, type IconName } from './src/icons';
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
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#EAECF0',
  text: '#101828',
  sub: '#475467',
  muted: '#667085',
  faint: '#98A2B3',
  good: '#079455',
  warn: '#DC6803',
  bad: '#D92D20',
};

const DEMO_EMAIL: Record<string, string> = {
  shell: 'worker@shell.safeshift.app',
  exxon: 'worker@exxon.safeshift.app',
  chevron: 'worker@chevron.safeshift.app',
};

type Tab = 'home' | 'tasks' | 'certs' | 'profile';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
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
        <LogoMark size={64} color={accent} />
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
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: accent, paddingTop: Math.max(insets.top, 36) + 16 }]}>
        <View style={{ flex: 1 }}>
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
          {tab === 'certs' && <CertsTab certs={certs} accent={accent} />}
          {tab === 'profile' && <ProfileTab session={session} onSignOut={signOut} />}
        </ScrollView>
      )}

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
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
    </View>
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
        <StatCard value={pendingCount} label="To confirm" tone={pendingCount ? 'warn' : 'good'} icon="clock" />
        <StatCard value={doneCount} label="Completed" tone="good" icon="checkCircle" />
        <StatCard value={expiring} label="Certs due" tone={expiring ? 'bad' : 'good'} icon="certs" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s tasks</Text>
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <Text style={[styles.link, { color: accent }]}>See all</Text>
          <Icon name="chevronRight" size={16} color={accent} />
        </Pressable>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="checkCircle" size={30} color={PALETTE.good} />
          <Text style={styles.emptyTitle}>All caught up</Text>
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
          <Icon name="checkCircle" size={30} color={PALETTE.good} />
          <Text style={styles.emptyTitle}>Nothing pending</Text>
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

function CertsTab({ certs, accent }: { certs: Cert[]; accent: string }) {
  return (
    <View>
      <Text style={styles.pageTitle}>My certifications</Text>
      <Text style={styles.pageSub}>Keep these current to stay site-ready.</Text>
      {certs.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.taskHead}>
            <FeaturedIcon name="award" color={accent} bg="#F2F4F7" size={40} />
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.taskTitle, { flex: 1, marginRight: 8 }]}>{c.name}</Text>
                <StatusPill status={c.status} />
              </View>
              <View style={styles.metaRow}>
                <Icon name="calendar" size={14} color={PALETTE.faint} />
                <Text style={styles.taskMeta}>
                  {c.expiresAt ? `Expires ${c.expiresAt}` : 'No expiry'}
                  {c.daysToExpiry !== null
                    ? c.daysToExpiry < 0
                      ? ` · ${Math.abs(c.daysToExpiry)}d overdue`
                      : ` · ${c.daysToExpiry}d left`
                    : ''}
                </Text>
              </View>
            </View>
          </View>
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
        <Field icon="user" label="Name" value={session.user.fullName} />
        <Field icon="mail" label="Email" value={session.user.email} />
        <Field icon="briefcase" label="Role" value={prettyRole(session.user.role)} />
        <Field icon="certs" label="Company" value={session.tenant?.displayName ?? 'Platform'} last={!session.tenant} />
        {session.tenant ? (
          <Field icon="shieldCheck" label="Safety program" value={session.tenant.safetyProgramLabels.programName} last />
        ) : null}
      </View>
      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}>
        <Icon name="logout" size={18} color="#B42318" />
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
      <View style={styles.taskHead}>
        <FeaturedIcon name={kindIcon(task.kind)} color={accent} bg="#F2F4F7" size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.kindTagText}>{kindLabel(task.kind)}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>
        {task.mandatory ? (
          <View style={styles.mandatoryTag}>
            <Text style={styles.mandatoryText}>Mandatory</Text>
          </View>
        ) : null}
      </View>
      {task.detail ? <Text style={styles.taskDetail}>{task.detail}</Text> : null}
      <View style={styles.metaRow}>
        <Icon name="calendar" size={14} color={PALETTE.faint} />
        <Text style={styles.taskMeta}>{task.whenISO ? formatWhen(task.whenISO) : 'Anytime'}</Text>
      </View>
      {task.location ? (
        <View style={styles.metaRow}>
          <Icon name="pin" size={14} color={PALETTE.faint} />
          <Text style={styles.taskMeta}>{task.location}</Text>
        </View>
      ) : null}

      {confirmed ? (
        <View style={styles.confirmedRow}>
          <View style={styles.confirmedLeft}>
            <Icon name="checkCircle" size={16} color={PALETTE.good} />
            <Text style={[styles.confirmedText, { color: PALETTE.good }]}>Confirmed</Text>
          </View>
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

function StatCard({ value, label, tone, icon }: { value: number; label: string; tone: 'good' | 'warn' | 'bad'; icon: IconName }) {
  const color = tone === 'good' ? PALETTE.good : tone === 'warn' ? PALETTE.warn : PALETTE.bad;
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={18} color={color} strokeWidth={2.2} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Cert['status'] }) {
  const map = {
    active: { bg: '#ECFDF3', fg: '#067647', dot: '#17B26A', label: 'Active' },
    expiring: { bg: '#FFFAEB', fg: '#B54708', dot: '#F79009', label: 'Expiring' },
    expired: { bg: '#FEF3F2', fg: '#B42318', dot: '#F04438', label: 'Expired' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: s.dot }]} />
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

function Field({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.field, last ? styles.fieldLast : null]}>
      <Icon name={icon} size={18} color={PALETTE.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
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
        <Icon name={icon} size={23} color={color} strokeWidth={active ? 2.4 : 2} />
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
function kindIcon(kind: Task['kind']): IconName {
  return kind === 'toolbox' ? 'toolbox' : kind === 'training' ? 'training' : 'shieldCheck';
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

  card: { width: '100%', backgroundColor: PALETTE.card, borderRadius: 16, borderWidth: 1, borderColor: PALETTE.border, padding: 20, marginTop: 14, shadowColor: '#101828', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardDone: { backgroundColor: '#F9FAFB' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  input: { marginTop: 6, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: PALETTE.text, backgroundColor: '#fff' },
  errorText: { color: PALETTE.bad, fontSize: 13, marginTop: 10 },
  primaryBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  helperText: { color: PALETTE.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  demoNote: { color: PALETTE.muted, fontSize: 12, marginTop: 18, textAlign: 'center' },

  // Header
  header: { paddingBottom: 22, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  headerName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  content: { padding: 16, paddingBottom: 28 },

  // Home
  greeting: { fontSize: 16, color: PALETTE.sub },
  greetingName: { fontSize: 26, fontWeight: '800', color: PALETTE.text },
  programLine: { fontSize: 13, color: PALETTE.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statCard: { flex: 1, backgroundColor: PALETTE.card, borderRadius: 14, borderWidth: 1, borderColor: PALETTE.border, padding: 14, alignItems: 'flex-start', shadowColor: '#101828', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 10 },
  statLabel: { fontSize: 12, color: PALETTE.sub, marginTop: 2, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: PALETTE.text },
  link: { fontSize: 14, fontWeight: '700' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  pageTitle: { fontSize: 24, fontWeight: '800', color: PALETTE.text },
  pageSub: { fontSize: 14, color: PALETTE.sub, marginTop: 4 },
  groupLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16 },

  // Task card
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kindTag: { backgroundColor: '#F2F4F7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  kindTagText: { fontSize: 11, fontWeight: '700', color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  mandatoryTag: { backgroundColor: '#FEF3F2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  mandatoryText: { fontSize: 11, fontWeight: '700', color: '#B42318' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text, marginTop: 3 },
  taskDetail: { fontSize: 13, color: PALETTE.sub, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  taskMeta: { fontSize: 12.5, color: PALETTE.muted },
  confirmBtn: { marginTop: 16, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmedRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirmedLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmedText: { fontWeight: '700', fontSize: 14 },
  confirmedAt: { color: PALETTE.muted, fontSize: 12 },

  // Empty
  emptyCard: { backgroundColor: PALETTE.card, borderRadius: 14, borderWidth: 1, borderColor: PALETTE.border, padding: 24, marginTop: 12, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text },
  emptySub: { fontSize: 13, color: PALETTE.sub, marginTop: 4, textAlign: 'center' },

  // Pills / fields
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  fieldLast: { borderBottomWidth: 0 },
  fieldLabel: { fontSize: 12, color: PALETTE.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldValue: { fontSize: 15, color: PALETTE.text, marginTop: 2, fontWeight: '600' },
  signOutBtn: { marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDCA', backgroundColor: '#FEF3F2', paddingVertical: 13, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: '#B42318', fontWeight: '700', fontSize: 15 },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: PALETTE.border, paddingTop: 10 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  tabBadge: { position: 'absolute', top: -4, right: -10, backgroundColor: '#dc2626', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
