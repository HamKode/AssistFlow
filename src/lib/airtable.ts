const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

/**
 * Minimal read-only Airtable client for the analytics dashboard.
 * Uses a separate, read-scoped Personal Access Token from the one Make.com
 * uses — this app never writes to Airtable, only reads for display.
 */
export async function listAllRecords<TFields extends object>(
  table: string,
): Promise<TFields[]> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("AIRTABLE_API_KEY / AIRTABLE_BASE_ID are not configured.");
  }

  const records: TFields[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Airtable request failed for table "${table}": ${res.status}`);
    }

    const data: { records: { fields: TFields }[]; offset?: string } = await res.json();
    records.push(...data.records.map((r) => r.fields));
    offset = data.offset;
  } while (offset);

  return records;
}
