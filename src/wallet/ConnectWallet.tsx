import { useState } from 'react';
import {
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { getAddress } from 'viem';
import type { Connector } from 'wagmi';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { shortAddress } from '../lib/storage';
import { CHAIN_ID } from './config';
import { OPEN_IN, isPhoneBrowser } from './open-in';

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}wallets/${name}.svg`;
const errorMessage = (error: unknown, action: 'connect' | 'switch') => {
  const message = error instanceof Error ? error.message : '';
  if (/reject|denied|4001/i.test(message))
    return action === 'connect'
      ? 'Connection declined. Choose a wallet to try again.'
      : 'Network change declined. You can try again or keep playing locally.';
  if (/already pending|-32002/i.test(message))
    return 'A request is already open. Check your wallet, then try again.';
  if (/provider|not found|not installed/i.test(message))
    return 'No browser wallet found. Install MetaMask or Rabby, refresh, and try again.';
  return action === 'connect'
    ? 'Unable to connect. Unlock your wallet and try again.'
    : 'Unable to switch networks. Choose Ethereum Sepolia in your wallet, then try again.';
};

export function ConnectWallet({ onOpen }: { onOpen: () => void }) {
  const {
    address,
    isConnected,
    chainId,
    isReconnecting,
    connector: activeConnector,
  } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const named = connectors.filter(
    (c) => c.type === 'injected' && c.id !== 'injected',
  );
  const mobile = isPhoneBrowser(
    named.length > 0 ||
      Boolean((window as Window & { ethereum?: unknown }).ethereum),
  );
  const listed = connectors
    .filter((c) => !(c.id === 'injected' && (named.length > 0 || mobile)))
    .sort(
      (a, b) => Number(a.type !== 'injected') - Number(b.type !== 'injected'),
    );
  const wrongChain = isConnected && chainId !== CHAIN_ID;
  const pending =
    connect.isPending || switchChain.isPending || disconnect.isPending;
  const show = () => {
    onOpen();
    setNote('');
    setCopied(false);
    setOpen(true);
  };

  async function changeNetwork() {
    setNote('');
    try {
      await switchChain.mutateAsync({ chainId: CHAIN_ID });
      setNote('Ethereum Sepolia is selected. Scores are still local.');
    } catch (e) {
      setNote(errorMessage(e, 'switch'));
    }
  }
  async function connectTo(connector: Connector) {
    setNote('');
    setPendingId(connector.uid);
    try {
      await connect.mutateAsync({ connector });
      setOpen(false);
    } catch (e) {
      setNote(errorMessage(e, 'connect'));
    } finally {
      setPendingId(null);
    }
  }
  function icon(connector: Connector) {
    return (
      connector.icon ||
      (connector.id === 'coinbaseWalletSDK' ? asset('coinbase') : null)
    );
  }
  function label(connector: Connector) {
    return connector.id === 'injected'
      ? 'Browser wallet'
      : connector.id === 'coinbaseWalletSDK' && mobile
        ? 'Coinbase Smart Wallet'
        : connector.name;
  }

  return (
    <>
      <button
        type="button"
        className={`wallet-button ${wrongChain ? 'wrong-chain' : ''}`}
        onClick={() => {
          show();
          if (wrongChain) void changeNetwork();
        }}
      >
        <Icon name="wallet" size={18} />
        <span>
          {isReconnecting ? (
            'Reconnecting…'
          ) : wrongChain ? (
            'Switch to Sepolia'
          ) : isConnected && address ? (
            shortAddress(getAddress(address))
          ) : (
            <>
              Connect<span className="wallet-word"> wallet</span>
            </>
          )}
        </span>
        {isConnected && !wrongChain && (
          <span className="connection-dot" aria-label="Connected" />
        )}
      </button>
      {open && (
        <Modal
          title={isConnected ? 'Your wallet' : 'Connect a wallet'}
          onClose={() => setOpen(false)}
          className="wallet-modal"
        >
          {isConnected && address ? (
            <>
              <p className="modal-intro">
                Connected with {activeConnector?.name || 'your wallet'}.
              </p>
              <div className="account-address">
                <code>{getAddress(address)}</code>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Copy wallet address"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getAddress(address));
                      setCopied(true);
                    } catch {
                      setNote(
                        'Copy is unavailable. Select and copy the address above.',
                      );
                    }
                  }}
                >
                  <Icon name={copied ? 'check' : 'copy'} />
                </button>
              </div>
              <div
                className={`network-state ${wrongChain ? 'network-warning' : ''}`}
              >
                <Icon name={wrongChain ? 'help' : 'check'} />
                <div>
                  <strong>
                    {wrongChain
                      ? 'Ethereum Sepolia required'
                      : 'Ethereum Sepolia'}
                  </strong>
                  <span>
                    {wrongChain
                      ? `Current chain: ${chainId ?? 'unknown'}`
                      : `Chain ID ${CHAIN_ID}`}
                  </span>
                </div>
              </div>
              {wrongChain && (
                <button
                  type="button"
                  className="button primary wide"
                  disabled={pending}
                  onClick={() => void changeNetwork()}
                >
                  {switchChain.isPending
                    ? 'Confirm in your wallet…'
                    : 'Switch to Sepolia'}
                </button>
              )}
              <p className="privacy-note">
                Your address labels new runs in this browser. No scores are sent
                to a blockchain.
              </p>
              <button
                type="button"
                className="button secondary wide"
                disabled={pending}
                onClick={async () => {
                  try {
                    await disconnect.mutateAsync({});
                    setOpen(false);
                  } catch {
                    setNote(
                      'Unable to disconnect. Close any open wallet prompt and try again.',
                    );
                  }
                }}
              >
                {disconnect.isPending ? 'Disconnecting…' : 'Disconnect wallet'}
              </button>
            </>
          ) : (
            <>
              <p className="modal-intro">
                Optional for playing. Add your address to new local scores.
              </p>
              <div className="wallet-rows">
                {mobile &&
                  OPEN_IN.map((w) => (
                    <a
                      className="wallet-row"
                      key={w.id}
                      href={w.href(location.href)}
                    >
                      <img src={asset(w.id)} width="28" height="28" alt="" />
                      <span>Open in {w.name}</span>
                      <Icon name="external" size={16} />
                    </a>
                  ))}
                {listed.map((c) => (
                  <button
                    type="button"
                    key={c.uid}
                    className="wallet-row"
                    disabled={pending}
                    onClick={() => void connectTo(c)}
                  >
                    {icon(c) ? (
                      <img src={icon(c)!} alt="" width="28" height="28" />
                    ) : (
                      <span className="browser-wallet-icon">
                        <Icon name="wallet" size={24} />
                      </span>
                    )}
                    <span>
                      {label(c)}
                      {pendingId === c.uid && <small>Check your wallet…</small>}
                    </span>
                    <Icon name="arrow" size={18} />
                  </button>
                ))}
              </div>
              {!mobile && named.length === 0 && (
                <div className="wallet-install">
                  <p>Use MetaMask or Rabby?</p>
                  <div>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={asset('metamask')}
                        width="20"
                        height="20"
                        alt=""
                      />
                      Get MetaMask
                      <Icon name="external" size={14} />
                    </a>
                    <a
                      href="https://rabby.io/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={asset('rabby')} width="20" height="20" alt="" />
                      Get Rabby
                      <Icon name="external" size={14} />
                    </a>
                  </div>
                </div>
              )}
              <p className="privacy-note">
                <Icon name="shield" size={16} />
                Connection requests your public address. No signature, payment,
                or transaction is requested.
              </p>
            </>
          )}
          <p role="status" className={`wallet-note ${note ? 'has-note' : ''}`}>
            {copied && !note ? 'Address copied.' : note}
          </p>
        </Modal>
      )}
    </>
  );
}
