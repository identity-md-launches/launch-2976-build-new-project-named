import { useEffect, useRef, useState } from 'react';
import { RunnerEngine, WORLD_HEIGHT } from '../game/engine';
import type { GameSnapshot, RunResult } from '../game/engine';
import { GameAudio } from '../game/audio';
import { renderGame } from '../game/draw';
import { formatScore } from '../lib/storage';
import { Icon } from './Icon';

const pace = [
  'Easy does it',
  'Finding your feet',
  'Picking up speed',
  'Quite the scurry',
  'Quick little paws',
  'Full squeek ahead',
];

export interface GameHandle {
  pause: () => void;
  start: () => void;
}
interface Props {
  best: number;
  sound: boolean;
  address: string | null;
  onSound: () => void;
  onHelp: () => void;
  onFinish: (result: RunResult, address: string | null) => void;
  handleRef: React.RefObject<GameHandle | null>;
}

export function Game({
  best,
  sound,
  address,
  onSound,
  onHelp,
  onFinish,
  handleRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useRef<GameAudio | null>(null);
  const engineRef = useRef<RunnerEngine | null>(null);
  if (!engineRef.current)
    engineRef.current = new RunnerEngine(Math.random, (event) =>
      audio.current?.play(event),
    );
  const engine = engineRef.current;
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    engine.snapshot(),
  );
  const [newBest, setNewBest] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [pauseReason, setPauseReason] = useState(
    'Your cheese can wait a moment.',
  );
  const refs = useRef({ best, address, onFinish, sound });
  refs.current = { best, address, onFinish, sound };
  const runAddress = useRef<string | null>(null);
  const runBest = useRef(best);
  const finished = useRef(false);
  const reduced = useRef(false);

  function sync() {
    setSnapshot(engine.snapshot());
  }
  function start() {
    runAddress.current = refs.current.address;
    runBest.current = refs.current.best;
    finished.current = false;
    setNewBest(false);
    engine.start();
    audio.current?.unlock();
    sync();
    setAnnouncement('Run started. Press Space, Up, or tap the scene to jump.');
    canvasRef.current?.focus({ preventScroll: true });
  }
  function pause(reason = 'Your cheese can wait a moment.') {
    if (engine.status !== 'running') return;
    engine.pause();
    setPauseReason(reason);
    sync();
    setAnnouncement('Run paused.');
  }
  function resume() {
    engine.resume();
    audio.current?.unlock();
    sync();
    setAnnouncement('Run resumed.');
    canvasRef.current?.focus({ preventScroll: true });
  }
  function jump() {
    audio.current?.unlock();
    engine.jump();
    sync();
  }

  useEffect(() => {
    handleRef.current = { pause: () => pause(), start };
    return () => {
      handleRef.current = null;
    };
  });

  useEffect(() => {
    audio.current = new GameAudio();
    audio.current.enabled = refs.current.sound;
    const canvas = canvasRef.current!;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      reduced.current = media.matches;
      renderGame(canvas, engine, reduced.current);
    };
    updateMotion();
    media.addEventListener('change', updateMotion);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      engine.setWidth((r.width / r.height) * WORLD_HEIGHT);
      renderGame(canvas, engine, reduced.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frame = 0,
      previous = performance.now(),
      lastSync = 0;
    const tick = (now: number) => {
      const dt = (now - previous) / 1000;
      previous = now;
      if (engine.status === 'running') {
        engine.update(dt);
        renderGame(canvas, engine, reduced.current);
        const current = engine.snapshot();
        if (current.status === 'over' && !finished.current) {
          finished.current = true;
          setNewBest(engine.score > runBest.current);
          const result = current;
          refs.current.onFinish(result, runAddress.current);
          setAnnouncement(
            `Run finished. Score ${formatScore(result.score)}. ${result.cheese} cheese collected. ${result.score > runBest.current ? 'New local best.' : ''}`,
          );
          setSnapshot(result);
        } else if (now - lastSync > 85) {
          setSnapshot(engine.snapshot());
          lastSync = now;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const visibility = () => {
      if (document.hidden) pause('The run paused while you were away.');
    };
    const blur = () => pause('The run paused while you were away.');
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        document.querySelector('dialog[open]') ||
        target.closest('input, textarea, select, [contenteditable=true]')
      )
        return;
      if (
        target.closest('button, a') &&
        !(
          target.closest('.game-utilities') &&
          (event.code === 'KeyP' || event.code === 'Escape')
        )
      )
        return;
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        if (event.repeat) return;
        if (engine.status === 'ready' || engine.status === 'over') start();
        else if (engine.status === 'paused') resume();
        else jump();
      }
      if (event.code === 'KeyP' || event.code === 'Escape') {
        event.preventDefault();
        if (event.repeat) return;
        if (engine.status === 'running') pause();
        else if (engine.status === 'paused') resume();
      }
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', keyboard);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', keyboard);
      audio.current?.dispose();
      audio.current = null;
    };
    // The engine is stable; latest callbacks and settings are read through refs.
  }, [engine]);

  useEffect(() => {
    if (audio.current) audio.current.enabled = sound;
  }, [sound]);

  return (
    <section id="game" className="game-section" aria-label="Squeek Runner game">
      <div
        className={`game-frame is-${snapshot.status}`}
        data-status={snapshot.status}
        data-jumping={snapshot.jumping}
      >
        <canvas
          ref={canvasRef}
          className="game-canvas"
          role="img"
          aria-label={`Pantry scene. Squeek the mouse is ${snapshot.status === 'running' ? 'running' : snapshot.status === 'over' ? 'resting after a run' : 'waiting on the shelf'}.`}
          aria-describedby="game-instructions"
          tabIndex={0}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            if (engine.status === 'running') {
              e.preventDefault();
              canvasRef.current?.focus({ preventScroll: true });
              jump();
            }
          }}
        />
        <div className="game-hud">
          <div className="scoreboard">
            <div className="score-cell">
              <span>Score</span>
              <strong data-testid="score">
                {formatScore(snapshot.score).padStart(4, '0')}
              </strong>
            </div>
            <div className="score-cell best-cell">
              <span>
                <Icon name="trophy" size={14} />
                Local best
              </span>
              <strong data-testid="best">
                {formatScore(best).padStart(4, '0')}
              </strong>
            </div>
          </div>
          <div className="game-utilities">
            <button
              type="button"
              className="icon-button"
              aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
              title={sound ? 'Sound on' : 'Sound off'}
              onClick={(event) => {
                if (audio.current) {
                  audio.current.enabled = !sound;
                  if (!sound) audio.current.unlock();
                }
                onSound();
                if (event.detail > 0)
                  canvasRef.current?.focus({ preventScroll: true });
              }}
            >
              <Icon name={sound ? 'sound' : 'muted'} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={
                snapshot.status === 'paused' ? 'Resume run' : 'Pause run'
              }
              title="Pause or resume (P)"
              disabled={
                snapshot.status === 'ready' || snapshot.status === 'over'
              }
              onClick={(event) => {
                snapshot.status === 'paused' ? resume() : pause();
                if (event.detail > 0)
                  canvasRef.current?.focus({ preventScroll: true });
              }}
            >
              <Icon name={snapshot.status === 'paused' ? 'play' : 'pause'} />
            </button>
          </div>
        </div>
        {snapshot.status === 'ready' && (
          <div className="game-menu start-menu">
            <h2>Ready, little runner?</h2>
            <p>There’s cheese around the corner.</p>
            <button type="button" className="button primary" onClick={start}>
              <Icon name="play" size={18} />
              Start running
              <Icon name="arrow" size={18} />
            </button>
            <span className="menu-hint">
              No wallet needed. Just little paws.
            </span>
          </div>
        )}
        {snapshot.status === 'paused' && (
          <div className="game-menu paused-menu">
            <span className="menu-symbol">
              <Icon name="pause" size={25} />
            </span>
            <h2>Taking a breather</h2>
            <p>{pauseReason}</p>
            <button type="button" className="button primary" onClick={resume}>
              <Icon name="play" size={18} />
              Resume running
            </button>
            <button type="button" className="text-button" onClick={start}>
              <Icon name="restart" size={16} />
              Restart run
            </button>
          </div>
        )}
        {snapshot.status === 'over' && (
          <div className="game-menu over-menu">
            <h2>A good little run.</h2>
            <p className={newBest ? 'new-best' : ''}>
              {newBest ? (
                <>
                  <Icon name="trophy" size={16} />A new local best!
                </>
              ) : (
                'Every little run counts.'
              )}
            </p>
            <div className="run-summary">
              <div>
                <strong>{formatScore(snapshot.score)}</strong>
                <span>points</span>
              </div>
              <div>
                <strong>
                  <Icon name="cheese" size={22} />
                  {snapshot.cheese}
                </strong>
                <span>cheese</span>
              </div>
            </div>
            <button type="button" className="button primary" onClick={start}>
              <Icon name="restart" size={18} />
              Run again
              <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
        <div className="scene-caption" aria-hidden="true">
          <span>
            <span className="scene-dot" />
            {snapshot.status === 'ready'
              ? 'The pantry'
              : `Level ${snapshot.level} · ${pace[snapshot.level - 1]}`}
          </span>
          <span>
            <Icon name="cheese" size={17} />
            {snapshot.cheese.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="control-rail">
        <p id="game-instructions">
          <span className="keyboard-hint">
            <kbd>Space</kbd> / <kbd>↑</kbd> to jump
            <span className="pause-hint">
              {' '}
              · <kbd>P</kbd> to pause
            </span>
          </span>
          <span className="touch-hint">Tap the scene to jump</span>
        </p>
        <button
          type="button"
          className="text-button help-button"
          onClick={onHelp}
        >
          <Icon name="help" size={17} />
          How to play
        </button>
      </div>
      {snapshot.status === 'running' && (
        <button
          type="button"
          className="button mobile-jump"
          onPointerDown={(e) => {
            e.preventDefault();
            jump();
          }}
          onClick={(e) => {
            if (e.detail === 0) jump();
          }}
        >
          <Icon name="up" />
          Jump<span>Tap or press Space</span>
        </button>
      )}
      <div className="sr-only" role="status" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
