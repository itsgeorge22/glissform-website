// This is a public, write-only PostHog project token, never an account/API secret.
const projectToken = 'phc_yjUSMgbWh2MRH98S38CiCYgiNE6GCYBtHRtER7usvGLu';
const endpoint = 'https://eu.i.posthog.com/i/v0/e/';
const consentKey = 'glissform.analytics.consent.v1';
const identityKey = 'glissform.analytics.visitor.v1';
const lifetime = 180 * 24 * 60 * 60 * 1000;
export type DownloadPlacement = 'hero' | 'download_card' | 'navbar' | 'fixed_navbar';
type Choice = 'accepted' | 'declined' | 'undecided';
let pageviewSent = false;
const requests = new Set<AbortController>();

export function analyticsChoice(): Choice {
  try {
    const saved = JSON.parse(localStorage.getItem(consentKey) ?? 'null');
    if (saved && Date.now() < saved.expires && ['accepted', 'declined'].includes(saved.choice)) return saved.choice;
    localStorage.removeItem(identityKey);
  } catch { /* Unavailable storage means no tracking. */ }
  return 'undecided';
}

function stop() {
  requests.forEach(request => request.abort());
  requests.clear();
  pageviewSent = false;
  try { localStorage.removeItem(identityKey); } catch { /* No storage to clear. */ }
}

export function chooseAnalytics(choice: Exclude<Choice, 'undecided'>) {
  if (choice === 'declined') stop();
  try {
    localStorage.setItem(consentKey, JSON.stringify({ choice, expires: Date.now() + lifetime }));
  } catch { return; }
  window.dispatchEvent(new Event('glissform:analytics-choice'));
  if (choice === 'accepted') trackPageview();
}

function capture(event: '$pageview' | 'download_clicked', extra: Record<string, string> = {}) {
  if (analyticsChoice() !== 'accepted') return;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const production = import.meta.env.PROD && location.hostname === 'glissform.app';
  if (!production && !local) return;
  let distinctId: string;
  try {
    distinctId = localStorage.getItem(identityKey) || `web_${crypto.randomUUID()}`;
    localStorage.setItem(identityKey, distinctId);
  } catch { return; }
  // Never send arbitrary URLs, query strings, fragments or referrer paths.
  const path = ['/', '/privacy/'].includes(location.pathname) ? location.pathname : '/other/';
  let source = 'direct';
  try {
    const referrer = new URL(document.referrer);
    if (referrer.hostname !== location.hostname) source = referrer.hostname;
  } catch { /* No external referrer. */ }
  const campaign: Record<string, string> = {};
  const params = new URLSearchParams(location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key);
    if (value && /^[a-z0-9_-]{1,64}$/i.test(value)) campaign[key] = value;
  }
  const controller = new AbortController();
  requests.add(controller);
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  // Direct capture keeps autocapture, replay, surveys and person profiles absent.
  // text/plain avoids a preflight; keepalive preserves a click when navigation starts.
  void fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, credentials: 'omit',
    referrerPolicy: 'no-referrer', keepalive: true, signal: controller.signal,
    body: JSON.stringify({ api_key: projectToken, event, distinct_id: distinctId, uuid: crypto.randomUUID(),
      properties: { environment: production ? 'production' : 'test', platform: 'web', schema_version: 1,
        $process_person_profile: false, $geoip_disable: true, $ip: '0.0.0.0',
        $current_url: `https://glissform.app${path}`, $pathname: path, $host: 'glissform.app',
        $referring_domain: source, source, ...campaign, ...extra },
    }),
  }).catch(() => { /* Analytics must never interrupt a visit or download. */ })
    .finally(() => { clearTimeout(timeout); requests.delete(controller); });
}

export function trackPageview() {
  if (pageviewSent || analyticsChoice() !== 'accepted') return;
  pageviewSent = true;
  capture('$pageview');
}

export function startAnalytics() {
  trackPageview();
  const click = (event: MouseEvent) => {
    if (event.button !== 0 && event.button !== 1) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-download-placement]');
    const placement = link?.dataset.downloadPlacement;
    if (placement && ['hero', 'download_card', 'navbar', 'fixed_navbar'].includes(placement)) {
      capture('download_clicked', { placement });
    }
  };
  document.addEventListener('click', click);
  document.addEventListener('auxclick', click);
  window.addEventListener('storage', event => {
    if (event.key !== consentKey && event.key !== null) return;
    if (analyticsChoice() !== 'accepted') stop();
    window.dispatchEvent(new Event('glissform:analytics-choice'));
  });
}
