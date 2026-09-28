// Structural invoice CSS — shared by the in-app preview and standalone
// HTML export, so there is exactly one layout to maintain. Theme CSS
// (themes.js) only overrides colors/fonts on top of this.

export const invoiceCss = `
.invoice { background: #fff; color: #1a1a1a; max-width: 820px; margin: 0 auto; padding: 48px; font-family: -apple-system, sans-serif; }
.invoice-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 28px; }
.invoice-brand h1 { font-size: 26px; margin: 0; }
.invoice-meta { display: flex; gap: 14px; font-size: 12.5px; color: #555; }
.invoice-parties { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 28px; }
.party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 6px; }
.party p { margin: 0; font-size: 12.5px; line-height: 1.5; }
.invoice-items, .invoice-summary { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
.invoice-items th, .invoice-items td, .invoice-summary th, .invoice-summary td { text-align: left; padding: 7px 8px; }
.invoice-items th, .invoice-summary th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; }
.invoice-items td:last-child, .invoice-items th:last-child,
.invoice-summary td:last-child, .invoice-summary th:last-child { text-align: right; }
.invoice-totals { max-width: 260px; margin-left: auto; font-size: 13px; }
.invoice-totals > div { display: flex; justify-content: space-between; padding: 5px 8px; }
.balance-due { font-size: 15px; margin-top: 6px; }
`;
