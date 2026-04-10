module.exports = async function handler(req, res) {
  const { code } = req.query;
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  if (!code) { res.status(400).send('Missing OAuth code.'); return; }

  const tokenRes  = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
  });
  const tokenData = await tokenRes.json();

  const status  = tokenData.access_token ? 'success' : 'error';
  const payload = tokenData.access_token
    ? JSON.stringify({ token: tokenData.access_token, provider: 'github' })
    : JSON.stringify({ error: tokenData.error || 'OAuth failed' });

  res.setHeader('Content-Type', 'text/html');
  res.end(`<!DOCTYPE html><html><body><script>
(function(){
  var msg = ${JSON.stringify(`authorization:github:${status}:${payload}`)};
  function receive(e){ window.opener.postMessage(msg, e.origin); }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`);
};
