const optionsCustom = document.querySelector('.acting-options');

function actingSelect() {
  optionsCustom.classList.toggle('show');
}

const settingContainer = document.querySelector('.settings-container');
const calendarContainer = document.querySelector('.calendar-container');
const attendanceContainer = document.querySelector('.student-attendance-container');
const statisticsContainer = document.querySelector('.student-statistics-container');
const dashboardContainer = document.querySelector('.dashboard-container');

function closeAll() {
  if (settingContainer) settingContainer.classList.add('closed');
  if (calendarContainer) calendarContainer.classList.add('closed');
  if (attendanceContainer) attendanceContainer.classList.add('closed');
  if (statisticsContainer) statisticsContainer.classList.add('closed');
  if (dashboardContainer) dashboardContainer.classList.add('closed');
}

function showContainerForHash(hash) {
  closeAll();
  switch ((hash || '').toString().toLowerCase()) {
    case '#settings':
      if (settingContainer) settingContainer.classList.remove('closed');
      break;
    case '#calendar':
      if (calendarContainer) calendarContainer.classList.remove('closed');
      break;
    case '#attendance':
      if (attendanceContainer) attendanceContainer.classList.remove('closed');
      break;
    case '#statistics':
      if (statisticsContainer) statisticsContainer.classList.remove('closed');
      break;
    case '#dashboard':
    default:
      if (dashboardContainer) dashboardContainer.classList.remove('closed');
      break;
  }
}

// respond to hash changes (keeps behavior consistent with sidebar.js)
window.addEventListener('hashchange', () => {
  showContainerForHash(window.location.hash);
});

// initialize on load
document.addEventListener('DOMContentLoaded', () => {
  showContainerForHash(window.location.hash || '#dashboard');
});