// Only the public GitHub Pages frontend needs cross-origin browser access.
export const pagesOrigin = 'https://xueqian-zhong.github.io';
export function apiJson(request, data, init = {}) {
  const headers = new Headers(init.headers);
  headers.append('Vary', 'Origin');
  if (request.headers.get('Origin') === pagesOrigin) {
    headers.set('Access-Control-Allow-Origin', pagesOrigin);
  }
  return Response.json(data, {...init, headers});
}
