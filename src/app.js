const { initialEvents, motivationalQuotes } = window.ikigAIData;
const {
  renderAppointmentForm,
  renderBalancePanel,
  renderBottomNav,
  renderCalendar,
  renderGoalStrip,
  renderHeader,
  renderSuggestions
} = window.ikigAIComponents;

const state = {
  activeGoal: "balance",
  events: [...initialEvents],
  quoteIndex: new Date().getDate() % motivationalQuotes.length
};

const app = document.querySelector("#app");

function render() {
  const quote = motivationalQuotes[state.quoteIndex];

  app.innerHTML = `
    <section class="screen">
      ${renderHeader(quote)}
      <div class="content">
        ${renderBalancePanel(state.activeGoal)}
        ${renderGoalStrip(state.activeGoal)}
        ${renderCalendar(state.events)}
        ${renderAppointmentForm()}
        ${renderSuggestions()}
      </div>
      ${renderBottomNav()}
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeGoal = button.dataset.goal;
      render();
    });
  });

  document.querySelector("#appointmentForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const type = data.get("type");

    state.events = [
      ...state.events,
      {
        id: Date.now(),
        day: "Sa",
        time: data.get("time"),
        title: data.get("title") || "Neuer Termin",
        type: type === "business" ? "business" : type
      }
    ];

    render();
  });
}

render();
