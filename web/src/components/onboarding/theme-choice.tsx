'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};

/**
 * Light or dark, in onboarding's corner: a new person starts on the dark
 * theme (NEW_USER_THEME) with no menu yet to find the sun/moon button in.
 * A click switches at once and is kept like the menu's button keeps it
 * (next-themes, per browser); the line under it says where to change it
 * later. Never blocks a step.
 */
export function ThemeChoice({ className }: { className?: string }) {
  const t = useTranslations('onboarding.theme');
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    useCallback(() => true, []),
    useCallback(() => false, []),
  );
  const current = mounted ? resolvedTheme : undefined;
  const options = [
    { value: 'light', label: t('light'), Icon: Sun },
    { value: 'dark', label: t('dark'), Icon: Moon },
  ] as const;

  return (
    <div data-slot="theme-choice" className={cn('flex flex-col items-end gap-1', className)}>
      <div
        role="radiogroup"
        aria-label={t('label')}
        className="inline-flex rounded-full border bg-background/90 p-0.5 shadow-sm backdrop-blur"
      >
        {options.map(({ value, label, Icon }) => {
          const on = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(value)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                on
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      <p className="max-w-56 text-end text-[11px] leading-snug text-muted-foreground">
        {t('hint')}
      </p>
    </div>
  );
}
