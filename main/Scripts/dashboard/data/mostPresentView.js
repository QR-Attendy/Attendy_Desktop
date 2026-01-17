import attendanceStore from './attendanceStore.js';

let _lastFingerprint = '';

export function renderMostPresent(limit = 10) {
  const tbody = document.getElementById('most-present-tbody');
  if (!tbody) return;
  const list = attendanceStore.getMostPresent(limit);
  const parts = list.map(it => `${it.key}|${it.days}`);
  const fp = parts.join('\n');
  if (fp === _lastFingerprint) return;
  _lastFingerprint = fp;

  const html = list.map(item => `<tr data-student-key="${item.key}"><td>${item.name}</td><td>${item.days}</td></tr>`).join('');
  tbody.innerHTML = html;
}
