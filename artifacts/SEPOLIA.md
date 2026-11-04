# Extending Squeek Runner with Sepolia

## Current boundary

The game is complete local software. Wallet connection and network detection are implemented. A contract, shared leaderboard, verified score protocol, signing flow, transaction flow, and indexer are **not** implemented. There is intentionally no contract address or invented ABI.

| Surface | Actual source | Meaning |
| --- | --- | --- |
| HUD / local best | `RunnerEngine` and `squeek-runner:v1` local storage | This browser's unverified game results |
| This browser tab | `SaveData.runs`, sorted by score | Top five of up to ten retained local runs |
| Player address | Connected wallet at the start of a run | Local attribution only |
| Sepolia tab | Explicit unavailable state | No blockchain data is read or submitted |
| Wallet network | Wallet's reported EIP-1193 chain ID | Checked against 11155111 |
| Contract configuration | `leaderboardDeployment = null` in `src/wallet/config.ts` | No deployment exists in this delivery |

## Reuse the existing modules

`RunnerEngine` owns deterministic game logic independently of React and wallets. `RunResult` contains `score`, `cheese`, `seconds`, and `distance`. The game component captures the wallet address when a run starts and calls `onFinish(result, runAddress)` once after collision. `src/lib/storage.ts` handles the local record; it should stay available when disconnected or on the wrong network.

Keep the existing wagmi configuration as the connection entry point. It discovers MetaMask and Rabby independently, persists sessions safely, handles Sepolia switching and the unknown-chain add fallback, and provides the Coinbase SDK path. Do not add a relay or embed a private key in the export.

## Integration sequence

1. **Define score verification before deployment.** A client can edit local storage, patch JavaScript, or submit arbitrary numbers. Connecting a wallet does not prove a score. Choose an authoritative verifier, replay-verifiable protocol, or suitable proof system. Bind submissions to the player, run identifier, nonce, chain, contract, and validity period as appropriate. Decide trust and replay rules explicitly.
2. **Deploy and review a real Sepolia contract.** Record the actual deployment address, ABI, deployment transaction, and protocol version. Confirm deployed bytecode and chain ID. Replace the explicit `null` configuration only after this information exists. Do not use a zero address or a guessed address.
3. **Add a separate blockchain adapter.** Put contract reads and submissions in a new module rather than in `engine.ts` or the local storage implementation. A read result should identify its `blockchain` source and include the real player, verified score, and block/transaction reference where the contract permits. Keep `local` and `blockchain` record types distinct.
4. **Connect UI states to actual outcomes.** Require the correct chain for writes. Expose approval, pending, rejected, reverted, retry, and receipt-confirmed states. Only describe a score as on-chain after a successful receipt or verified read. Explorer links must come from real transaction hashes. Never transform a local table row into a blockchain record optimistically.
5. **Keep availability honest.** Handle empty, loading, RPC failure, disconnected, and wrong-network states. Preserve local play while chain services are unavailable. Add caching/indexing only when a real service exists; a static IPFS directory alone cannot provide a shared database.
6. **Validate the real integration separately.** Re-run local gameplay checks and add contract-specific tests, actual deployed-bytecode reads, receipt handling, rejection/revert cases, multiple injected wallets, and physical phone handoffs. The current simulated-provider checks establish wallet UI behavior, not a deployed contract integration.

## Public references

- [Wagmi EIP-6963 configuration](https://wagmi.sh/react/api/createConfig) and [injected connector](https://wagmi.sh/react/api/connectors/injected).
- [Wagmi Coinbase connector](https://wagmi.sh/react/api/connectors/coinbaseWallet) and [v3 API migration](https://wagmi.sh/react/guides/migrate-from-v2-to-v3), used for the current hook names.
- [MetaMask dapp deep links](https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks), [Coinbase deep links](https://docs.cdp.coinbase.com/wallet-sdk/docs/deep-link), and [Phantom browser links](https://docs.phantom.com/phantom-deeplinks/other-methods/browse).
- Rabby's `https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=…` form follows the public [universal-link configuration](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/constant/universalLink.ts) and [open-dapp handler](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/hooks/universalLink.ts). App vendor behavior can change; no physical mobile handoff was performed in this task.

These links document connector behavior. They do not establish that a score contract or shared leaderboard exists.
