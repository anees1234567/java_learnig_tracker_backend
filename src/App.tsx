import { useEffect, useMemo, useRef, useState } from 'react';

  import StudyTimerProvider, { useStudyTimer } from './StudyTimerContext';

type Status = 'not-started' | 'learning' | 'completed' | 'revision';
type Topic = { id: string; title: string; status: Status; notes: string; studyMinutes: number; startedAt?: string; completedAt?: string; updatedAt: string };
type Week = { id: string; number: number; title: string; topics: Topic[] };
type Session = { id: string; date: string; minutes: number; topicId?: string };
type AppData = { version: 4; weeks: Week[]; sessions: Session[]; currentTopicId?: string; theme?: 'light' | 'dark' };

const outline: [string, string[]][] = [
  ['JavaScript + TypeScript Foundation (2 weeks)', [
    'Scope and lexical environment',
    'Hoisting',
    'Closures',
    'this',
    'call, apply, bind',
    'Prototypes',
    'Prototype chain',
    'Classes',
    'Higher-order functions',
    'Destructuring',
    'Spread/rest',
    'Modules',
    'Error handling',
    'Callbacks',
    'Promises',
    'async/await',
    'Promise chaining',
    'Promise.all',
    'Promise.allSettled',
    'Promise.race',
    'Promise.any',
    'Event loop',
    'Microtasks',
    'Macrotasks',
    'process.nextTick()',
    'setImmediate()',
    'Types vs interfaces',
    'Union/intersection',
    'Generics',
    'Type narrowing',
    'Type guards',
    'Utility types',
    'keyof',
    'typeof',
    'unknown vs any',
    'Generic constraints',
    'Conditional types',
    'Type inference',
    'Strict mode',
    'tsconfig'
  ]],
  ['Node.js Deep Dive (2 weeks)', [
    'V8',
    'libuv',
    'Event loop',
    'Event-loop phases',
    'Call stack',
    'Thread pool',
    'Non-blocking I/O',
    'Main thread',
    'CPU-bound vs I/O-bound work',
    'fs',
    'path',
    'http',
    'events',
    'buffer',
    'stream',
    'crypto',
    'process',
    'child_process',
    'worker_threads',
    'Readable streams',
    'Writable streams',
    'Duplex streams',
    'Transform streams',
    'Backpressure',
    'Piping',
    'Event-loop blocking',
    'Memory leaks',
    'Garbage collection',
    'Heap',
    'CPU profiling',
    'Worker threads',
    'Connection pooling',
    'Keep-alive'
  ]],
  ['Backend Engineering (2 weeks)', [
    'HTTP methods',
    'Status codes',
    'Headers',
    'Request/response lifecycle',
    'Pagination',
    'Filtering',
    'Sorting',
    'API versioning',
    'Idempotency',
    'Error handling',
    'Validation',
    'Configuration',
    'Logging',
    'Sessions',
    'Cookies',
    'JWT',
    'Access tokens',
    'Refresh tokens',
    'OAuth 2.0',
    'Password hashing',
    'RBAC',
    'Permissions',
    'CORS',
    'CSRF',
    'XSS',
    'SQL injection',
    'Rate limiting',
    'Input validation',
    'Secrets management'
  ]],
  ['PostgreSQL (1 week)', [
    'JOINs',
    'Subqueries',
    'CTEs',
    'Aggregations',
    'Window functions',
    'EXISTS',
    'CASE',
    'Transactions',
    'ACID',
    'Indexes',
    'Composite indexes',
    'Partial indexes',
    'Query planner',
    'EXPLAIN',
    'EXPLAIN ANALYZE',
    'Isolation levels',
    'Locks',
    'Deadlocks',
    'Connection pooling',
    'Partitioning basics',
    'Replication basics'
  ]],
  ['Redis (1 week)', [
    'Caching',
    'TTL',
    'Cache-aside',
    'Cache invalidation',
    'Distributed locks',
    'Pub/Sub',
    'Sorted sets',
    'Lists',
    'Sets',
    'Redis transactions',
    'Eviction policies',
    'Memory management',
    'Redis Cluster basics',
    'Why use Redis instead of PostgreSQL for caching?',
    'What is cache-aside?',
    'What is cache invalidation?',
    'What is TTL?',
    'What happens during a cache hit/miss?',
    'What happens if Redis goes down?',
    'What are Redis data types and when would you use each?',
    'What is Redis Pub/Sub?',
    'Pub/Sub vs Redis Streams?',
    'What is a distributed lock?',
    'How would you implement rate limiting using Redis?',
    'What are RDB and AOF?',
    'What happens when Redis memory is full?',
    'What is Redis replication?',
    'What is Redis Cluster?',
    'How does BullMQ use Redis?',
    'How do you prevent stale cache?',
    'How do you handle Redis failure in a Node.js application?'
  ]],
  ['Distributed Systems + Microservices (2 weeks)', [
    'Monolith',
    'Modular monolith',
    'Microservices',
    'Service boundaries',
    'Database-per-service',
    'Shared database problems',
    'API Gateway',
    'Service communication',
    'REST',
    'Async messaging',
    'Events',
    'Message brokers',
    'Pub/Sub',
    'Timeouts',
    'Retries',
    'Exponential backoff',
    'Circuit breakers',
    'Idempotency',
    'Dead-letter queues',
    'Two-phase commit basics',
    'Saga pattern',
    'Queues',
    'Producer/consumer',
    'Retry',
    'Delayed jobs',
    'Job priority',
    'Concurrency',
    'Failure handling',
    'At-least-once delivery',
    'Job idempotency'
  ]],
  ['NestJS Complete Learning (3 weeks)', [
    'NestJS overview and architecture', 'Nest CLI and project structure', 'NestJS modules', 'Feature modules', 'Dynamic modules',
    'Controllers', 'Routing and route parameters', 'Request handling', 'Providers and services', 'Services',
    'Dependency injection', 'Provider scopes', 'Lifecycle hooks', 'Middleware', 'Pipes', 'ValidationPipe',
    'class-validator and class-transformer', 'Guards', 'Authentication guards', 'Authorization and RBAC', 'Interceptors',
    'Exception filters', 'Custom decorators', 'Metadata and Reflector', 'Configuration with ConfigModule',
    'Logging with Logger', 'Swagger/OpenAPI', 'NestJS API versioning', 'Serialization', 'File uploads', 'Nest cache manager',
    'Nest throttler rate limiting', 'Task scheduling', 'Queues with BullMQ', 'WebSockets and gateways', 'Microservices transporters',
    'Database integration', 'TypeORM', 'Prisma', 'MongoDB with Mongoose', 'Unit testing', 'End-to-end testing',
    'Authentication with Passport and JWT', 'Security hardening', 'Performance and production deployment', 'NestJS capstone project'
  ]]
];
const today = () => new Date().toISOString().slice(0, 10);
const nestJsModuleTitle = 'NestJS Complete Learning (3 weeks)';
const nestJsTopics = outline.find(([title]) => title === nestJsModuleTitle)![1];
const nestJsBuildingBlocks = new Set(['Middleware', 'Controllers', 'Services', 'Dependency injection', 'Guards', 'Pipes', 'Interceptors', 'Exception filters', 'Custom decorators', 'Swagger/OpenAPI']);
const makeTopic = (title: string, id: string): Topic => ({ id, title, status: 'not-started', notes: '', studyMinutes: 0, updatedAt: new Date().toISOString() });
const initialData = (): AppData => ({ version: 4, weeks: outline.map(([title, names], i) => ({ id: title === nestJsModuleTitle ? 'phase-nestjs' : `phase-${i + 1}`, number: i + 1, title, topics: names.map((title, j) => makeTopic(title, `topic-p${i + 1}-t${j + 1}`)) })), sessions: [] });
const key = 'learning-tracker-v1';
const apiUrl = (path: string) => `${import.meta.env.VITE_API_URL ?? ''}${path}`;
const topicSessions = (weeks: Week[]): Session[] => weeks.flatMap(week => week.topics.filter(topic => topic.studyMinutes > 0).map(topic => ({ id: `topic-study-${topic.id}`, topicId: topic.id, date: (topic.updatedAt || new Date().toISOString()).slice(0, 10), minutes: topic.studyMinutes })));
const upgradeCurriculum = (value: any): AppData => {
  const existingWeeks: Week[] = Array.isArray(value?.weeks) ? value.weeks.map((week: Week) => ({ ...week, topics: Array.isArray(week.topics) ? week.topics : [] })) : [];
  const nestModule = existingWeeks.find(week => week.title === nestJsModuleTitle);
  const movedTopics = existingWeeks.filter(week => week !== nestModule).flatMap(week => week.topics.filter(topic => nestJsBuildingBlocks.has(topic.title)));
  const weeksWithoutMovedTopics = existingWeeks.filter(week => week !== nestModule).map(week => ({ ...week, topics: week.topics.filter(topic => !nestJsBuildingBlocks.has(topic.title)) }));
  const topicsByTitle = new Map<string, Topic>();
  [...movedTopics, ...(nestModule?.topics ?? [])].forEach(topic => { if (!topicsByTitle.has(topic.title)) topicsByTitle.set(topic.title, topic); });
  const completedNestTopics = nestJsTopics.map((title, index) => topicsByTitle.get(title) ?? makeTopic(title, `nestjs-t${index + 1}`));
  const completedWeeks = [...weeksWithoutMovedTopics, { id: nestModule?.id ?? 'phase-nestjs', number: weeksWithoutMovedTopics.length + 1, title: nestJsModuleTitle, topics: completedNestTopics }]
    .map((week, index) => ({ ...week, number: index + 1 }));
  return { version: 4, weeks: completedWeeks, sessions: Array.isArray(value?.sessions) ? value.sessions : topicSessions(completedWeeks), currentTopicId: value?.currentTopicId, theme: value?.theme };
};
const load = (): AppData => { try { const saved = localStorage.getItem(key); return saved ? upgradeCurriculum(JSON.parse(saved)) : initialData(); } catch { return initialData(); } };
const statusMeta: Record<Status, [string, string]> = { 'not-started': ['○', 'Not Started'], learning: ['◉', 'Learning'], completed: ['✓', 'Completed'], revision: ['↻', 'Revision'] };
const minutes = (value: number) => value ? `${Math.floor(value / 60)}h ${value % 60}m` : '0m';
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const day = 86400000;

function Progress({ value, compact = false }: { value: number; compact?: boolean }) { return <div className="progress-wrap"><div className="progress"><i style={{ width: `${value}%` }} /></div>{!compact && <b>{value}%</b>}</div>; }

export default function App() {
  const [data, setData] = useState<AppData>(load);
  const [remoteReady, setRemoteReady] = useState(false);
  const localData = useRef(data);
  const [page, setPage] = useState<'dashboard' | 'roadmap' | 'study' | 'settings'>('dashboard');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | Status>('all'); const [weekFilter, setWeekFilter] = useState('all');
  const allTopics = useMemo(() => data.weeks.flatMap(w => w.topics.map(t => ({ ...t, week: w }))), [data.weeks]);
  const current = allTopics.find(t => t.id === data.currentTopicId);
  const stats = useMemo(() => { const count = (s: Status) => allTopics.filter(t => t.status === s).length; const total = allTopics.length; const done = count('completed'); return { total, done, pct: Math.round(done / total * 100), learning: count('learning'), revision: count('revision'), notStarted: count('not-started') }; }, [allTopics]);
  const weeklyMinutes = data.sessions.filter(s => { const d = new Date(`${s.date}T12:00:00`); const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() + 6) % 7); monday.setHours(0,0,0,0); return d >= monday; }).reduce((a, s) => a + s.minutes, 0);
  const streak = useMemo(() => { const days = new Set(data.sessions.filter(s => s.minutes > 0).map(s => s.date)); let n = 0; const cursor = new Date(); if (!days.has(today())) cursor.setDate(cursor.getDate() - 1); while (days.has(cursor.toISOString().slice(0, 10))) { n++; cursor.setTime(cursor.getTime() - day); } return n; }, [data.sessions]);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(data)); localData.current = data; }, [data]);
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail ?? {};
      const { date, minutes } = detail;
      if (!date || typeof minutes !== 'number') return;
      setData(d => ({ ...d, sessions: [...d.sessions, { id: crypto.randomUUID(), date, minutes }] }));
    };
    window.addEventListener('study:added', handler as EventListener);
    return () => window.removeEventListener('study:added', handler as EventListener);
  }, []);
  useEffect(() => { let active = true; const sync = async () => { try { const response = await fetch(apiUrl('/api/tracker')); if (!response.ok) throw new Error('Could not load tracker'); const remote = await response.json(); if (!active) return; if (Array.isArray(remote?.data?.weeks)) setData(upgradeCurriculum(remote.data)); else await fetch(apiUrl('/api/tracker'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: localData.current }) }); } catch { /* Local storage remains available when the API is offline. */ } finally { if (active) setRemoteReady(true); } }; void sync(); return () => { active = false; }; }, []);
  useEffect(() => { if (!remoteReady) return; const timer = window.setTimeout(() => { void fetch(apiUrl('/api/tracker'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => { /* Changes remain in local storage and retry next visit. */ }); }, 350); return () => window.clearTimeout(timer); }, [data, remoteReady]);
  useEffect(() => { const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.dataset.theme = data.theme ?? preferred; }, [data.theme]);
  const updateTopic = (id: string, patch: Partial<Topic>) => setData(d => { const weeks = d.weeks.map(w => ({ ...w, topics: w.topics.map(t => { if (t.id !== id) return t; const status = patch.status ?? t.status; const now = new Date().toISOString(); return { ...t, ...patch, status, updatedAt: now, startedAt: status === 'learning' && !t.startedAt ? now : patch.startedAt ?? t.startedAt, completedAt: status === 'completed' ? t.completedAt ?? now : undefined }; }) })); return { ...d, weeks, sessions: [...d.sessions.filter(session => !session.topicId), ...topicSessions(weeks)] }; });
  const addSession = (date: string, hours: number, mins: number) => { const total = hours * 60 + mins; if (!total) return; setData(d => ({ ...d, sessions: [...d.sessions, { id: crypto.randomUUID(), date, minutes: total }] })); };
  const selectedTopic = allTopics.find(t => t.id === selected);
  const nav = [['dashboard','Dashboard'],['roadmap','Roadmap'],['study','Study'],['settings','Settings']] as const;

  function TimerController({ page }: { page: string }) {
    try {
      const { start, stop } = useStudyTimer();
      useEffect(() => {
        if (page === 'dashboard') start();
        else stop();
        return () => stop();
      }, [page]);
    } catch (e) {
      // hook not available if provider not mounted yet
    }
    return null;
  }

  function LiveTimer({ page }: { page: string }) {
    try {
      const { secondsToday } = useStudyTimer();
      if (page !== 'dashboard') return null;
      const mins = Math.floor(secondsToday / 60);
      const secs = secondsToday % 60;
      // also update the dashboard card display so it increments live
      try {
        const saved = localStorage.getItem(key);
        let base = 0;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.sessions)) base = parsed.sessions.filter((s: any) => s.date === today()).reduce((a: number, s: any) => a + (s.minutes || 0), 0);
          } catch {}
        }
        const liveTotal = base + mins;
        const h2 = document.querySelector('.card.study-mini h2');
        if (h2) h2.textContent = minutes(liveTotal);
        const small = document.querySelector('.card.study-mini small.live');
        if (small) small.textContent = `Live: ${secs}s`;
      } catch {}
      return <div className="live-timer">Live: {mins}m {secs}s</div>;
    } catch {
      return null;
    }
  }

  return <StudyTimerProvider>
    <div className="app-shell">
      <TimerController page={page} />
      <aside>
        <div className="brand"><span>⌁</span><div>JAVA <small>BACKEND LEARNING TRACKER</small></div></div>
        <nav>{nav.map(([id, label]) => <button className={page === id ? 'active' : ''} onClick={() => setPage(id)} key={id}>{label}</button>)}</nav>
        <div className="side-foot"><span>🔥 {streak} day streak</span><span>{stats.done} topics completed</span></div>
      </aside>
      <main>
        <header>
          <div><p className="eyebrow">PERSONAL JAVA ROADMAP</p><h1>{page === 'dashboard' ? 'Good to see you.' : page[0].toUpperCase() + page.slice(1)}</h1></div>
          <LiveTimer page={page} />
          <button className="theme" onClick={() => setData(d => ({ ...d, theme: (d.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark' }))}>◐ <span>Theme</span></button>
        </header>
    
    {page === 'dashboard' && <Dashboard stats={stats} data={data} allTopics={allTopics} current={current} weeklyMinutes={weeklyMinutes} streak={streak} setPage={setPage} select={setSelected} />}
    {page === 'roadmap' && <Roadmap weeks={data.weeks} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} weekFilter={weekFilter} setWeekFilter={setWeekFilter} setSelected={setSelected} updateTopic={updateTopic} />}
    {page === 'study' && <Study sessions={data.sessions} weekly={weeklyMinutes} add={addSession} />}
    {page === 'settings' && <Settings theme={data.theme} setTheme={(theme: 'light' | 'dark') => setData(d => ({ ...d, theme }))} reset={() => { if (confirm('Are you sure? This will delete all learning progress, notes and study history.')) setData(initialData()); }} />}
  </main>{selectedTopic && <TopicModal topic={selectedTopic} week={selectedTopic.week} currentId={data.currentTopicId} close={() => setSelected(null)} update={updateTopic} setCurrent={() => setData(d => ({ ...d, currentTopicId: selectedTopic.id }))} />}</div></StudyTimerProvider>;
}

function Dashboard({ stats, data, allTopics, current, weeklyMinutes, streak, setPage, select }: any) { const todayMinutes = data.sessions.filter((s: Session) => s.date === today()).reduce((a: number, s: Session) => a + s.minutes, 0); return <><section className="hero card"><div><p className="eyebrow">JAVA BACKEND LEARNING PROGRESS</p><h2>{stats.pct}% complete</h2><p>{stats.done} of {stats.total} topics completed</p></div><Progress value={stats.pct} /><button className="outline" onClick={() => setPage('roadmap')}>Open roadmap →</button></section><section className="stat-grid"><Stat label="Total topics" value={stats.total} /><Stat label="Completed" value={stats.done} note={`${stats.pct}% of roadmap`} /><Stat label="Learning" value={stats.learning} /><Stat label="Revision" value={stats.revision} /><Stat label="Study this week" value={minutes(weeklyMinutes)} /><Stat label="Study streak" value={`🔥 ${streak} days`} /></section><section className="dashboard-grid"><div className="card current"><p className="eyebrow">CURRENT TOPIC</p>{current ? <><h2>{current.title}</h2><p>Phase {current.week.number} · {current.week.title}</p><span className={`badge ${current.status}`}>{statusMeta[current.status as Status][0]} {statusMeta[current.status as Status][1]}</span><button onClick={() => select(current.id)}>Open details</button></> : <><h2>Choose your next topic</h2><p>Set a topic as current to keep your focus clear.</p><button onClick={() => setPage('roadmap')}>Browse roadmap</button></>}</div><div className="card study-mini"><p className="eyebrow">TODAY'S STUDY</p><h2>{minutes(todayMinutes)}</h2><p>This week: {minutes(weeklyMinutes)}</p><button onClick={() => setPage('study')}>Log study time →</button></div></section><section><div className="section-title"><div><p className="eyebrow">{data.weeks.length}-PHASE ROADMAP</p><h2>Phase progress</h2></div><button className="text-button" onClick={() => setPage('roadmap')}>View all topics</button></div><div className="week-grid">{data.weeks.map((w: Week) => { const completed = w.topics.filter(t => t.status === 'completed').length; const pct = Math.round(completed / w.topics.length * 100); return <button className="week-card" key={w.id} onClick={() => { setPage('roadmap'); }}><small>PHASE {w.number}</small><h3>{w.title}</h3><Progress value={pct} compact /><p>{completed} / {w.topics.length} completed <b>{pct}%</b></p></button>; })}</div></section></> }
function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) { return <div className="stat card"><p>{label}</p><h2>{value}</h2>{note && <small>{note}</small>}</div> }
function Roadmap({ weeks, query, setQuery, filter, setFilter, weekFilter, setWeekFilter, setSelected, updateTopic }: any) { const matches = (t: Topic) => (!query || t.title.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || t.status === filter); return <><div className="toolbar"><input aria-label="Search topics" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics…" /><select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}><option value="all">All phases</option>{weeks.map((w: Week) => <option value={w.id} key={w.id}>Phase {w.number}</option>)}</select></div><div className="filters">{(['all','not-started','learning','completed','revision'] as const).map(s => <button className={filter === s ? 'active' : ''} key={s} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : statusMeta[s][1]}</button>)}</div><div className="roadmap">{weeks.filter((w: Week) => weekFilter === 'all' || w.id === weekFilter).map((w: Week) => { const rows = w.topics.filter(matches); const completed = w.topics.filter((t: Topic) => t.status === 'completed').length; const pct = Math.round(completed / w.topics.length * 100); return <section className="week-section" key={w.id}><div className="week-head"><div><p className="eyebrow">PHASE {w.number}</p><h2>{w.title}</h2></div><span>{completed} / {w.topics.length} completed · {pct}%{rows.length !== w.topics.length ? ` · ${rows.length} shown` : ''}</span></div>{rows.length ? <div className="topic-list">{rows.map(t => <div className="topic-row" key={t.id}><button className={`status-dot ${t.status}`} title="Cycle status" onClick={() => updateTopic(t.id, { status: ({ 'not-started': 'learning', learning: 'completed', completed: 'revision', revision: 'not-started' } as Record<Status, Status>)[t.status] })}>{statusMeta[t.status][0]}</button><button className="topic-title" onClick={() => setSelected(t.id)}>{t.title}<small>{statusMeta[t.status][1]}</small></button><button className="details" onClick={() => setSelected(t.id)}>Details →</button></div>)}</div> : <p className="empty">No matching topics in this phase.</p>}</section>; })}</div></> }
function Study({ sessions, weekly, add }: { sessions: Session[]; weekly: number; add: (date: string, hours: number, mins: number) => void }) { const [date, setDate] = useState(today()); const [hours, setHours] = useState(''); const [mins, setMins] = useState(''); const total = sessions.reduce((a, s) => a + s.minutes, 0); const todayTotal = sessions.filter(s => s.date === today()).reduce((a,s) => a+s.minutes,0); return <div className="study-page"><section className="study-summary"><Stat label="Today's study" value={minutes(todayTotal)} /><Stat label="This week" value={minutes(weekly)} /><Stat label="Total study time" value={minutes(total)} /></section><section className="card log"><p className="eyebrow">LOG STUDY TIME</p><h2>Add a study session</h2><div className="form-grid"><label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Hours<input type="number" min="0" value={hours} onChange={e => setHours(e.target.value)} placeholder="0" /></label><label>Minutes<input type="number" min="0" max="59" value={mins} onChange={e => setMins(e.target.value)} placeholder="0" /></label></div><button onClick={() => { add(date, Number(hours), Number(mins)); setHours(''); setMins(''); }}>Save session</button></section><section><div className="section-title"><div><p className="eyebrow">HISTORY</p><h2>Recent sessions</h2></div></div><div className="sessions">{sessions.length ? [...sessions].sort((a,b) => b.date.localeCompare(a.date)).map(s => <div className="session" key={s.id}><span>{new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><b>{minutes(s.minutes)}</b></div>) : <p className="empty">Your study history will appear here.</p>}</div></section></div> }
function Settings({ theme, setTheme, reset }: any) { return <div className="settings"><section className="card"><p className="eyebrow">APPEARANCE</p><h2>Theme</h2><p>Choose a visual preference. Your system setting is used by default.</p><div className="theme-options"><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}>☀ Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}>◐ Dark</button></div></section><section className="card danger"><p className="eyebrow">DATA</p><h2>Reset all progress</h2><p>Deletes topic status, notes, study time, and study history from this browser.</p><button onClick={reset}>Reset everything</button></section></div> }
function TopicModal({ topic, week, currentId, close, update, setCurrent }: any) { const [status, setStatus] = useState<Status>(topic.status); const [notes, setNotes] = useState(topic.notes); const [time, setTime] = useState(String(topic.studyMinutes)); const [fullScreen, setFullScreen] = useState(false); const [notesPreview, setNotesPreview] = useState(false); const [running, setRunning] = useState(false); const [elapsed, setElapsed] = useState(0); useEffect(() => { if (!running) return; const timer = window.setInterval(() => setElapsed(value => value + 1), 1000); return () => window.clearInterval(timer); }, [running]); const timerLabel = `${Math.floor(elapsed / 3600).toString().padStart(2, '0')}:${Math.floor(elapsed % 3600 / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`; const saveElapsedTime = () => { const existingMinutes = Math.max(0, Number(time) || 0); const sessionMinutes = Math.ceil(elapsed / 60); if (!sessionMinutes) return existingMinutes; const totalMinutes = existingMinutes + sessionMinutes; setTime(String(totalMinutes)); return totalMinutes; }; const stopTimer = () => { if (!running) return; const totalMinutes = saveElapsedTime(); update(topic.id, { studyMinutes: totalMinutes }); setElapsed(0); setRunning(false); }; const save = () => { const totalMinutes = running ? saveElapsedTime() : Math.max(0, Number(time) || 0); if (running) { setElapsed(0); setRunning(false); } update(topic.id, { status, notes, studyMinutes: totalMinutes }); close(); }; return <div className="backdrop" onMouseDown={close}><section className={`modal ${fullScreen ? 'full-screen' : ''}`} onMouseDown={e => e.stopPropagation()}><div className="modal-top"><div><p className="eyebrow">PHASE {week.number} · {week.title}</p><h2>{topic.title}</h2></div><div className="modal-tools"><button className="expand" onClick={() => setNotesPreview(value => !value)}>{notesPreview ? 'Edit notes' : 'Preview chart'}</button><button className="expand" onClick={() => setFullScreen(value => !value)}>{fullScreen ? 'Exit full screen' : 'Full screen'}</button><button className="close" aria-label="Close details" onClick={close}>×</button></div></div><div className="topic-fields"><label>Status<select value={status} onChange={e => setStatus(e.target.value as Status)}>{(Object.keys(statusMeta) as Status[]).map(s => <option value={s} key={s}>{statusMeta[s][0]} {statusMeta[s][1]}</option>)}</select></label><label>Study time (minutes)<input type="number" min="0" value={time} onChange={e => setTime(e.target.value)} /></label></div><div className="topic-timer"><div><small>TOPIC TIMER</small><strong>{timerLabel}</strong></div>{running ? <button className="stop-timer" onClick={stopTimer}>■ Stop & save time</button> : <button className="start-timer" onClick={() => setRunning(true)}>▶ Start timer</button>}</div>{notesPreview ? <section className="notes-preview" aria-label="Notes preview">{notes || 'Your formatted notes and flowcharts will appear here.'}</section> : <label className="notes-field">Notes<textarea autoFocus value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste a flowchart or capture key ideas, examples, and questions…" /></label>}<dl><div><dt>Date started</dt><dd>{dateLabel(topic.startedAt)}</dd></div><div><dt>Date completed</dt><dd>{dateLabel(topic.completedAt)}</dd></div><div><dt>Date updated</dt><dd>{dateLabel(topic.updatedAt)}</dd></div></dl><div className="modal-actions"><button className="outline" onClick={setCurrent}>{currentId === topic.id ? 'Current topic' : 'Set as current'}</button><button className="save" onClick={save}>{status === 'completed' ? 'Save completed' : 'Save changes'}</button></div></section></div> }
