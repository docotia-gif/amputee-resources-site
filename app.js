async function loadResources(){
  const res = await fetch('data/resources.json');
  return res.json();
}

function cardHTML(r){
  const meta = [r['Meeting Day'], r['Meeting Time']].filter(Boolean).join(' · ');
  const zoom = r['Zoom ID'] ? `Zoom ID: ${r['Zoom ID']}` : '';
  const notes = r['Notes'] || '';
  const metaLine = [meta, zoom].filter(Boolean).join(' · ');
  return `
    <div class="resource-card" data-category="${r.Category}" data-name="${(r.Name||'').toLowerCase()}" data-desc="${(r.Description||'').toLowerCase()}">
      <span class="cat">${r.Category || ''}</span>
      <h3>${r.Name || ''}</h3>
      ${r.Description ? `<p>${r.Description}</p>` : ''}
      ${metaLine ? `<div class="meta">${metaLine}</div>` : ''}
      ${notes ? `<div class="meta">${notes}</div>` : ''}
      ${r.URL ? `<a class="go" href="${r.URL}" target="_blank" rel="noopener">Visit site →</a>` : ''}
    </div>`;
}

function render(list, container, showHeaders){
  if(!list.length){
    container.innerHTML = '<div class="no-results">No resources match your search. Try a different term or category.</div>';
    return;
  }
  if(!showHeaders){
    container.innerHTML = `<div class="resource-grid">${list.map(cardHTML).join('')}</div>`;
    return;
  }
  const groups = [];
  list.forEach(r => {
    const cat = r.Category || 'Other';
    let group = groups.find(g => g.cat === cat);
    if(!group){ group = {cat, items: []}; groups.push(group); }
    group.items.push(r);
  });
  container.innerHTML = groups.map(g => `
    <h2 class="category-heading">${g.cat}</h2>
    <div class="resource-grid">${g.items.map(cardHTML).join('')}</div>
  `).join('');
}

(async function init(){
  const grid = document.getElementById('resource-grid');
  const search = document.getElementById('search');
  const categorySelect = document.getElementById('category-filter');
  const countEl = document.getElementById('result-count');
  if(!grid) return;

  const data = await loadResources();

  const categories = [...new Set(data.map(r => r.Category).filter(Boolean))].sort();
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  });

  function sortByCategoryThenName(list){
    return [...list].sort((a, b) => {
      const catA = (a.Category || '').toLowerCase();
      const catB = (b.Category || '').toLowerCase();
      if (catA !== catB) return catA.localeCompare(catB);
      const nameA = (a.Name || '').toLowerCase();
      const nameB = (b.Name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  function applyFilters(){
    const q = search.value.trim().toLowerCase();
    const cat = categorySelect.value;
    const filtered = data.filter(r => {
      const matchesCat = !cat || r.Category === cat;
      const matchesQ = !q || (r.Name||'').toLowerCase().includes(q) || (r.Description||'').toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
    const sorted = sortByCategoryThenName(filtered);
    render(sorted, grid, !cat);
    countEl.textContent = `${sorted.length} resource${sorted.length===1?'':'s'}`;
  }

  search.addEventListener('input', applyFilters);
  categorySelect.addEventListener('change', applyFilters);
  applyFilters();
})();

// mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav.primary');
  if(toggle && nav){
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
  }
});
