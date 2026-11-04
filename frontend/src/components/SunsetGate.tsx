import { useEffect, useState } from 'react';
import { SUNSET_AT, DEVELOPER_CONTACT } from '../config/sunset';

function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2 min-w-[64px]">
      <span className="text-3xl font-extrabold text-primary tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs font-semibold text-gray-500">{label}</span>
    </div>
  );
}

function ContactCard() {
  const c = DEVELOPER_CONTACT;
  return (
    <div className="bg-bg border border-gray-200 rounded-lg p-4 text-center space-y-1">
      <p className="text-sm text-gray-600">לשאלות ניתן ליצור קשר עם המפתח:</p>
      <p className="font-bold text-dark">{c.name}</p>
      <p>
        <a href={`mailto:${c.email}`} className="text-primary font-semibold underline" dir="ltr">
          {c.email}
        </a>
      </p>
      <p>
        <a href={c.phoneHref} className="text-primary font-semibold underline" dir="ltr">
          {c.phoneDisplay}
        </a>
      </p>
    </div>
  );
}

export default function SunsetGate({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(() => Date.now());
  const [acknowledged, setAcknowledged] = useState(false);

  const remainingMs = SUNSET_AT.getTime() - now;
  const ended = remainingMs <= 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!ended && acknowledged) return <>{children}</>;

  const r = splitRemaining(remainingMs);

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-card border-t-4 border-t-accent p-6 space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-primary">BookFlow</h1>
          {ended ? (
            <>
              <h2 className="text-xl font-bold text-dark">התמיכה באפליקציה הסתיימה</h2>
              <p className="text-gray-600">הגישה לאפליקציה נסגרה. תודה לכל המשתמשים!</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-dark">הודעה חשובה</h2>
              <p className="text-gray-600">
                התמיכה באפליקציה תופסק בתאריך{' '}
                <strong>{SUNSET_AT.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })}</strong>
                , ולאחר מכן הגישה לאפליקציה תיסגר לכל המשתמשים.
              </p>
            </>
          )}
        </div>

        {!ended && (
          <div className="space-y-2">
            <p className="text-center text-sm font-semibold text-gray-500">זמן שנותר עד לסגירה:</p>
            <div className="flex justify-center gap-2">
              <CountdownUnit value={r.days} label="ימים" />
              <CountdownUnit value={r.hours} label="שעות" />
              <CountdownUnit value={r.minutes} label="דקות" />
              <CountdownUnit value={r.seconds} label="שניות" />
            </div>
          </div>
        )}

        <ContactCard />

        {!ended && (
          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
            autoFocus
          >
            הבנתי
          </button>
        )}
      </div>
    </div>
  );
}
