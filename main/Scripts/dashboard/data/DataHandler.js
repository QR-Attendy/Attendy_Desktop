
// Attendance table actions: download, delete, apply timeout, select-all
(function () {
  function getSelectedIds() {
    const checked = Array.from(document.querySelectorAll('#attendance-tbody .row-select:checked'));
    return checked.map(cb => Number(cb.getAttribute('data-id'))).filter(Boolean);
  }

  function collectRowsData(ids) {
    const rows = [];
    const trs = ids && ids.length ? Array.from(document.querySelectorAll('#attendance-tbody tr')).filter(tr => ids.includes(Number(tr.getAttribute('data-id')))) : Array.from(document.querySelectorAll('#attendance-tbody tr'));
    for (const tr of trs) {
      const id = Number(tr.getAttribute('data-id')) || '';
      const fullname = (tr.children[2] && tr.children[2].textContent || '').trim();
      // times cell contains a select with two options
      let timeIn = '';
      let timeOut = '';
      try {
        const sel = tr.querySelector('.times-select');
        if (sel) {
          const opt0 = sel.options[0] && sel.options[0].textContent || '';
          const opt1 = sel.options[1] && sel.options[1].textContent || '';
          timeIn = opt0.replace(/^\s*Time In:\s*/i, '').trim();
          timeOut = opt1.replace(/^\s*Time Out:\s*/i, '').trim();
        }
      } catch (e) { }
      const statusEl = tr.querySelector('.status-select');
      const status = statusEl ? statusEl.value : (tr.children[4] && tr.children[4].textContent || '').trim();
      rows.push({ id, fullname, timeIn, timeOut, status });
    }
    return rows;
  }

  async function downloadAsXlsx(data, filename = 'attendance.xlsx') {
    if (typeof XLSX === 'undefined') {
      console.error('XLSX library not found');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('download-sheet');
    const deleteBtn = document.getElementById('delete');
    const applyTimeoutBtn = document.getElementById('apply-timeout-btn');
    const selectAll = document.getElementById('select-all-rows');

    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const checked = !!selectAll.checked;
        const boxes = document.querySelectorAll('#attendance-tbody .row-select');
        boxes.forEach(b => { b.checked = checked; });
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        const ids = getSelectedIds();
        const data = collectRowsData(ids);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = ids.length ? `attendance-selected-${ts}.xlsx` : `attendance-all-${ts}.xlsx`;
        await downloadAsXlsx(data, filename);
      });
    }

    // disable download button when table is empty
    function updateDownloadState() {
      const tbody = document.getElementById('attendance-tbody');
      if (!downloadBtn) return;
      const hasRows = tbody && tbody.querySelectorAll('tr').length > 0;
      downloadBtn.disabled = !hasRows;
    }

    // watch for DOM changes in the attendance tbody so the button state stays accurate
    const tbodyEl = document.getElementById('attendance-tbody');
    if (tbodyEl) {
      const mo = new MutationObserver(() => updateDownloadState());
      mo.observe(tbodyEl, { childList: true, subtree: false });
    }
    // initial state
    updateDownloadState();

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const ids = getSelectedIds();
        if (!ids.length) {
          alert('Select rows to delete');
          return;
        }
        if (!confirm(`Delete ${ids.length} selected row(s)? This cannot be undone.`)) return;
        try {
          const mod = await import('./dashboard/data/attendanceStore.js');
          const store = mod.default;
          for (const id of ids) {
            await store.deleteRow(id);
          }
        } catch (e) {
          console.error('delete action failed', e);
          alert('Delete failed');
        }
      });
    }

    if (applyTimeoutBtn) {
      applyTimeoutBtn.addEventListener('click', async () => {
        const ids = getSelectedIds();
        if (!ids.length) {
          alert('Select rows to apply timeout');
          return;
        }
        const timeInput = document.getElementById('timeout-time');
        if (!timeInput || !timeInput.value) {
          alert('Please select a time first');
          return;
        }
        // build ISO string for today with selected hh:mm
        const [hh, mm] = timeInput.value.split(':').map(Number);
        const d = new Date();
        d.setHours(hh, mm, 0, 0);
        const iso = d.toISOString();
        try {
          if (!window.attendyAPI || typeof window.attendyAPI.setTimeoutForRows !== 'function') {
            console.error('attendyAPI.setTimeoutForRows not available');
            alert('Timeout API not available');
            return;
          }
          await window.attendyAPI.setTimeoutForRows(ids, iso);
          // refresh store if available
          try {
            const mod = await import('./dashboard/data/attendanceStore.js');
            const store = mod.default;
            await store.refreshAttendance();
          } catch (e) { /* ignore */ }
        } catch (e) {
          console.error('apply timeout failed', e);
          alert('Failed to apply timeout');
        }
      });
    }
  });
})();


