// ═══════════════════════════════════════════════════════════════════
// BAC TRACKER — MAIN APP
// ═══════════════════════════════════════════════════════════════════

// ─── STATE ─────────────────────────────────────────────────────────
let subjects = [];        // full tree
let progress = {};        // { 'subjId:lessonId:scId': true }
let notes = {};           // { scId: text }
let favorites = {};       // { scId: true }
let files = {};           // { fileKey: { name, type, dataUrl, lessonId, section, sectionIdx? } }
let settings = {};        // { theme, pomodoroWork, pomodoroRest, activeSubject }
let currentSubject = null;
let showFavoritesOnly = false;
let hasUnsaved = false;   // dirty flag
let searchIndex = [];     // flat index for search

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════
function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function markDirty() {
  hasUnsaved = true;
  updateSaveButton();
}

function updateSaveButton() {
  const wrap = document.getElementById('save-btn-wrap');
  const btn = document.getElementById('save-btn');
  if (!wrap || !btn) return;
  if (hasUnsaved) {
    wrap.classList.add('has-unsaved');
    btn.classList.remove('saved');
    btn.innerHTML = '💾 Sauvegarder';
  } else {
    wrap.classList.remove('has-unsaved');
    btn.classList.add('saved');
    btn.innerHTML = '✓ Tout est sauvegardé';
  }
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

function confirmDialog(msg) {
  return confirm(msg);
}

function promptDialog(msg, defaultVal = '') {
  return prompt(msg, defaultVal);
}

// ═══════════════════════════════════════════════════════════════════
// STORAGE SYNC
// ═══════════════════════════════════════════════════════════════════
async function saveAll() {
  await Promise.all([
    Storage.setSubjects(subjects),
    Storage.setProgress(progress),
    Storage.setNotes(notes),
    Storage.setFavorites(favorites),
    Storage.setSettings(settings)
  ]);

  // Cloud sync if logged in
  if (currentUser) {
    setSyncStatus('☁️ Sync…');
    try {
      await SB.saveUserData(currentUser.id, { subjects, progress, notes, favorites, settings });
      setSyncStatus('☁️ Synchronisé');
    } catch (e) {
      setSyncStatus('⚠️ Sync échoué');
      console.warn('Cloud save failed:', e);
    }
  }

  hasUnsaved = false;
  updateSaveButton();
  toast('✓ Sauvegardé');
}

async function loadAll() {
  [subjects, progress, notes, favorites, files, settings] = await Promise.all([
    Storage.getSubjects(),
    Storage.getProgress(),
    Storage.getNotes(),
    Storage.getFavorites(),
    Storage.getAllFiles(),
    Storage.getSettings()
  ]);

  // Seed if empty
  if (!subjects || subjects.length === 0) {
    subjects = JSON.parse(JSON.stringify(SEED_DATA.subjects));
    await Storage.setSubjects(subjects);
  }

  applyTheme();
  currentSubject = settings.activeSubject || (subjects[0]?.id);
}

function applyTheme() {
  if (settings.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = '🌙';
  }
}

// ═══════════════════════════════════════════════════════════════════
// DATA HELPERS
// ═══════════════════════════════════════════════════════════════════
function getSubject(id) {
  return subjects.find(s => s.id === id);
}
function findLesson(lessonId) {
  for (const s of subjects) {
    for (const d of s.domains) {
      for (const m of d.modules) {
        const l = m.lessons.find(l => l.id === lessonId);
        if (l) return { subject: s, domain: d, module: m, lesson: l };
      }
    }
  }
  return null;
}

function progKey(subjId, lessonId, scId) {
  return `${subjId}:${lessonId}:${scId}`;
}

function isSubChecked(subjId, lessonId, scId) {
  return !!progress[progKey(subjId, lessonId, scId)];
}

function setSubChecked(subjId, lessonId, scId, val) {
  const k = progKey(subjId, lessonId, scId);
  if (val) progress[k] = true;
  else delete progress[k];
  markDirty();
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS CALCULATIONS
// ═══════════════════════════════════════════════════════════════════
function calcLesson(subjectId, lesson) {
  const total = lesson.subchapters.length;
  let done = 0;
  lesson.subchapters.forEach(sc => {
    if (isSubChecked(subjectId, lesson.id, sc.id)) done++;
  });
  return { done, total, pct: total > 0 ? Math.round(done/total*100) : 0 };
}

function calcModule(subjectId, module) {
  let done = 0, total = 0;
  module.lessons.forEach(l => {
    const p = calcLesson(subjectId, l);
    done += p.done; total += p.total;
  });
  return { done, total, pct: total > 0 ? Math.round(done/total*100) : 0 };
}

function calcDomain(subjectId, domain) {
  let done = 0, total = 0;
  domain.modules.forEach(m => {
    const p = calcModule(subjectId, m);
    done += p.done; total += p.total;
  });
  return { done, total, pct: total > 0 ? Math.round(done/total*100) : 0 };
}

function calcSubject(subject) {
  let done = 0, total = 0;
  subject.domains.forEach(d => {
    const p = calcDomain(subject.id, d);
    done += p.done; total += p.total;
  });
  return { done, total, pct: total > 0 ? Math.round(done/total*100) : 0 };
}

function countLessons(subject) {
  let completed = 0, total = 0;
  subject.domains.forEach(d => {
    d.modules.forEach(m => {
      m.lessons.forEach(l => {
        total++;
        const p = calcLesson(subject.id, l);
        if (p.pct === 100) completed++;
      });
    });
  });
  return { completed, total };
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR RENDERING
// ═══════════════════════════════════════════════════════════════════
function renderSidebar() {
  const nav = document.getElementById('subject-nav');
  nav.innerHTML = '';

  subjects.forEach(subj => {
    const pct = calcSubject(subj).pct;
    const item = document.createElement('div');
    item.className = 'nav-item' + (subj.id === currentSubject && !showFavoritesOnly ? ' active' : '');
    item.onclick = () => selectSubject(subj.id);
    item.innerHTML = `
      <span class="nav-item-icon">${escapeHtml(subj.icon)}</span>
      <span class="nav-item-text">${escapeHtml(subj.name)}</span>
      <span class="nav-item-badge">${pct}%</span>
    `;
    nav.appendChild(item);
  });

  // Favorites nav
  const favCount = Object.keys(favorites).length;
  const favItem = document.getElementById('nav-favorites');
  if (favItem) {
    favItem.classList.toggle('active', showFavoritesOnly);
    const badge = favItem.querySelector('.nav-item-badge');
    if (badge) badge.textContent = favCount;
  }
}

function selectSubject(id) {
  currentSubject = id;
  showFavoritesOnly = false;
  settings.activeSubject = id;
  markDirty();
  renderSidebar();
  render();
  if (window.innerWidth <= 880) toggleSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Broadcast study session to friends
  if (currentUser && settings.visible !== false) {
    const subj = getSubject(id);
    SB.setStudying(currentUser.id, {
      subjectId: id,
      subjectName: subj?.name || id,
      visible: true
    }).catch(() => {});
  }
}

function showFavorites() {
  showFavoritesOnly = true;
  renderSidebar();
  renderFavoritesPage();
  if (window.innerWidth <= 880) toggleSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════════

// Preserve open state across re-renders
let openState = { modules: new Set(), lessons: new Set() };

function captureOpenState() {
  openState.modules = new Set(Array.from(document.querySelectorAll('.module.open')).map(e => e.dataset.mid));
  openState.lessons = new Set(Array.from(document.querySelectorAll('.lesson.open')).map(e => e.dataset.lid));
}

function restoreOpenState() {
  document.querySelectorAll('.module').forEach(e => {
    if (openState.modules.has(e.dataset.mid)) e.classList.add('open');
  });
  document.querySelectorAll('.lesson').forEach(e => {
    if (openState.lessons.has(e.dataset.lid)) e.classList.add('open');
  });
}

function render() {
  if (showFavoritesOnly) { renderFavoritesPage(); return; }
  captureOpenState();

  const subject = getSubject(currentSubject);
  if (!subject) {
    document.getElementById('content').innerHTML = '<div class="empty">Aucune matière</div>';
    return;
  }

  const overall = calcSubject(subject);
  const counts = countLessons(subject);

  let html = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-eyebrow">${escapeHtml(subject.level || 'Révision')}</div>
        <h1 class="page-title page-title-editable" onclick="editSubjectName('${subject.id}')" title="Cliquer pour renommer">${escapeHtml(subject.name)}</h1>
        <p class="page-subtitle">Coche les sous-chapitres au fur et à mesure. La leçon se complète automatiquement. Clique sur les noms pour les modifier.</p>
      </div>
      <div class="header-actions">
        <button class="btn" onclick="addModule()">+ Module</button>
        <button class="btn danger btn-sm" onclick="deleteSubject('${subject.id}')" title="Supprimer cette matière">🗑️</button>
      </div>
    </div>

    <div class="summary-grid">
  `;

  subject.domains.forEach((d, i) => {
    const p = calcDomain(subject.id, d);
    html += `
      <div class="summary-card ${i === 0 ? 'featured' : ''}">
        <div class="summary-label">${escapeHtml(d.name)}</div>
        <div class="summary-value">${p.pct}%</div>
        <div class="summary-bar"><div class="summary-bar-fill" style="width:${p.pct}%"></div></div>
      </div>
    `;
  });

  html += `
    <div class="summary-card featured">
      <div class="summary-label">Global</div>
      <div class="summary-value">${overall.pct}%</div>
      <div class="summary-bar"><div class="summary-bar-fill" style="width:${overall.pct}%"></div></div>
    </div>
    </div>
  `;

  subject.domains.forEach(dom => {
    const domP = calcDomain(subject.id, dom);
    html += `
      <div class="domain">
        <div class="domain-head">
          <span class="domain-name page-title-editable" onclick="editDomainName('${dom.id}')" title="Cliquer pour renommer">${escapeHtml(dom.name)}</span>
          <span class="domain-weight">${dom.weight}%</span>
          <div class="domain-progress-right">
            <span class="domain-pct">${domP.pct}%</span>
            <div class="domain-bar"><div class="domain-bar-fill" style="width:${domP.pct}%"></div></div>
          </div>
        </div>
    `;

    dom.modules.forEach(mod => {
      html += renderModule(subject, dom, mod);
    });

    // Add module btn
    html += `
        <button class="add-page-btn" onclick="addModule('${dom.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un module dans ${escapeHtml(dom.name)}
        </button>
      </div>
    `;
  });

  // Progression tab
  html += renderProgressionTab(subject, overall, counts);

  document.getElementById('content').innerHTML = html;
  restoreOpenState();
}

function renderModule(subject, domain, mod) {
  const modP = calcModule(subject.id, mod);
  let html = `
    <div class="module" data-mid="${mod.id}">
      <div class="module-row" onclick="toggleModule('${mod.id}')">
        <span class="module-icon">${escapeHtml(mod.icon || '📘')}</span>
        <span class="module-name">${escapeHtml(mod.name)}${mod.priority ? '<span class="star">★</span>' : ''}</span>
        <span class="module-weight-tag">${mod.weight}%</span>
        <div class="module-prog">
          <span class="module-prog-pct">${modP.pct}%</span>
          <div class="mini-bar"><div class="mini-bar-fill" style="width:${modP.pct}%"></div></div>
        </div>
        <button class="edit-btn" onclick="event.stopPropagation(); editModule('${mod.id}')" title="Modifier">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <span class="chev">▶</span>
      </div>
      <div class="lessons-wrap">
  `;

  mod.lessons.forEach(les => {
    html += renderLesson(subject, mod, les);
  });

  html += `
        <div style="padding: 0.6rem 1rem 0.7rem 1.5rem; border-top: 1px dashed var(--border);">
          <button class="btn btn-sm" onclick="addLesson('${mod.id}')">+ Ajouter une leçon</button>
        </div>
      </div>
    </div>
  `;
  return html;
}

function renderLesson(subject, mod, les) {
  const p = calcLesson(subject.id, les);
  const isDone = p.total > 0 && p.pct === 100;
  let html = `
    <div class="lesson ${isDone ? 'done' : ''}" data-lid="${les.id}">
      <div class="lesson-row" onclick="toggleLesson('${les.id}')">
        <div class="cb ${isDone ? 'checked' : ''}" onclick="event.stopPropagation(); toggleLessonAll('${subject.id}', '${les.id}')">
          <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3L3 5L7 1" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span class="lesson-name">${escapeHtml(les.name)}</span>
        <span class="lesson-frac">${p.done}/${p.total}</span>
        <div class="lesson-mini"><div class="lesson-mini-fill" style="width:${p.pct}%"></div></div>
        <button class="edit-btn" onclick="event.stopPropagation(); editLesson('${les.id}')" title="Modifier">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <span class="lesson-chev">▶</span>
      </div>
      <div class="subs-wrap">
        <div class="subs">
  `;

  les.subchapters.forEach(sc => {
    html += renderSubchapter(subject, les, sc);
  });

  html += `
        </div>
        <div class="add-sub">
          <input type="text" class="add-sub-input" placeholder="+ Ajouter un sous-chapitre (Entrée pour valider)" 
                 onkeydown="handleAddSub(event, '${les.id}')">
        </div>
      </div>
      ${renderLessonDetail(les)}
    </div>
  `;
  return html;
}

function renderSubchapter(subject, lesson, sc) {
  const checked = isSubChecked(subject.id, lesson.id, sc.id);
  const note = notes[sc.id] || '';
  const isFav = !!favorites[sc.id];
  return `
    <div class="sub ${checked ? 'done' : ''} ${note ? 'has-note' : ''} ${isFav ? 'is-fav' : ''}" onclick="toggleSub('${subject.id}', '${lesson.id}', '${sc.id}')">
      <div class="sub-cb ${checked ? 'checked' : ''}">
        <svg width="7" height="5" viewBox="0 0 8 6"><path d="M1 3L3 5L7 1" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="sub-body">
        <div class="sub-text">${escapeHtml(sc.text)}</div>
        ${note ? `<div class="sub-note">📝 ${escapeHtml(note)}</div>` : ''}
      </div>
      <div class="sub-actions">
        <button class="star-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFav('${sc.id}')" title="Favori">${isFav ? '★' : '☆'}</button>
        <button class="note-btn ${note ? 'active' : ''}" onclick="event.stopPropagation(); editNote('${sc.id}')" title="Note">📝</button>
        <button class="edit-btn" onclick="event.stopPropagation(); editSub('${lesson.id}', '${sc.id}')" title="Modifier">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="edit-btn" onclick="event.stopPropagation(); deleteSub('${lesson.id}', '${sc.id}')" title="Supprimer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// LESSON DETAIL (formulas, tips, traps, custom pages)
// ═══════════════════════════════════════════════════════════════════
function renderLessonDetail(lesson) {
  let html = '<div class="lesson-detail">';

  html += renderDetailSection(lesson, 'formulas', '📐 Formules clés', lesson.formulas || []);
  html += renderDetailSection(lesson, 'tips', '💡 Astuces & Tricks', lesson.tips || []);
  html += renderDetailSection(lesson, 'traps', '⚠️ Pièges courants', lesson.traps || []);

  // Custom pages
  if (lesson.customPages) {
    lesson.customPages.forEach((page, idx) => {
      html += renderCustomPage(lesson, page, idx);
    });
  }

  html += `
    <button class="add-page-btn" onclick="addCustomPage('${lesson.id}')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Ajouter une page perso
    </button>
  `;

  html += '</div>';
  return html;
}

function renderDetailSection(lesson, sectionKey, label, items) {
  const sectionFiles = getFilesForSection(lesson.id, sectionKey);
  const listClass = sectionKey === 'formulas' ? 'formulas' : '';

  let html = `
    <div class="detail-section ${sectionKey}">
      <div class="detail-section-head">
        <span class="detail-section-label">${label}</span>
        <div class="section-actions">
          <button class="section-action" onclick="addItemToSection('${lesson.id}', '${sectionKey}')" title="Ajouter un item">+ item</button>
          <button class="section-action" onclick="uploadFileToSection('${lesson.id}', '${sectionKey}')" title="Upload fichier">📎 fichier</button>
        </div>
      </div>
      <div class="detail-section-body">
        ${items.length ? `
          <ul class="detail-list ${listClass}">
            ${items.map((it, idx) => `
              <li>
                <span class="item-text">${escapeHtml(it)}</span>
                <span class="item-actions">
                  <button class="section-action" onclick="editSectionItem('${lesson.id}', '${sectionKey}', ${idx})">✏️</button>
                  <button class="section-action" onclick="deleteSectionItem('${lesson.id}', '${sectionKey}', ${idx})">🗑️</button>
                </span>
              </li>
            `).join('')}
          </ul>
        ` : '<div style="font-size:12px; color:var(--muted); font-style:italic;">Aucun item — utilise "+ item" pour ajouter.</div>'}
        ${renderSectionFiles(sectionFiles)}
      </div>
    </div>
  `;
  return html;
}

function renderCustomPage(lesson, page, idx) {
  const pageFiles = getFilesForSection(lesson.id, 'custom_' + idx);
  return `
    <div class="detail-section custom">
      <div class="detail-section-head">
        <span class="detail-section-label">📄 ${escapeHtml(page.title)}</span>
        <div class="section-actions">
          <button class="section-action" onclick="editCustomPage('${lesson.id}', ${idx})" title="Éditer">✏️ éditer</button>
          <button class="section-action" onclick="uploadFileToSection('${lesson.id}', 'custom_${idx}')" title="Upload fichier">📎 fichier</button>
          <button class="section-action" onclick="deleteCustomPage('${lesson.id}', ${idx})" title="Supprimer">🗑️</button>
        </div>
      </div>
      <div class="detail-section-body">
        <div class="custom-page-content">${escapeHtml(page.content || '')}</div>
        ${renderSectionFiles(pageFiles)}
      </div>
    </div>
  `;
}

function getFilesForSection(lessonId, section) {
  const result = [];
  for (const [key, f] of Object.entries(files)) {
    if (f.lessonId === lessonId && f.section === section) {
      result.push({ key, ...f });
    }
  }
  return result;
}

function renderSectionFiles(sectionFiles) {
  if (!sectionFiles.length) return '';
  const images = sectionFiles.filter(f => f.type.startsWith('image/'));
  const others = sectionFiles.filter(f => !f.type.startsWith('image/'));

  let html = '';

  if (images.length) {
    html += '<div class="thumbnail-preview">';
    images.forEach(img => {
      html += `
        <div class="thumbnail" onclick="viewFile('${img.key}')">
          <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">
          <button class="thumbnail-remove" onclick="event.stopPropagation(); removeFile('${img.key}')">×</button>
        </div>
      `;
    });
    html += '</div>';
  }

  if (others.length) {
    html += '<div class="section-files">';
    others.forEach(f => {
      const icon = f.type === 'application/pdf' ? '📄' : '📎';
      html += `
        <div class="file-chip" onclick="viewFile('${f.key}')">
          <span class="file-chip-icon">${icon}</span>
          <span class="file-chip-name">${escapeHtml(f.name)}</span>
          <button class="file-chip-remove" onclick="event.stopPropagation(); removeFile('${f.key}')">×</button>
        </div>
      `;
    });
    html += '</div>';
  }

  return html;
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESSION TAB
// ═══════════════════════════════════════════════════════════════════
function renderProgressionTab(subject, overall, counts) {
  let html = `
    <div class="progression">
      <div class="prog-head">
        <span class="prog-title">Tableau de progression</span>
        <span class="prog-sub">${counts.completed} / ${counts.total} leçons terminées</span>
      </div>
      <div class="prog-body">
  `;

  subject.domains.forEach(dom => {
    const p = calcDomain(subject.id, dom);
    html += `
      <div class="prog-row big">
        <div class="prog-name"><span class="prog-dot"></span>${escapeHtml(dom.name.toUpperCase())}</div>
        <div class="prog-bar-wrap"><div class="prog-bar-inner" style="width:${p.pct}%"></div></div>
        <span class="prog-pct">${p.pct}%</span>
        <span class="prog-weight">${dom.weight}%</span>
      </div>
    `;
    dom.modules.forEach(mod => {
      const mp = calcModule(subject.id, mod);
      html += `
        <div class="prog-row">
          <div class="prog-name" style="padding-left:1rem"><span class="prog-dot" style="opacity:0.5"></span>${escapeHtml(mod.icon || '')} ${escapeHtml(mod.name)}</div>
          <div class="prog-bar-wrap"><div class="prog-bar-inner" style="width:${mp.pct}%; background:var(--orange); opacity:0.7"></div></div>
          <span class="prog-pct">${mp.pct}%</span>
          <span class="prog-weight">${mod.weight}%</span>
        </div>
      `;
    });
    html += `<hr class="prog-div">`;
  });

  html += `
        <div class="prog-row global-row">
          <div class="prog-name"><span class="prog-dot"></span>PROGRESSION GLOBALE</div>
          <div class="prog-bar-wrap"><div class="prog-bar-inner" style="width:${overall.pct}%"></div></div>
          <span class="prog-pct">${overall.pct}%</span>
          <span class="prog-weight">100%</span>
        </div>
      </div>
    </div>
  `;
  return html;
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIONS
// ═══════════════════════════════════════════════════════════════════
function toggleModule(id) {
  document.querySelector(`.module[data-mid="${id}"]`)?.classList.toggle('open');
}
function toggleLesson(id) {
  document.querySelector(`.lesson[data-lid="${id}"]`)?.classList.toggle('open');
}

function toggleSub(subjId, lessonId, scId) {
  const checked = isSubChecked(subjId, lessonId, scId);
  setSubChecked(subjId, lessonId, scId, !checked);
  render();
  renderSidebar();
}

function toggleLessonAll(subjId, lessonId) {
  const found = findLesson(lessonId);
  if (!found) return;
  const p = calcLesson(subjId, found.lesson);
  const allDone = p.total > 0 && p.pct === 100;
  // If all done → uncheck all ; else → check all
  found.lesson.subchapters.forEach(sc => {
    setSubChecked(subjId, lessonId, sc.id, !allDone);
  });
  render();
  renderSidebar();
}

// ═══════════════════════════════════════════════════════════════════
// EDITING: SUBJECTS / DOMAINS / MODULES / LESSONS / SUBS
// ═══════════════════════════════════════════════════════════════════
function editSubjectName(id) {
  const s = getSubject(id);
  if (!s) return;
  const newName = promptDialog('Nouveau nom de la matière :', s.name);
  if (newName && newName.trim()) {
    s.name = newName.trim();
    markDirty();
    render();
    renderSidebar();
  }
}

function editDomainName(id) {
  const subj = getSubject(currentSubject);
  const d = subj.domains.find(d => d.id === id);
  if (!d) return;
  const newName = promptDialog('Nouveau nom du domaine :', d.name);
  if (newName && newName.trim()) {
    d.name = newName.trim();
    markDirty();
    render();
  }
}

function addModule(domainId) {
  const subj = getSubject(currentSubject);
  if (!subj) return;
  let targetDomain;
  if (domainId) {
    targetDomain = subj.domains.find(d => d.id === domainId);
  } else {
    // Pick first domain by default
    targetDomain = subj.domains[0];
  }
  if (!targetDomain) return;

  openModal({
    title: 'Nouveau module',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', placeholder: 'ex : Thermodynamique', required: true },
      { name: 'icon', label: 'Icône (emoji)', type: 'text', placeholder: '🔬', value: '📘' },
      { name: 'weight', label: 'Poids (%)', type: 'number', placeholder: '10', value: 10, min: 0, max: 100 }
    ],
    onSubmit: (data) => {
      const newMod = {
        id: uid('mod'),
        name: data.name,
        icon: data.icon || '📘',
        weight: parseInt(data.weight, 10) || 0,
        priority: false,
        order: targetDomain.modules.length,
        lessons: []
      };
      targetDomain.modules.push(newMod);
      markDirty();
      render();
    }
  });
}

function editModule(id) {
  const subj = getSubject(currentSubject);
  let mod, dom;
  for (const d of subj.domains) {
    const m = d.modules.find(m => m.id === id);
    if (m) { mod = m; dom = d; break; }
  }
  if (!mod) return;

  openModal({
    title: 'Modifier le module',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', value: mod.name, required: true },
      { name: 'icon', label: 'Icône', type: 'text', value: mod.icon || '' },
      { name: 'weight', label: 'Poids (%)', type: 'number', value: mod.weight, min: 0, max: 100 },
      { name: 'priority', label: 'Priorité (★)', type: 'checkbox', value: mod.priority }
    ],
    extraButtons: [
      {
        label: '🗑️ Supprimer le module',
        className: 'btn danger',
        onClick: () => {
          if (confirmDialog(`Supprimer le module "${mod.name}" et toutes ses leçons ?`)) {
            dom.modules = dom.modules.filter(m => m.id !== id);
            markDirty();
            closeModal();
            render();
          }
        }
      }
    ],
    onSubmit: (data) => {
      mod.name = data.name;
      mod.icon = data.icon || '📘';
      mod.weight = parseInt(data.weight, 10) || 0;
      mod.priority = !!data.priority;
      markDirty();
      render();
    }
  });
}

function addLesson(modId) {
  const subj = getSubject(currentSubject);
  let mod;
  for (const d of subj.domains) {
    const m = d.modules.find(m => m.id === modId);
    if (m) { mod = m; break; }
  }
  if (!mod) return;

  const name = promptDialog('Nom de la nouvelle leçon :');
  if (name && name.trim()) {
    const newLes = {
      id: uid('les'),
      name: name.trim(),
      order: mod.lessons.length,
      subchapters: [],
      formulas: [],
      tips: [],
      traps: [],
      customPages: []
    };
    mod.lessons.push(newLes);
    markDirty();
    render();
  }
}

function editLesson(id) {
  const found = findLesson(id);
  if (!found) return;
  openModal({
    title: 'Modifier la leçon',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', value: found.lesson.name, required: true }
    ],
    extraButtons: [
      {
        label: '🗑️ Supprimer la leçon',
        className: 'btn danger',
        onClick: () => {
          if (confirmDialog(`Supprimer la leçon "${found.lesson.name}" ?`)) {
            found.module.lessons = found.module.lessons.filter(l => l.id !== id);
            markDirty();
            closeModal();
            render();
          }
        }
      }
    ],
    onSubmit: (data) => {
      found.lesson.name = data.name;
      markDirty();
      render();
    }
  });
}

function handleAddSub(e, lessonId) {
  if (e.key !== 'Enter') return;
  const val = e.target.value.trim();
  if (!val) return;
  const found = findLesson(lessonId);
  if (!found) return;
  const newSc = { id: uid('sc'), text: val };
  found.lesson.subchapters.push(newSc);
  e.target.value = '';
  markDirty();
  render();
  renderSidebar();
}

function editSub(lessonId, scId) {
  const found = findLesson(lessonId);
  if (!found) return;
  const sc = found.lesson.subchapters.find(s => s.id === scId);
  if (!sc) return;
  const newText = promptDialog('Modifier le sous-chapitre :', sc.text);
  if (newText && newText.trim()) {
    sc.text = newText.trim();
    markDirty();
    render();
  }
}

function deleteSub(lessonId, scId) {
  if (!confirmDialog('Supprimer ce sous-chapitre ?')) return;
  const found = findLesson(lessonId);
  if (!found) return;
  found.lesson.subchapters = found.lesson.subchapters.filter(s => s.id !== scId);
  // Clean up progress for this sc
  const k = progKey(found.subject.id, lessonId, scId);
  delete progress[k];
  delete notes[scId];
  delete favorites[scId];
  markDirty();
  render();
  renderSidebar();
}

function deleteSubject(id) {
  if (subjects.length <= 1) {
    toast('Impossible de supprimer la dernière matière');
    return;
  }
  const s = getSubject(id);
  if (!s) return;
  if (!confirmDialog(`Supprimer la matière "${s.name}" et toutes ses leçons ?\n\nCette action est IRRÉVERSIBLE.`)) return;
  subjects = subjects.filter(x => x.id !== id);
  currentSubject = subjects[0].id;
  markDirty();
  render();
  renderSidebar();
}

// ═══════════════════════════════════════════════════════════════════
// SECTIONS: FORMULAS / TIPS / TRAPS / CUSTOM PAGES
// ═══════════════════════════════════════════════════════════════════
function addItemToSection(lessonId, sectionKey) {
  const found = findLesson(lessonId);
  if (!found) return;
  const val = promptDialog('Nouvel item :');
  if (val && val.trim()) {
    if (!found.lesson[sectionKey]) found.lesson[sectionKey] = [];
    found.lesson[sectionKey].push(val.trim());
    markDirty();
    render();
  }
}

function editSectionItem(lessonId, sectionKey, idx) {
  const found = findLesson(lessonId);
  if (!found) return;
  const arr = found.lesson[sectionKey] || [];
  const current = arr[idx];
  const newVal = promptDialog('Modifier :', current);
  if (newVal && newVal.trim()) {
    arr[idx] = newVal.trim();
    markDirty();
    render();
  }
}

function deleteSectionItem(lessonId, sectionKey, idx) {
  if (!confirmDialog('Supprimer cet item ?')) return;
  const found = findLesson(lessonId);
  if (!found) return;
  found.lesson[sectionKey].splice(idx, 1);
  markDirty();
  render();
}

function addCustomPage(lessonId) {
  const found = findLesson(lessonId);
  if (!found) return;
  const title = promptDialog('Titre de la nouvelle page :');
  if (!title || !title.trim()) return;
  if (!found.lesson.customPages) found.lesson.customPages = [];
  found.lesson.customPages.push({ title: title.trim(), content: '' });
  markDirty();
  render();
}

function editCustomPage(lessonId, idx) {
  const found = findLesson(lessonId);
  if (!found) return;
  const page = found.lesson.customPages[idx];
  if (!page) return;

  openModal({
    title: 'Éditer la page',
    large: true,
    fields: [
      { name: 'title', label: 'Titre', type: 'text', value: page.title, required: true },
      { name: 'content', label: 'Contenu', type: 'textarea', value: page.content || '', placeholder: 'Ton texte ici...', rows: 10 }
    ],
    onSubmit: (data) => {
      page.title = data.title;
      page.content = data.content;
      markDirty();
      render();
    }
  });
}

function deleteCustomPage(lessonId, idx) {
  if (!confirmDialog('Supprimer cette page ?')) return;
  const found = findLesson(lessonId);
  if (!found) return;
  // Delete any files associated with this page
  const sectionName = 'custom_' + idx;
  Object.entries(files).forEach(([key, f]) => {
    if (f.lessonId === lessonId && f.section === sectionName) {
      delete files[key];
      Storage.deleteFile(key);
    }
  });
  found.lesson.customPages.splice(idx, 1);
  markDirty();
  render();
}

// ═══════════════════════════════════════════════════════════════════
// FILES: Upload / View / Delete
// ═══════════════════════════════════════════════════════════════════
let fileUploadContext = null;

function uploadFileToSection(lessonId, section) {
  fileUploadContext = { lessonId, section };
  document.getElementById('file-input').click();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('file-input').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f || !fileUploadContext) return;
    if (f.size > 15 * 1024 * 1024) {
      toast('❌ Fichier trop gros (max 15 MB)');
      return;
    }
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toast('❌ Seulement images et PDFs');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileData = {
        name: f.name,
        type: f.type,
        dataUrl: ev.target.result,
        lessonId: fileUploadContext.lessonId,
        section: fileUploadContext.section
      };
      const key = await Storage.addFile(fileData);
      files[key] = fileData;
      fileUploadContext = null;
      e.target.value = '';
      toast('✓ Fichier ajouté');
      render();
    };
    reader.readAsDataURL(f);
  });
});

async function removeFile(key) {
  if (!confirmDialog('Supprimer ce fichier ?')) return;
  await Storage.deleteFile(key);
  delete files[key];
  render();
  toast('✓ Fichier supprimé');
}

function viewFile(key) {
  const f = files[key];
  if (!f) return;
  const backdrop = document.getElementById('viewer-backdrop');
  const content = document.getElementById('viewer-content');
  if (f.type.startsWith('image/')) {
    content.innerHTML = `
      <button class="viewer-close" onclick="closeViewer()">✕ Fermer</button>
      <img src="${f.dataUrl}" alt="${escapeHtml(f.name)}">
    `;
  } else {
    content.innerHTML = `
      <button class="viewer-close" onclick="closeViewer()">✕ Fermer</button>
      <iframe src="${f.dataUrl}"></iframe>
    `;
  }
  backdrop.classList.add('show');
}
function closeViewer() {
  document.getElementById('viewer-backdrop').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════
// NOTES & FAVORITES
// ═══════════════════════════════════════════════════════════════════
function editNote(scId) {
  const current = notes[scId] || '';
  const newNote = promptDialog('Note rapide (laisse vide pour supprimer) :', current);
  if (newNote === null) return;
  if (newNote.trim()) notes[scId] = newNote.trim();
  else delete notes[scId];
  markDirty();
  render();
}

function toggleFav(scId) {
  if (favorites[scId]) delete favorites[scId];
  else favorites[scId] = true;
  markDirty();
  render();
  renderSidebar();
}

function renderFavoritesPage() {
  const favIds = Object.keys(favorites);
  if (favIds.length === 0) {
    document.getElementById('content').innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <div class="page-eyebrow">Favoris</div>
          <h1 class="page-title"><span class="accent">Mes</span> favoris</h1>
          <p class="page-subtitle">Les sous-chapitres que tu as marqués d'une étoile apparaîtront ici.</p>
        </div>
      </div>
      <div style="padding: 3rem; text-align:center; color:var(--muted); font-size:13px;">
        Aucun favori pour le moment. Clique sur ☆ à côté d'un sous-chapitre pour l'ajouter.
      </div>
    `;
    return;
  }

  const items = [];
  subjects.forEach(s => {
    s.domains.forEach(d => {
      d.modules.forEach(m => {
        m.lessons.forEach(l => {
          l.subchapters.forEach(sc => {
            if (favorites[sc.id]) {
              items.push({ subject: s, module: m, lesson: l, sc });
            }
          });
        });
      });
    });
  });

  let html = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-eyebrow">Favoris</div>
        <h1 class="page-title"><span class="accent">Mes</span> favoris</h1>
        <p class="page-subtitle">${items.length} sous-chapitre${items.length > 1 ? 's' : ''} marqué${items.length > 1 ? 's' : ''} en favori</p>
      </div>
    </div>
    <div class="favorites-list">
  `;

  items.forEach(item => {
    const checked = isSubChecked(item.subject.id, item.lesson.id, item.sc.id);
    html += `
      <div class="favorite-item" onclick="navigateToSub('${item.subject.id}', '${item.module.id}', '${item.lesson.id}')">
        <div class="sub-cb ${checked ? 'checked' : ''}" onclick="event.stopPropagation(); toggleSub('${item.subject.id}', '${item.lesson.id}', '${item.sc.id}')">
          <svg width="7" height="5" viewBox="0 0 8 6"><path d="M1 3L3 5L7 1" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="flex:1;">
          <div class="favorite-path">${escapeHtml(item.subject.name)} → ${escapeHtml(item.module.name)} → ${escapeHtml(item.lesson.name)}</div>
          <div class="favorite-text">${escapeHtml(item.sc.text)}</div>
        </div>
        <button class="star-btn active" onclick="event.stopPropagation(); toggleFav('${item.sc.id}')">★</button>
      </div>
    `;
  });
  html += '</div>';

  document.getElementById('content').innerHTML = html;
}

function navigateToSub(subjectId, moduleId, lessonId) {
  showFavoritesOnly = false;
  currentSubject = subjectId;
  openState.modules.add(moduleId);
  openState.lessons.add(lessonId);
  renderSidebar();
  render();
  setTimeout(() => {
    const el = document.querySelector(`.lesson[data-lid="${lessonId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// ═══════════════════════════════════════════════════════════════════
// MODAL (generic form modal)
// ═══════════════════════════════════════════════════════════════════
let modalSubmit = null;
function openModal({ title, fields, onSubmit, extraButtons = [], large = false }) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = backdrop.querySelector('.modal');
  modal.classList.toggle('large', !!large);

  let fieldsHtml = '';
  fields.forEach(f => {
    if (f.type === 'textarea') {
      fieldsHtml += `
        <div class="form-group">
          <label class="form-label">${escapeHtml(f.label)}</label>
          <textarea class="form-textarea" name="${f.name}" rows="${f.rows || 4}" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(f.value || '')}</textarea>
        </div>
      `;
    } else if (f.type === 'checkbox') {
      fieldsHtml += `
        <div class="form-group">
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:13px; color:var(--text-soft);">
            <input type="checkbox" name="${f.name}" ${f.value ? 'checked' : ''} style="width:auto;">
            ${escapeHtml(f.label)}
          </label>
        </div>
      `;
    } else {
      fieldsHtml += `
        <div class="form-group">
          <label class="form-label">${escapeHtml(f.label)}</label>
          <input class="form-input" type="${f.type || 'text'}" name="${f.name}" value="${escapeHtml(f.value || '')}" placeholder="${escapeHtml(f.placeholder || '')}" ${f.required ? 'required' : ''} ${f.min !== undefined ? 'min="'+f.min+'"' : ''} ${f.max !== undefined ? 'max="'+f.max+'"' : ''}>
        </div>
      `;
    }
  });

  let extraHtml = '';
  extraButtons.forEach((btn, i) => {
    extraHtml += `<button class="${btn.className || 'btn'}" data-extra="${i}">${escapeHtml(btn.label)}</button>`;
  });

  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${escapeHtml(title)}</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="modal-form">${fieldsHtml}</form>
    </div>
    <div class="modal-footer">
      ${extraHtml}
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn primary" onclick="submitModal()">Valider</button>
    </div>
  `;

  // Bind extra buttons
  extraButtons.forEach((btn, i) => {
    const el = modal.querySelector(`[data-extra="${i}"]`);
    if (el) el.onclick = btn.onClick;
  });

  modalSubmit = onSubmit;
  backdrop.classList.add('show');

  // Focus first input
  setTimeout(() => {
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  }, 50);
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('show');
  modalSubmit = null;
}

function submitModal() {
  const form = document.getElementById('modal-form');
  if (!form) return;
  const data = {};
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') data[el.name] = el.checked;
    else data[el.name] = el.value;
  });
  // Validate required
  for (const el of form.elements) {
    if (el.required && !el.value.trim()) {
      el.focus();
      toast('Champ requis');
      return;
    }
  }
  const cb = modalSubmit;
  closeModal();
  if (cb) cb(data);
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════
function buildSearchIndex() {
  searchIndex = [];
  subjects.forEach(s => {
    s.domains.forEach(d => {
      d.modules.forEach(m => {
        m.lessons.forEach(l => {
          // Lessons
          searchIndex.push({
            type: 'lesson',
            text: l.name,
            path: `${s.name} → ${m.name}`,
            subjectId: s.id, moduleId: m.id, lessonId: l.id
          });
          // Subchapters
          l.subchapters.forEach(sc => {
            searchIndex.push({
              type: 'sub',
              text: sc.text,
              path: `${s.name} → ${m.name} → ${l.name}`,
              subjectId: s.id, moduleId: m.id, lessonId: l.id, scId: sc.id
            });
          });
          // Formulas/tips/traps
          ['formulas', 'tips', 'traps'].forEach(key => {
            (l[key] || []).forEach(item => {
              searchIndex.push({
                type: key,
                text: item,
                path: `${s.name} → ${l.name} (${key})`,
                subjectId: s.id, moduleId: m.id, lessonId: l.id
              });
            });
          });
          // Custom pages
          (l.customPages || []).forEach(p => {
            searchIndex.push({
              type: 'page',
              text: p.title + ' — ' + (p.content || '').slice(0, 100),
              path: `${s.name} → ${l.name}`,
              subjectId: s.id, moduleId: m.id, lessonId: l.id
            });
          });
        });
      });
    });
  });
}

function openSearch() {
  const backdrop = document.getElementById('search-backdrop');
  backdrop.classList.add('show');
  buildSearchIndex();
  const input = document.getElementById('search-input');
  input.value = '';
  input.focus();
  renderSearchResults('');
}

function closeSearch() {
  document.getElementById('search-backdrop').classList.remove('show');
}

function renderSearchResults(query) {
  const results = document.getElementById('search-results');
  if (!query.trim()) {
    results.innerHTML = '<div class="search-empty">Tape pour chercher dans toutes tes matières...</div>';
    return;
  }
  const q = query.toLowerCase();
  const matches = searchIndex.filter(item => item.text.toLowerCase().includes(q)).slice(0, 40);
  if (matches.length === 0) {
    results.innerHTML = '<div class="search-empty">Aucun résultat</div>';
    return;
  }
  results.innerHTML = matches.map((m, i) => {
    const highlightedText = highlightMatch(m.text, query);
    return `
      <div class="search-result ${i === 0 ? 'active' : ''}" onclick="jumpToSearchResult(${i})" data-idx="${i}">
        <div class="search-result-path">${escapeHtml(m.path)}</div>
        <div class="search-result-text">${highlightedText}</div>
      </div>
    `;
  }).join('');
  window._searchMatches = matches;
}

function highlightMatch(text, query) {
  const safe = escapeHtml(text);
  const q = query.trim();
  if (!q) return safe;
  const regex = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return safe.replace(regex, '<span class="search-result-highlight">$1</span>');
}

function jumpToSearchResult(idx) {
  const m = window._searchMatches[idx];
  if (!m) return;
  closeSearch();
  navigateToSub(m.subjectId, m.moduleId, m.lessonId);
}

// Search keyboard
let searchSelectedIdx = 0;
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      searchSelectedIdx = 0;
      renderSearchResults(e.target.value);
    });
    input.addEventListener('keydown', (e) => {
      const matches = window._searchMatches || [];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchSelectedIdx = Math.min(searchSelectedIdx + 1, matches.length - 1);
        updateSearchSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchSelectedIdx = Math.max(searchSelectedIdx - 1, 0);
        updateSearchSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        jumpToSearchResult(searchSelectedIdx);
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    });
  }
});

function updateSearchSelection() {
  document.querySelectorAll('.search-result').forEach((el, i) => {
    el.classList.toggle('active', i === searchSelectedIdx);
    if (i === searchSelectedIdx) el.scrollIntoView({ block: 'nearest' });
  });
}

// Global keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveAll();
  }
});

// ═══════════════════════════════════════════════════════════════════
// POMODORO
// ═══════════════════════════════════════════════════════════════════
const Pomodoro = {
  workMinutes: 25,
  restMinutes: 5,
  mode: 'work',
  timeLeft: 25 * 60,
  running: false,
  interval: null,

  init() {
    this.workMinutes = settings.pomodoroWork || 25;
    this.restMinutes = settings.pomodoroRest || 5;
    this.timeLeft = this.workMinutes * 60;
    this.updateDisplay();
  },

  start() {
    this.running = true;
    document.getElementById('pomo-display').classList.add('running');
    document.getElementById('pomo-play').innerHTML = '⏸';
    this.interval = setInterval(() => this.tick(), 1000);
  },

  pause() {
    this.running = false;
    document.getElementById('pomo-display').classList.remove('running');
    document.getElementById('pomo-play').innerHTML = '▶';
    clearInterval(this.interval);
  },

  reset() {
    this.pause();
    this.timeLeft = (this.mode === 'work' ? this.workMinutes : this.restMinutes) * 60;
    this.updateDisplay();
  },

  tick() {
    this.timeLeft--;
    if (this.timeLeft <= 0) {
      this.pause();
      this.playSound();
      // Switch mode
      if (this.mode === 'work') {
        this.mode = 'rest';
        toast('☕ Pause ! Tu l\'as mérité');
      } else {
        this.mode = 'work';
        toast('💪 Retour au travail !');
      }
      this.timeLeft = (this.mode === 'work' ? this.workMinutes : this.restMinutes) * 60;
    }
    this.updateDisplay();
  },

  updateDisplay() {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const disp = document.getElementById('pomo-display');
    if (disp) disp.textContent = str;
    const mode = document.getElementById('pomo-mode');
    if (mode) {
      mode.textContent = this.mode === 'work' ? 'Travail' : 'Pause';
      mode.className = 'pomodoro-mode ' + this.mode;
    }
    // Badge
    const badge = document.getElementById('pomo-fab-badge');
    if (badge && this.running) {
      badge.textContent = str;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  },

  setWork(mins) {
    mins = parseInt(mins, 10);
    if (isNaN(mins) || mins < 1 || mins > 120) return;
    this.workMinutes = mins;
    settings.pomodoroWork = mins;
    markDirty();
    if (!this.running && this.mode === 'work') {
      this.timeLeft = mins * 60;
      this.updateDisplay();
    }
  },

  setRest(mins) {
    mins = parseInt(mins, 10);
    if (isNaN(mins) || mins < 1 || mins > 60) return;
    this.restMinutes = mins;
    settings.pomodoroRest = mins;
    markDirty();
    if (!this.running && this.mode === 'rest') {
      this.timeLeft = mins * 60;
      this.updateDisplay();
    }
  },

  playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1046;
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 300);
    } catch (e) {}
  }
};

function togglePomodoroPanel() {
  const panel = document.getElementById('pomo-panel');
  const fab = document.getElementById('pomo-fab');
  const hidden = panel.classList.toggle('hidden');
  fab.classList.toggle('hidden', !hidden);
}

// ═══════════════════════════════════════════════════════════════════
// THEME, ADD SUBJECT, EXPORT, IMPORT, RESET
// ═══════════════════════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  settings.theme = newTheme;
  markDirty();
}

function addSubject() {
  openModal({
    title: 'Nouvelle matière',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', placeholder: 'ex : Mathématiques', required: true },
      { name: 'icon', label: 'Icône (emoji)', type: 'text', placeholder: '📐', value: '📚' },
      { name: 'level', label: 'Niveau', type: 'text', placeholder: '2BAC SVT', value: '2BAC SVT' }
    ],
    onSubmit: (data) => {
      const newSubj = {
        id: uid('subj'),
        name: data.name,
        icon: data.icon || '📚',
        level: data.level || '',
        order: subjects.length,
        domains: [
          {
            id: uid('dom'),
            name: 'Domaine 1',
            weight: 100,
            order: 0,
            modules: []
          }
        ]
      };
      subjects.push(newSubj);
      currentSubject = newSubj.id;
      markDirty();
      render();
      renderSidebar();
    }
  });
}

async function exportData() {
  const data = await Storage.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bac-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✓ Sauvegarde exportée');
}

function importData() {
  document.getElementById('import-input').click();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirmDialog('⚠️ Importer écrasera TOUTES tes données actuelles. Tu veux continuer ?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        await Storage.importAll(data);
        await loadAll();
        render();
        renderSidebar();
        toast('✓ Progression importée');
      } catch (err) {
        toast('❌ Fichier invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
});

async function resetConfirm() {
  if (!confirmDialog('⚠️ Réinitialiser TOUTE ta progression ?\n\nCette action est irréversible. Tu peux d\'abord exporter.')) return;
  if (!confirmDialog('Vraiment sûr ? Toutes tes données (progression, notes, favoris, pages perso, fichiers) vont être effacées.')) return;
  await Storage.resetAll();
  await loadAll();
  render();
  renderSidebar();
  toast('🔄 Tout a été réinitialisé');
}

// ═══════════════════════════════════════════════════════════════════
// MOBILE
// ═══════════════════════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('backdrop').classList.toggle('show');
}

// ═══════════════════════════════════════════════════════════════════
// AUTH & SOCIAL
// ═══════════════════════════════════════════════════════════════════

let currentUser = null;
let _presenceUnsub = null;
let _friendshipUnsub = null;

// ── AUTH INIT ─────────────────────────────────────────────────────
function initAuth() {
  SB.onAuthChange(async (user) => {
    document.getElementById('app-loading').style.display = 'none';
    if (user) {
      await onLogin(user);
    } else {
      showLoginScreen();
    }
  });
}

async function onLogin(user) {
  currentUser = user;

  // Ensure profile row exists
  const profile = await SB.getProfile(user.id);
  if (!profile) {
    await SB.saveProfile(user.id, {
      name:       user.user_metadata?.full_name || user.email,
      email:      user.email.toLowerCase(),
      avatar_url: user.user_metadata?.avatar_url || null,
      visible:    true
    });
  }

  hideLoginScreen();
  updateUserBar();

  // Merge cloud data (cloud wins if it exists)
  try {
    const cloud = await SB.loadUserData(user.id);
    if (cloud && cloud.updated_at) {
      if (cloud.subjects?.length)                     subjects  = cloud.subjects;
      if (Object.keys(cloud.progress || {}).length)   progress  = cloud.progress;
      if (Object.keys(cloud.notes    || {}).length)   notes     = cloud.notes;
      if (Object.keys(cloud.favorites|| {}).length)   favorites = cloud.favorites;
      settings = { ...settings, ...(cloud.settings || {}) };
      await Promise.all([
        Storage.setSubjects(subjects),
        Storage.setProgress(progress),
        Storage.setNotes(notes),
        Storage.setFavorites(favorites),
        Storage.setSettings(settings)
      ]);
    }
  } catch (e) {
    console.warn('Cloud load failed, using local data:', e);
  }

  applyTheme();
  currentSubject = settings.activeSubject || (subjects[0]?.id);

  render();
  renderSidebar();
  updateSaveButton();
  startFriendWatcher();
}

function onLogout() {
  currentUser = null;
  if (_presenceUnsub)  { _presenceUnsub();  _presenceUnsub  = null; }
  if (_friendshipUnsub){ _friendshipUnsub(); _friendshipUnsub = null; }
  showLoginScreen();
  updateUserBar();
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────
function showLoginScreen() {
  document.getElementById('login-screen')?.classList.remove('hidden');
  document.getElementById('app-wrap')?.classList.add('hidden');
}

function hideLoginScreen() {
  document.getElementById('login-screen')?.classList.add('hidden');
  document.getElementById('app-wrap')?.classList.remove('hidden');
}

async function handleSignIn() {
  const btn = document.getElementById('google-signin-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connexion…'; }
  try {
    await SB.signIn();
    // Page redirects to Google — nothing more to do here
  } catch (e) {
    toast('❌ ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Continuer avec Google'; }
  }
}

async function handleSignOut() {
  if (!confirmDialog('Se déconnecter ?')) return;
  try {
    await SB.signOut();
    onLogout();
  } catch (e) {
    toast('❌ ' + e.message);
  }
}

// ── USER BAR ──────────────────────────────────────────────────────
function updateUserBar() {
  const bar = document.getElementById('user-bar');
  if (!bar) return;
  if (!currentUser) { bar.innerHTML = ''; return; }
  const meta   = currentUser.user_metadata || {};
  const name   = meta.full_name || currentUser.email;
  const avatar = meta.avatar_url;
  bar.innerHTML = `
    <div class="user-bar-inner">
      ${avatar
        ? `<img src="${escapeHtml(avatar)}" class="user-avatar" alt="">`
        : `<div class="user-avatar-fallback">${escapeHtml((name[0] || '?').toUpperCase())}</div>`}
      <div class="user-info">
        <div class="user-name">${escapeHtml(name)}</div>
        <div class="user-sync-status" id="sync-status">☁️ Connecté</div>
      </div>
      <button class="logout-btn" onclick="handleSignOut()" title="Déconnexion">⏏</button>
    </div>
  `;
}

function setSyncStatus(msg) {
  const el = document.getElementById('sync-status');
  if (el) el.textContent = msg;
}

// ── FRIENDS WATCHER ───────────────────────────────────────────────
function startFriendWatcher() {
  if (!currentUser) return;
  if (_friendshipUnsub) _friendshipUnsub();
  _friendshipUnsub = SB.watchFriendships(currentUser.id, async () => {
    updateFriendsBadge();
    refreshPresenceWatcher();
    if (document.getElementById('friends-page-wrap')) showFriendsPage();
  });
  refreshPresenceWatcher();
  updateFriendsBadge();
}

async function updateFriendsBadge() {
  if (!currentUser) return;
  try {
    const pending = await SB.getPendingRequests(currentUser.id);
    const badge = document.getElementById('friends-badge');
    if (!badge) return;
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {}
}

async function refreshPresenceWatcher() {
  if (!currentUser) return;
  if (_presenceUnsub) { _presenceUnsub(); _presenceUnsub = null; }
  const friendships = await SB.getFriendships(currentUser.id);
  const friendIds = friendships.map(f => f.friendId);
  if (friendIds.length === 0) return;
  _presenceUnsub = SB.watchPresence(friendIds, (presenceMap) => {
    checkStudyNotification(presenceMap);
    if (document.getElementById('friends-page-wrap')) {
      renderFriendsPresence(presenceMap, friendIds);
    }
  });
}

// ── STUDY NOTIFICATION ────────────────────────────────────────────
function checkStudyNotification(presenceMap) {
  if (!currentSubject) return;
  const subj = getSubject(currentSubject);
  if (!subj) return;
  for (const p of Object.values(presenceMap)) {
    if (p.online && p.visible && p.subject_id === currentSubject) {
      showStudyNotif(p.subject_name || subj.name);
      return;
    }
  }
  hideStudyNotif();
}

function showStudyNotif(subjectName) {
  const banner = document.getElementById('study-notif');
  if (!banner) return;
  document.getElementById('study-notif-text').textContent =
    `🎓 Un ami révise aussi "${subjectName}" en ce moment !`;
  banner.classList.remove('hidden');
}

function hideStudyNotif() {
  document.getElementById('study-notif')?.classList.add('hidden');
}

function dismissNotif() { hideStudyNotif(); }

// ── FRIENDS PAGE ──────────────────────────────────────────────────
async function showFriendsPage() {
  showFavoritesOnly = false;
  renderSidebar();
  document.getElementById('content').innerHTML = `
    <div id="friends-page-wrap">
      <div class="page-header">
        <div class="page-title-group">
          <div class="page-eyebrow">Social</div>
          <h1 class="page-title"><span class="accent">Mes</span> amis</h1>
          <p class="page-subtitle">Révise avec tes amis et vois qui travaille quoi en temps réel.</p>
        </div>
      </div>
      <div id="friends-content" style="padding:0 1.5rem 2rem;">
        <div style="color:var(--muted);padding:2rem 0;">Chargement…</div>
      </div>
    </div>
  `;

  if (!currentUser) {
    document.getElementById('friends-content').innerHTML =
      `<div style="color:var(--muted);padding:2rem 0;">Connecte-toi pour accéder aux fonctionnalités sociales.</div>`;
    return;
  }

  try {
    const [friendships, pending, sent] = await Promise.all([
      SB.getFriendships(currentUser.id),
      SB.getPendingRequests(currentUser.id),
      SB.getSentRequests(currentUser.id)
    ]);

    const friendIds = friendships.map(f => f.friendId);
    const friendProfiles = friendIds.length > 0 ? await SB.getProfiles(friendIds) : [];

    let html = '';

    // ─ Add friend ─
    html += `
      <div class="friends-section">
        <div class="friends-section-title">Ajouter un ami</div>
        <div class="add-friend-row">
          <input type="email" id="add-friend-email" class="form-input"
                 placeholder="Email de ton ami…" onkeydown="if(event.key==='Enter') addFriendByEmail()">
          <button class="btn primary" onclick="addFriendByEmail()">Envoyer</button>
        </div>
      </div>
    `;

    // ─ Pending incoming ─
    if (pending.length > 0) {
      html += `<div class="friends-section"><div class="friends-section-title">Demandes reçues (${pending.length})</div>`;
      pending.forEach(req => {
        const n = req.profile?.name || req.profile?.email || '?';
        html += `
          <div class="friend-card">
            <div class="friend-avatar-wrap">
              <div class="friend-avatar">${escapeHtml(n[0].toUpperCase())}</div>
            </div>
            <div class="friend-info">
              <div class="friend-name">${escapeHtml(n)}</div>
              <div class="friend-studying">${escapeHtml(req.profile?.email || '')}</div>
            </div>
            <div class="friend-actions">
              <button class="btn btn-sm primary" onclick="acceptRequest('${req.id}')">✓ Accepter</button>
              <button class="btn btn-sm danger"  onclick="rejectRequest('${req.id}')">✕</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    // ─ Sent pending ─
    if (sent.length > 0) {
      html += `<div class="friends-section"><div class="friends-section-title">Demandes envoyées</div>`;
      sent.forEach(req => {
        const n = req.profile?.name || req.profile?.email || '?';
        html += `
          <div class="friend-card" style="opacity:0.7;">
            <div class="friend-avatar-wrap"><div class="friend-avatar">${escapeHtml(n[0].toUpperCase())}</div></div>
            <div class="friend-info">
              <div class="friend-name">${escapeHtml(n)}</div>
              <div class="friend-studying">En attente de réponse</div>
            </div>
            <button class="btn btn-sm" onclick="rejectRequest('${req.id}')">Annuler</button>
          </div>
        `;
      });
      html += '</div>';
    }

    // ─ Friends ─
    html += `<div class="friends-section"><div class="friends-section-title">Amis (${friendProfiles.length})</div>`;
    if (friendProfiles.length === 0) {
      html += `<div style="color:var(--muted);font-size:13px;padding:0.5rem 0;">Aucun ami pour le moment — envoie une demande !</div>`;
    }
    friendProfiles.forEach(fp => {
      const friendship = friendships.find(f => f.friendId === fp.id);
      html += `
        <div class="friend-card" id="friend-${fp.id}">
          <div class="friend-avatar-wrap">
            ${fp.avatar_url
              ? `<img src="${escapeHtml(fp.avatar_url)}" class="friend-avatar-img" alt="">`
              : `<div class="friend-avatar">${escapeHtml((fp.name || fp.email || '?')[0].toUpperCase())}</div>`}
            <div class="friend-status-dot" id="dot-${fp.id}"></div>
          </div>
          <div class="friend-info">
            <div class="friend-name">${escapeHtml(fp.name || fp.email)}</div>
            <div class="friend-studying" id="studying-${fp.id}">Hors ligne</div>
          </div>
          <button class="btn btn-sm" onclick="removeFriend('${fp.id}', '${escapeHtml(fp.name || fp.email || '?')}')" title="Supprimer">✕</button>
        </div>
      `;
    });
    html += '</div>';

    document.getElementById('friends-content').innerHTML = html;

    // Live presence for this page
    if (friendIds.length > 0) {
      if (_presenceUnsub) { _presenceUnsub(); _presenceUnsub = null; }
      _presenceUnsub = SB.watchPresence(friendIds, (map) => {
        renderFriendsPresence(map, friendIds);
        checkStudyNotification(map);
      });
    }
  } catch (e) {
    document.getElementById('friends-content').innerHTML =
      `<div style="color:var(--muted);padding:2rem 0;">Erreur : ${escapeHtml(e.message)}</div>`;
  }
}

function renderFriendsPresence(presenceMap, friendIds) {
  friendIds.forEach(uid => {
    const p = presenceMap[uid];
    const dot     = document.getElementById('dot-' + uid);
    const studying = document.getElementById('studying-' + uid);
    if (!dot || !studying) return;
    if (p?.online) {
      dot.classList.add('online');
      studying.textContent = p.subject_name ? `📖 ${p.subject_name}` : 'En ligne';
    } else {
      dot.classList.remove('online');
      studying.textContent = 'Hors ligne';
    }
  });
}

async function addFriendByEmail() {
  const input = document.getElementById('add-friend-email');
  const email = input?.value?.trim();
  if (!email) { toast('Saisis un email'); return; }
  if (!currentUser) return;
  try {
    const found = await SB.findUserByEmail(email);
    if (!found) { toast('❌ Aucun utilisateur avec cet email'); return; }
    if (found.id === currentUser.id) { toast('❌ C\'est ton propre compte !'); return; }
    await SB.sendFriendRequest(currentUser.id, found.id);
    if (input) input.value = '';
    toast('✓ Demande envoyée à ' + (found.name || email));
    showFriendsPage();
  } catch (e) {
    toast('❌ ' + e.message);
  }
}

async function acceptRequest(requestId) {
  try {
    await SB.acceptFriendRequest(requestId);
    toast('✓ Ami ajouté !');
    showFriendsPage();
    refreshPresenceWatcher();
    updateFriendsBadge();
  } catch (e) { toast('❌ ' + e.message); }
}

async function rejectRequest(requestId) {
  try {
    await SB.rejectFriendRequest(requestId);
    toast('Demande annulée');
    showFriendsPage();
    updateFriendsBadge();
  } catch (e) { toast('❌ ' + e.message); }
}

async function removeFriend(friendId, friendName) {
  if (!confirmDialog(`Supprimer ${friendName} de tes amis ?`)) return;
  try {
    await SB.removeFriend(currentUser.id, friendId);
    toast('✓ Ami supprimé');
    showFriendsPage();
    refreshPresenceWatcher();
  } catch (e) { toast('❌ ' + e.message); }
}

// ═══════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════
(async () => {
  await openDB();
  await loadAll();   // load from IndexedDB
  Pomodoro.init();
  initAuth();        // Supabase checks session → calls onLogin or showLoginScreen

  window.addEventListener('beforeunload', (e) => {
    if (currentUser) SB.setOffline(currentUser.id).catch(() => {});
    if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; return ''; }
  });
})();
