// Minimal Handlebars-like renderer: {{path.to.value}} interpolation (escaped)
// and one level of {{#each path}}...{{/each}} over an array (bare {{field}}
// inside resolves against the current item) or an object (@key + {{this}}).
// No nested #each, no helpers — enough for an invoice, nothing to configure.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const get = (ctx, path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), ctx);

const interpolate = (str, ctx) =>
  str.replace(/\{\{\s*([@\w.]+)\s*\}\}/g, (_, expr) => esc(get(ctx, expr)));

const EACH_RE = /\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;

export function renderTemplate(tpl, data) {
  const expanded = tpl.replace(EACH_RE, (_, path, inner) => {
    const list = get(data, path);
    if (Array.isArray(list)) return list.map((item) => interpolate(inner, item)).join('');
    if (list && typeof list === 'object') {
      return Object.entries(list)
        .map(([key, value]) => interpolate(inner, { ...(typeof value === 'object' ? value : { this: value }), '@key': key }))
        .join('');
    }
    return '';
  });
  return interpolate(expanded, data);
}

// Ported from toggl-bun-invoice/template.html (the original CLI's default
// Handlebars template) — same markup/CSS/variables, doctype+html+head+body
// wrapper stripped since this renders as a fragment inside #invoice.
//
// Everything is scoped under .toggl-invoice: a bare "body { font: ... }"
// selector in an injected <style> targets the REAL page body (style tags
// apply document-wide regardless of where they sit in the DOM), which broke
// the app's own toolbar font/spacing. The inner info box was also named
// class="invoice", colliding with the app's own .invoice CSS — renamed to
// .invoice-box. An explicit white background replaces the browser-default
// white this template assumed when it lived in its own standalone document.
export const DEFAULT_TEMPLATE = `<style>
  .toggl-invoice { font: 12px 'Arial'; line-height: 15px; background: #fff; color: #1a1a1a; padding-bottom: 24px; }
  .toggl-invoice table { border-spacing: 0; border-collapse: collapse; }
  .toggl-invoice tr { height: 20px; }
  .toggl-invoice td { padding: 0; }
  .toggl-invoice tr.header td { background-color: #e6e6e6; }
  .toggl-invoice .bold { font-weight: bold; }
  .toggl-invoice .page { position: relative; margin: 50px auto 20px; padding: 0; border: none; width: 687px; }
  .toggl-invoice .info { margin-bottom: 20px; }
  .toggl-invoice p { margin: 0; }
  .toggl-invoice .info .invoice-box { margin-left: 458px; }
  .toggl-invoice .content td, .toggl-invoice .summary td, .toggl-invoice .summary th { border-bottom: #e6e6e6 1px solid; word-wrap: break-word; }
  .toggl-invoice .content td p { padding: 8px 10px; }
  .toggl-invoice .bottom table, .toggl-invoice .summary table { width: 213px; margin-left: 527px; margin-top: 20px; }
  .toggl-invoice .bottom p, .toggl-invoice .summary p { padding: 10px 5px; }
</style>
<div class="toggl-invoice">
  <div class="page">
    <div class="info">
      <div class="bill_from">
        <table>
          <tr>
            <td width="229"><p>{{ invoice.billFrom.name }}</p></td>
            <td><p>{{ invoice.billFrom.street }}</p></td>
          </tr>
          <tr>
            <td><p>{{ invoice.billFrom.email }}</p></td>
            <td><p>{{ invoice.billFrom.locality }}</p></td>
          </tr>
          <tr>
            <td><p>&nbsp;</p></td>
            <td><p>{{ invoice.billFrom.country }}</p></td>
          </tr>
        </table>
      </div>
      <div class="invoice-box">
        <table width="229">
          <tr><td><p>Invoice Number</p></td><td><p>{{ invoice.number }}</p></td></tr>
          <tr><td><p>Invoice Date</p></td><td><p>{{ invoice.date }}</p></td></tr>
          <tr><td><p>Balance Due</p></td><td><p>{{ invoice.balanceDue }}</p></td></tr>
        </table>
      </div>
      <div class="bill_to">
        <table>
          <tr><td><p>{{ invoice.billTo.name }}</p></td></tr>
          <tr><td><p>{{ invoice.billTo.street }}</p></td></tr>
          <tr><td><p>{{ invoice.billTo.locality }}</p></td></tr>
          <tr><td><p>{{ invoice.billTo.country }}</p></td></tr>
        </table>
      </div>
    </div>
    <div class="content">
      <table width="687">
        <tr class="header bold">
          <td width="100"><p>Date</p></td>
          <td width="304"><p>Description</p></td>
          <td width="111"><p>Unit Cost</p></td>
          <td width="89"><p>Quantity</p></td>
          <td width="83"><p>Line Total</p></td>
        </tr>
        {{#each invoice.items}}
        <tr>
          <td><p><nobr>{{ startDate }}</nobr></p></td>
          <td><p>{{ description }}</p></td>
          <td><p>{{ rate }}</p></td>
          <td><p>{{ hours }}</p></td>
          <td><p>{{ amount }}</p></td>
        </tr>
        {{/each}}
      </table>
    </div>
  </div>
  <div class="summary">
    <table>
      <tr>
        <tr class="header"><td colspan="2" width="100"><p>Summary by Project</p></td></tr>
        {{#each invoice.summary}}
        <tr>
          <td class="bold"><p>{{ @key }}</p></td>
          <td align="right"><p>{{ this }}</p></td>
        </tr>
        {{/each}}
      </tr>
    </table>
  </div>
  <div class="bottom">
    <table>
      <tr><td><p>Subtotal</p></td><td align="right"><p>{{ invoice.totalAmount }}</p></td></tr>
      <tr><td><p>Paid To Date</p></td><td align="right"><p>{{ invoice.paidAmount }}</p></td></tr>
      <tr class="header"><td><p>Balance Due</p></td><td align="right"><p>{{ invoice.balanceDue }}</p></td></tr>
    </table>
  </div>
</div>`;
