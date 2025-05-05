function normalizeCategory(name) {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') value = String(value ?? '');
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
}

function initConfirmationResults() {
  const target = document.getElementById('initiative-results');

  const savedInputs = {
    priority1: document.getElementById('priority1')?.textContent.trim() || '',
    priority2: document.getElementById('priority2')?.textContent.trim() || '',
    priority3: document.getElementById('priority3')?.textContent.trim() || '',
    budgetOneTime: document.getElementById('onetime')?.textContent.trim() || '',
    budgetOngoing: document.getElementById('ongoing')?.textContent.trim() || '',
  };

  const budgetOneTime = toNumber(savedInputs.budgetOneTime);
  const budgetOngoing = toNumber(savedInputs.budgetOngoing);

  if (!savedInputs.priority1 || !savedInputs.priority2 || !savedInputs.priority3 || (budgetOneTime === 0 && budgetOngoing === 0)) {
    console.error('Missing input data, aborting.');
    return;
  }

  fetch('/wp-json/initiative-calc/v1/services')
    .then(res => res.json())
    .then(data => {
      const allServices = Object.entries(data).flatMap(([category, services]) =>
        services.map(service => ({
          ...service,
          categoryOriginal: category,
          category: normalizeCategory(category),
        }))
      );

      const userPriorities = [savedInputs.priority1, savedInputs.priority2, savedInputs.priority3].map(p => normalizeCategory(p)).filter(Boolean);

      const userPriorityWeight = {};
      userPriorities.forEach((p, i) => {
        userPriorityWeight[p] = 3 - i;
      });

      const unlimitedServices = allServices.filter(service => userPriorities.includes(service.category)).sort((a, b) => (userPriorityWeight[b.category] || 0) - (userPriorityWeight[a.category] || 0));

      let currentMonthlyBudget = budgetOngoing;
      let currentOneTimeBudget = budgetOneTime;
      const budgetServices = [];

      unlimitedServices.forEach(service => {
        const cost = service.hours * 150;
        if (service.timeframe === 'Ongoing' && currentMonthlyBudget >= cost) {
          budgetServices.push(service);
          currentMonthlyBudget -= cost;
        } else if (service.timeframe !== 'Ongoing' && currentOneTimeBudget >= cost) {
          budgetServices.push(service);
          currentOneTimeBudget -= cost;
        }
      });

      const getColor = index => {
        const baseColors = ['#FF2041', '#23294F', '#FFDDE2', '#6A4C93', '#FF7A7A', '#F3BCC3', '#A0A6D6', '#C1B7DC', '#CFE2F3', '#FFC857'];
        return index < baseColors.length ? baseColors[index] : `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;
      };

      const renderSection = (title, services) => {
        const ongoing = services.filter(s => s.timeframe === 'Ongoing');
        const ongoingHours = ongoing.reduce((sum, s) => sum + s.hours, 0);
        const oneTimeHours = services.filter(s => s.timeframe !== 'Ongoing').reduce((sum, s) => sum + s.hours, 0);

        const labels = ongoing.map(s => `${s.name}: ${s.hours.toLocaleString()} hrs`);
        const hours = ongoing.map(s => s.hours);

        target.innerHTML += `
          <section class="recommendation-columns">
            <div class="column">
              <h3>${title}</h3>
              <p><strong>Ongoing Hours:</strong> ${ongoingHours.toLocaleString()} hrs</p>
              <p><strong>One-Time Project Hours:</strong> ${oneTimeHours.toLocaleString()} hrs</p>
              <ol>
                ${services.map(s => `<li><strong>${s.name}</strong> (${s.categoryOriginal}, ${s.timeframe}, ${s.hours.toLocaleString()} hrs)</li>`).join('')}
              </ol>
            </div>
            <div class="column">
              <h4>Ongoing Services Breakdown by Hours</h4>
              <div><canvas id="${normalizeCategory(title)}Chart" width="400" height="400" style="width:400px; height:400px;"></canvas></div>
            </div>
          </section>
        `;

        setTimeout(() => {
          new Chart(document.getElementById(`${normalizeCategory(title)}Chart`).getContext('2d'), {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [
                {
                  data: hours,
                  backgroundColor: labels.map((_, i) => getColor(i)),
                },
              ],
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              devicePixelRatio: 2,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return context.label;
                    },
                  },
                },
              },
            },
          });
        }, 50);
      };

      renderSection('Unlimited Possibilities', unlimitedServices);
      renderSection('Prioritized Based on Your Budget', budgetServices);
    });
}

const observer = new MutationObserver(() => {
  const wrapper = document.querySelector('.gform_confirmation_wrapper');
  const values = document.getElementById('initiative-values');

  if (wrapper && values) {
    observer.disconnect();
    initConfirmationResults();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
