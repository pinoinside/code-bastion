// storage.js
// Gestione salvataggi locali

function saveExamData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadExamData(key) {
    const value = localStorage.getItem(key);

    if (value) {
        return JSON.parse(value);
    }

    return null;
}

function removeExamData(key) {
    localStorage.removeItem(key);
}
