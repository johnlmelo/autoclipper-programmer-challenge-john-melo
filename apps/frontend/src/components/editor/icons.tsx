type IconProps = {
  className?: string;
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19C15.418 19 19 15.418 19 11S15.418 3 11 3 3 6.582 3 11s3.582 8 8 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M21 21 16.65 16.65" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function CaretDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m8 6 10 6-10 6V6Z" fill="currentColor" />
    </svg>
  );
}

export function SkipBackIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 6v12M9 12l8 6V6l-8 6Z" fill="currentColor" />
    </svg>
  );
}

export function SkipForwardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 6v12M15 12 7 18V6l8 6Z" fill="currentColor" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V6m0 0-4 4m4-4 4 4M4 16.5v1A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 8.5 1.2-2.1 2.4.7.5 2.3 2.2 1.1-.8 2.3 1.6 1.9-1.6 1.9.8 2.3-2.2 1.1-.5 2.3-2.4.7L12 19.5l-1.2 2.1-2.4-.7-.5-2.3-2.2-1.1.8-2.3L4.9 13l1.6-1.9-.8-2.3 2.2-1.1.5-2.3 2.4-.7L12 8.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="12" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
