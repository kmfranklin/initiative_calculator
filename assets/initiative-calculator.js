/**
 * Saves selected form input values to localStorage for later retrieval.
 */
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

/**
 * Initializes event listeners for input fields and form submission.
 */
document.addEventListener('DOMContentLoaded', () => {
  const prioritySelectors = ['#input_4_3', '#input_4_6', '#input_4_7'];
  prioritySelectors.forEach(sel => {
    document.querySelector(sel)?.addEventListener('input', saveInputData);
  });

  document.querySelector('#gform_4')?.addEventListener('submit', saveInputData);
});

/**
 * Monitors Gravity Forms page transitions to capture additional inputs.
 */
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
    watchFormPages.disconnect();
  }
});

watchFormPages.observe(document.body, {
  childList: true,
  subtree: true,
});

/**
 * Render's the user's priorities, matching services, and "Unlimited Possibilities" after form submission.
 */
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

  // Fetch and flatten the dataset after confirmation screen appears
  fetch('/wp-json/initiative-calc/v1/services')
    .then(res => res.json())
    .then(data => {
      // Flatten the dataset
      const allServices = Object.entries(data).flatMap(([category, services]) =>
        services.map(service => ({
          ...service,
          category,
        }))
      );

      const userPriorityWeight = {
        [savedInputs.priority1]: 3,
        [savedInputs.priority2]: 2,
        [savedInputs.priority3]: 1,
      };

      // Filter by priorities
      const userPriorities = [savedInputs.priority1, savedInputs.priority2, savedInputs.priority3].filter(Boolean);
      const matchingServices = allServices.filter(service => userPriorities.includes(service.category));
      const scoredServices = matchingServices.map(service => ({ ...service, score: (userPriorityWeight[service.category] || 0) * (service.priority || 0) }));

      scoredServices.sort((a, b) => b.score - a.score);

      // Determine "Unlimited Budget" service possibilities
      const unlimitedServices = allServices
        .filter(service => userPriorities.includes(service.category))
        .sort((a, b) => {
          const weightA = userPriorityWeight[a.category] || 0;
          const weightB = userPriorityWeight[b.category] || 0;
          return weightB - weightA;
        });

      // Budget-based recommendations
      let currentMonthlyBudget = budgetOngoing;
      let currentOneTimeBudget = budgetOneTime;

      const budgetServices = [];

      unlimitedServices.forEach(service => {
        const serviceCost = service.hours * 150;

        if (service.timeframe === 'Ongoing') {
          if (currentMonthlyBudget >= serviceCost) {
            budgetServices.push(service);
            currentMonthlyBudget -= serviceCost;
          }
        } else {
          if (currentOneTimeBudget >= serviceCost) {
            budgetServices.push(service);
            currentOneTimeBudget -= serviceCost;
          }
        }
      });

      let unlimitedOngoingHours = 0;
      let unlimitedOneTimeHours = 0;

      unlimitedServices.forEach(service => {
        if (service.timeframe === 'Ongoing') {
          unlimitedOngoingHours += service.hours;
        } else {
          unlimitedOneTimeHours += service.hours;
        }
      });

      let budgetOngoingHours = 0;
      let budgetOneTimeHours = 0;

      budgetServices.forEach(service => {
        if (service.timeframe === 'Ongoing') {
          budgetOngoingHours += service.hours;
        } else {
          budgetOneTimeHours += service.hours;
        }
      });

      // Output "If Budget Was No Issue" services
      target.innerHTML += `
        <h3>Unlimited Possibilities</h3>
        <p><strong>Ongoing Hours:</strong> ${unlimitedOngoingHours} hrs</p>
        <p><strong>One-Time Project Hours:</strong> ${unlimitedOneTimeHours} hrs</p>
        <ul>
          ${unlimitedServices
            .map(
              s => `<li>
                <strong>${s.name}</strong> (${s.category}, ${s.timeframe}, ${s.hours} hrs)
              </li>`
            )
            .join('')}
        </ul>
        `;

      // Output budget-friendly recommendations
      target.innerHTML += `
      <h3>Prioritized Based on Your Budget</h3>
      <p><strong>Ongoing Hours:</strong> ${budgetOngoingHours} hrs</p>
      <p><strong>One-Time Project Hours:</strong> ${budgetOneTimeHours} hrs</p>
      <ul>
        ${budgetServices
          .map(
            s => `<li>
              <strong>${s.name}</strong> (${s.category}, ${s.timeframe}, ${s.hours} hrs)
            </li>`
          )
          .join('')}
      </ul>
      `;
    });

  renderConfirmation.disconnect();
});

renderConfirmation.observe(document.body, {
  childList: true,
  subtree: true,
});
