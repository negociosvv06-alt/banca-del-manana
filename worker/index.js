export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(".workers.dev") || url.hostname === "www.bancadelmanana.com") {
      url.hostname = "bancadelmanana.com"; url.protocol = "https:"; url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    // Enlaces antiguos de «Bancos y comparador» (sección eliminada) → calculadoras.
    if (url.pathname === "/bancos" || url.pathname.startsWith("/bancos/")) {
      url.pathname = "/calculadoras"; url.search = ""; url.hash = "";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
