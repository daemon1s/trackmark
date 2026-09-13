import test from 'node:test';
import assert from 'node:assert/strict';
import { SPANavigator } from '../src/core/spa-navigator.ts';

test('SPANavigator notifies metadata change on yt-page-data-updated even when videoId is unchanged', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  const eventListeners = new Map<string, Function[]>();
  const addListener = (event: string, fn: Function) => {
    const list = eventListeners.get(event) || [];
    list.push(fn);
    eventListeners.set(event, list);
  };

  (globalThis as any).window = {
    location: { href: 'https://www.youtube.com/watch?v=video123' },
    addEventListener: addListener,
    setInterval: () => 1,
    clearInterval: () => {}
  };
  (globalThis as any).document = {
    addEventListener: addListener
  };

  try {
    const navigator = new SPANavigator();
    let metadataUpdatesCount = 0;
    let lastUpdatedVideoId: string | null = null;

    navigator.onMetadataChange((videoId) => {
      metadataUpdatesCount++;
      lastUpdatedVideoId = videoId;
    });

    const pageDataHandlers = eventListeners.get('yt-page-data-updated') || [];
    assert.ok(pageDataHandlers.length > 0);

    pageDataHandlers.forEach(h => h());

    assert.equal(metadataUpdatesCount, 1);
    assert.equal(lastUpdatedVideoId, 'video123');

    navigator.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});

test('SPANavigator handles non-watch URLs and unsubscribe properly', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  const eventListeners = new Map<string, Function[]>();
  const addListener = (event: string, fn: Function) => {
    const list = eventListeners.get(event) || [];
    list.push(fn);
    eventListeners.set(event, list);
  };

  (globalThis as any).window = {
    location: { href: 'https://www.youtube.com/feed/subscriptions' },
    addEventListener: addListener,
    setInterval: () => 1,
    clearInterval: () => {}
  };
  (globalThis as any).document = {
    addEventListener: addListener
  };

  try {
    const navigator = new SPANavigator();
    let called = false;
    const unsubscribe = navigator.onMetadataChange(() => {
      called = true;
    });

    unsubscribe();

    const pageDataHandlers = eventListeners.get('yt-page-data-updated') || [];
    pageDataHandlers.forEach(h => h());

    assert.equal(called, false);
    assert.equal(navigator.getVideoId(), null);

    navigator.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
