import attendanceStore from './attendanceStore.js';

let _lastFingerprint = '';

export function renderRecentStudents(section = null, limit = 10) {
  const tbody = document.getElementById('recent-students-tbody');
  if (!tbody) return;
  // request a very large recent window so we effectively show all recent rows
  let rows = attendanceStore.getRecent ? attendanceStore.getRecent(1000000) : [];
  if (section && section !== 'all') {
    const secLower = String(section || '').toLowerCase();
    rows = rows.filter(r => {
      const sec = (r.student_section || r.section || r.section_name || '').toString().trim().toLowerCase();
      return sec === secLower;
    });
  }
  const parts = rows.map(r => `${r.id}|${r.student_fullname || ''}|${r.time_in || r.timestamp || ''}`);
  const fp = parts.join('\n');
  if (fp === _lastFingerprint) return;
  _lastFingerprint = fp;
  function formatDateTimeWithSeconds(ts) {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      // date part in MM/DD/YYYY
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      // time part HH:MM:SSAM/PM with no space before AM/PM
      let hh = d.getHours();
      const ampm = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      const hStr = String(hh).padStart(2, '0');
      const mStr = String(d.getMinutes()).padStart(2, '0');
      const sStr = String(d.getSeconds()).padStart(2, '0');
      return `${mm}/${dd}/${yyyy}, ${hStr}:${mStr}:${sStr}${ampm}`;
    } catch (e) { return ''; }
  }

  const html = rows.map(r => {
    const fullname = r.student_fullname || r.student_username || '';
    const section = r.student_section || '';
    const ts = r.time_in || r.timestamp || '';
    const timeDisplay = ts ? formatDateTimeWithSeconds(ts) : '';
    return `<tr data-id="${r.id}"><td>${fullname}</td><td>${timeDisplay}</td><td>${section}</td></tr>`;
  }).join('');
  tbody.innerHTML = html;
}

export default { renderRecentStudents };
