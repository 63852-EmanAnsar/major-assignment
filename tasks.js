// ============================================================
// StudyFlow — Daily Study Checklist (tasks.js)
// Uses user, getTasks(), saveTasks() and updateStats() from index.html
// ============================================================

let currentFilter = 'all'; // which tasks to show: 'all', 'pending' or 'completed'
let editingId = null;      // id of the task being edited (null means we are adding)

// Stops HTML tags typed in a task from breaking the page
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Turns "2026-11-04" into "4 Nov 2026"
function formatDate(dateStr) {
  if (!dateStr) return 'No due date';
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------- ADD or UPDATE a task ----------
document.getElementById('taskForm').onsubmit = (e) => {
  e.preventDefault();

  const title = document.getElementById('taskTitle').value.trim();
  const subject = document.getElementById('taskSubject').value.trim();
  const dueDate = document.getElementById('taskDate').value;
  const priority = document.getElementById('taskPriority').value;
  const msg = document.getElementById('taskMsg');

  // Do not allow empty tasks
  if (!title || !subject || !dueDate) {
    msg.textContent = 'Please fill in the title, subject and due date.';
    return;
  }

  let tasks = getTasks();

  if (editingId === null) {
    // Add a new task
    tasks.push({ id: Date.now(), title, subject, dueDate, priority, done: false });
  } else {
    // Update the task being edited (keep its done status)
    tasks = tasks.map(t => t.id === editingId ? { ...t, title, subject, dueDate, priority } : t);
  }

  saveTasks(tasks);
  cancelEdit();   // clear the form and go back to "Add" mode
  renderTasks();
};

// ---------- EDIT a task (fills the form with its details) ----------
function editTask(id) {
  const task = getTasks().find(t => t.id === id);
  if (!task) return;

  editingId = id;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskSubject').value = task.subject;
  document.getElementById('taskDate').value = task.dueDate || '';
  document.getElementById('taskPriority').value = task.priority;

  document.getElementById('taskFormTitle').textContent = 'Edit Task';
  document.getElementById('taskSubmitBtn').textContent = 'Update Task';
  document.getElementById('taskCancelBtn').hidden = false;
  document.getElementById('taskMsg').textContent = '';
  document.getElementById('taskTitle').focus();
}

// ---------- CANCEL editing / reset the form ----------
function cancelEdit() {
  editingId = null;
  document.getElementById('taskForm').reset();
  document.getElementById('taskFormTitle').textContent = 'Add a New Task';
  document.getElementById('taskSubmitBtn').textContent = 'Add Task';
  document.getElementById('taskCancelBtn').hidden = true;
  document.getElementById('taskMsg').textContent = '';
}

// ---------- COMPLETE / mark PENDING again ----------
function toggleTask(id) {
  const tasks = getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks(tasks);
  renderTasks();
}

// ---------- DELETE a task ----------
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  saveTasks(getTasks().filter(t => t.id !== id));
  if (editingId === id) cancelEdit();
  renderTasks();
}

// ---------- FILTERS: All / Pending / Completed ----------
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ---------- DAILY PROGRESS ----------
function updateTaskProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('tpTotal').textContent = total;
  document.getElementById('tpCompleted').textContent = completed;
  document.getElementById('tpPending').textContent = pending;
  document.getElementById('tpPercent').textContent = percent + '%';
  document.getElementById('tpFill').style.width = percent + '%';
}

// ---------- SHOW the task list ----------
function renderTasks() {
  const tasks = getTasks();
  updateTaskProgress(tasks);
  updateStats(); // keeps the Dashboard numbers up to date

  // Apply the selected filter
  let shown = tasks;
  if (currentFilter === 'pending') shown = tasks.filter(t => !t.done);
  if (currentFilter === 'completed') shown = tasks.filter(t => t.done);

  const list = document.getElementById('taskList');

  if (shown.length === 0) {
    const messages = {
      all: 'No tasks yet. Add one above!',
      pending: 'No pending tasks. Great job! 🎉',
      completed: 'No completed tasks yet.'
    };
    list.innerHTML = `<div class="empty">${messages[currentFilter]}</div>`;
    return;
  }

  list.innerHTML = shown.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <input type="checkbox" class="t-checkbox" ${t.done ? 'checked' : ''}
             onchange="toggleTask(${t.id})" title="Mark as completed / pending" />
      <div class="t-body">
        <div class="t-title">${escapeHTML(t.title)}</div>
        <div class="t-meta">${escapeHTML(t.subject)} · Due: ${formatDate(t.dueDate)}</div>
      </div>
      <span class="badge ${t.priority}">${t.priority}</span>
      <div class="t-actions">
        <button class="t-edit" onclick="editTask(${t.id})" title="Edit task">✎</button>
        <button class="t-del" onclick="deleteTask(${t.id})" title="Delete task">✕</button>
      </div>
    </div>`).join('');
}

// Show tasks when the page loads
renderTasks();