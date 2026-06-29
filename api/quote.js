export default async function handler(req, res) {
  const { symbol, interval, outputsize } = req.query;

  if (!symbol || !interval) {
    return res.status(400).json({ error: 'Missing symbol or interval parameter' });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&outputsize=${encodeURIComponent(outputsize || 100)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
