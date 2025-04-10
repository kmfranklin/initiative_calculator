console.log('🧪 JS file is running — using MutationObserver fallback.');

const observer = new MutationObserver(() => {
  const target = document.getElementById('initiative-results');
  if (target) {
    fetch('/wp-json/initiative-calc/v1/services')
      .then(res => res.json())
      .then(data => {
        target.innerHTML = `
          <p>Top category: ${Object.keys(data)[0]}</p>
        `;
      })
      .catch(() => {
        const target = document.getElementById('initiative-results');
        if (target) {
          target.innerHTML = `<p>We couldn't load your recommendations. Please try again later.</p>`;
        }
      });

    observer.disconnect(); // stop watching after success
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
