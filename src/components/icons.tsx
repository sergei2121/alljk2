import type { JSX } from "react";

const P: Record<string, JSX.Element> = {
  logo: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" strokeWidth="1.7" />
      <path d="M7 8h10M7 12h6.5M10.5 8v8.5" strokeWidth="1.6" />
      <path d="M6.5 17.6c2-2 4-2 6.4-.3 2 1.4 3.6 1 4.9-.7" strokeWidth="1.7" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15.2 15.2 4.8 4.8" />
    </>
  ),
  import: (
    <>
      <path d="M12 3.5v10m0 0 3.6-3.6M12 13.5 8.4 9.9" />
      <path d="M4 15.5v2.6A2.4 2.4 0 0 0 6.4 20.5h11.2a2.4 2.4 0 0 0 2.4-2.4v-2.6" />
    </>
  ),
  export: (
    <>
      <path d="M12 13.5v-10m0 0L8.4 7.1M12 3.5l3.6 3.6" />
      <path d="M4 15.5v2.6a2.4 2.4 0 0 0 2.4 2.4h11.2a2.4 2.4 0 0 0 2.4-2.4v-2.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevD: <path d="m6 9.5 6 6 6-6" />,
  chevR: <path d="m9.5 6 6 6-6 6" />,
  chevL: <path d="m14.5 6-6 6 6 6" />,
  sortAsc: <path d="M8 10.5 12 6l4 4.5M8 15h8" />,
  sortDesc: <path d="M8 9h8M8 13.5 12 18l4-4.5" />,
  filter: <path d="M4 5.5h16l-6.2 7.2v5.1L10.2 20v-7.3L4 5.5Z" />,
  columns: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M9.2 4.5v15M14.8 4.5v15" />
    </>
  ),
  rows: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 13.6A8.2 8.2 0 0 1 10.4 4a8.2 8.2 0 1 0 9.6 9.6Z" />,
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 3.8h5M6.2 6.5l.8 12a2 2 0 0 0 2 1.9h6a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </>
  ),
  pencil: <path d="m14.4 4.9 4.7 4.7L8.4 20.3l-5 1.3 1.3-5L15.4 5.9a2.1 2.1 0 0 1 3 0l-4-1Zm0 0 1.3-1.3a2.1 2.1 0 0 1 3 0l1.7 1.7a2.1 2.1 0 0 1 0 3L19.1 6.2" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 5.5v-.7A2.3 2.3 0 0 0 13.2 2.5H5.8a2.3 2.3 0 0 0-2.3 2.3v7.4a2.3 2.3 0 0 0 2.3 2.3h.7" />
    </>
  ),
  check: <path d="m4.5 12.8 5 5L19.5 6.6" />,
  warn: (
    <>
      <path d="M12 3.6 2.8 19.4h18.4L12 3.6Z" />
      <path d="M12 9.8v4.4M12 17.2v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.2M12 7.6v.2" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9.3h18M9.5 9.3v10.2M3 14.4h18" />
    </>
  ),
  doc: (
    <>
      <path d="M6 2.8h8l4 4.2v13a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V4.3A1.5 1.5 0 0 1 6.5 2.8Z" />
      <path d="M14 3v4.3h4M8.5 12h7M8.5 15.5h7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.5 5.8 12 5.8 21.2 12 21.2 12 17.5 18.2 12 18.2 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4.5 20 19.5M9.9 6.3A8.6 8.6 0 0 1 12 5.8c5.5 0 9.2 6.2 9.2 6.2a15.6 15.6 0 0 1-3 3.4M6 8.3A14.6 14.6 0 0 0 2.8 12S6.5 18.2 12 18.2a8.8 8.8 0 0 0 3.3-.6" />
      <path d="M9.5 9.8a2.9 2.9 0 0 0 4.1 4.1" />
    </>
  ),
  refresh: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9.4M19.5 12a7.5 7.5 0 0 1-13 5.1L4 14.6" />
      <path d="M20 4.8v4.6h-4.6M4 19.2v-4.6h4.6" />
    </>
  ),
  sigma: <path d="M17.5 7.5v-3h-11l6.2 7.5L6.5 19.5h11v-3" />,
  spark: <path d="M12 2.8 14 9.6l6.8 2.4-6.8 2.4L12 21.2l-2-6.8L3.2 12 10 9.6 12 2.8Z" />,
  wave: <path d="M2.5 12.5c2.6-4.6 5.4-4.6 9-.9 3.2 3.2 6.4 3.2 10-1.6" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2.5" />
      <path d="M9 4.5V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2v1.3M8.7 10.5h6.6M8.7 14h6.6M8.7 17.5h4" />
    </>
  ),
  arrowR: <path d="M4 12h16m0 0-5.5-5.5M20 12l-5.5 5.5" />,
  dots: <path d="M12 6.2v.2M12 12v.2M12 17.8v.2" />,
  expand: <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />,
  fileJson: (
    <>
      <path d="M6 2.8h8l4 4.2v13a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V4.3A1.5 1.5 0 0 1 6.5 2.8Z" />
      <path d="M14 3v4.3h4M9.2 11.5c-1 0-1 .9-1 1.5s.2 1.5-1 1.5c1.2 0 1 .9 1 1.5s0 1.5 1 1.5M14.8 11.5c1 0 1 .9 1 1.5s-.2 1.5 1 1.5c-1.2 0-1 .9-1 1.5s0 1.5-1 1.5" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  className = "w-4 h-4",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
