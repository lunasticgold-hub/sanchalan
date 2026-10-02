// POST /api/apply  { plan } → { updated, created: [{db, url}] }
// Writes an ImpactPlan to Notion: page updates + new pages (tasks, comms,
// impact reports) with Source = "🤖 AI-generated" provenance.
// 501 when no token is configured.

import { DB_IDS, SRC } from '../src/config';
import type { DbKey, ImpactPlan } from '../src/lib/types';
import { draftToNotionProps, toNotionProps } from './_schema';
import { updatePage, createPage } from './_notion';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(501).json({ error: 'NOTION_TOKEN not configured' });

  const plan = req.body?.plan as ImpactPlan;
  if (!plan) return res.status(400).json({ error: 'Missing plan' });

  const created: { db: DbKey; url: string }[] = [];
  let updated = 0;

  try {
    for (const u of plan.updates) {
      if (!DB_IDS[u.db]) continue;
      await updatePage(token, u.pageId, toNotionProps(u.db, u.props));
      updated++;
    }
    const creates: { db: DbKey; draft: Record<string, any> }[] = [
      ...plan.newTasks.map((d) => ({ db: 'tasks' as DbKey, draft: d })),
      ...plan.newComms.map((d) => ({ db: 'comms' as DbKey, draft: d })),
      ...plan.newImpactReports.map((d) => ({ db: 'impactReports' as DbKey, draft: d })),
    ];
    for (const c of creates) {
      if (!DB_IDS[c.db]) continue;
      const props = draftToNotionProps(c.db, { ...c.draft, source: c.draft.source || SRC.AI });
      const page: any = await createPage(token, DB_IDS[c.db], props);
      created.push({ db: c.db, url: page.url ?? '' });
    }
    return res.status(200).json({ updated, created });
  } catch (e: any) {
    return res.status(502).json({ error: `Notion write failed: ${e?.message ?? e}`, updated, created });
  }
}
