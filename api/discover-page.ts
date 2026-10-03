// POST /api/discover-page — takes a Notion token + page ID (or URL),
// returns all databases nested under that page.
// This lets users share ONE parent page instead of 11 databases.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const { token, pageIdOrUrl } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Notion token required' });
    return;
  }
  if (!pageIdOrUrl || typeof pageIdOrUrl !== 'string') {
    res.status(400).json({ error: 'Notion page link required' });
    return;
  }

  // Extract page ID from various Notion URL formats
  // e.g. https://www.notion.so/My-Page-3ed9bf2c345681f4aee4f6ba5aa13e41
  // e.g. https://notion.so/3ed9bf2c345681f4aee4f6ba5aa13e41
  // e.g. 3ed9bf2c-3456-81f4-aee4-f6ba5aa13e41 (raw ID)
  const clean = pageIdOrUrl.trim();
  const hexMatch = clean.match(/([0-9a-f]{32})/i);
  const dashMatch = clean.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const rawId = dashMatch?.[1] ?? hexMatch?.[1];
  if (!rawId) {
    res.status(400).json({ error: 'Could not find a page ID in that link. Paste the full Notion URL.' });
    return;
  }
  // Normalize to dashed UUID format
  const hex = rawId.replace(/-/g, '');
  const pageId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  try {
    const databases: { id: string; name: string }[] = [];

    // Walk child blocks recursively (1 level deep is usually enough, do 2 for safety)
    const scanBlocks = async (blockId: string, depth: number) => {
      if (depth > 2) return;
      let cur: string | undefined;
      do {
        const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100${cur ? `&start_cursor=${cur}` : ''}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
          const err = await resp.text();
          throw new Error(`Notion API: ${err.slice(0, 200)}`);
        }
        const data = await resp.json();
        for (const block of data.results ?? []) {
          if (block.type === 'child_database') {
            const title = (block.child_database?.title ?? '').trim() || 'Untitled';
            databases.push({ id: block.id, name: title });
          } else if (block.has_children && depth < 2) {
            await scanBlocks(block.id, depth + 1);
          }
        }
        cur = data.has_more ? data.next_cursor : undefined;
      } while (cur);
    };

    await scanBlocks(pageId, 0);

    // Also get the page title for display
    let pageTitle = '';
    try {
      const pageResp = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers });
      if (pageResp.ok) {
        const pageData = await pageResp.json();
        const props = pageData.properties ?? {};
        for (const v of Object.values(props) as any[]) {
          if (v?.type === 'title' && v.title?.length) {
            pageTitle = v.title.map((t: any) => t.plain_text).join('');
            break;
          }
        }
      }
    } catch {}

    res.status(200).json({ databases, pageTitle });
  } catch (e: any) {
    // 404 usually means the page isn't shared with the integration
    const msg = e.message ?? 'Discovery failed';
    if (msg.includes('404') || msg.includes('not be found') || msg.includes('Could not find') || msg.includes('object_not_found')) {
      res.status(404).json({ error: 'NOT_SHARED' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
}
