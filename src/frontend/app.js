import { parseCsv, generateInvoice } from './invoice.js';
import { themes, defaultThemeId, themeById } from './themes.js';
import { invoiceCss } from './invoice-style.js';
import { esc, renderTemplate, DEFAULT_TEMPLATE } from './template.js';

const $ = (id) => document.getElementById(id);

const DEFAULT_CONFIG = {
  company: { name: '', street: '', locality: '', country: '', email: '', phone: '' },
  client: { code: '', name: '', street: '', locality: '', country: '' },
  hourlyRate: 50,
};

let config = DEFAULT_CONFIG;
let rows = null; // parsed CSV rows, kept so paid/config/theme edits re-render without a re-open
let invoice = null;
let themeId = defaultThemeId;
let customTemplate = DEFAULT_TEMPLATE;
let useCustomTemplate = false;

function addressBlock(party, extra = []) {
  const lines = [party.name, party.street, party.locality, party.country, ...extra].filter(Boolean);
  return lines.map((l) => `<p>${esc(l)}</p>`).join('');
}

function renderInvoiceHtml(inv) {
  const rowsHtml = inv.items.map((it) => `
    <tr>
      <td>${esc(it.description)}</td>
      <td>${esc(it.startDate)}</td>
      <td>${esc(it.endDate)}</td>
      <td>${esc(it.hours)}</td>
      <td>${esc(it.rate)}</td>
      <td>${esc(it.amount)}</td>
    </tr>`).join('');

  const summaryHtml = Object.entries(inv.summary).map(([project, total]) => `
    <tr><td>${esc(project)}</td><td>${esc(total)}</td></tr>`).join('');

  return `
    <div class="invoice">
      <div class="invoice-head">
        <div class="invoice-brand">
          <h1>Invoice</h1>
          <div class="invoice-meta"><span>#${esc(inv.number)}</span><span>${esc(inv.date)}</span></div>
        </div>
      </div>
      <div class="invoice-parties">
        <div class="party"><h3>From</h3>${addressBlock(inv.billFrom, [inv.billFrom.email, inv.billFrom.phone])}</div>
        <div class="party"><h3>Bill To</h3>${addressBlock(inv.billTo, [inv.billTo.code])}</div>
      </div>
      <table class="invoice-items">
        <thead><tr><th>Description</th><th>Start</th><th>End</th><th>Hours</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <table class="invoice-summary">
        <thead><tr><th>Project</th><th>Total</th></tr></thead>
        <tbody>${summaryHtml}</tbody>
      </table>
      <div class="invoice-totals">
        <div><span>Subtotal</span><span>${esc(inv.totalAmount)}</span></div>
        <div><span>Paid To Date</span><span>${esc(inv.paidAmount)}</span></div>
        <div class="balance-due"><span>Balance Due</span><span>${esc(inv.balanceDue)}</span></div>
      </div>
    </div>`;
}

function applyTheme(id) {
  themeId = id;
  $('theme-style').textContent = themeById(id).css;
}

function invoiceHtml(inv) {
  return useCustomTemplate ? renderTemplate(customTemplate, { invoice: inv }) : renderInvoiceHtml(inv);
}

// The custom template ships its own <style> — don't also fight it with our
// built-in .invoice/.invoice-items/... rules (class names can collide).
function applyBaseCss() {
  $('invoice-base-style').textContent = useCustomTemplate ? '' : invoiceCss;
}

function renderPreview() {
  if (!rows) return;
  invoice = generateInvoice(rows, config, Number($('paid').value) || 0);
  $('invoice').innerHTML = invoiceHtml(invoice);
  $('exportHtml').disabled = false;
  $('exportPdf').disabled = false;
}

function isConfigValid(cfg) {
  return !!(cfg.company.name && cfg.client.name && cfg.hourlyRate > 0);
}

function applyConfigGate() {
  const valid = isConfigValid(config);
  $('openCsv').disabled = !valid;
  $('err').textContent = valid ? '' : 'Fill in Settings (company, client, hourly rate) and save before importing a CSV.';
  if (!valid) $('settings').classList.remove('hidden');
  return valid;
}

function fillSettingsForm() {
  $('c-name').value = config.company.name;
  $('c-street').value = config.company.street;
  $('c-locality').value = config.company.locality;
  $('c-country').value = config.company.country;
  $('c-email').value = config.company.email;
  $('c-phone').value = config.company.phone;
  $('cl-code').value = config.client.code;
  $('cl-name').value = config.client.name;
  $('cl-street').value = config.client.street;
  $('cl-locality').value = config.client.locality;
  $('cl-country').value = config.client.country;
  $('rate').value = config.hourlyRate;
}

function readSettingsForm() {
  return {
    company: {
      name: $('c-name').value, street: $('c-street').value, locality: $('c-locality').value,
      country: $('c-country').value, email: $('c-email').value, phone: $('c-phone').value,
    },
    client: {
      code: $('cl-code').value, name: $('cl-name').value, street: $('cl-street').value,
      locality: $('cl-locality').value, country: $('cl-country').value,
    },
    hourlyRate: Number($('rate').value) || 0,
  };
}

async function init() {
  const [savedConfig, savedTheme, savedPaid, savedTemplate, savedUseTemplate] = await Promise.all([
    tiny.store.get('config'),
    tiny.store.get('themeId'),
    tiny.store.get('paid'),
    tiny.store.get('customTemplate'),
    tiny.store.get('useCustomTemplate'),
  ]);
  config = savedConfig || DEFAULT_CONFIG;
  fillSettingsForm();
  if (savedPaid != null) $('paid').value = savedPaid;

  $('theme').innerHTML = themes.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  $('theme').value = savedTheme || defaultThemeId;
  applyTheme($('theme').value);

  customTemplate = savedTemplate || DEFAULT_TEMPLATE;
  useCustomTemplate = savedUseTemplate == null ? true : !!savedUseTemplate;
  $('templateEditor').value = customTemplate;
  $('useTemplate').checked = useCustomTemplate;
  $('theme').disabled = useCustomTemplate;
  applyBaseCss();

  applyConfigGate();
}

async function loadCsv(path) {
  $('err').textContent = '';
  try {
    const text = await tiny.api.call('readFile', { path });
    rows = parseCsv(text);
    $('csvName').textContent = path.split('/').pop();
    renderPreview();
  } catch (e) {
    $('err').textContent = String(e);
  }
}

$('openCsv').addEventListener('click', async () => {
  const path = await tiny.dialog.openFile({ types: ['csv'] });
  if (path) loadCsv(path);
});

const dropZone = $('invoiceWrap');
['dragenter', 'dragover'].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));

tiny.win.onDrop((paths) => {
  if (!applyConfigGate()) return;
  const path = paths.find((p) => p.toLowerCase().endsWith('.csv'));
  if (path) loadCsv(path);
  else $('err').textContent = 'Drop a .csv file.';
});

$('paid').addEventListener('input', () => {
  tiny.store.set('paid', Number($('paid').value) || 0);
  renderPreview();
});

$('theme').addEventListener('change', () => {
  applyTheme($('theme').value);
  tiny.store.set('themeId', themeId);
});

$('toggleSettings').addEventListener('click', () => $('settings').classList.toggle('hidden'));
$('toggleTemplate').addEventListener('click', () => $('templatePanel').classList.toggle('hidden'));

$('saveSettings').addEventListener('click', async () => {
  config = readSettingsForm();
  await tiny.store.set('config', config);
  if (applyConfigGate()) renderPreview();
});

$('useTemplate').addEventListener('change', () => {
  useCustomTemplate = $('useTemplate').checked;
  $('theme').disabled = useCustomTemplate;
  applyBaseCss();
  tiny.store.set('useCustomTemplate', useCustomTemplate);
  renderPreview();
});

$('saveTemplate').addEventListener('click', async () => {
  customTemplate = $('templateEditor').value;
  await tiny.store.set('customTemplate', customTemplate);
  renderPreview();
});

$('resetTemplate').addEventListener('click', () => {
  $('templateEditor').value = DEFAULT_TEMPLATE;
});

$('exportHtml').addEventListener('click', async () => {
  if (!invoice) return;
  const path = await tiny.dialog.saveFile({ types: ['html'] });
  if (!path) return;
  const baseCss = useCustomTemplate ? '' : `${invoiceCss}\n${themeById(themeId).css}`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(invoice.number)}</title>
<style>${baseCss}</style></head><body>${invoiceHtml(invoice)}</body></html>`;
  await tiny.api.call('writeFile', { path, content: doc });
});

$('exportPdf').addEventListener('click', async () => {
  if (!invoice) return;
  const path = await tiny.dialog.saveFile({ types: ['pdf'] });
  if (!path) return;
  await tiny.win.printToPDF(path);
});

init().catch((e) => { $('err').textContent = 'init failed: ' + e; });
