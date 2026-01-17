
// Dark theme toggle + persistence
// Looks for the checkbox inside the label with id="dark-theme"
(() => {
  const storageKey = 'darkmode';
  const checkbox = document.querySelector('#dark-theme input[type="checkbox"]');
  const darkClass = 'dark-theme';

  function setDarkMode(active) {
    if (active) {
      document.documentElement.classList.add(darkClass);
      if (checkbox) checkbox.checked = true;
      localStorage.setItem(storageKey, 'active');
    } else {
      document.documentElement.classList.remove(darkClass);
      if (checkbox) checkbox.checked = false;
      localStorage.removeItem(storageKey);
    }
  }

  // Expose global toggle function if other scripts want to call it
  window.toggleDarkMode = setDarkMode;

  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(storageKey);
    if (checkbox) {
      // Initialize checkbox and class from storage
      if (saved === 'active') setDarkMode(true);
      else setDarkMode(false);

      // sync when user toggles checkbox
      checkbox.addEventListener('change', () => {
        setDarkMode(checkbox.checked);
      });
    } else {
      // No checkbox found; still apply saved preference
      if (saved === 'active') setDarkMode(true);
    }
  });
})();

