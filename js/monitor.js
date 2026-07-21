// monitor.js
// Monitoraggio focus, tab, fullscreen

let events = [];
let focusLostCount = 0;
let lostFocusTime = null;
let isMonitoringActive = false;

/*
 Registra un evento
*/
function logEvent(type, extra = {}) {
    const event = {
        type: type,
        timestamp: new Date().toISOString(),
        ...extra
    };
    events.push(event);
    localStorage.setItem("exam_events", JSON.stringify(events));
}

/*
 Recupera eventi
*/
function loadEvents() {
    const saved = localStorage.getItem("exam_events");
    if (saved) {
        events = JSON.parse(saved);
    }
}

/*
 Restituisce log completo
*/
function getEvents() {
    return events;
}

/*
 Evento perdita focus
*/
function focusLost() {
    // Se l'esame non è iniziato, ignora totalmente!
    if (!isMonitoringActive) return;

    focusLostCount++;
    const countEl = document.getElementById("focus-count");
    if (countEl) countEl.innerText = focusLostCount;

    lostFocusTime = Date.now();
    logEvent("focus_lost");

    showWarning();
    playAlert();
}

/*
 Ritorno focus
*/
function focusBack() {
    if (!isMonitoringActive) return;

    let duration = null;
    if (lostFocusTime) {
        duration = Math.floor((Date.now() - lostFocusTime) / 1000);
    }
    logEvent("focus_return", { duration: duration });
    lostFocusTime = null;
}

/*
 Avviso grafico (Popup)
*/
function showWarning() {
    const box = document.getElementById("warning");
    if (!box) return;

    box.hidden = false;
    box.style.display = "flex";

    setTimeout(() => {
        box.hidden = true;
        box.style.display = "none";
    }, 3000);
}

/*
 Suono
*/
function playAlert() {
    if (!isMonitoringActive) return;

    const audio = document.getElementById("alert-sound");
    if (audio) {
        audio.play().catch(() => {});
    }
}

/*
 Fullscreen
*/
function fullscreenChanged() {
    if (!isMonitoringActive) return;

    if (!document.fullscreenElement) {
        logEvent("fullscreen_exit");
        showWarning();
    }
}

/**
 * Attiva il monitoraggio dell'esame (DA CHIAMARE DOPO IL LOGIN)
 */
function startMonitoring() {
    if (isMonitoringActive) return; // Evita attivazioni multiple
    
    isMonitoringActive = true;

    // Registriamo gli Event Listener solo in questo momento
    window.addEventListener("blur", focusLost);
    window.addEventListener("focus", focusBack);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            focusLost();
        } else {
            focusBack();
        }
    });

    document.addEventListener("fullscreenchange", fullscreenChanged);

    console.log("🛡️ Monitoraggio di sicurezza attivato con successo.");
}

let isPaused = false;

function pauseMonitoring() {
    isPaused = true;
}

function resumeMonitoring() {
    // Un piccolo delay per evitare che l'interazione con la modal scateni un falso blur immediato
    setTimeout(() => {
        isPaused = false;
    }, 1000);
}

// Aggiorna la funzione focusLost() aggiungendo il controllo if (isPaused) return:
function focusLost() {
    if (!isMonitoringActive || isPaused) return; // Ignora se disattivato o in pausa!

    focusLostCount++;
    const countEl = document.getElementById("focus-count");
    if (countEl) countEl.innerText = focusLostCount;

    lostFocusTime = Date.now();
    logEvent("focus_lost");

    showWarning();
    playAlert();
}

// Inizializza i log salvati in precedenza al caricamento
loadEvents();