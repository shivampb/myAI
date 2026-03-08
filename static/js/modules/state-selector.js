// ── State Selector & Settings Module ──
import { INDIAN_STATES, UT_NAMES, setSelectedState } from '../states/index.js';

export function initStateSelector({ stateSelector, stateGrid, stateSearch, onSelect }) {

    function populateStateGrid(filter = "") {
        stateGrid.innerHTML = "";
        const filtered = INDIAN_STATES.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

        if (filtered.length === 0) {
            stateGrid.innerHTML = '<div class="state-empty">No states found 🤷</div>';
            return;
        }

        const states = filtered.filter(s => !s.isUT);
        const uts = filtered.filter(s => s.isUT);

        if (states.length > 0) {
            const header = document.createElement("div");
            header.className = "state-section-header";
            header.textContent = "States";
            stateGrid.appendChild(header);
            states.forEach(s => stateGrid.appendChild(createStateCard(s)));
        }
        if (uts.length > 0) {
            const header = document.createElement("div");
            header.className = "state-section-header";
            header.textContent = "Union Territories";
            stateGrid.appendChild(header);
            uts.forEach(s => stateGrid.appendChild(createStateCard(s)));
        }
    }

    function createStateCard(s) {
        const card = document.createElement("button");
        card.className = "state-card";
        card.innerHTML = `<span class="state-card-emoji">${s.emoji}</span><span class="state-card-name">${s.name}</span>`;
        card.addEventListener("click", () => selectState(s.name));
        return card;
    }

    function selectState(name) {
        setSelectedState(name);
        stateSelector.style.display = "none";
        onSelect(name);
    }

    function showStateSelector() {
        stateSelector.style.display = "flex";
        populateStateGrid();
        if (stateSearch) { stateSearch.value = ""; stateSearch.focus(); }
    }

    if (stateSearch) {
        stateSearch.addEventListener("input", () => populateStateGrid(stateSearch.value));
    }

    return { showStateSelector };
}

export function initModeSelector({ langModeSelector, modeCards, onModeSelected }) {
    modeCards.forEach(card => {
        card.addEventListener("click", () => {
            const mode = card.dataset.mode;
            langModeSelector.style.display = "none";
            onModeSelected(mode);
        });
    });

    function showModeSelector() {
        langModeSelector.style.display = "flex";
    }

    return { showModeSelector };
}

export function initLevelSelector({ levelSelector, levelCards, onLevelSelected }) {
    levelCards.forEach(card => {
        card.addEventListener("click", () => {
            const level = card.dataset.level;
            levelSelector.style.display = "none";
            onLevelSelected(level);
        });
    });

    function showLevelSelector() {
        levelSelector.style.display = "flex";
    }

    return { showLevelSelector };
}

export function initSettings({ settingsBtn, settingsOverlay, settingsClose, changeStateBtn, currentStateName, currentStateFlag, showStateSelector, currentMode, onModeChange, educationLevelSelect, currentLevel, onLevelChange }) {
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            settingsOverlay.style.display = "flex";
            // Update mode toggle active state
            document.querySelectorAll(".mode-toggle-btn").forEach(btn => {
                if (btn.dataset.mode === currentMode()) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
            // Update level select
            if (educationLevelSelect) {
                educationLevelSelect.value = currentLevel();
            }
        });
    }
    if (settingsClose) {
        settingsClose.addEventListener("click", () => settingsOverlay.style.display = "none");
    }
    if (settingsOverlay) {
        settingsOverlay.addEventListener("click", (e) => {
            if (e.target === settingsOverlay) settingsOverlay.style.display = "none";
        });
    }
    if (changeStateBtn) {
        changeStateBtn.addEventListener("click", () => {
            settingsOverlay.style.display = "none";
            showStateSelector();
        });
    }

    // Mode toggle logic
    const modeBtns = document.querySelectorAll(".mode-toggle-btn");
    modeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            onModeChange(btn.dataset.mode);
        });
    });

    // Level select logic
    if (educationLevelSelect) {
        educationLevelSelect.addEventListener("change", (e) => {
            onLevelChange(e.target.value);
        });
    }
}

