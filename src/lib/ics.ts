import type { Cert, Phase, Target, WeeklyIcsSetting } from "./types";
import { addDays, compact, pad2, parseISO, toISO, uid } from "./utils";

function icsEscape(s: string): string {
  return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildICS(cert: Cert, target: Target, phases: Phase[] | null, weekly: WeeklyIcsSetting): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  type Ev = { uid: string; start: string; end: string; title: string; desc: string };
  const ev: Ev[] = [];
  const push = (o: Ev) => ev.push(o);
  if (target.examDate) {
    push({
      uid: `exam-${uid()}`,
      start: compact(target.examDate),
      end: compact(toISO(addDays(parseISO(target.examDate), 1))),
      title: `【受験】${cert.name}`,
      desc: "資格ロードマップから書き出した受験日です。",
    });
  }
  (phases || []).forEach((p, i) => {
    push({
      uid: `ph-${p.id}`,
      start: compact(p.from),
      end: compact(toISO(addDays(parseISO(p.to), 1))),
      title: `${cert.name}｜フェーズ${i + 1} ${p.name}（${p.hours}h）`,
      desc: p.purpose || "",
    });
  });
  let body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//cert-roadmap//JP", "CALSCALE:GREGORIAN"];
  ev.forEach((e) => {
    body = body.concat([
      "BEGIN:VEVENT", `UID:${e.uid}@cert-roadmap`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.start}`, `DTEND;VALUE=DATE:${e.end}`,
      `SUMMARY:${icsEscape(e.title)}`, `DESCRIPTION:${icsEscape(e.desc)}`, "END:VEVENT",
    ]);
  });
  if (weekly && weekly.on && target.examDate) {
    const start = new Date();
    const diff = (weekly.dow - ((start.getDay() + 6) % 7) + 7) % 7;
    const first = addDays(start, diff);
    const [hh, mm] = weekly.time.split(":").map(Number);
    const s = `${compact(toISO(first))}T${pad2(hh)}${pad2(mm)}00`;
    const endMin = hh * 60 + mm + Math.round(weekly.minutes);
    const e = `${compact(toISO(first))}T${pad2(Math.floor(endMin / 60) % 24)}${pad2(endMin % 60)}00`;
    body = body.concat([
      "BEGIN:VEVENT", `UID:weekly-${uid()}@cert-roadmap`, `DTSTAMP:${stamp}`,
      `DTSTART:${s}`, `DTEND:${e}`, `RRULE:FREQ=WEEKLY;UNTIL=${compact(target.examDate)}T235900`,
      `SUMMARY:${icsEscape(`${cert.name} の学習時間`)}`,
      `DESCRIPTION:${icsEscape("資格ロードマップで設定した週の学習枠です。")}`, "END:VEVENT",
    ]);
  }
  body.push("END:VCALENDAR");
  return body.join("\r\n");
}

export function gcalUrl(cert: Cert, target: Target): string | null {
  if (!target.examDate) return null;
  const s = compact(target.examDate);
  const e = compact(toISO(addDays(parseISO(target.examDate), 1)));
  const p = new URLSearchParams({
    action: "TEMPLATE", text: `【受験】${cert.name}`, dates: `${s}/${e}`,
    details: "資格ロードマップから登録した受験日です。前日までに会場・持ち物・本人確認書類を確認。",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function downloadText(filename: string, text: string): boolean {
  try {
    const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
    return true;
  } catch {
    return false;
  }
}
