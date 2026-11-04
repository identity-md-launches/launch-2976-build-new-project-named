import { useState } from 'react';
import { getAddress } from 'viem';
import type { LocalRun } from '../lib/storage';
import { formatScore, shortAddress } from '../lib/storage';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { CHAIN_ID } from '../wallet/config';

export function Leaderboard({
  runs,
  onStart,
}: {
  runs: LocalRun[];
  onStart: () => void;
}) {
  const [tab, setTab] = useState<'local' | 'sepolia'>('local');
  const [player, setPlayer] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState('');
  return (
    <section className="leaderboard" aria-labelledby="leaderboard-heading">
      <div className="section-heading">
        <h2 id="leaderboard-heading">
          <Icon name="trophy" size={21} />
          The cheese board
        </h2>
        <span className="local-label">Local play</span>
      </div>
      <div
        className="board-tabs"
        role="tablist"
        aria-label="Leaderboard source"
      >
        <button
          type="button"
          id="local-tab"
          role="tab"
          aria-selected={tab === 'local'}
          aria-controls="local-panel"
          tabIndex={tab === 'local' ? 0 : -1}
          onClick={() => setTab('local')}
          onKeyDown={(e) => {
            if (
              e.key === 'ArrowRight' ||
              e.key === 'ArrowLeft' ||
              e.key === 'End'
            ) {
              e.preventDefault();
              setTab('sepolia');
              document.getElementById('sepolia-tab')?.focus();
            }
          }}
        >
          This browser
        </button>
        <button
          type="button"
          id="sepolia-tab"
          role="tab"
          aria-selected={tab === 'sepolia'}
          aria-controls="sepolia-panel"
          tabIndex={tab === 'sepolia' ? 0 : -1}
          onClick={() => setTab('sepolia')}
          onKeyDown={(e) => {
            if (
              e.key === 'ArrowLeft' ||
              e.key === 'ArrowRight' ||
              e.key === 'Home'
            ) {
              e.preventDefault();
              setTab('local');
              document.getElementById('local-tab')?.focus();
            }
          }}
        >
          Sepolia
          <span className="soon-dot" aria-hidden="true" />
        </button>
      </div>
      {tab === 'local' ? (
        <div
          id="local-panel"
          role="tabpanel"
          aria-labelledby="local-tab"
          tabIndex={0}
        >
          <table className="score-table">
            <caption className="sr-only">
              Top five runs saved in this browser, highest score first.
            </caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Player</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 5).map((run, i) => (
                <tr key={run.id}>
                  <td>
                    <span className={i === 0 ? 'rank first-rank' : 'rank'}>
                      {i === 0 ? (
                        <Icon name="trophy" size={17} />
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                      <span className="sr-only">
                        {i === 0 ? 'First place' : ''}
                      </span>
                    </span>
                  </td>
                  <td>
                    {run.address ? (
                      <button
                        type="button"
                        className="address-button"
                        aria-label={`View player address ${run.address}`}
                        onClick={() => {
                          setPlayer(run.address);
                          setCopyNote('');
                        }}
                      >
                        {shortAddress(getAddress(run.address))}
                        <Icon name="external" size={13} />
                      </button>
                    ) : (
                      <span className="guest-player">
                        <span className="player-dot" />
                        You<span className="guest-label">Guest</span>
                      </span>
                    )}
                  </td>
                  <td>{formatScore(run.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && (
            <div className="board-empty">
              <span className="empty-illustration">
                <Icon name="cheese" size={30} />
                <span className="tiny-spark">+</span>
              </span>
              <h3>A spot for your little victories</h3>
              <p>Finish a run to set the first score.</p>
              <button type="button" className="text-button" onClick={onStart}>
                Make your first run
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          <p className="board-footnote">
            <Icon name="shield" size={14} />
            {runs.length > 0
              ? 'Top 5 runs · Saved in this browser only.'
              : 'Browser scores only. No global rankings.'}
          </p>
        </div>
      ) : (
        <div
          id="sepolia-panel"
          className="sepolia-panel"
          role="tabpanel"
          aria-labelledby="sepolia-tab"
          tabIndex={0}
        >
          <span className="empty-illustration">
            <Icon name="leaf" size={28} />
          </span>
          <h3>A future finish line</h3>
          <p>
            An on-chain leaderboard is planned. No contract is connected, and no
            scores or transactions are sent.
          </p>
          <span className="network-label">
            Ethereum Sepolia · Chain ID {CHAIN_ID}
          </span>
          <p className="board-footnote">
            Connect a wallet above to label new local runs with your address.
          </p>
        </div>
      )}
      {player && (
        <Modal title="Player address" onClose={() => setPlayer(null)}>
          <p className="modal-intro">
            This address is attached to a local run. It is not an on-chain
            record.
          </p>
          <code className="full-address">{getAddress(player)}</code>
          <button
            type="button"
            className="button secondary wide"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(getAddress(player));
                setCopyNote('Address copied.');
              } catch {
                setCopyNote('Select and copy the address above.');
              }
            }}
          >
            <Icon name="copy" size={17} />
            Copy address
          </button>
          <p role="status" className="wallet-note">
            {copyNote}
          </p>
        </Modal>
      )}
    </section>
  );
}
