import type { Cert, Phase, Target, WeeklySlot } from "./types";
import { addDays, compact, pad2, parseISO, toISO } from "./utils";

export type CalendarEvent = {
  key: string;
  label: string;
  url: string;
};

const DOW_NAMES = ["月", "火", "水", "木", "金", "土", "日"];
const DOW_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

function gcalEventUrl(opts: { title: string; details: string; dates: string; recur?: string }): string {
  const p = new URLSearchParams({ action: "TEMPLATE", text: opts.title, dates: opts.dates, details: opts.details });
  if (opts.recur) p.set("recur", opts.recur);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function examGcalUrl(cert: Cert, target: Target): string | null {
  if (!target.examDate) return null;
  const s = compact(target.examDate);
  const e = compact(toISO(addDays(parseISO(target.examDate), 1)));
  return gcalEventUrl({
    title: `【受験】${cert.name}`,
    details: "資格ロードマップから登録した受験日です。前日までに会場・持ち物・本人確認書類を確認。",
    dates: `${s}/${e}`,
  });
}

function phaseGcalUrl(cert: Cert, phase: Phase, index: number): string {
  const s = compact(phase.from);
  const e = compact(toISO(addDays(parseISO(phase.to), 1)));
  return gcalEventUrl({
    title: `${cert.name}｜フェーズ${index + 1} ${phase.name}（${phase.hours}h）`,
    details: phase.purpose || "",
    dates: `${s}/${e}`,
  });
}

function weeklySlotGcalUrl(cert: Cert, slot: WeeklySlot, examDate: string): string {
  const start = new Date();
  const diff = (slot.dow - ((start.getDay() + 6) % 7) + 7) % 7;
  const first = addDays(start, diff);
  const [hh, mm] = slot.time.split(":").map(Number);
  const s = `${compact(toISO(first))}T${pad2(hh)}${pad2(mm)}00`;
  const endMin = hh * 60 + mm + Math.round(slot.minutes);
  const e = `${compact(toISO(first))}T${pad2(Math.floor(endMin / 60) % 24)}${pad2(endMin % 60)}00`;
  return gcalEventUrl({
    title: `${cert.name} の学習時間`,
    details: "資格ロードマップで設定した学習枠です。",
    dates: `${s}/${e}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${DOW_CODES[slot.dow]};UNTIL=${compact(examDate)}T235900`,
  });
}

export function buildCalendarEvents(cert: Cert, target: Target, phases: Phase[] | null, weeklySlots: WeeklySlot[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const exam = examGcalUrl(cert, target);
  if (exam) events.push({ key: "exam", label: `【受験】${cert.name}`, url: exam });
  (phases || []).forEach((p, i) => {
    events.push({ key: `phase-${p.id}`, label: `フェーズ${i + 1} ${p.name}`, url: phaseGcalUrl(cert, p, i) });
  });
  if (target.examDate) {
    weeklySlots.forEach((slot) => {
      events.push({
        key: `weekly-${slot.id}`,
        label: `毎週${DOW_NAMES[slot.dow]}曜 ${slot.time}〜（${slot.minutes}分）`,
        url: weeklySlotGcalUrl(cert, slot, target.examDate),
      });
    });
  }
  return events;
}
