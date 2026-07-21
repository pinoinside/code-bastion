// auth.js
// Gestione autenticazione studenti

let students = [];
let loggedStudent = null;

/**
 * Carica l'elenco degli studenti dal file JSON locale
 */
async function loadUsers() {
    try {
        const response = await fetch("students.json");
        if (!response.ok) {
            throw new Error(`Impossibile caricare il file utenti: ${response.statusText}`);
        }
        students = await response.json();
        console.log("👥 Utenti caricati con successo.");
    } catch (error) {
        console.error("Errore nel caricamento degli studenti:", error);
    }
}

/**
 * Verifica le credenziali inserite
 */
async function login(username, password) {
    if (!students || students.length === 0) {
        // Se i dati non sono ancora stati caricati, riprova il caricamento prima di fallire
        await loadUsers();
    }

    const hash = await sha256(password);
    const user = students.find((s) => s.username === username && s.passwordHash === hash);

    if (user) {
        loggedStudent = user;
        return true;
    }

    return false;
}

/**
 * Restituisce i dati dello studente autenticato
 */
function getLoggedStudent() {
    return loggedStudent;
}

/**
 * Calcola l'hash SHA-256 della password
 */
async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}