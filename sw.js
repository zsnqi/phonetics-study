/* sw.js — service worker for the Arabic phonetics study app (GitHub Pages project page).
 *
 * All URLs are resolved against this file's own location, so the app works under
 * https://user.github.io/repo/ (never absolute "/..." paths).
 *
 * Two caches:
 *   phonetics-shell-<VERSION>  app shell. Precached atomically on install, served
 *                              stale-while-revalidate, DELETED when VERSION changes.
 *   phonetics-audio-<AUDIO_VERSION>  audio clips. Cache-first, filled lazily on first play
 *                              or by the 'cache-audio' message. NOT touched on VERSION bumps.
 *   (Cache names are per-origin and github.io is shared by all of a user's project pages,
 *    hence the distinctive "phonetics-" prefix; we only ever delete our own prefixes.)
 *
 * RELEASE RULE: whenever any shell file changes, bump VERSION. The new worker installs
 * next to the old one, waits, and the page shows an "update available" banner; the page
 * then posts {type:'skip-waiting'} and reloads (see the message protocol below / sw-notes.md).
 * While a new worker is waiting, the old worker stops background revalidation so old and new
 * files are never mixed in the old cache.
 *
 * Message protocol (page -> worker, via registration.active.postMessage / controller.postMessage):
 *   {type:'skip-waiting'}                  activate a waiting worker now.
 *   {type:'cache-audio', urls:[...]}       download audio URLs into the audio cache.
 * Worker -> page (to the sender only, unless noted):
 *   {type:'audio-progress', done, total}   done = clips processed so far (ok + failed).
 *   {type:'audio-done', done, total, failed, quota}
 *                                          done = clips now in cache, failed = array of URLs
 *                                          that could not be fetched/stored, quota = true if a
 *                                          QuotaExceededError happened.
 *   {type:'sw-updated', version}           (broadcast to all window clients) a new version just
 *                                          activated over an older one; reload to use it.
 *
 * Audio and Range requests: the page plays audio through Blob URLs obtained with fetch(), so
 * iOS never sends Range requests for them. As a safety net (e.g. a plain <audio src> fallback)
 * the audio handler still answers Range requests correctly with a 206 slice of the cached
 * (or freshly fetched) full file, because a plain 200 reply can stall iOS Safari media loading.
 */
'use strict';

const VERSION = 'v2';                       // bump on every shell change
const AUDIO_VERSION = 'v1';                 // bump only to throw away all cached audio

const SHELL_PREFIX = 'phonetics-shell-';
const AUDIO_PREFIX = 'phonetics-audio-';
const SHELL_CACHE = SHELL_PREFIX + VERSION;
const AUDIO_CACHE = AUDIO_PREFIX + AUDIO_VERSION;

const abs = (p) => new URL(p, self.location.href).href;
const AUDIO_DIR = abs('./audio/');
const INDEX_URL = abs('./index.html');

// Must be cached or the install fails (the worker then retries later; the old one keeps running).
const SHELL_REQUIRED = [
  './', './index.html', './data.js',
  './app-core.js', './app-vowels.js', './app-practice.js', './app-more.js',
  './manifest.webmanifest',
].map(abs);
// Best effort: a failure is logged but does not block the install.
const SHELL_OPTIONAL = [
  './audio/list.json',
  './icons/apple-touch-icon.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-512-maskable.png',
].map(abs);
const SHELL_SET = new Set([...SHELL_REQUIRED, ...SHELL_OPTIONAL]);

/* ---------------------------------------------------------------- install */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const problems = [];
    await Promise.all([...SHELL_REQUIRED, ...SHELL_OPTIONAL].map(async (url) => {
      try {
        // 'reload' bypasses the HTTP cache so a version bump always captures fresh files.
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await cache.put(url, res);
      } catch (err) {
        if (SHELL_REQUIRED.includes(url)) problems.push(url + ' (' + err.message + ')');
        else console.warn('[sw] optional precache failed:', url, err);
      }
    }));
    if (problems.length) {
      await caches.delete(SHELL_CACHE);
      throw new Error('[sw] precache failed: ' + problems.join(', '));
    }
    // No skipWaiting() here: the page decides when to switch (message 'skip-waiting').
  })());
});

/* --------------------------------------------------------------- activate */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const stale = names.filter((n) =>
      (n.startsWith(SHELL_PREFIX) && n !== SHELL_CACHE) ||
      (n.startsWith(AUDIO_PREFIX) && n !== AUDIO_CACHE));
    await Promise.all(stale.map((n) => caches.delete(n)));
    await self.clients.claim();
    // Tell open pages only when this activation replaced an older version (not on first install).
    if (stale.some((n) => n.startsWith(SHELL_PREFIX))) {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      wins.forEach((c) => c.postMessage({ type: 'sw-updated', version: VERSION }));
    }
  })());
});

/* ---------------------------------------------------------------- messages */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'skip-waiting') {
    self.skipWaiting();
  } else if (data.type === 'cache-audio') {
    event.waitUntil(cacheAudio(data.urls, event.source));
  }
});

async function cacheAudio(urls, client) {
  const post = (msg) => { try { if (client) client.postMessage(msg); } catch (e) { /* client gone */ } };
  const seen = new Set();
  const list = [];
  for (const u of (Array.isArray(urls) ? urls : [])) {
    let href = String(u);
    try { href = new URL(u, self.location.href).href.split('#')[0]; } catch (e) { /* keep raw, fails below */ }
    if (!seen.has(href)) { seen.add(href); list.push(href); }
  }
  const total = list.length;
  const failed = [];
  let processed = 0, ok = 0, quota = false, next = 0;
  post({ type: 'audio-progress', done: 0, total });

  const cache = await caches.open(AUDIO_CACHE);
  const worker = async () => {
    while (next < list.length) {
      const url = list[next++];
      try {
        if (!url.startsWith(AUDIO_DIR)) throw new Error('not under ./audio/');
        if (!(await cache.match(url))) {
          const res = await fetch(url);                 // full file, no Range
          if (res.status !== 200) throw new Error('HTTP ' + res.status);
          await cache.put(url, res);
        }
        ok++;
      } catch (err) {
        failed.push(url);
        if (err && err.name === 'QuotaExceededError') quota = true;
      }
      processed++;
      post({ type: 'audio-progress', done: processed, total });
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, total) }, worker));
  post({ type: 'audio-done', done: ok, total, failed, quota });
}

/* ------------------------------------------------------------------- fetch */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  url.hash = '';

  const shellKey = new URL(url.href); shellKey.search = '';   // ignore ?query for shell files
  if (SHELL_SET.has(shellKey.href)) {
    event.respondWith(shellStaleWhileRevalidate(event, shellKey.href));
  } else if (url.href.startsWith(AUDIO_DIR)) {
    event.respondWith(audioCacheFirst(event, url.href));
  }
});

// Shell: answer from cache at once, refresh in the background (HTTP revalidation, not the HTTP cache).
async function shellStaleWhileRevalidate(event, key) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(key);
  const refresh = () => fetch(key, { cache: 'no-cache' }).then((res) => {
    if (res.ok) event.waitUntil(cache.put(key, res.clone()));
    return res;
  });
  if (cached) {
    // A newer worker is waiting: keep this cache frozen so versions are not mixed.
    if (!self.registration.waiting && !self.registration.installing) {
      event.waitUntil(refresh().catch(() => {}));
    }
    return cached;
  }
  try {
    return await refresh();
  } catch (err) {
    if (event.request.mode === 'navigate') {
      const index = await cache.match(INDEX_URL);
      if (index) return index;
    }
    return Response.error();
  }
}

// Audio: cache-first; on a miss fetch the FULL file, store it, then answer (honouring Range).
async function audioCacheFirst(event, key) {
  const cache = await caches.open(AUDIO_CACHE);
  let res = await cache.match(key);
  if (!res) {
    try {
      const net = await fetch(key);                     // never forward Range upstream
      if (net.status !== 200) return net;               // 404 etc.: pass through, don't cache
      event.waitUntil(cache.put(key, net.clone()).catch(() => {}));  // e.g. QuotaExceededError
      res = net;
    } catch (err) {
      return Response.error();
    }
  }
  const range = event.request.headers.get('range');
  return range ? rangeResponse(res, range) : res;
}

// Build a 206 (or 416) from a full 200 response. Unsupported forms (multi-range) get the full file.
async function rangeResponse(full, header) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return full;
  const buf = await full.arrayBuffer();
  const total = buf.byteLength;
  let start, end;
  if (m[1] === '') {                                    // suffix: last N bytes
    const n = parseInt(m[2], 10);
    start = Math.max(0, total - n);
    end = total - 1;
    if (n === 0) start = total;                         // forces 416 below
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? total - 1 : Math.min(parseInt(m[2], 10), total - 1);
  }
  if (start >= total || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + total } });
  }
  const body = buf.slice(start, end + 1);
  return new Response(body, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Content-Length': String(body.byteLength),
      'Accept-Ranges': 'bytes',
    },
  });
}
