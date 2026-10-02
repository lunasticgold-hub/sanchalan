// Minimal Notion REST helper (raw fetch — no SDK dependency).
// Used by /api/query and /api/apply.

const API = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': VERSION,
    'Content-Type': 'application/json',
  };
}

async function notionFetch(token: string, path: string, method: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Notion API ${res.status}`);
  }
  return data;
}

export async function queryDatabase(token: string, databaseId: string) {
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const data: any = await notionFetch(token, `/databases/${databaseId}/query`, 'POST', {
      start_cursor: cursor,
      page_size: 100,
    });
    rows.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);
  return rows;
}

export async function updatePage(token: string, pageId: string, properties: Record<string, any>) {
  return notionFetch(token, `/pages/${pageId}`, 'PATCH', { properties });
}

export async function createPage(token: string, databaseId: string, properties: Record<string, any>) {
  return notionFetch(token, '/pages', 'POST', {
    parent: { database_id: databaseId },
    properties,
  });
}
