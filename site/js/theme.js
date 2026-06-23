(function() {
  const theme = localStorage.getItem('dex_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
