// Backend: file I/O only. CSV parsing, invoice math, and rendering happen
// in the page (see src/frontend/invoice.js) — this stays thin.

export const api = {
  async readFile({ path }) {
    const data = await tjs.readFile(path);
    return new TextDecoder().decode(data);
  },

  async writeFile({ path, content }) {
    await tjs.writeFile(path, new TextEncoder().encode(content));
    return { path };
  },
};
