interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const w = size === 'sm' ? 'w-10' : 'w-[52px]';
  const h = size === 'sm' ? 'h-[22px]' : 'h-7';
  const thumb = size === 'sm' ? 'w-4 h-4' : 'w-[22px] h-[22px]';
  const translate = size === 'sm' ? 'translate-x-[20px]' : 'translate-x-[26px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        ${w} ${h}
        ${checked ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200
          ${thumb}
          ${checked ? translate : 'translate-x-[3px]'}
          mt-[3px]
        `}
      />
    </button>
  );
}
