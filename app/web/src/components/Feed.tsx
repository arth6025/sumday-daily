import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Action, type Catalogue, type FeedItem, type FeedPage, type FeedQuery } from '../api';
import { Post } from './Post';

interface Props {
  catalogue: Catalogue;
  query: FeedQuery;
  setQuery: (q: FeedQuery) => void;
  hearts: string[];
  showWhy: boolean;
  onHeart: (id: string, on: boolean) => void;
  onOpen: (id: string) => void;
  onProfile: (p: FeedPage['profile']) => void;
  refreshKey: number;
}

const CATS = ['', 'Travel', 'Sports', 'Fitness', 'Lifestyle'];

/** The endless feed: pages of 10, re-ranked on every page with the latest profile. */
export function Feed({ catalogue, query, setQuery, hearts, showWhy, onHeart, onOpen, onProfile, refreshKey }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);
  const pending = useRef<{ experienceId: string; action: Action }[]>([]);

  const load = useCallback(
    async (reset: boolean) => {
      if (loading) return;
      const from = reset ? 0 : cursor;
      if (from === null) return;
      setLoading(true);
      try {
        const recent = reset ? [] : items.slice(-6).map((i) => i.experience.id);
        const page = await api.feed(query, from, recent);
        setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
        setCursor(page.nextCursor);
        onProfile(page.profile);
        setError('');
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [cursor, items, loading, onProfile, query],
  );

  // New query or new weights: start the feed again.
  useEffect(() => {
    setItems([]);
    setCursor(0);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query), refreshKey]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && void load(false), { rootMargin: '800px' });
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  // Attention signals are batched and sent every 2 seconds.
  const onSignal = useCallback((id: string, action: Action) => {
    pending.current.push({ experienceId: id, action });
  }, []);
  useEffect(() => {
    const t = window.setInterval(async () => {
      if (!pending.current.length) return;
      const batch = pending.current.splice(0);
      try {
        const r = await api.events(batch);
        onProfile({ strength: r.profile.strength, coldStart: r.profile.strength < 12, top: r.profile.top });
      } catch {
        pending.current.unshift(...batch);
      }
    }, 2000);
    return () => window.clearInterval(t);
  }, [onProfile]);

  const hide = (id: string) => {
    onSignal(id, 'not_interested');
    setItems((prev) => prev.filter((i) => i.experience.id !== id));
  };

  const active = [query.category, query.country, query.activity, query.q, query.newToMe ? 'new' : ''].filter(Boolean).length;

  return (
    <section className="feed">
      <div className="dropbar">
        <span className="mono"><span className="dot" /> Today's drop</span>
        <button className="fbtn" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>Filter{active ? ` · ${active}` : ''}</button>
      </div>
      <div className="cats">
        {CATS.map((c) => (
          <button key={c || 'all'} aria-pressed={(query.category ?? '') === c} onClick={() => setQuery({ ...query, category: c || undefined })}>{c || 'For you'}</button>
        ))}
      </div>
      {filtersOpen && (
        <div className="fpanel">
          <input placeholder="Type a country or a place" value={query.q ?? ''} onChange={(e) => setQuery({ ...query, q: e.target.value || undefined })} />
          <div className="chips">
            <button aria-pressed={!query.country} onClick={() => setQuery({ ...query, country: undefined })}>Anywhere</button>
            {catalogue.countries.map((c) => (
              <button key={c} aria-pressed={query.country === c} onClick={() => setQuery({ ...query, country: c })}>{c}</button>
            ))}
          </div>
          <div className="chips">
            <button aria-pressed={!!query.newToMe} onClick={() => setQuery({ ...query, newToMe: !query.newToMe })}>New to me</button>
            {catalogue.activities.map((a) => (
              <button key={a} aria-pressed={query.activity === a} onClick={() => setQuery({ ...query, activity: query.activity === a ? undefined : a })}>{a}</button>
            ))}
          </div>
          <button className="link" onClick={() => setQuery({ weights: query.weights, lambda: query.lambda })}>Clear filter</button>
        </div>
      )}

      {items.map((it) => (
        <Post
          key={`${it.position}-${it.experience.id}`}
          item={it}
          hearted={hearts.includes(it.experience.id)}
          friends={catalogue.friends}
          showWhy={showWhy}
          onHeart={onHeart}
          onOpen={(id) => {
            onSignal(id, 'open');
            onOpen(id);
          }}
          onSignal={onSignal}
          onHide={hide}
        />
      ))}

      {error ? <div className="end">Couldn't load the feed: {error}. Is the API running on :8787?</div> : null}
      {cursor === null && items.length ? <div className="end"><h3>That's today's edition for this filter</h3><p>Clear the filter for more, or come back after the 6am drop.</p></div> : null}
      {!loading && !items.length && !error ? <div className="end"><h3>Nothing for that today</h3><p>Try another place or clear the filter.</p></div> : null}
      <div ref={sentinel} className="sentinel">{loading ? 'Loading…' : ''}</div>
    </section>
  );
}
