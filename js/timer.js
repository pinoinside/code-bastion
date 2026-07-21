// timer.js
// Gestione cronometro esame

let startTime = null;
let timerInterval = null;
let elapsedSeconds = 0;

/*
 Avvia il timer
*/
function startTimer() {
    if(timerInterval)
        return;

    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateTimerDisplay();

        // autosalvataggio del tempo
        localStorage.setItem("exam_time", elapsedSeconds);
    },1000);
}

/*
 Ferma il timer
*/
function stopTimer(){
    clearInterval(timerInterval);
    timerInterval=null;
}

/*
 Recupera tempo precedente
*/
function loadTimer(){
    const saved = localStorage.getItem("exam_time");
    if(saved){
        elapsedSeconds = parseInt(saved);
        updateTimerDisplay();
    }
}

/*
 Visualizzazione
*/
function updateTimerDisplay(){
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;

    document.getElementById("timer")
        .innerText =
        String(h).padStart(2,"0")
        + ":" +
        String(m).padStart(2,"0")
        + ":" +
        String(s).padStart(2,"0");
}

/*
 Tempo finale
*/
function getElapsedTime(){
    return elapsedSeconds;
}