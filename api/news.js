// api/news.js
// Proxies ForexFactory's unofficial public JSON calendar feed so it can be
// called from the browser (the feed itself does not send CORS headers).
// No API key required — this is a free, undocumented, industry-standard feed
// used by most retail trading tools.
//
// Returns: { events: [{ title, country, impact, date (ISO), timeLabel }] }
// On any failure, returns { events: [], degraded: true } with HTTP 200 so the
// frontend can silently skip the news check instead of breaking the signal flow.

const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const upstream = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sniper777X/1.0)' }
    });

    if (!upstream.ok) {
      return res.status(200).json({ events: [], degraded: true });
    }

    const raw = await upstream.json();

    const events = (Array.isArray(raw) ? raw : [])
      .filter(e => e && e.impact === 'High')
      .map(e => {
        // ForexFactory feed gives a date string already in a parseable format
        // (e.g. "2026-06-30T12:30:00-04:00" or similar ISO-ish value).
        const d = new Date(e.date);
        return {
          title: e.title || 'Economic event',
          country: e.country || '',
          impact: e.impact,
          date: isNaN(d.getTime()) ? null : d.toISOString()
        };
      })
      .filter(e => e.date !== null);

    return res.status(200).json({ events, degraded: false });
  } catch (err) {
    // Graceful degradation — never break signal generation because news failed.
    return res.status(200).json({ events: [], degraded: true });
  }
};
