// Renders the storefront and public party records from Supabase.
(async function () {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  // Replace these with the Project URL and anon/public key from Supabase → Project Settings → API.
  // Never put a service_role key in browser code.
  const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
  const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  async function load(file) {
    const response = await fetch(file + '?v=' + Date.now());
    if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`);
    try { return await response.json(); }
    catch { throw new Error(`${file} is not valid JSON. Check for a missing comma or quote.`); }
  }

  function renderParties(parties) {
    const container = $('parties');
    container.replaceChildren();

    if (!parties.length) {
      $('parties-status').textContent = 'No parties found.';
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const party of parties) {
      const card = document.createElement('article');
      card.className = 'card party-card';

      const title = document.createElement('h3');
      title.textContent = party.name || 'Unnamed party';
      card.append(title);

      const role = document.createElement('p');
      role.className = 'party-role';
      role.textContent = party.role || 'Role not specified';
      card.append(role);

      const details = document.createElement('dl');
      const fields = [
        ['GLN', party.gln],
        ['County', party.county],
        ['Team', party.team]
      ];
      for (const [label, value] of fields) {
        if (value == null || value === '') continue;
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        details.append(term, description);
      }
      card.append(details);
      fragment.append(card);
    }

    container.append(fragment);
    $('parties-status').textContent = `${parties.length} ${parties.length === 1 ? 'party' : 'parties'}`;
  }

  async function loadParties() {
    const status = $('parties-status');
    const isConfigured = !supabaseUrl.includes('YOUR_PROJECT_ID') &&
      !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY');

    if (!isConfigured) {
      status.textContent = 'Add your Supabase Project URL and anon/public key in app.js to load parties.';
      return;
    }
    if (!window.supabase?.createClient) {
      status.textContent = 'Could not load the Supabase client library. Check your connection and reload.';
      return;
    }

    try {
      const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await client
        .from('parties')
        .select('gln, name, role, county, team')
        .order('name', { ascending: true });

      if (error) throw error;
      renderParties(data || []);
    } catch (error) {
      status.textContent = `Could not load parties: ${error.message}`;
    }
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
      ? items.map(item => {
          const extra = Object.entries(item).filter(([key]) => !['name', 'description'].includes(key));
          return `<article class="card"><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p>${
            extra.length ? `<dl>${extra.map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(typeof value === 'object' ? JSON.stringify(value) : value)}</dd>`).join('')}</dl>` : ''
          }</article>`;
        }).join('')
      : '<p class="muted">Nothing listed yet.</p>';

    $('members').innerHTML = (team.members || []).map(member => `<li><b>${esc(member.name)}</b>${member.role ? ` · ${esc(member.role)}` : ''}${
      member.github ? ` · <a href="https://github.com/${encodeURIComponent(member.github)}">@${esc(member.github)}</a>` : ''}</li>`).join('');

    const host = location.hostname.match(/^([^.]+)\.github\.io$/);
    const repo = location.pathname.split('/').filter(Boolean)[0];
    if (host && repo) $('contact').href = `https://github.com/${host[1]}/${repo}/issues/new/choose`;
    else $('contact').classList.add('hidden');
  } catch (error) {
    $('name').textContent = 'Storefront not ready';
    $('err').textContent = error.message;
  }

  // Keep the storefront usable even if Supabase is not configured or unavailable.
  await loadParties();
})();
