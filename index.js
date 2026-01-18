export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/') {
      return env.ASSETS.fetch(request);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
