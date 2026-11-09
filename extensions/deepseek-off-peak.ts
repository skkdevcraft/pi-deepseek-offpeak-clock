/**
 * DeepSeek off-peak indicator.
 *
 * Shows in pi's footer whether the current moment is inside DeepSeek's
 * off-peak (discounted) window. DeepSeek defines peak/off-peak in Beijing
 * time (UTC+8), regardless of where you actually are.
 *
 * Label examples:
 *   🟢 off-peak · Beijing 23:14 · UTC 15:14
 *   🔴 peak · Beijing 10:30 · UTC 02:30
 *
 * Test hook: set DEEPSEEK_OFFPEAK_NOW to an ISO timestamp to pretend it is
 * that moment, e.g.
 *   DEEPSEEK_OFFPEAK_NOW=2026-09-14T09:00:00+08:00 pi -e ./.pi/extensions/deepseek-off-peak.ts
 * Inert when unset.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const STATUS_KEY = "deepseek-off-peak";
const REFRESH_MS = 60_000;
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Whether the given moment falls in DeepSeek's off-peak (discounted) window.
 *
 * DeepSeek's rules. Peak hours are 01:00 - 04:00 and 06:00 - 10:00 UTC
 * (equivalent to 09:00–12:00 and 14:00–18:00 Beijing time, UTC+8):
 *   - Saturday and Sunday: off-peak all day.
 *   - Monday to Friday: peak only during those two UTC windows;
 *     everything else (early morning, the 12:00–14:00 Beijing lunch gap,
 *     and the evening) is off-peak.
 *   - Endpoints are half-open: 01:00 is peak, 04:00 is off-peak,
 *     06:00 is peak, 10:00 is off-peak.
 *
 * Accurate as of 2026-09-13. If DeepSeek changes its policy, update the
 * weekday check and the minute boundaries below.
 *
 * Sources:
 *   - https://api-docs.deepseek.com/quick_start/pricing
 *   - https://api-docs.deepseek.com/news/news250225
 */
function isOffPeak(now: Date): boolean {
	// Beijing time has been a fixed UTC+8 offset since 1991 (China has no DST).
	const beijing = new Date(now.getTime() + BEIJING_OFFSET_MS);
	const day = beijing.getUTCDay(); // 0 = Sunday ... 6 = Saturday
	const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();

	// Weekends are entirely off-peak.
	if (day === 0 || day === 6) return true;

	// Weekday peak windows in UTC: [01:00, 04:00) and [06:00, 10:00).
	const inMorningPeak = minutes >= 1 * 60 && minutes < 4 * 60;
	const inAfternoonPeak = minutes >= 6 * 60 && minutes < 10 * 60;

	return !(inMorningPeak || inAfternoonPeak);
}

/** Current moment; honours DEEPSEEK_OFFPEAK_NOW when set for testing. */
function currentTime(): Date {
	const override = process.env.DEEPSEEK_OFFPEAK_NOW;
	if (override) {
		const parsed = new Date(override);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}
	return new Date();
}

/** Format a moment as HH:MM in Beijing time. */
function beijingClock(now: Date): string {
	const beijing = new Date(now.getTime() + BEIJING_OFFSET_MS);
	const hh = String(beijing.getUTCHours()).padStart(2, "0");
	const mm = String(beijing.getUTCMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

/** Format a moment as HH:MM in UTC. */
function utcClock(now: Date): string {
	const hh = String(now.getUTCHours()).padStart(2, "0");
	const mm = String(now.getUTCMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

/** Render the current state into the footer. */
function render(ctx: ExtensionContext): void {
	const now = currentTime();
	const offPeak = isOffPeak(now);
	const state = offPeak
		? ctx.ui.theme.fg("success", "🟢 off-peak")
		: ctx.ui.theme.fg("error", "🔴 peak");
	const clock = ctx.ui.theme.fg(
		"dim",
		`· Beijing ${beijingClock(now)} · UTC ${utcClock(now)}`,
	);
	ctx.ui.setStatus(STATUS_KEY, `${state} ${clock}`);
}

export default function (pi: ExtensionAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		render(ctx);
		timer = setInterval(() => render(ctx), REFRESH_MS);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		}
		if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, undefined);
	});
}
