type IconProps = {
  className?: string;
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M18 8.5C18 5.18629 15.3137 2.5 12 2.5C8.68629 2.5 6 5.18629 6 8.5V11.5C6 13.1569 5.21935 14.7173 3.9 15.7L3.5 16H20.5L20.1 15.7C18.7807 14.7173 18 13.1569 18 11.5V8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M10 19C10.4 20.2 11.2 21 12 21C12.8 21 13.6 20.2 14 19" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function DotsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}
