// The agent runs entirely in the browser, so there is nothing to render per-request:
// prerender the whole site to static HTML at build time.
export const prerender = true;
export const ssr = false;
