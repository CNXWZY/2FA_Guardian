export default {
  async fetch(request, env) {
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
