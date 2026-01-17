import attendanceStore from './attendanceStore.js';

let _lastFingerprint = '';

export function renderRecentStudents(limit = 8) {
  const tbody = document.getElementById('recent-students-tbody');
  if (!tbody) return;
  const rows = attendanceStore.getRecent(limit);
  const parts = rows.map(r => `${r.id}|${r.student_fullname || ''}|${r.time_in || r.timestamp || ''}`);
  const fp = parts.join('\n');
  if (fp === _lastFingerprint) return;
  _lastFingerprint = fp;

  const html = rows.map(r => {
    const fullname = r.student_fullname || r.student_username || '';
    const section = r.student_section || '';
    const ts = r.time_in || r.timestamp || '';
    const timeDisplay = ts ? new Date(ts).toLocaleString() : '';
    return `<tr data-id="${r.id}"><td>${fullname}</td><td>${timeDisplay}</td><td>${section}</td></tr>`;
  }).join('');
  tbody.innerHTML = html;
}
