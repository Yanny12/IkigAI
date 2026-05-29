const days = ["Fr", "Sa", "So"];
const times = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];
const { goals, suggestedSlots } = window.ikigAIData;
window.ikigAIComponents = {};

window.ikigAIComponents.renderHeader = function renderHeader(quote) {
  return `
    <header class="top-area">
      <div class="app-header">
        <div class="brand">
          <h1 class="brand-title">ikigAI</h1>
          <span class="brand-subtitle">Work-Life Terminplanung</span>
        </div>
        <div class="header-actions" aria-label="Profil und Einstellungen">
          <button class="icon-button" type="button" title="Profil" aria-label="Profil">◠</button>
          <button class="icon-button" type="button" title="Einstellungen" aria-label="Einstellungen">⚙</button>
        </div>
      </div>
      <section class="quote" aria-label="Motivationsspruch">
        <p>${quote}</p>
      </section>
    </header>
  `;
};

window.ikigAIComponents.renderBalancePanel = function renderBalancePanel(activeGoal) {
  const goal = goals.find((item) => item.id === activeGoal) ?? goals[0];

  return `
    <section class="balance-panel" aria-label="Tagesziel">
      <div class="balance-copy">
        <span class="section-kicker">Heute</span>
        <h2 class="section-title">${goal.title}</h2>
      </div>
      <div class="balance-ring" aria-label="Balance Score 76 Prozent">
        <span>76%<br />Balance</span>
      </div>
    </section>
  `;
};

window.ikigAIComponents.renderGoalStrip = function renderGoalStrip(activeGoal) {
  return `
    <nav class="goal-strip" aria-label="Zielauswahl">
      ${goals
        .map(
          (goal) => `
            <button class="goal-button ${goal.id === activeGoal ? "is-active" : ""}" type="button" data-goal="${goal.id}">
              <span class="goal-icon">${goal.icon}</span>
              <span class="goal-label">${goal.label}</span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
};

window.ikigAIComponents.renderCalendar = function renderCalendar(events) {
  return `
    <section class="panel" aria-label="Wochenkalender">
      <div class="panel-header">
        <h2 class="panel-title">Freitag, 29.05.2026</h2>
        <button class="chip" type="button">Woche 1</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-cell calendar-head"></div>
        ${days.map((day) => `<div class="calendar-cell calendar-head">${day}</div>`).join("")}
        ${times
          .map((time) => {
            const rowEvents = days
              .map((day) => {
                const event = events.find((item) => item.day === day && item.time === time);
                return `
                  <div class="calendar-cell">
                    ${event ? `<span class="event ${event.type}">${event.title}</span>` : ""}
                  </div>
                `;
              })
              .join("");

            return `<div class="calendar-cell time-cell">${time}</div>${rowEvents}`;
          })
          .join("")}
      </div>
    </section>
  `;
};

window.ikigAIComponents.renderAppointmentForm = function renderAppointmentForm() {
  return `
    <section class="panel" aria-label="Termin erfassen">
      <div class="panel-header">
        <h2 class="panel-title">Termin planen</h2>
        <span class="chip">AI Vorschlag</span>
      </div>
      <form class="appointment-form" id="appointmentForm">
        <div class="field">
          <label for="title">Titel</label>
          <input id="title" name="title" type="text" value="Coffee Chat" />
        </div>
        <div class="field-row">
          <div class="field">
            <label for="type">Bereich</label>
            <select id="type" name="type">
              <option value="personal">Privat</option>
              <option value="business">Geschaeftlich</option>
              <option value="focus">Fokus</option>
            </select>
          </div>
          <div class="field">
            <label for="time">Zeit</label>
            <select id="time" name="time">
              <option>07:00</option>
              <option>08:00</option>
              <option>09:00</option>
              <option>10:00</option>
              <option>11:00</option>
              <option>12:00</option>
            </select>
          </div>
        </div>
        <button class="primary-button" type="submit">Termin eintragen</button>
      </form>
    </section>
  `;
};

window.ikigAIComponents.renderSuggestions = function renderSuggestions() {
  return `
    <section class="panel" aria-label="Empfohlene Slots">
      <div class="panel-header">
        <h2 class="panel-title">Freie Ziele</h2>
        <button class="chip" type="button">Mehr</button>
      </div>
      <div class="suggestions">
        ${suggestedSlots
          .map(
            (slot) => `
              <article class="suggestion">
                <span class="suggestion-dot event ${slot.type}"></span>
                <div>
                  <span class="suggestion-title">${slot.title}</span>
                  <span class="suggestion-meta">${slot.meta}</span>
                </div>
                <span aria-hidden="true">›</span>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
};

window.ikigAIComponents.renderBottomNav = function renderBottomNav() {
  const items = [
    ["Kalender", "▦"],
    ["Ziele", "◎"],
    ["AI", "✦"],
    ["Profil", "◠"]
  ];

  return `
    <nav class="bottom-nav" aria-label="Hauptnavigation">
      ${items
        .map(
          ([label, icon], index) => `
            <button class="nav-button ${index === 0 ? "is-active" : ""}" type="button">
              <span class="nav-icon">${icon}</span>
              <span>${label}</span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
};
