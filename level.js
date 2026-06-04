(() => {
  const buttons = document.querySelectorAll('.level-card');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      window.location.href = `play.html?level=${level}`;
    });
  });
})();
