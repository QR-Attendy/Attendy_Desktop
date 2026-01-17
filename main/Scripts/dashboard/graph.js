document.addEventListener('DOMContentLoaded', () => {
  // ------------------ Pie / Donut chart ------------------
  const pieCanvas = document.getElementById('pie-attendance-graph');
  const dpr = window.devicePixelRatio || 1;

  const pieSize = 220;
  const pieLabels = ['Present', 'Late', 'Excused', 'Absent'];
  const pieColors = ['#2ecc71', '#ff7f0e', '#f1c40f', '#e74c3c'];
  const pieValues = [0, 0, 0, 0];

  if (pieCanvas) {
    const ctx = pieCanvas.getContext('2d');
    pieCanvas.width = pieSize * dpr;
    pieCanvas.height = pieSize * dpr;
    pieCanvas.style.width = pieSize + 'px';
    pieCanvas.style.height = pieSize + 'px';
    ctx.scale(dpr, dpr);

    function drawDonut(values) {
      const total = values.reduce((s, v) => s + v, 0);
      const center = pieSize / 2;
      const radius = 90;

      // clear
      ctx.clearRect(0, 0, pieSize, pieSize);

      if (!total) {
        // draw empty ring
        ctx.beginPath();
        ctx.fillStyle = '#f4f4f4';
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        let start = -Math.PI / 2;
        for (let i = 0; i < values.length; i++) {
          const slice = values[i];
          const angle = (slice / total) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.arc(center, center, radius, start, start + angle);
          ctx.closePath();
          ctx.fillStyle = pieColors[i % pieColors.length];
          ctx.fill();
          start += angle;
        }
      }

      // inner circle to make donut
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(center, center, 50, 0, Math.PI * 2);
      ctx.fill();

      // total in center
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((total || 0).toString(), center, center - 8);
      ctx.font = '12px Arial';
      ctx.fillText('total', center, center + 12);
    }

    drawDonut(pieValues);

    // build legend next to canvas if container exists
    const container = pieCanvas.closest('.pie-graph-container');
    if (container) {
      let legend = container.querySelector('.graph-legend');
      if (!legend) {
        legend = document.createElement('div');
        legend.className = 'graph-legend';
        container.appendChild(legend);
      }
      legend.innerHTML = '';
      for (let i = 0; i < pieLabels.length; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = pieColors[i % pieColors.length];
        const txt = document.createElement('span');
        txt.textContent = `${pieLabels[i]} — ${pieValues[i]}`;
        item.appendChild(sw);
        item.appendChild(txt);
        legend.appendChild(item);
      }
    }
  }

  // ------------------ Column / Bar chart (status counts) ------------------
  const columnCanvas = document.getElementById('column-attendCalend-graph');
  if (columnCanvas) {
    // Use attendance status labels matching the per-day breakdown
    const labels = ['Present', 'Absent', 'Late', 'Excused'];
    // Sample values for each status (replace with real data when available)
    const values = [0, 0, 0, 0];
    const color = '#4e73df';

    const ctx2 = columnCanvas.getContext('2d');
    const cw = 420; // logical pixels
    const ch = 220;
    columnCanvas.width = cw * dpr;
    columnCanvas.height = ch * dpr;
    columnCanvas.style.width = cw + 'px';
    columnCanvas.style.height = ch + 'px';
    ctx2.scale(dpr, dpr);

    function drawBarChart(labels, values) {
      // clear
      ctx2.clearRect(0, 0, cw, ch);

      // filter out zero-value items so we don't draw them
      const items = labels.map((lab, i) => ({ label: lab, value: values[i] })).filter(it => it.value > 0);

      const padding = { left: 40, right: 16, top: 20, bottom: 36 };
      const chartW = cw - padding.left - padding.right;
      const chartH = ch - padding.top - padding.bottom;

      if (items.length === 0) {
        // No data to show
        ctx2.fillStyle = '#666';
        ctx2.font = '14px Arial';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText('No records for this date', cw / 2, ch / 2);
        return;
      }

      const maxVal = Math.max(...items.map(i => i.value), 1);
      const cols = items.length;
      const gap = 18;
      const barW = (chartW - gap * (cols - 1)) / cols;

      // y grid and labels
      ctx2.strokeStyle = '#e6e6e6';
      ctx2.fillStyle = '#333';
      ctx2.font = '12px Arial';
      ctx2.textAlign = 'right';
      ctx2.textBaseline = 'middle';

      const ticks = 4;
      for (let i = 0; i <= ticks; i++) {
        const y = padding.top + (chartH * i) / ticks;
        const v = Math.round(maxVal - (maxVal * i) / ticks);
        ctx2.beginPath();
        ctx2.moveTo(padding.left, y);
        ctx2.lineTo(padding.left + chartW, y);
        ctx2.stroke();
        ctx2.fillText(v.toString(), padding.left - 8, y);
      }

      // draw bars for non-zero items
      ctx2.textAlign = 'center';
      for (let i = 0; i < cols; i++) {
        const x = padding.left + i * (barW + gap);
        const val = items[i].value;
        const h = (val / maxVal) * chartH;
        const y = padding.top + (chartH - h);
        // bar
        ctx2.fillStyle = color;
        ctx2.fillRect(x, y, barW, h);
        // value text above bar
        ctx2.fillStyle = '#111';
        ctx2.font = '12px Arial';
        ctx2.fillText(val.toString(), x + barW / 2, y - 10);
        // x label
        ctx2.fillStyle = '#333';
        ctx2.fillText(items[i].label, x + barW / 2, padding.top + chartH + 16);
      }
    }

    drawBarChart(labels, values);
  }

  // Expose rendering API for calendar-specific column chart
  function computeCountsFromRecords(records) {
    const map = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    if (!Array.isArray(records) || records.length === 0) return map;
    for (const r of records) {
      const s = (r.status || '').toString().toLowerCase();
      if (s === 'present') map.Present += 1;
      else if (s === 'late') map.Late += 1;
      else if (s === 'excused' || s === 'excuse' || s === 'e') map.Excused += 1;
      else map.Absent += 1;
    }
    return map;
  }

  function renderColumnForDate(dateKey, records) {
    const counts = computeCountsFromRecords(records || []);
    const labels = ['Present', 'Absent', 'Late', 'Excused'];
    const values = labels.map(l => counts[l] || 0);
    drawBarChart(labels, values);
  }

  // attach to global for other modules to call
  window.calendarGraph = window.calendarGraph || {};
  window.calendarGraph.renderForDate = renderColumnForDate;

});
