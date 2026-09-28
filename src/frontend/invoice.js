// Toggl Track "detailed report" CSV -> invoice. Pure JS, no deps —
// runs in the webview page (compute belongs here, not the backend).

const BOM = /^﻿/;

// Minimal RFC4180 parser: handles quoted fields, "" escapes, embedded
// commas/newlines. Toggl always quotes every field.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(BOM, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows
    .slice(1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const hoursFrom = (minutes) => parseFloat((minutes / 60).toFixed(2));

// Billing rounding: <12min -> 0.5h, 12-42min -> +0.5h, >42min -> next hour.
export const round = (minutes) => {
  const hours = hoursFrom(minutes);
  const int = Math.floor(hours);
  const decimal = hours - int;
  if (decimal < 0.2) return int || 0.5;
  if (decimal < 0.7) return int + 0.5;
  return int + 1;
};

const getMinutesFrom = (item) => {
  const start = new Date(`${item['Start date']} ${item['Start time']}`);
  const end = new Date(`${item['Stop date']} ${item['Stop time']}`);
  return (end.valueOf() - start.valueOf()) / (1000 * 60);
};

const pad = (n) => String(n).padStart(2, '0');

const SERVICE_FEE = 25;

export function generateInvoice(data, config, paid = 0) {
  const now = new Date();
  const invoice = {
    date: `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`,
    number: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
    billTo: config.client,
    billFrom: config.company,
    total: 0,
    paid,
    hourlyRate: config.hourlyRate,
    items: [],
    summary: {},
  };

  const groups = new Map();
  for (const item of data) {
    if (!item.Description) continue;
    if (!groups.has(item.Description)) groups.set(item.Description, []);
    groups.get(item.Description).push(item);
  }

  for (const [description, group] of groups) {
    const minutes = group.reduce((sum, item) => sum + getMinutesFrom(item), 0);
    const first = group[0];
    const last = group[group.length - 1];
    const hours = round(minutes);
    const amount = hours * invoice.hourlyRate;
    const project = first.Project && first.Project !== '-' ? first.Project : 'C&C';
    invoice.total += amount;
    invoice.items.push({
      description: `${project} - ${description}`,
      startDate: first['Start date'],
      endDate: last['Stop date'] || first['Stop date'],
      hours,
      rate: usd.format(invoice.hourlyRate),
      amount: usd.format(amount),
    });
    invoice.summary[project] = (invoice.summary[project] || 0) + amount;
  }

  if (invoice.items.length) {
    invoice.total += SERVICE_FEE;
    const last = invoice.items[invoice.items.length - 1];
    invoice.items.push({
      description: 'Service Fee',
      startDate: last.endDate,
      endDate: last.endDate,
      hours: 1,
      rate: usd.format(SERVICE_FEE),
      amount: usd.format(SERVICE_FEE),
    });
    invoice.summary['C&C'] = (invoice.summary['C&C'] || 0) + SERVICE_FEE;
  }

  invoice.totalAmount = usd.format(invoice.total);
  invoice.paidAmount = usd.format(invoice.paid);
  invoice.balanceDue = usd.format(invoice.total - invoice.paid);
  invoice.summary = Object.fromEntries(
    Object.entries(invoice.summary).map(([project, total]) => [project, usd.format(total)]),
  );

  return invoice;
}
