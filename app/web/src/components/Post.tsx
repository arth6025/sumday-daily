import { useEffect, useRef, useState } from 'react';
import type { Action, FeedItem, Friend } from '../api';
import { CAT_COLOUR, inr, initials } from '../util';

interface Props {
  item: FeedItem;
  hearted: boolean;
  friends: Friend[];
  showWhy: boolean;
  onHeart: (id: string, on: boolean) => void;
  onOpen: (id: string) => void;
  onSignal: (id: string, action: Action) => void;
  onHide: (id: string) => void;
}

/**
 * One post. It also measures attention: how long it was on screen (dwell) or
 * whether it was scrolled past in under a second (skip). Both feed the ranker.
 */
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function Post({ item, hearted, friends, showWhy, onHeart, onOpen, onSignal, onHide }: Props) {
  const e = item.experience;
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [burst, setBurst] = useState(0);
  const [why, setWhy] = useState(false);

  const video = e.media.find((m) => m.kind === 'video');
  const photos = e.media.filter((m) => m.kind === 'photo');
  const tall = photos.find((m) => m.shape === '9:16');
  const main = item.format === 'reel' && tall ? tall : photos.find((m) => m.shape !== '9:16') ?? photos[0];
  const isVideo = (item.format === 'auto' || item.format === 'tap') && video;
  const credit = isVideo ? video! : main;
  const hook = e.hooks[item.position % e.hooks.length];

  // Attention: view after 1 s on screen, dwell after 3 s, skip if gone in under 1 s.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let since = 0;
    let viewed = false;
    let dwelled = false;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (entry.intersectionRatio > 0.6) {
          since = Date.now();
          timer = window.setTimeout(() => {
            if (!viewed) onSignal(e.id, 'view');
            viewed = true;
            timer = window.setTimeout(() => {
              if (!dwelled) onSignal(e.id, 'dwell');
              dwelled = true;
            }, 2000);
          }, 1000);
          if (v && item.format === 'auto') v.play().catch(() => undefined);
        } else {
          window.clearTimeout(timer);
          if (since && !viewed && Date.now() - since < 1000) onSignal(e.id, 'skip');
          since = 0;
          if (v) v.pause();
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [e.id, item.format, onSignal]);

  const slides =
    item.format === 'carousel'
      ? [
          { kind: 'photo' as const, src: main.src },
          { kind: 'tip' as const, text: e.tips[item.position % e.tips.length] },
          ...photos.filter((p) => p !== main && p.shape !== '9:16').slice(0, 1).map((p) => ({ kind: 'photo' as const, src: p.src })),
          { kind: 'cost' as const },
        ]
      : [];

  const heart = () => {
    onHeart(e.id, !hearted);
    if (!hearted) setBurst((b) => b + 1);
  };
  const fans = friends.filter((f) => item.reasons.some((r) => r.includes(f.name)));

  return (
    <article className="post" ref={ref}>
      <header className="phead">
        <span className="av"><span>{initials(credit.credit)}</span></span>
        <div className="who">
          <b>{credit.credit}</b>
          <small>{e.place}</small>
        </div>
        {isVideo ? <span className="tag">Video</span> : null}
        <button className="whybtn" onClick={() => setWhy((w) => !w)} aria-expanded={why}>Why this?</button>
      </header>

      <div
        className={`media ${item.format === 'reel' ? 'reel' : 'r45'}`}
        onDoubleClick={() => !hearted && heart()}
        onClick={(ev) => {
          if ((ev.target as HTMLElement).closest('button')) return;
          if (item.format === 'tap' && videoRef.current) {
            if (playing) videoRef.current.pause();
            else videoRef.current.play();
            return;
          }
          onOpen(e.id);
        }}
      >
        {isVideo ? (
          <>
            <video ref={videoRef} src={video!.src} poster={video!.poster} muted playsInline loop preload={item.format === 'auto' ? 'auto' : 'metadata'} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
            {item.format === 'tap' && !playing ? <button className="playbig" aria-label="Play video" onClick={() => videoRef.current?.play()}>▶</button> : null}
            <span className="vtime">{item.format === 'auto' ? '● Playing' : 'Video'}</span>
          </>
        ) : item.format === 'carousel' ? (
          <>
            <div className="track" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {slides.map((s, i) =>
                s.kind === 'photo' ? (
                  <img key={i} src={s.src} alt={e.name} loading="lazy" />
                ) : s.kind === 'tip' ? (
                  <div key={i} className="slide tip"><span className="mono">Before you go</span><p>{s.text}</p><span className="mono">sumday editor</span></div>
                ) : (
                  <div key={i} className="slide cost">
                    <span className="mono">What it really costs · {e.nights} nights</span>
                    <b className="big">{inr(e.cost)}</b>
                    {Object.entries(e.costSplit).map(([k, pct]) => (
                      <div key={k} className="crow"><span>{k}</span><i style={{ width: `${pct * 2}%` }} /><b>{inr((e.cost * pct) / 100)}</b></div>
                    ))}
                  </div>
                ),
              )}
            </div>
            <span className="counter">{slide + 1}/{slides.length}</span>
            {slide > 0 ? <button className="arrow l" onClick={() => setSlide(slide - 1)} aria-label="Previous">‹</button> : null}
            {slide < slides.length - 1 ? <button className="arrow r" onClick={() => setSlide(slide + 1)} aria-label="Next">›</button> : null}
          </>
        ) : (
          <img src={main.src} alt={e.name} loading="lazy" />
        )}
        {burst ? <span key={burst} className="burst">♥</span> : null}
      </div>

      <div className="actions">
        <button className={`act ${hearted ? 'on' : ''}`} onClick={heart} aria-label={hearted ? 'On your wish list' : 'Add to wish list'}>♥</button>
        <button className="act" onClick={() => onOpen(e.id)} aria-label="Jam with friends">✦</button>
        <button className="act small" onClick={() => onHide(e.id)}>Not for me</button>
        <span className="price">{inr(e.cost)}</span>
      </div>

      {fans.length ? <div className="jamline">♥ {item.reasons.find((r) => fans.some((f) => r.includes(f.name)))}</div> : null}
      <div className="cap" onClick={() => onOpen(e.id)}><b>{e.name}</b> {hook}</div>
      <div className="meta">
        <span style={{ color: CAT_COLOUR[e.categories[0]] }}>{e.categories.join(' · ')}</span>
        <span>{e.bestMonths}</span>
        <span className="green">or {inr(Math.ceil(e.cost / 12 / 50) * 50)}/mo</span>
      </div>

      {(why || showWhy) && (
        <div className="why">
          <div className="whyhead"><span className="mono">Why this card</span><b>score {item.relevance.toFixed(2)}</b></div>
          {item.reasons.length ? <p>{item.reasons.join(' · ')}</p> : <p>Mostly quality and popularity, while we learn what you like.</p>}
          <div className="preds">
            <span title="Chance you'll heart it">♥ {pct(item.predictions.heart)}</span>
            <span title="Chance you'll tag a friend">✦ jam {pct(item.predictions.jam)}</span>
            <span title="Chance you'll stay 3 seconds or more">stay {pct(item.predictions.dwell)}</span>
            <span title="Chance you'll scroll past">skip {pct(item.predictions.skip)}</span>
            <span title="Expected seconds on screen">~{item.predictions.staySeconds}s</span>
          </div>
          <span className="mono muted">The eight algorithms below</span>
          {item.breakdown.filter((b) => b.weight > 0).map((b) => (
            <div key={b.id} className="wrow">
              <span>{b.name}</span>
              <i><b style={{ width: `${Math.round(b.score * 100)}%` }} /></i>
              <em>{(b.contribution * 100).toFixed(0)}</em>
            </div>
          ))}
        </div>
      )}

      <div className="credit">
        {isVideo ? 'Video' : 'Photo'}: <a href={credit.source} target="_blank" rel="noreferrer">{credit.credit}</a> · {credit.licence} · Wikimedia Commons{credit.note ? ` · ${credit.note}` : ''}
      </div>
    </article>
  );
}
