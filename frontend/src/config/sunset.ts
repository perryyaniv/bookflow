// End-of-support configuration.
// Until SUNSET_AT the app shows a notice splash on every load, then opens normally.
// From SUNSET_AT onward the app is closed and only the notice is shown.
// Keep in sync with SUNSET_AT in backend/src/index.ts.
export const SUNSET_AT = new Date('2026-11-11T23:59:59+02:00');

export const SPLASH_DURATION_MS = 10_000;

export const DEVELOPER_CONTACT = {
  name: 'Yaniv Perry',
  email: 'perryyaniv@gmail.com',
  phoneDisplay: '054-905-0716',
  phoneHref: 'tel:+972549050716',
};
