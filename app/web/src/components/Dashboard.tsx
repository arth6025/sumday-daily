import { useState } from 'react';
import { api, type Catalogue, type Plan } from '../api';
import { inr, monthLabel } from '../util';

interface Props {
  plan: Plan | null;
  catalogue: Catalogue;
  setPlan: (p: Plan) => void;
}

/** The sumday dashboard, styled after sumday.in/v4: each wish becomes a someday. */
export function Dashboard({ plan, catalogue, setPlan }: Props) {
  const [msg, setMsg] = useState('');
  if (!plan) return <div className="dash"><div className="dsheet">Loading…</div></div>;
  const byId = new Map(catalogue.experiences.map((e) => [e.id, e]));
  const first = new Date();
  first.setDate(1);
  first.setMonth(first.getMonth() + 1);
  const firstLabel = first.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const act = async (fn: () => Promise<Plan>) => {
    try {
      setPlan(await fn());
      setMsg('');
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="dash">
      <div className="dsheet">
        <div className="dtop"><span className="dlogo">sumday</span><span className="dmono">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</span></div>
        <h1 className="dh">Your somedays<br />have dates now.</h1>
        <p className="dp">{plan.items.length} things from your vision board, funded a little every month, not financed. The money stays yours the whole way there.</p>
        <div className="dstats">
          <div><b>{inr(plan.share)}</b><span>your share</span></div>
          <div><b>{inr(plan.provisionNow)}</b><span>a month, one mandate</span></div>
          <div><b>{firstLabel}</b><span>first provision</span></div>
        </div>

        {plan.mandate.active ? (
          <div className="dcard live"><span className="dmono">● MANDATE LIVE</span><p>{inr(plan.provisionNow)} on the 1st by UPI autopay, into your own folio.</p></div>
        ) : (
          <div className="dcard">
            <span className="dmono">THREE STEPS, ONCE</span>
            <ol>
              <li><b>Verify once.</b> Aadhaar and PAN, SEBI KYC.</li>
              <li><b>Open a folio in your name.</b> sumday never holds your money.</li>
              <li><b>One mandate.</b> {inr(plan.provisionNow)} on the 1st by UPI autopay.</li>
            </ol>
            <button className="dbtn" onClick={() => act(api.mandate)}>Sign the charter · start {inr(plan.provisionNow)}/mo</button>
            <p className="dfine">Demo only. Nothing is charged and no account is opened.</p>
          </div>
        )}
        {msg ? <p className="dwarn">{msg}</p> : null}

        <p className="dsec">THE SOMEDAYS</p>
        {plan.items.map((x) => {
          const e = byId.get(x.id)!;
          const p = e.media.find((m) => m.kind === 'photo');
          return (
            <article key={x.id} className={`dsd ${x.paused ? 'paused' : ''}`}>
              <img src={p?.src} alt="" loading="lazy" />
              <div>
                <span className="dmono">{x.pinned ? 'PINNED · RATE HELD' : x.paused ? 'PAUSED' : x.categories[0].toUpperCase()} · {x.monthsAway} MONTHS AWAY</span>
                <h3>{x.name}</h3>
                <div className="damt"><b>₹0</b><span>0% of {inr(x.share)}</span></div>
                <span className="dmono">{x.paused ? 'PROVISIONS PAUSED' : `FIRST PROVISION · ${firstLabel.toUpperCase()} · ${inr(x.provision)}`}</span>
                <div className="drow">
                  <span className="dwhen">
                    <button onClick={() => act(() => api.someday(x.id, { shiftBy: -1 }))} aria-label="Move earlier">‹</button>
                    <b>{monthLabel(x.month)}</b>
                    <button onClick={() => act(() => api.someday(x.id, { shiftBy: 1 }))} aria-label="Move later">›</button>
                  </span>
                  {x.pinned ? <span className="dok">✓ Pinned ₹1,000</span> : <button className="dlink" onClick={() => act(() => api.someday(x.id, { pin: true }))}>Pin tonight's price · ₹1,000</button>}
                  <button className="dlink" onClick={() => act(() => api.someday(x.id, { paused: !x.paused }))}>{x.paused ? 'Resume' : 'Pause'}</button>
                </div>
              </div>
            </article>
          );
        })}
        <a className="dbtn ghost" href="https://sumday.in/v4" target="_blank" rel="noreferrer">Open the full sumday app ↗</a>
        <p className="dfine">Concept prototype. Mutual-fund investments are subject to market risk; returns are not guaranteed. sumday would act as an AMFI-registered mutual-fund distributor, not a bank or investment adviser.</p>
      </div>
    </div>
  );
}
