type IconeProps = { className?: string };

const base = "w-[18px] h-[18px]";

function Svg({ className = base, children }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconeResumo(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeLancamentos(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M8 6.5h12M8 12h12M8 17.5h12" strokeLinecap="round" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" strokeLinecap="round" strokeWidth="2.5" />
    </Svg>
  );
}

export function IconeEntradas(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M12 19V7m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4.5h14" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeContas(props: IconeProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
      <path d="M4 9.5h16" />
      <path d="M8 3.5v3.5M16 3.5v3.5" strokeLinecap="round" />
      <path d="m9 14.5 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeParcelados(props: IconeProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="1.75" />
      <path d="M3.5 10h17" />
      <path d="M7 14.5h4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeDividas(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M4 17.5 9 12l3.5 3.5L20 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconePrevisao(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M4 18V6M4 18h16" strokeLinecap="round" />
      <path d="M7 14l3.5-4 3 2.5L18 7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0" />
      <path d="M16 7h2v2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeCartoes(props: IconeProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 15h3" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeOrcamento(props: IconeProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.5 9.75c0-1-1-1.75-2.5-1.75s-2.5.7-2.5 1.75c0 2.4 5 1.2 5 3.5 0 1.05-1.12 1.75-2.5 1.75s-2.5-.75-2.5-1.75" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeMetas(props: IconeProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" strokeLinecap="round" strokeWidth="2.5" />
    </Svg>
  );
}

export function IconeImportar(props: IconeProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15.5v2A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconeConfiguracoes(props: IconeProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="2.75" />
      <path d="M12 3.5v2.25M12 18.25v2.25M3.5 12h2.25M18.25 12h2.25M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" strokeLinecap="round" />
    </Svg>
  );
}
