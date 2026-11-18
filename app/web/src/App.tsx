import { useCallback, useEffect, useState } from 'react';
import { api, type Algorithm, type Catalogue, type FeedPage, type FeedQuery, type Plan } from './api';
import { Dashboard } from './components/Dashboard';
import { Drawer } from './components/Drawer';
import { Feed } from './components/Feed';
import { Lab } from './components/Lab';
import { VisionBoard } from './components/VisionBoard';
import { inr } from './util';

type View = 'feed' | 'board' | 'sumday';

export function App() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [view, setView] = useState<View>('feed');
  const [query, setQuery] = useState<FeedQuery>({});
  const [hearts, setHearts] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [profile, setProfile] = useState<FeedPage['profile'] | null>(null);
  const [session, setSession] = useState<FeedPage['session'] | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [labOpen, setLabOpen] = useState(true);
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.catalogue(), api.algorithms(), api.plan()])
      .then(([c, a, p]) => {
        setCatalogue(c);
        setAlgorithms(a);
        setPlan(p);
        setHearts(p.items.map((x) => x.id));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const refreshPlan = useCallback(() => api.plan().then(setPlan), []);

  const onHeart = useCallback(
    async (id: string, on: boolean) => {
      const r = on ? await api.heart(id) : await api.unheart(id);
      setHearts(r.hearts);
      const p = await api.plan();
      setPlan(p);
      setToast(on ? `♥ Added · ${p.items.length} things, ${inr(p.total)}` : 'Removed from your wish list');
    },
    [],
  );

  const onProfile = useCallback((p: FeedPage['profile']) => setProfile(p), []);
  const onSession = useCallback((s: FeedPage['session']) => setSession(s), []);

  if (error) return <div className="boot">Couldn't reach the API: {error}. Start it with <code>npm run dev</code> in <code>app/</code>.</div>;
  if (!catalogue) return <div className="boot">Loading today's drop…</div>;

  return (
    <div className={`shell ${view === 'sumday' ? 'paper' : ''} ${labOpen && view === 'feed' ? 'withlab' : ''}`}>
      <nav className="rail">
        <div className="logo">sumday <b>✦</b></div>
        <button aria-current={view === 'feed'} onClick={() => setView('feed')}>Today</button>
        <button aria-current={view === 'board'} onClick={() => { setView('board'); void refreshPlan(); }}>Wish list <span className="count">{hearts.length}</span></button>
        <button aria-current={view === 'sumday'} onClick={() => { setView('sumday'); void refreshPlan(); }}>sumday</button>
        {view === 'feed' ? <button className="labtoggle" onClick={() => setLabOpen((o) => !o)}>{labOpen ? 'Hide' : 'Show'} algorithm lab</button> : null}
        <p className="railnote">Demo build. Photos and videos are real, credited, from Wikimedia Commons. Friends, prices and dates are demo data.</p>
      </nav>

      <main>
        {view === 'feed' && (
          <Feed
            catalogue={catalogue}
            query={query}
            setQuery={setQuery}
            hearts={hearts}
            showWhy={showWhy}
            onHeart={onHeart}
            onOpen={setOpen}
            onProfile={onProfile}
            onSession={onSession}
            refreshKey={refreshKey}
          />
        )}
        {view === 'board' && <VisionBoard plan={plan} catalogue={catalogue} onOpen={setOpen} onGo={() => setView('sumday')} />}
        {view === 'sumday' && <Dashboard plan={plan} catalogue={catalogue} setPlan={setPlan} />}
      </main>

      {view === 'feed' && labOpen && (
        <Lab
          algorithms={algorithms}
          weights={query.weights ?? Object.fromEntries(algorithms.map((a) => [a.id, a.defaultWeight]))}
          lambda={query.lambda ?? 0.72}
          profile={profile}
          session={session}
          showWhy={showWhy}
          setShowWhy={setShowWhy}
          onWeights={(w, lambda) => setQuery({ ...query, weights: w, lambda })}
          onReset={async () => {
            await api.reset();
            const p = await api.plan();
            setPlan(p);
            setHearts(p.items.map((x) => x.id));
            setRefreshKey((k) => k + 1);
            setToast('Demo member reset');
          }}
        />
      )}

      {open && (
        <Drawer
          id={open}
          friends={catalogue.friends}
          hearted={hearts.includes(open)}
          onHeart={onHeart}
          onClose={() => { setOpen(null); void refreshPlan(); }}
        />
      )}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
