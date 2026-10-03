// POST /api/discover — takes a Notion token, returns databases in that workspace.
// Used by the Add Event wizard to map a custom event to the user's Notion.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const { token } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Notion token required' });
    return;
  }
  try {
    // Search for databases shared with this integration
    const resp = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 100 }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      res.status(resp.status).json({ error: `Notion API error: ${err.slice(0, 200)}` });
      return;
    }
    const data = await resp.json();
    const dbs = (data.results ?? []).map((db: any) => ({
      id: db.id,
      name: db.title?.[0]?.plain_text ?? 'Untitled',
    }));
    res.status(200).json({ databases: dbs });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'Discovery failed' });
  }
}
