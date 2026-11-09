# pi-deepseek-offpeak-clock

A [pi](https://pi.dev) extension that shows whether DeepSeek's **off-peak
(discounted) pricing window** is currently active.

The status sits in pi's footer and refreshes every minute:

```
🟢 off-peak · Beijing 23:14 · UTC 15:14
🔴 peak · Beijing 10:30 · UTC 02:30
```

DeepSeek defines peak and off-peak hours in Beijing time (UTC+8), regardless of
where you are. The footer shows both Beijing and UTC clocks so you can compare
them with the published schedule at a glance.

## Install

Install globally from the GitHub repository:

```bash
pi install https://github.com/skkdevcraft/pi-deepseek-offpeak-clock
```

The same source is also available in git form:

```bash
pi install git:github.com/skkdevcraft/pi-deepseek-offpeak-clock
```

Install it for the current project only (written to `.pi/settings.json`):

```bash
pi install --local https://github.com/skkdevcraft/pi-deepseek-offpeak-clock
```

Try it for a single pi invocation without adding it to your settings:

```bash
pi -e https://github.com/skkdevcraft/pi-deepseek-offpeak-clock
```

Remove it with:

```bash
pi remove https://github.com/skkdevcraft/pi-deepseek-offpeak-clock
```

After installing, start pi or run `/reload`. The indicator appears automatically
when the session starts.

## Schedule

DeepSeek's rules, accurate as of 2026-09-13:

| Day | Peak | Off-peak |
| --- | --- | --- |
| Monday – Friday | 01:00–04:00 and 06:00–10:00 UTC (09:00–12:00 and 14:00–18:00 Beijing) | All other hours |
| Saturday – Sunday | — | All day |

Window endpoints are half-open: 01:00 UTC is peak, 04:00 UTC is off-peak;
06:00 UTC is peak, 10:00 UTC is off-peak.

If DeepSeek changes its policy, update the boundary constants in
[`extensions/deepseek-off-peak.ts`](extensions/deepseek-off-peak.ts).

Sources:

- [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek off-peak discount announcement](https://api-docs.deepseek.com/news/news250225)

## Behavior notes

- The extension only renders in interactive sessions where the UI is available.
- The status is cleared and the refresh timer is stopped when the session shuts
  down.
- Weekend detection uses the Beijing calendar day, so the labels stay aligned
  with DeepSeek's schedule even when your local date differs.

## Test the clock

Set `DEEPSEEK_OFFPEAK_NOW` to an ISO timestamp to pretend it is that moment.
The override is ignored when unset or invalid:

```bash
DEEPSEEK_OFFPEAK_NOW=2026-09-14T09:00:00+08:00 \
  pi -e ./extensions/deepseek-off-peak.ts
```

## Development

The extension is loaded directly from TypeScript by pi, so there is no build
step. To work on it locally:

```bash
git clone https://github.com/skkdevcraft/pi-deepseek-offpeak-clock.git
cd pi-deepseek-offpeak-clock
pi -e ./extensions/deepseek-off-peak.ts
```

## License

[MIT](LICENSE)
