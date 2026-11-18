import type { Catalogue, Plan } from '../api';
import { CAT_COLOUR, inr, monthLabel } from '../util';

interface Props {
  plan: Plan | null;
  catalogue: Catalogue;
  onOpen: (id: string) => void;
  onGo: () => void;
}

/** The wish list on a timeline by quarter, with the monthly pour that funds it. */
export function VisionBoard({ plan, catalogue, onOpen, onGo }: Props) {
  if (!plan) return <div className="end">Loading…</div>;
  if (!plan.items.length) return <div className="end"><h3>Your wish list is empty</h3><p>Tap ♥ on anything in today's feed.</p></div>;
  const byId = new Map(catalogue.experiences.map((e) => [e.id, e]));
  const quarter = (m: string) => {
    const [y, mm] = m.split('-').map(Number);
    return `${['Jan – Mar', 'Apr – Jun', 'Jul – Sep', 'Oct – Dec'][Math.ceil(mm / 3) - 1]} ${y}`;
  };
  const lanes = [...new Set(plan.items.map((x) => quarter(x.month)))];
  const next = plan.items[0];
  const max = Math.max(1, ...plan.chart.map((c) => c.amount));
  const cover = (id: string) => {
    const e = byId.get(id)!;
    const v = e.media.find((m) => m.kind === 'video');
    const p = e.media.find((m) => m.kind === 'photo');
    return v ? <video src={v.src} poster={v.poster} muted playsInline loop autoPlay /> : <img src={p?.src} alt="" loading="lazy" />;
  };

  return (
    <section className="vb">
      <span className="mono ember">♥ Your vision board</span>
      <h1>Everything you want to do, by <em>{monthLabel(plan.items[plan.items.length - 1].month)}</em>.</h1>
      <div className="stats">
        <span><b>{plan.items.length}</b>things</span>
        <span><b>{inr(plan.total)}</b>all-in</span>
        <span><b className="green">{inr(plan.provisionNow)}</b>a month, now</span>
      </div>

      <div className="upnext" onClick={() => onOpen(next.id)}>
        <div className="unmedia">{cover(next.id)}</div>
        <div>
          <span className="mono ember">Up next · {next.monthsAway} months away</span>
          <b className="hand big">{next.name}</b>
          <p>{monthLabel(next.month)} · your share {inr(next.share)} · {inr(next.provision)}/mo</p>
          <button className="btn cream" onClick={(e) => { e.stopPropagation(); onGo(); }}>Set it up in sumday →</button>
        </div>
      </div>

      <div className="lanes">
        {lanes.map((l) => (
          <div key={l} className="lane">
            <div className="lanehd mono">{l}</div>
            {plan.items.filter((x) => quarter(x.month) === l).map((x) => (
              <div key={x.id} className="vpc" onClick={() => onOpen(x.id)}>
                <div className="vimg">{cover(x.id)}<span className="vcat" style={{ background: CAT_COLOUR[x.categories[0]] }}>{x.categories[0]}</span></div>
                <b className="hand">{x.name}</b>
                <div className="vmeta"><span>{monthLabel(x.month)}</span><span>{inr(x.share)}</span></div>
                <div className="vmeta"><span>{x.friendsIn.length ? `${x.friendsIn.length} friend${x.friendsIn.length > 1 ? 's' : ''} in` : 'just you'}</span><b className="green">{inr(x.provision)}/mo</b></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="chart">
        <span className="mono">Your pour, month by month · Modelled</span>
        <div className="bars">
          {plan.chart.map((c, i) => (
            <div key={c.month} title={`${monthLabel(c.month)}: ${inr(c.amount)}`}>
              <i style={{ height: `${(c.amount / max) * 100}%`, background: i ? 'var(--green)' : 'var(--ember)' }} />
              <small>{i % 3 === 0 ? monthLabel(c.month).split(' ')[0] : ''}</small>
            </div>
          ))}
        </div>
        <p className="fine">Each thing gets its own pour, timed to finish the month before it happens.</p>
      </div>

      <div className="emi">The same plans on a 12-month EMI at 18% would cost <b>{inr(plan.emiInterest12m)}</b> in interest.</div>
      <button className="btn ember wide" onClick={onGo}>Start investing {inr(plan.provisionNow)}/mo in sumday →</button>
      <p className="fine">Mutual fund investments are subject to market risks. Every number here is illustrative.</p>
    </section>
  );
}
