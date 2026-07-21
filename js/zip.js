// zip.js
// Generazione e Firma di Sicurezza del pacchetto di consegna ZIP

// Chiave segreta per la firma HMAC (in ambiente reale viene verificata dal docente)
const EXAM_SIGNATURE_KEY = "EXAM_SECRET_KEY_2026_INTEGRITY_CHECK";

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxaMy54YCLsPqUIwGqWxnGGOB8fIn2WOPsBgaTjHKJfJdyCS_7kUoCyTgYmONcrMeX-/exec";
/**
 * Genera l'impronta digitale HMAC-SHA256 dei dati
 */
function generateIntegritySignature(dataString) {
    if (typeof CryptoJS !== "undefined") {
        return CryptoJS.HmacSHA256(dataString, EXAM_SIGNATURE_KEY).toString(CryptoJS.enc.Hex);
    }
    return "HMAC_UNAVAILABLE";
}

/**
 * Converte un oggetto Blob in una stringa Base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Invia il file ZIP a Google Drive tramite Google Apps Script
 */
async function uploadToGoogleDrive(blob, fileName) {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes("IL_TUO_SCRIPT_ID_QUI")) {
        console.warn("⚠️ URL Google Apps Script non configurato. Salto il caricamento remoto.");
        return false;
    }

    try {
        console.log("📤 Invio del file ZIP a Google Drive in corso...");
        const base64Data = await blobToBase64(blob);

        // Invio via POST al Web Endpoint di Google
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // FONDAMENTALE: evita i blocchi CORS del browser
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fileName: fileName,
                fileBase64: base64Data
            })
        });

        console.log("✅ File ZIP inviato correttamente a Google Drive!");
        return true;
    } catch (error) {
        console.error("❌ Errore durante l'invio del file a Google Drive:", error);
        return false;
    }
}

/**
 * Genera, firma, invia a Google Drive e scarica lo ZIP di consegna
 * @param {string} studentName - Nome o ID dello studente
 * @param {Object} filesToZip - Oggetto con { nomeFile: contenuto }
 */
async function generateSubmissionZip(studentName, filesToZip) {
    if (typeof JSZip === "undefined") {
        console.error("❌ Libreria JSZip non caricata!");
        return;
    }

    // 1. Mettiamo in PAUSA il monitoraggio per evitare falsi allarmi durante il download/upload
    if (typeof pauseMonitoring === "function") {
        pauseMonitoring();
    }

    try {
        const zip = new JSZip();
        let combinedContent = "";

        // Aggiungiamo i file utente nello ZIP e accumuliamo il contenuto per la firma
        for (const [filename, content] of Object.entries(filesToZip)) {
            zip.file(filename, content);
            combinedContent += `[${filename}]\n${content}\n`;
        }

        // 2. Calcoliamo la firma d'integrità HMAC
        const integrityHash = generateIntegritySignature(combinedContent);
        
        const signatureManifest = {
            student: studentName,
            timestamp: new Date().toISOString(),
            signature: integrityHash,
            files: Object.keys(filesToZip)
        };

        // Inseriamo i file di controllo nello ZIP
        zip.file("signature.sig", integrityHash);
        zip.file("manifest.json", JSON.stringify(signatureManifest, null, 2));

        // 3. Generiamo il file BLOB ZIP finale
        const blob = await zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 }
        });

        // Nome file pulito e formattato: consegna_{nome_studente}.zip
        const safeStudentName = (studentName || "studente")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_-]/g, "");

        const fileName = `consegna_${safeStudentName}.zip`;

        // 4. Caricamento remoto su Google Drive
        await uploadToGoogleDrive(blob, fileName);

        // 5. Download locale di backup per lo studente
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`🔒 Consegna completata e salvata: ${fileName}`);
    } catch (error) {
        console.error("❌ Errore durante la creazione dello ZIP:", error);
    } finally {
        // 6. Riattiviamo il monitoraggio anti-cheat con un piccolo margine di sicurezza
        if (typeof resumeMonitoring === "function") {
            resumeMonitoring();
        }
    }
}

/**
 * Genera e scarica il file ZIP di consegna firmato
 * @param {string} studentName - Nome o ID dello studente
 * @param {Object} filesToZip - Oggetto con { nomeFile: contenuto }
 */
async function generateSubmissionZipDownloadFile(studentName, filesToZip) {
    if (typeof JSZip === "undefined") {
        console.error("Libreria JSZip non caricata!");
        return;
    }

    // 1. Sospendiamo temporaneamente il monitoraggio per evitare allarmi durante il download
    if (typeof pauseMonitoring === "function") {
        pauseMonitoring();
    }

    try {
        const zip = new JSZip();

        // Concateniamo i contenuti dei file per calcolare la firma unica del pacchetto
        let combinedContent = "";

        // Aggiungiamo i file utente nello ZIP e accumuliamo il contenuto per la firma
        for (const [filename, content] of Object.entries(filesToZip)) {
            zip.file(filename, content);
            combinedContent += `[${filename}]\n${content}\n`;
        }

        // 2. Generiamo il file di firma di integrità (HMAC)
        const integrityHash = generateIntegritySignature(combinedContent);
        
        const signatureManifest = {
            student: studentName,
            timestamp: new Date().toISOString(),
            signature: integrityHash,
            files: Object.keys(filesToZip)
        };

        // Inseriamo lo stampo d'integrità e il file di verifica nello ZIP
        zip.file("signature.sig", integrityHash);
        zip.file("manifest.json", JSON.stringify(signatureManifest, null, 2));

        // 3. Generiamo il pacchetto ZIP finale
        const blob = await zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 }
        });

        // Nome file pulito
        const safeStudentName = (studentName || "studente")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_-]/g, "");

        const fileName = `consegna_${safeStudentName}.zip`;

        // 4. Download del file
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`🔒 Consegna firmata e scaricata con successo: ${fileName}`);
    } catch (error) {
        console.error("Errore durante la firma e creazione dello ZIP:", error);
    } finally {
        // 5. Riattiviamo il monitoraggio
        if (typeof resumeMonitoring === "function") {
            resumeMonitoring();
        }
    }
}