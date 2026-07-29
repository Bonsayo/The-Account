addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  const targetUrl = `https://mel-bet.et${url.pathname}${url.search}`;
  const headers = new Headers(request.headers);
  headers.set("Host", "mel-bet.et");
  headers.delete("CF-Connecting-IP");
  headers.delete("CF-Worker");
  headers.delete("CF-Ray");
  headers.delete("X-Forwarded-For");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });

  const respHeaders = new Headers(response.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}
