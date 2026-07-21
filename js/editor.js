// editor.js
// Inizializzazione e gestione Monaco Editor

let editor = null;
let editorLoading = false;
let monacoReady = false;

function createEditor() {
    console.log("createEditor chiamata", {
        editor,
        editorLoading,
        monacoReady
    });

    if (editor) {
        // Se l'editor esiste già, forza il ricalcolo delle dimensioni del layout
        editor.layout();
        return;
    }

    if (editorLoading) {
        return;
    }

    editorLoading = true;

    if (!window.monacoRequested) {
        window.monacoRequested = true;
        require.config({ paths: { vs: 'lib/monaco/vs' } });
    }

    console.log("Richiedo Monaco editor.main");
    require(["vs/editor/editor.main"], function () {
        monacoReady = true;

        // Recupera eventuale codice precedentemente salvato in bozza
        const savedCode = localStorage.getItem("exam_code");
        const initialCode = savedCode ? savedCode : `# Python Code\n\nprint("Hello CodeBastion!")\n`;

        const container = document.getElementById("editor");
        if (!container) {
            console.error("Elemento #editor non trovato nel DOM");
            editorLoading = false;
            return;
        }

        editor = monaco.editor.create(container, {
            value: initialCode,
            language: "python",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: {
                enabled: false
            },
            fontSize: 15,
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            lineHeight: 22,
            padding: { top: 12 }
        });

        editorLoading = false;
        
        // Piccolo trigger layout per assicurarsi che si adatti al container visibile
        setTimeout(() => {
            if (editor) editor.layout();
        }, 100);
    });
}

function getCode() {
    if (editor) {
        return editor.getValue();
    }
    return "";
}

function setCode(code) {
    if (editor) {
        editor.setValue(code);
    }
}

function saveCode() {
    if (editor) {
        localStorage.setItem("exam_code", editor.getValue());
    }
}