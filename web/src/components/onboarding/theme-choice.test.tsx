import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';

const theme = vi.hoisted(() => ({ resolvedTheme: 'dark', setTheme: vi.fn() }));
vi.mock('next-themes', () => ({ useTheme: () => theme }));

const { ThemeChoice } = await import('./theme-choice');

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

function render() {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() =>
    root.render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ThemeChoice />
      </NextIntlClientProvider>,
    ),
  );
  return { container, unmount: () => act(() => root.unmount()) };
}

describe('ThemeChoice', () => {
  it('shows the current theme, switches at once, and says where to change it later', () => {
    const { container, unmount } = render();
    const group = container.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-label')).toBe('Theme');
    const [light, dark] = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(light.textContent).toBe('Light');
    expect(dark.getAttribute('aria-checked')).toBe('true');
    expect(light.getAttribute('aria-checked')).toBe('false');
    act(() => light.click());
    expect(theme.setTheme).toHaveBeenCalledWith('light');
    expect(container.textContent).toContain('next to the logo in the menu');
    unmount();
  });
});
