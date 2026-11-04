import type { CSSProperties } from 'react';

export type IconName =
  | 'play'
  | 'pause'
  | 'restart'
  | 'sound'
  | 'muted'
  | 'cheese'
  | 'trophy'
  | 'arrow'
  | 'up'
  | 'close'
  | 'wallet'
  | 'help'
  | 'check'
  | 'external'
  | 'copy'
  | 'leaf'
  | 'clock'
  | 'shield';
const paths: Record<IconName, React.ReactNode> = {
  play: <path d="m9 5 11 7-11 7V5Z" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  restart: (
    <>
      <path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6" />
    </>
  ),
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16" />
    </>
  ),
  muted: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM16 9l6 6M22 9l-6 6" />
    </>
  ),
  cheese: (
    <>
      <path d="m3 16 3-12 15 10v6H3v-4Zm0 0 18-2" />
      <path d="M8 10h.01M12 13h.01M8 18h.01" strokeWidth="3" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v6M8 21h8" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  up: <path d="M12 20V4m-6 6 6-6 6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  wallet: (
    <>
      <path d="M19 7V4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h15V7H5a1 1 0 0 1 0-2" />
      <path d="M20 11h-6v5h6M16.5 13.5h.01" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.1.8-1.7 1-1.7 2.7M12 17h.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3c1 9-2 16-9 16a7 7 0 0 1-7-7C4 5 12 4 20 3ZM4 21l11-11" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function MouseMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
    >
      <path
        d="M12 31C1 33 2 19 8 22"
        stroke="#b58e87"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M10 29c-2-7 2-14 11-14 7 0 13 5 17 11-5 8-23 11-28 3Z"
        fill="#bfc3b9"
        stroke="#494d43"
        strokeWidth="1.7"
      />
      <ellipse
        cx="21"
        cy="15"
        rx="8"
        ry="9"
        fill="#c7cabf"
        stroke="#494d43"
        strokeWidth="1.7"
      />
      <ellipse cx="21" cy="15" rx="5" ry="6" fill="#e4b8aa" />
      <path d="m16 26 5-3 4 7-6 2-3-6Z" fill="#f1c348" />
      <circle cx="31" cy="24" r="2" fill="#343a32" />
      <circle cx="38" cy="27" r="2" fill="#bb8a80" />
      <path
        d="m35 29 6 2m-5-4 6-1"
        stroke="#707765"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
