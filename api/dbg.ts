// Debug: isolate which import crashes.
export default async function handler(_req: any, res: any) {
  const out: Record<string, string> = {};
  try { await import('../src/config'); out.config = 'ok'; } catch (e: any) { out.config = 'FAIL: ' + (e?.message || e); }
  try { await import('./_schema'); out.schema = 'ok'; } catch (e: any) { out.schema = 'FAIL: ' + (e?.message || e); }
  try { await import('./_notion'); out.notion = 'ok'; } catch (e: any) { out.notion = 'FAIL: ' + (e?.message || e); }
  out.token = process.env.NOTION_TOKEN ? 'set(' + process.env.NOTION_TOKEN.length + ' chars)' : 'MISSING';
  return res.status(200).json(out);
}
