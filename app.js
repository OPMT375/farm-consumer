// Renders the storefront from team.json and catalog.json. Students edit the JSON, not this file.
(async function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function load(file) {
    const r = await fetch(file + '?v=' + Date.now());
    if (!r.ok) throw new Error(`Could not load ${file} (${r.status})`);
    try { return await r.json(); }
    catch { throw new Error(`${file} is not valid JSON. Check for a missing comma or quote.`); }
  }

  try {
    const [team, catalog] = await Promise.all([load('team.json'), load('catalog.json')]);
    document.title = team.name || 'Storefront';
    $('name').textContent = team.name || 'Unnamed team';
    $('tagline').textContent = team.tagline || '';
    $('eyebrow').textContent = ['OPMT 375 Supply Lab', team.link && `${team.link} link`, team.chain && `Chain ${team.chain}`].filter(Boolean).join(' · ');
    $('about').textContent = team.about || '';
    $('how').textContent = team.how_to_order || '';

    const items = (catalog && catalog.items) || [];
    $('catalog').innerHTML = items.length
      ? items.map(it => {
          const extra = Object.entries(it).filter(([k]) => !['name', 'description'].includes(k));
          return `<article class="card"><h3>${esc(it.name)}</h3><p>${esc(it.description)}</p>${
            extra.length ? `<dl>${extra.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>`).join('')}</dl>` : ''
          }</article>`;
        }).join('')
      : '<p class="muted">Nothing listed yet.</p>';

    $('members').innerHTML = (team.members || []).map(m => `<li><b>${esc(m.name)}</b>${m.role ? ` · ${esc(m.role)}` : ''}${
      m.github ? ` · <a href="https://github.com/${encodeURIComponent(m.github)}">@${esc(m.github)}</a>` : ''}</li>`).join('');

    // "Contact us" opens a new Issue on this repo (owner.github.io/repo → github.com/owner/repo/issues/new)
    const host = location.hostname.match(/^([^.]+)\.github\.io$/);
    const repo = location.pathname.split('/').filter(Boolean)[0];
    if (host && repo) $('contact').href = `https://github.com/${host[1]}/${repo}/issues/new/choose`;
    else $('contact').classList.add('hidden');
  } catch (e) {
    $('name').textContent = 'Storefront not ready';
    $('err').textContent = e.message;
  }
})();
