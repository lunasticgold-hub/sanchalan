// POST /api/query  { db } → { rows: flat records }
// Reads one Notion database (via NOTION_TOKEN + DB_IDS) and maps it to flat
// records. 501 when no token is configured.

import { Client } from '@notionhq/client';
import { DB_IDS } from '../src/config';
import type { DbKey } from '../src/lib/types';
import { notionRowToFlat } from './_schema';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(501).json({ error: 'NOTION_TOKEN not configured' });

  const db = req.body?.db as DbKey;
  const databaseId = db ? DB_IDS[db] : '';
  if (!db || !databaseId) return res.status(400).json({ error: 'Unknown or unconfigured db' });

  try {
    const notion = new Client({ auth: token });
    const rows: Record<string, any>[] = [];
    let cursor: string | undefined;
    do {
      const page: any = await notion.databases.query({ database_id: databaseId, start_cursor: cursor, page_size: 100 });
      for (const p of page.results) rows.push(notionRowToFlat(db, p));
      cursor = page.has_more ? page.next_cursor ?? undefined : undefined;
    } while (cursor);
    return res.status(200).json({ rows });
  } catch (e: any) {
    return res.status(502).json({ error: `Notion query failed: ${e?.message ?? e}` });
  }
}
