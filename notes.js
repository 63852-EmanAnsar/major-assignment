// ================= STUDY NOTES MANAGER =================
// Uses the shared helpers defined in index.html: getNotes(), saveNotes(), updateStats().
// Everything is kept inside this function so no names clash with teammates' code.
// Only renderNotes() is made global, because index.html calls it on start-up.
(function () {
  const form       = document.getElementById('noteForm');
  const titleEl    = document.getElementById('noteTitle');
  const subjectEl  = document.getElementById('noteSubject');
  const contentEl  = document.getElementById('noteContent');
  const msgEl      = document.getElementById('noteMsg');
  const submitBtn  = document.getElementById('noteSubmit');
  const cancelBtn  = document.getElementById('noteCancel');
  const searchEl   = document.getElementById('noteSearch');
  const filterEl   = document.getElementById('noteFilter');
  const subjectList = document.getElementById('noteSubjectList');
  const countEl    = document.getElementById('notesCount');
  const grid       = document.getElementById('notesGrid');

  const PREVIEW_LENGTH = 140;   // characters shown on each card
  let editingId = null;         // id of the note being edited (null = creating a new note)
  let msgTimer = null;

  // ---------- Helpers ----------
  // Turns < > & " ' into safe text so typed HTML is shown, not run
  function escapeHTML(text) {
    return String(text ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function subjectOf(note) {
    return String(note.subject || '').trim() || 'General';
  }

  function makePreview(text) {
    const clean = String(text || '').trim();
    return clean.length > PREVIEW_LENGTH ? clean.slice(0, PREVIEW_LENGTH).trimEnd() + '…' : clean;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    if (!ts || isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function showMsg(text, type) {
    clearTimeout(msgTimer);
    msgEl.textContent = text;
    msgEl.className = 'notes-msg' + (type ? ' ' + type : '');
    if (type === 'ok') msgTimer = setTimeout(() => showMsg(''), 2500);
  }

  // Unique subject names (case-insensitive), sorted A–Z
  function getSubjects(notes) {
    const map = new Map();
    notes.forEach(n => {
      const s = subjectOf(n);
      if (!map.has(s.toLowerCase())) map.set(s.toLowerCase(), s);
    });
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }

  // "physics" becomes "Physics" if a "Physics" subject already exists
  function normalizeSubject(raw, notes) {
    const s = raw.trim().replace(/\s+/g, ' ');
    if (!s) return 'General';
    return getSubjects(notes).find(x => x.toLowerCase() === s.toLowerCase()) || s;
  }

  function refreshSubjectOptions(subjects) {
    const current = filterEl.value;
    filterEl.innerHTML = '';
    filterEl.add(new Option('All Subjects', ''));
    subjects.forEach(s => filterEl.add(new Option(s, s)));
    filterEl.value = subjects.includes(current) ? current : '';

    subjectList.innerHTML = '';
    subjects.forEach(s => subjectList.appendChild(new Option(s, s)));
  }

  function resetForm() {
    form.reset();
    editingId = null;
    submitBtn.textContent = 'Save Note';
    cancelBtn.hidden = true;
    showMsg('');
  }

  // ---------- Display ----------
  function renderNotes() {
    const notes = getNotes();
    refreshSubjectOptions(getSubjects(notes));

    if (!notes.length) {
      countEl.textContent = '';
      grid.innerHTML = '<div class="empty">No notes yet. Create your first note above!</div>';
      return;
    }

    const query = searchEl.value.trim().toLowerCase();
    const subject = filterEl.value.toLowerCase();

    const visible = notes.filter(n => {
      const matchesSubject = !subject || subjectOf(n).toLowerCase() === subject;
      const matchesSearch = !query ||
        String(n.title || '').toLowerCase().includes(query) ||
        String(n.content || '').toLowerCase().includes(query);
      return matchesSubject && matchesSearch;
    });

    countEl.textContent = visible.length === notes.length
      ? `${notes.length} note${notes.length === 1 ? '' : 's'}`
      : `Showing ${visible.length} of ${notes.length} notes`;

    if (!visible.length) {
      grid.innerHTML = '<div class="empty">No notes match your search or filter.</div>';
      return;
    }

    grid.innerHTML = visible.map(n => {
      const id = escapeHTML(n.id);
      const date = formatDate(n.updatedAt || n.createdAt || n.id);
      const dateLabel = date ? `<div class="note-date">${n.updatedAt ? 'Updated' : 'Created'} ${date}</div>` : '';
      return `
      <article class="note-card${n.id === editingId ? ' is-editing' : ''}">
        <div class="note-subject">${escapeHTML(subjectOf(n))}</div>
        <div class="note-title">${escapeHTML(n.title)}</div>
        <div class="note-content">${escapeHTML(makePreview(n.content))}</div>
        ${dateLabel}
        <div class="note-actions">
          <button type="button" class="note-btn" data-action="edit" data-id="${id}">Edit</button>
          <button type="button" class="note-btn danger" data-action="delete" data-id="${id}">Delete</button>
        </div>
      </article>`;
    }).join('');
  }

  // ---------- Create / Update ----------
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    // Don't save empty notes
    if (!title) { showMsg('Please enter a title.', 'error'); titleEl.focus(); return; }
    if (!content) { showMsg('Please write some content for this note.', 'error'); contentEl.focus(); return; }

    const notes = getNotes();
    const now = Date.now();
    const subject = normalizeSubject(subjectEl.value, notes.filter(n => n.id !== editingId));

    if (editingId !== null) {
      const index = notes.findIndex(n => n.id === editingId);
      if (index === -1) {
        resetForm();
        showMsg('That note no longer exists.', 'error');
        renderNotes();
        return;
      }
      notes[index] = { ...notes[index], title, subject, content, updatedAt: now };
      saveNotes(notes);
      resetForm();
      showMsg('Note updated ✓', 'ok');
    } else {
      let id = now;
      while (notes.some(n => n.id === id)) id++;   // keep ids unique
      notes.unshift({ id, title, subject, content, createdAt: now });
      saveNotes(notes);
      resetForm();
      showMsg('Note saved ✓', 'ok');
    }

    renderNotes();
    updateStats();   // keeps the dashboard "Notes Saved" count correct
  });

  // ---------- Edit ----------
  function startEdit(id) {
    const note = getNotes().find(n => n.id === id);
    if (!note) return;
    editingId = id;
    titleEl.value = note.title || '';
    subjectEl.value = subjectOf(note);
    contentEl.value = note.content || '';
    submitBtn.textContent = 'Update Note';
    cancelBtn.hidden = false;
    showMsg(`Editing "${note.title}"`, 'info');   // textContent, so this is safe
    renderNotes();                                // highlights the card being edited
    window.scrollTo({ top: 0, behavior: 'smooth' });
    titleEl.focus({ preventScroll: true });
  }

  cancelBtn.addEventListener('click', () => { resetForm(); renderNotes(); });

  // ---------- Delete ----------
  function deleteNote(id) {
    const note = getNotes().find(n => n.id === id);
    if (!note) return;
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    saveNotes(getNotes().filter(n => n.id !== id));
    if (editingId === id) resetForm();
    renderNotes();
    updateStats();
  }

  // One click listener for all Edit/Delete buttons on the cards
  grid.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') startEdit(id);
    if (btn.dataset.action === 'delete') deleteNote(id);
  });

  // ---------- Search & Filter ----------
  searchEl.addEventListener('input', renderNotes);
  filterEl.addEventListener('change', renderNotes);

  // Clear the error message once the user starts typing again
  [titleEl, contentEl].forEach(el => el.addEventListener('input', () => {
    if (msgEl.classList.contains('error')) showMsg('');
  }));

  // index.html calls renderNotes() on start-up, so make it available globally
  window.renderNotes = renderNotes;
})();