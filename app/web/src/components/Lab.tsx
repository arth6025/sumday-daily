import type { Algorithm, FeedPage } from '../api';
import { featureLabel } from '../util';

interface Props {
  algorithms: Algorithm[];
  weights: Record<string, number>;
  lambda: number;
  profile: FeedPage['profile'] | null;
  session: FeedPage['session'] | null;
  showWhy: boolean;
  setShowWhy: (v: boolean) => void;
  onWeights: (w: Record<string, number>, lambda: number) => void;
  onReset: () => void;
}

/**
 * The algorithm lab: for demos and for tuning. Shows the member's live interest
 * profile and lets you change how much each ranking algorithm counts.
 */
export function Lab({ algorithms, weights, lambda, profile, session, showWhy, setShowWhy, onWeights, onReset }: Props) {
  const max = Math.max(0.01, ...(profile?.top.map((t) => t.weight) ?? [0]));
  return (
    <aside className="lab">
      <h3>Algorithm lab</h3>
      <p className="fine">Every heart, open, three-second look and quick skip updates this profile. The next page of the feed uses it straight away.</p>

      <div className="labsec">
        <span className="mono">Your live interests {profile?.coldStart ? '· cold start' : ''}</span>
        {profile?.top.length ? (
          profile.top.map((t) => (
            <div key={t.feature} className="irow"><span>{featureLabel(t.feature)}</span><i><b style={{ width: `${(t.weight / max) * 100}%` }} /></i></div>
          ))
        ) : (
          <p className="fine">Nothing yet. Heart a few things.</p>
        )}
        <small className="fine">Signal strength {profile?.strength ?? 0}</small>
      </div>

      <div className="labsec">
        <span className="mono">This session</span>
        <div className="sess">
          <div><b>{session?.shown1m ?? 0}</b><span>seen, 1 min</span></div>
          <div><b>{session?.shown3m ?? 0}</b><span>seen, 3 min</span></div>
          <div><b>{session?.skipped3m ?? 0}</b><span>skipped, 3 min</span></div>
          <div><b>{session?.heartsSession ?? 0}</b><span>hearts</span></div>
        </div>
        {session?.rescue ? <p className="rescue">{session.note}</p> : <small className="fine">Skip three cards fast and the feed switches to more variety.</small>}
      </div>

      <div className="labsec">
        <span className="mono">How much each algorithm counts</span>
        {algorithms.map((a) => (
          <label key={a.id} className="slider" title={a.about}>
            <span>{a.name}<small>{a.about}</small></span>
            <input type="range" min={0} max={1} step={0.02} value={weights[a.id] ?? a.defaultWeight} onChange={(e) => onWeights({ ...weights, [a.id]: Number(e.target.value) }, lambda)} />
          </label>
        ))}
        <label className="slider">
          <span>Relevance vs variety<small>1 = most relevant first. Lower mixes in more variety (MMR re-ranking).</small></span>
          <input type="range" min={0.3} max={1} step={0.02} value={lambda} onChange={(e) => onWeights(weights, Number(e.target.value))} />
        </label>
      </div>

      <label className="toggle"><input type="checkbox" checked={showWhy} onChange={(e) => setShowWhy(e.target.checked)} /> Show "why this" on every card</label>
      <div className="labbtns">
        <button className="btn ghost" onClick={() => onWeights(Object.fromEntries(algorithms.map((a) => [a.id, a.defaultWeight])), 0.72)}>Default weights</button>
        <button className="btn ghost" onClick={onReset}>Reset demo member</button>
      </div>
    </aside>
  );
}
