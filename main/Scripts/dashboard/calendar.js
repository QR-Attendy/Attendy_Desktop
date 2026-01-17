document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('calendar-month-label');
  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');
  if (!grid || !label) return;

  const now = new Date();
  let displayYear = now.getFullYear();
  let displayMonth = now.getMonth(); // 0-11

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function updateLabel() {
    const d = new Date(displayYear, displayMonth, 1);
    const fmt = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    label.textContent = fmt;
  }

  function clearGrid() { grid.innerHTML = ''; }

  function renderWeekdays() {
    for (let i = 0; i < 7; i++) {
      const w = document.createElement('div');
      w.className = 'weekday';
      w.textContent = weekdayNames[i];
      grid.appendChild(w);
    }
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function renderCalendar(year, month) {
    clearGrid();
    renderWeekdays();
    updateLabel();

    const firstDay = new Date(year, month, 1).getDay(); // 0-6
    const totalDays = daysInMonth(year, month);

    // previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevDays = daysInMonth(prevYear, prevMonth);

    // we'll render a 6x7 grid of day cells (42 days)
    const totalCells = 42;
    let dayNum = 1;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';

      // weekday header offset: firstDay cells from prev month
      const dayIndex = i - firstDay + 1;
      let cellDate = null;
      if (i < firstDay) {
        // previous month
        const d = prevDays - (firstDay - 1 - i);
        cell.classList.add('other-month');
        const num = document.createElement('div');
        num.className = 'day-number';
        num.textContent = d;
        cell.appendChild(num);
        cellDate = new Date(prevYear, prevMonth, d);
      } else if (dayNum <= totalDays) {
        // current month
        const num = document.createElement('div');
        num.className = 'day-number';
        num.textContent = dayNum;
        cell.appendChild(num);
        cellDate = new Date(year, month, dayNum);
        dayNum++;
      } else {
        // next month
        const d = dayNum - totalDays;
        cell.classList.add('other-month');
        const num = document.createElement('div');
        num.className = 'day-number';
        num.textContent = d;
        cell.appendChild(num);
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        cellDate = new Date(nextYear, nextMonth, d);
        dayNum++;
      }

      // mark today
      const today = new Date();
      if (cellDate && cellDate.toDateString() === today.toDateString()) {
        cell.classList.add('today');
      }

      // example mark area (could be used to show attendance dots)
      const mark = document.createElement('div');
      mark.className = 'day-mark';
      // placeholder: no attendance data yet
      mark.textContent = '';
      cell.appendChild(mark);

      // attach date data and click handler
      if (cellDate) {
        // Build a local YYYY-MM-DD key to avoid UTC offset issues from toISOString()
        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const dd = String(cellDate.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${dd}`;
        cell.dataset.date = iso;
        cell.addEventListener('click', () => {
          // simple selection behavior
          document.querySelectorAll('.day-cell.selected').forEach(n => n.classList.remove('selected'));
          cell.classList.add('selected');
          // dispatch custom event with selected date
          window.dispatchEvent(new CustomEvent('calendar-date-selected', { detail: { date: iso } }));
          console.log('calendar selected', iso);
        });
      }

      grid.appendChild(cell);
    }
  }

  prevBtn && prevBtn.addEventListener('click', () => {
    displayMonth--;
    if (displayMonth < 0) { displayMonth = 11; displayYear--; }
    renderCalendar(displayYear, displayMonth);
  });
  nextBtn && nextBtn.addEventListener('click', () => {
    displayMonth++;
    if (displayMonth > 11) { displayMonth = 0; displayYear++; }
    renderCalendar(displayYear, displayMonth);
  });

  // initial render
  renderCalendar(displayYear, displayMonth);

  // expose simple API
  window.QRAttendyCalendar = {
    goTo(year, month) { displayYear = year; displayMonth = month; renderCalendar(year, month); },
    refresh() { renderCalendar(displayYear, displayMonth); }
  };
});
