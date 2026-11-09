import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';

/**
 * The dashboard drawn behind the onboarding wizard: its menu is the one the
 * wizard leads to, Agent Center in it only with the new Chat on, and the
 * item marked is where the person will start.
 */

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span data-image={alt} />,
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));

const { DashboardPreview } = await import('./dashboard-preview');
const { ChatAgenticProvider } = await import('@/components/providers/chat-agentic-provider');

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(chatAgentic: boolean) {
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ChatAgenticProvider enabled={chatAgentic}>
          <DashboardPreview
            brandName="Acme Coffee"
            domain=""
            topics={[]}
            promptCount={0}
            competitors={[]}
          />
        </ChatAgenticProvider>
      </NextIntlClientProvider>,
    );
  });
}

const menu = () => [...container.querySelectorAll('aside span.truncate')].map((s) => s.textContent);
/** The menu items drawn as the start page. */
const marked = () =>
  [...container.querySelectorAll('aside div.bg-accent span.truncate')].map((s) => s.textContent);

describe('DashboardPreview', () => {
  it('shows Agent Center under Chat with the new Chat on', async () => {
    await render(true);
    const items = menu();
    expect(items).toContain('Agent Center');
    expect(items.indexOf('Agent Center')).toBe(items.indexOf('Chat') + 1);
  });

  it('leaves Agent Center out with the new Chat off', async () => {
    await render(false);
    expect(menu()).toContain('Chat');
    expect(menu()).not.toContain('Agent Center');
  });

  it('marks where the person will start: Chat with the new Chat on, else the Action Center', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_CLOUD', 'true');
    try {
      await render(true);
      expect(marked()).toEqual(['Chat']);
      await render(false);
      expect(marked()).toEqual(['Action Center']);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
