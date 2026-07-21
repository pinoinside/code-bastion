// app.js
// Controller principale CodeBastion

let examStarted = false;

let student = {
    name: "",
    id: ""
};

window.addEventListener("DOMContentLoaded", () => {
    // Caricamento utenti
    loadUsers();

    // Event listener Login
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", checkLogin);
    }

    // Pulsante esegui
    const runBtn = document.getElementById("run-btn");
    if (runBtn) {
        runBtn.addEventListener("click", executeCode);
    }

    // Salva codice
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            saveCode();
            showMessage("Code saved successfully!");
        });
    }

    // Consegna
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", submitExam);
    }

    loadTimer();
});

/*
 LOGIN STUDENTE
*/
/*
 LOGIN STUDENTE
*/
async function checkLogin() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorEl = document.getElementById("login-error");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    // 1. Richiediamo il fullscreen IMMEDIATAMENTE al click dell'utente (User Gesture)
    enterFullscreen();

    const ok = await login(username, password);

    if (!ok) {
        if (errorEl) errorEl.innerText = "Incorrect credentials";
        // Se il login fallisce, usciamo dallo schermo intero
        exitFullscreen();
        return;
    }

    if (errorEl) errorEl.innerText = "";
    startExam();
}

function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {
            // Se l'utente rifiuta la richiesta, il sistema procede comunque
        });
    }
}

function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    }
}

/*
 AVVIO ESAME
*/
function startExam() {
    if (examStarted) {
        return;
    }

    examStarted = true;

    const logged = getLoggedStudent();

    if (!logged) {
        alert("Student not found");
        return;
    }

    student = {
        name: logged.name,
        id: logged.id
    };

    document.getElementById("display-name").innerText = student.name;
    document.getElementById("start-screen").hidden = true;
    document.getElementById("exam-screen").hidden = false;

    enterFullscreen();
    startTimer();
    loadEvents();

    // 🛡️ Attiva il monitoraggio del focus SOLO adesso
    if (typeof startMonitoring === "function") {
        startMonitoring();
    }

    console.log("AVVIO EDITOR");
    createEditor();

    saveStudent();
}

/*
 FULLSCREEN
*/
function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {
            // Ignora errori se l'utente rifiuta il fullscreen
        });
    }
}

/*
 SALVATAGGIO STUDENTE
*/
function saveStudent() {
    localStorage.setItem("student", JSON.stringify(student));
}

/*
 ESECUZIONE PYTHON
*/
async function executeCode() {
    const button = document.getElementById("run-btn");

    button.innerText = "⏳ RUNNING...";
    button.disabled = true;

    const code = getCode();
    const output = await runPython(code);

    document.getElementById("console-output").innerText = output;

    button.innerText = "▶ Esegui";
    button.disabled = false;
}

/*
 CONSEGNA
*/
async function submitExam() {
    console.log("🚀 Avvio processo di consegna esame...");

    // 1. Recupera il nome dell'utente
    const usernameInput = document.getElementById("username");
    let studentName = usernameInput ? usernameInput.value.trim() : "";
    
    if (!studentName) {
        studentName = localStorage.getItem("current_user") || "studente";
    }

    // 2. Recupera il codice dall'editor Monaco in modo sicuro
    let code = "";
    if (window.monacoEditor) {
        code = window.monacoEditor.getValue();
    } else if (typeof monaco !== "undefined" && monaco.editor && monaco.editor.getModels().length > 0) {
        code = monaco.editor.getModels()[0].getValue();
    } else {
        const fallbackEl = document.getElementById("editor");
        code = fallbackEl ? fallbackEl.value : "";
    }

    // 3. Recupera i log di sicurezza
    const logs = typeof getEvents === "function" ? getEvents() : [];

    // 4. Prepara i file da inserire nello ZIP
    const filesToZip = {
        "soluzione.py": code,
        "logs.json": JSON.stringify(logs, null, 2),
        "info.json": JSON.stringify({
            student: studentName,
            submittedAt: new Date().toISOString()
        }, null, 2)
    };

    // 5. Genera lo ZIP chiamando la funzione in zip.js
    if (typeof generateSubmissionZip === "function") {
        await generateSubmissionZip(studentName, filesToZip);
    } else {
        console.error("❌ La funzione generateSubmissionZip non è presente. Verifica l'inclusione di zip.js in index.html!");
    }
}

/*
 MOSTRA NOTIFICHE / MESSAGGI
*/
function showMessage(text) {
    // Utilizza la console o crea un toast temporaneo per non sporcare il div#warning
    const consoleOutput = document.getElementById("console-output");
    if (consoleOutput) {
        consoleOutput.innerText += `\n[SYSTEM]: ${text}`;
    }
}