function saveInputData() {
  const dataToSave = {
    priority1: document.querySelector('#input_4_3')?.value || '',
    priority2: document.querySelector('#input_4_6')?.value || '',
    priority3: document.querySelector('#input_4_7')?.value || '',
    budgetOneTime: document.querySelector('#input_4_10')?.value || '',
    budgetOngoing: document.querySelector('#input_4_11')?.value || '',
  };
  localStorage.setItem('initiative_inputs', JSON.stringify(dataToSave));
}

// Save priorities on input, and full form on submit
document.addEventListener('DOMContentLoaded', () => {
  const prioritySelectors = ['#input_4_3', '#input_4_6', '#input_4_7'];
  prioritySelectors.forEach(sel => {
    document.querySelector(sel)?.addEventListener('input', saveInputData);
  });

  document.querySelector('#gform_4')?.addEventListener('submit', saveInputData);
});

// Watch for Page 2/3 of the form becoming visible
const watchFormPages = new MutationObserver(() => {
  const page2 = document.getElementById('gform_page_4_2');
  const page3 = document.getElementById('gform_page_4_3');

  if (page2 && page2.style.display !== 'none') {
    ['#input_4_10', '#input_4_11'].forEach(sel => {
      document.querySelector(sel)?.addEventListener('input', saveInputData);
    });
  }

  if (page3 && page3.style.display !== 'none') {
    saveInputData();
    watchFormPages.disconnect(); // Stop watching once we're past Page 2
  }
});

watchFormPages.observe(document.body, {
  childList: true,
  subtree: true,
});

// Render the results on the confirmation screen
const renderConfirmation = new MutationObserver(() => {
  const target = document.getElementById('initiative-results');
  if (!target) return;

  const savedInputs = JSON.parse(localStorage.getItem('initiative_inputs') || '{}');

  const budgetOneTime = parseFloat(savedInputs.budgetOneTime) || 0;
  const budgetOngoing = parseFloat(savedInputs.budgetOngoing) || 0;

  target.innerHTML = `
    <p>Top Priority: ${savedInputs.priority1}</p>
    <p>Second Priority: ${savedInputs.priority2}</p>
    <p>Third Priority: ${savedInputs.priority3}</p>
    <p>One-Time Budget: $${budgetOneTime.toLocaleString()}</p>
    <p>Monthly Budget: $${budgetOngoing.toLocaleString()}</p>
  `;

  renderConfirmation.disconnect();
});

renderConfirmation.observe(document.body, {
  childList: true,
  subtree: true,
});
