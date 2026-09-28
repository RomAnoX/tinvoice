// HTML themes: CSS-only skins over the fixed invoice markup (structural
// layout lives in style.css). Add a theme by adding an entry here.

export const themes = [
  {
    id: 'classic',
    name: 'Classic',
    css: `
      .invoice { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; }
      .invoice-brand h1 { font-weight: 400; letter-spacing: 4px; }
      .invoice-items th { border-bottom: 2px solid #1a1a1a; }
      .balance-due { border-top: 2px solid #1a1a1a; }
    `,
  },
  {
    id: 'modern',
    name: 'Modern',
    css: `
      .invoice { font-family: -apple-system, 'Segoe UI', sans-serif; color: #1c2430; }
      .invoice-brand h1 { color: #2563eb; font-weight: 700; }
      .invoice-items th { background: #eef2ff; color: #2563eb; }
      .invoice-items tr:nth-child(even) { background: #f8fafc; }
      .balance-due { background: #2563eb; color: #fff; border-radius: 6px; padding: 8px 12px; }
    `,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    css: `
      .invoice { font-family: ui-monospace, 'SF Mono', monospace; color: #333; font-size: 12.5px; }
      .invoice-brand h1 { font-weight: 500; }
      .invoice-items th, .invoice-summary th { border-bottom: 1px solid #ccc; color: #888; }
      .balance-due { font-weight: 700; }
    `,
  },
];

export const defaultThemeId = themes[0].id;

export const themeById = (id) => themes.find((t) => t.id === id) || themes[0];
