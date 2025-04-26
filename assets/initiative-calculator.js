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

      // Prepare Ongoing services data for Unlimited Possibilities
      const ongoingUnlimited = unlimitedServices.filter(s => s.timeframe === 'Ongoing');

      const labelsUnlimited = ongoingUnlimited.map(s => `${s.name}: ${s.hours} hrs`);
      const hoursUnlimited = ongoingUnlimited.map(s => s.hours);
      function getColor(index) {
        const baseColors = [
          '#FF2041', // primary red
          '#23294F', // navy
          '#FFDDE2', // light pink
          '#6A4C93', // indigo/purple
          '#FF7A7A', // light coral
          '#F3BCC3', // blush
          '#A0A6D6', // soft indigo
          '#C1B7DC', // dusty lavender
          '#CFE2F3', // cloudy blue
          '#FFC857', // gold
        ];

        if (index < baseColors.length) return baseColors[index];

        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 80%)`;
      }

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
          ${unlimitedServices.map(s => `<li><strong>${s.name}</strong> (${s.category}, ${s.timeframe}, ${s.hours} hrs)</li>`).join('')}
        </ul>

        <h4>Ongoing Services Breakdown by Hours</h4>
        <div style="max-width: 300px; margin-bottom: 2rem;">
          <canvas id="unlimitedOngoingChart"></canvas>
        </div>
      `;

      setTimeout(() => {
        const canvas = document.getElementById('unlimitedOngoingChart');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labelsUnlimited,
              datasets: [
                {
                  data: hoursUnlimited,
                  backgroundColor: labelsUnlimited.map((_, i) => getColor(i)),
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            },
          });
        }
      }, 50);

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

      <h4>Ongoing Services Breakdown by Hours</h4>
      <div style="max-width: 300px; max-height: 300px;">
        <canvas id="budgetOngoingChart" width="400" height="400"></canvas>
      </div>
      `;

      const ongoingBudget = budgetServices.filter(s => s.timeframe === 'Ongoing');
      const labelsBudget = ongoingBudget.map(s => `${s.name}: ${s.hours} hrs`);
      const hoursBudget = ongoingBudget.map(s => s.hours);

      setTimeout(() => {
        const canvas = document.getElementById('budgetOngoingChart');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labelsBudget,
              datasets: [
                {
                  data: hoursBudget,
                  backgroundColor: labelsBudget.map((_, i) => getColor(i)),
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            },
          });
        }
      }, 50);
    });

  renderConfirmation.disconnect();
});

renderConfirmation.observe(document.body, {
  childList: true,
  subtree: true,
});
