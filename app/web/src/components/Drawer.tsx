import { useEffect, useState } from 'react';
import { api, type Detail, type Friend } from '../api';
import { money } from '../util';

interface Props {
  id: string;
  friends: Friend[];
  hearted: boolean;
  onHeart: (id: string, on: boolean) => void;
  onClose: () => void;
}

/** The right-hand drawer: tentative cost in ₹ or $, jam with friends, notes. */
export function Drawer({ id, friends, hearted, onHeart, onClose }: Props) {
  const [d, setD] = useState<Detail | null>(null);
  const [cur, setCur] = useState<'INR' | 'USD'>('INR');
  const [note, setNote] = useState('');

  const refresh = () => api.detail(id).then(setD).catch(() => undefined);
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(refresh, 2000); // pick up demo replies from tagged friends
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!d) return <aside className="drawer on"><div className="dbody">Loading…</div></aside>;
  const e = d.experience;
  const ins = Object.values(d.jam).filter((s) => s === 'in').length;
  const each = e.cost / (1 + ins);
  const photo = e.media.find((m) => m.kind === 'photo');

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer on" aria-label={`Jam on ${e.name}`}>
        <div className="dhead"><span className="mono">Jam on this ✦</span><button onClick={onClose} aria-label="Close">✕</button></div>
        <div className="dbody">
          <span className="mono muted">{e.place} · best {e.bestMonths}</span>
          <h2>{e.name}</h2>
          {photo ? <img className="dimg" src={photo.src} alt={e.name} /> : null}

          <div className="sec">
            <div className="sechead">
              <span className="mono">Tentative cost</span><span className="lbl">Modelled</span>
              <div className="seg">
                <button aria-pressed={cur === 'INR'} onClick={() => setCur('INR')}>₹ INR</button>
                <button aria-pressed={cur === 'USD'} onClick={() => setCur('USD')}>$ USD</button>
              </div>
            </div>
            <b className="bigcost">{money(e.cost, cur)}</b>
            {Object.entries(e.costSplit).map(([k, pct]) => (
              <div key={k} className="crow"><span>{k}</span><i style={{ width: `${pct * 2}%` }} /><b>{money((e.cost * pct) / 100, cur)}</b></div>
            ))}
            <div className="grid3">
              <div><b>{money(each, cur)}</b><span>{ins ? `each, with ${ins} in` : 'just you so far'}</span></div>
              <div><b>{money(Math.ceil(each / 12 / 50) * 50, cur)}</b><span>a month, 12 pours</span></div>
              <div><b>{money(Math.ceil(each / 6 / 50) * 50, cur)}</b><span>a month, 6 pours</span></div>
            </div>
            <p className="fine">A tentative figure from partner prices. The binding price is the partner's quote when you pin it.{cur === 'USD' ? ' Converted at ₹88 to US$1 (placeholder).' : ''}</p>
          </div>

          <div className="sec">
            <span className="mono">Jam with friends</span>
            {friends.map((f) => {
              const s = d.jam[f.id];
              return (
                <div key={f.id} className="fcard">
                  <span className="fc" style={{ background: f.colour }}>{f.name[0]}</span>
                  <div><b>{f.name}</b>{s ? <em className={`chip ${s}`}>{s === 'tagged' ? 'waiting' : s}</em> : null}<small>{f.free}{d.friendsWhoHearted.includes(f.id) ? ' · has this on their list' : ''}</small></div>
                  <button className="btn ghost" onClick={() => api.tag(e.id, f.id).then(refresh)}>{s ? 'Remove' : 'Tag'}</button>
                </div>
              );
            })}
          </div>

          <div className="sec">
            <span className="mono">Go deeper</span>
            <ul className="tips">{e.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="hand">{e.editorNote}</p>
          </div>

          <div className="sec">
            <span className="mono">Notes from the jam</span>
            {d.notes.map((n, i) => <div key={i} className="note"><b>{n.who}</b> {n.text}</div>)}
            <form className="noteform" onSubmit={(ev) => { ev.preventDefault(); if (note.trim()) api.note(e.id, note).then(() => { setNote(''); void refresh(); }); }}>
              <input value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a note for the squad" aria-label="Note" />
              <button className="btn cream" type="submit">Post</button>
            </form>
          </div>
        </div>
        <div className="dfoot">
          <span>{money(e.cost, cur)} tentative</span>
          <button className={`btn ${hearted ? 'ghost' : 'ember'}`} onClick={() => onHeart(e.id, !hearted)}>{hearted ? '♥ On your wish list' : '♥ Add to wish list'}</button>
        </div>
      </aside>
    </>
  );
}
