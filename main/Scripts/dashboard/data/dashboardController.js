import attendanceStore from './attendanceStore.js';
import { renderTodayAttendance } from './todayAttendanceView.js';
import { renderRecentStudents } from './recentStudentsView.js';
import { renderMostPresent } from './mostPresentView.js';
import { renderAttendanceSections } from './todayAttendanceSectionView.js';

let _controllerInProgress = false;
let _intervalId = null;
let _options = {};

async function _refreshAndRender() {
  if (_controllerInProgress) return;
  if (typeof document !== 'undefined' && document.hidden) return; // paused while hidden
  _controllerInProgress = true;
  try {
    const res = await attendanceStore.refreshAttendance();
    // only render if data changed according to store fingerprint
    if (!res || res.changed !== true) return;
    try { renderTodayAttendance(); } catch (e) { console.warn('renderTodayAttendance failed', e); }
    try { renderRecentStudents(); } catch (e) { console.warn('renderRecentStudents failed', e); }
    try { renderMostPresent(); } catch (e) { console.warn('renderMostPresent failed', e); }
    try { renderAttendanceSections(); } catch (e) { console.warn('renderAttendanceSections failed', e); }
  } finally {
    _controllerInProgress = false;
  }
}

// public init - set interval and run immediate
export function initDashboardController(options = {}) {
  _options = options || {};
  const minInterval = 15000; // require at least 15s per spec
  const attendanceInterval = Math.max(minInterval, Number(options.attendanceIntervalMs) || minInterval);

  if (_intervalId) return; // already initialized

  // initial immediate refresh if visible
  // render from any cached store data immediately to avoid blank UI while fetching
  try {
    // small defer to allow DOM to finish layout, but render promptly
    window.requestAnimationFrame(() => {
      try { renderTodayAttendance(); } catch (e) { /* ignore */ }
      try { renderRecentStudents(); } catch (e) { /* ignore */ }
      try { renderMostPresent(); } catch (e) { /* ignore */ }
      try { renderAttendanceSections(); } catch (e) { /* ignore */ }
      try { if (window.calendarAttendance && typeof window.calendarAttendance.renderSelectedDateAttendance === 'function') window.calendarAttendance.renderSelectedDateAttendance(new Date()); } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }

  if (!(typeof document !== 'undefined' && document.hidden)) _refreshAndRender();

  _intervalId = setInterval(_refreshAndRender, attendanceInterval);

  // subscribe to local store changes (delete/update/add) so UI lists update immediately
  try {
    if (typeof attendanceStore.subscribe === 'function') {
      attendanceStore.subscribe(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        // avoid overlapping render with an in-progress refresh
        if (_controllerInProgress) {
          setTimeout(() => {
            if (!_controllerInProgress) {
              try { renderTodayAttendance(); } catch (e) { console.warn(e); }
              try { renderRecentStudents(); } catch (e) { console.warn(e); }
              try { renderMostPresent(); } catch (e) { console.warn(e); }
              // also re-render the calendar's selected-date view if present
              try {
                if (window.calendarAttendance && typeof window.calendarAttendance.renderSelectedDateAttendance === 'function') {
                  const lastKey = (typeof window.calendarAttendance.getLastSelectedDateKey === 'function') ? window.calendarAttendance.getLastSelectedDateKey() : window.calendarAttendance._lastSelectedKey;
                  if (typeof window.calendarAttendance.refreshAll === 'function') {
                    // refresh calendar index from source, then render
                    window.calendarAttendance.refreshAll().then(() => {
                      try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { }
                    }).catch(() => { try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { } });
                  } else {
                    try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { }
                  }
                }
              } catch (e) { /* ignore */ }
            }
          }, 50);
          return;
        }
        try { renderTodayAttendance(); } catch (e) { console.warn(e); }
        try { renderRecentStudents(); } catch (e) { console.warn(e); }
        try { renderMostPresent(); } catch (e) { console.warn(e); }
        // keep the calendar-selected date view in sync too
        try {
          if (window.calendarAttendance && typeof window.calendarAttendance.renderSelectedDateAttendance === 'function') {
            const lastKey = (typeof window.calendarAttendance.getLastSelectedDateKey === 'function') ? window.calendarAttendance.getLastSelectedDateKey() : window.calendarAttendance._lastSelectedKey;
            if (typeof window.calendarAttendance.refreshAll === 'function') {
              window.calendarAttendance.refreshAll().then(() => {
                try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { }
              }).catch(() => { try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { } });
            } else {
              try { window.calendarAttendance.renderSelectedDateAttendance(lastKey || new Date()); } catch (e) { }
            }
          }
        } catch (e) { /* ignore */ }
      });
    }
  } catch (e) { console.warn('subscribe failed', e); }

  // pause/resume when visibility changes
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
      } else {
        if (!_intervalId) {
          _intervalId = setInterval(_refreshAndRender, attendanceInterval);
          // kick immediate refresh when becoming visible
          _refreshAndRender();
        }
      }
    });
  }

  // renderSelectedDateAttendance now provided by calendarAttendance (global)
}

// auto-init when loaded as module in browser
if (typeof window !== 'undefined') {
  if (!window._dashboardControllerInitialized) {
    window._dashboardControllerInitialized = true;
    // small defer to let DOM be ready
    window.addEventListener('DOMContentLoaded', () => {
      initDashboardController();
    });
  }
}

export default { initDashboardController };
