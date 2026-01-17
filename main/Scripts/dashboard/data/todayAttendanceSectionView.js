import attendanceStore from './attendanceStore.js';

let _lastFingerprint = '';

export function renderAttendanceSections() {
  const tbody = document.getElementById('attendance-section-tbody');
  if (!tbody) return;
  const rows = attendanceStore.getTodayRows();

  // aggregate by section
  const bySection = new Map();
  for (const r of rows) {
    // Accept multiple possible field names coming from backend or QR payload
    const section = (r.student_section || r.section || r.section_name || '').toString().trim() || 'Unknown';
    if (!bySection.has(section)) bySection.set(section, { present: 0, absent: 0, late: 0, total: 0 });
    const st = (r.status || '').toString().toLowerCase();
    const cur = bySection.get(section);
    cur.total += 1;
    if (st === 'present') cur.present += 1;
    else if (st === 'late') cur.late += 1;
    else if (st === 'absent') cur.absent += 1;
    else {
      // unknown statuses not counted
    }
  }

  const parts = [];
  const list = Array.from(bySection.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [section, stats] of list) parts.push(`${section}|${stats.present}|${stats.absent}|${stats.late}|${stats.total}`);
  const fp = parts.join('\n');
  if (fp === _lastFingerprint) return;
  _lastFingerprint = fp;

  const html = list.map(([section, stats]) => `
    <tr data-section="${section}">
      <td>${section}</td>
      <td>${stats.present}</td>
      <td>${stats.absent}</td>
      <td>${stats.late}</td>
    </tr>`).join('');

  tbody.innerHTML = html;
}

export default { renderAttendanceSections };
