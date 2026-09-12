const KEY = 'uh-default-template';

const FALLBACK = {
  enabled: true,
  title: 'Update Available!',
  points: [
    "Can’t wait to see you in the new version.",
    'Click “Update Now” to download the latest version from our Telegram channel.',
  ],
  update_link: 'https://t.me/heromodss/',
  cancel_text: 'NOT NOW',
  update_text: 'UPDATE NOW',
};

export function getDefaultTemplate() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
  } catch { /* ignore */ }
  return JSON.stringify(FALLBACK, null, 2);
}

export function setDefaultTemplate(jsonString) {
  localStorage.setItem(KEY, jsonString);
}
