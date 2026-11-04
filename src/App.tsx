import { useRef, useState } from 'react';
import { useConnection } from 'wagmi';
import { Game } from './components/Game';
import type { GameHandle } from './components/Game';
import { Icon, MouseMark } from './components/Icon';
import { Modal } from './components/Modal';
import { Leaderboard } from './components/Leaderboard';
import { ConnectWallet } from './wallet/ConnectWallet';
import { addRun, loadSave, persistSave } from './lib/storage';

export default function App() {
  const [save, setSave] = useState(loadSave);
  const [storageWarning, setStorageWarning] = useState(false);
  const [help, setHelp] = useState(false);
  const [about, setAbout] = useState(false);
  const { address, isConnected } = useConnection();
  const game = useRef<GameHandle | null>(null);
  const showHelp = () => {
    game.current?.pause();
    setHelp(true);
  };
  const startFromBoard = () => {
    document
      .getElementById('game')
      ?.scrollIntoView({ behavior: 'instant', block: 'center' });
    game.current?.start();
  };

  return (
    <>
      <a className="skip-link" href="#game">
        Skip to game
      </a>
      <div className="page-shell">
        <header className="site-header">
          <a className="brand" href="#" aria-label="Squeek Runner home">
            <MouseMark />
            <span>
              squeek<span className="brand-runner"> runner</span>
            </span>
          </a>
          <ConnectWallet onOpen={() => game.current?.pause()} />
        </header>
        <main>
          <div className="intro">
            <h1>
              Small mouse, <span>big cheese.</span>
            </h1>
            <p>
              A tiny endless runner
              <br className="desktop-break" /> with a big appetite.
            </p>
          </div>
          <Game
            best={save.best}
            sound={save.sound}
            address={isConnected && address ? address : null}
            handleRef={game}
            onHelp={showHelp}
            onSound={() => {
              const updated = { ...save, sound: !save.sound };
              setSave(updated);
              setStorageWarning(!persistSave(updated));
            }}
            onFinish={(result, runAddress) => {
              const updated = addRun(save, result, runAddress);
              setSave(updated);
              setStorageWarning(!persistSave(updated));
            }}
          />
          {storageWarning && (
            <p className="storage-warning" role="status">
              <Icon name="help" size={16} />
              Storage is unavailable. Scores will last for this visit only.
              Allow site storage to keep them.
            </p>
          )}
          <div className="below-game">
            <section className="how-it-works" aria-labelledby="how-heading">
              <h2 id="how-heading">Little paws. Simple rules.</h2>
              <p className="section-description">
                A quick escape, one jump at a time.
              </p>
              <ol className="rules-list">
                <li>
                  <span className="rule-icon">
                    <Icon name="up" size={24} />
                  </span>
                  <div>
                    <h3>Find your rhythm</h3>
                    <p>
                      Press Space or ↑, or tap to jump.
                      <br />
                      Time it right to clear the clutter.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="rule-icon cheese-rule">
                    <Icon name="cheese" size={24} />
                  </span>
                  <div>
                    <h3>Follow the cheese</h3>
                    <p>
                      Each little wedge adds 25 points.
                      <br />A little courage goes a long way.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="rule-icon">
                    <Icon name="trophy" size={23} />
                  </span>
                  <div>
                    <h3>Outrun your best</h3>
                    <p>
                      The pantry gets quicker as you go.
                      <br />
                      Your best stays in this browser.
                    </p>
                  </div>
                </li>
              </ol>
            </section>
            <Leaderboard
              runs={save.runs}
              onStart={startFromBoard}
              onOpen={() => game.current?.pause()}
            />
          </div>
        </main>
        <footer className="site-footer">
          <span className="footer-brand">
            <MouseMark size={24} />
            Made for one more little run.
          </span>
          <div>
            <span className="footer-local">No wallet needed to play.</span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                game.current?.pause();
                setAbout(true);
              }}
            >
              About & privacy
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </footer>
      </div>
      {help && (
        <Modal title="A little field guide" onClose={() => setHelp(false)}>
          <p className="modal-intro">
            Keep Squeek running, clear the pantry clutter, and bring home the
            cheese.
          </p>
          <dl className="help-keys">
            <div>
              <dt>Jump</dt>
              <dd>
                <kbd>Space</kbd> or <kbd>↑</kbd>
              </dd>
            </div>
            <div>
              <dt>Pause / resume</dt>
              <dd>
                <kbd>P</kbd> or <kbd>Esc</kbd>
              </dd>
            </div>
            <div>
              <dt>On your phone</dt>
              <dd>Tap the scene or Jump</dd>
            </div>
          </dl>
          <div className="help-scoring">
            <h3>Every crumb counts</h3>
            <p>
              You earn points for distance and 25 points for each cheese.
              Obstacles get faster over time. One bump ends the run.
            </p>
          </div>
          <p className="privacy-note">
            Your top runs and sound setting are saved in this browser. A wallet
            is entirely optional.
          </p>
          <button
            type="button"
            className="button primary wide"
            onClick={() => setHelp(false)}
          >
            Got it
            <Icon name="check" size={18} />
          </button>
        </Modal>
      )}
      {about && (
        <Modal
          title="Small game, small footprint"
          onClose={() => setAbout(false)}
        >
          <p className="modal-intro">
            Squeek Runner is a free endless runner for a little break. All game
            art and sounds are bundled or drawn right here.
          </p>
          <h3>Your scores stay here</h3>
          <p>
            Local best scores, up to ten runs, and your sound preference are
            stored in your browser. The board shows your top five. Clearing site
            data clears these records.
          </p>
          <h3>Wallets are optional</h3>
          <p>
            Connecting shares your public address with this page and labels runs
            started while connected. The address is stored locally with those
            scores. Disconnecting does not remove earlier scores.
          </p>
          <h3>About Sepolia</h3>
          <p>
            Network detection is available for Ethereum Sepolia (11155111).
            There is no leaderboard contract, token, prize, score verification,
            or transaction flow in this version.
          </p>
          <p className="privacy-note">
            No analytics or game backend. Wallet providers may use their own
            network services when you connect.
          </p>
        </Modal>
      )}
    </>
  );
}
