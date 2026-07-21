// python.js
// Gestione interprete Python locale tramite Pyodide con Terminal Input inline

let pyInstance = null;
let inputResolver = null;

async function loadPython() {
    if (pyInstance) return;

    setPythonStatus("🟡 Loading WASM...", "loading");

    try {
        pyInstance = await loadPyodide({
            indexURL: "lib/pyodide/"
        });

        setPythonStatus("🟢 Ready", "online");
        console.log("🐍 Pyodide ambiente Python caricato con successo!");
    } catch (error) {
        console.error("Errore durante l'inizializzazione di Pyodide:", error);
        setPythonStatus("🔴 Error Loading", "offline");
    }
}

function setPythonStatus(text, statusClass = "") {
    const el = document.getElementById("python-status");
    if (el) {
        el.innerText = text;
        el.className = "status-value status-pill " + statusClass;
    }
}

/*
 Esegue codice Python e cattura print() e input()
*/
async function runPython(code) {
    if (!pyInstance) {
        await loadPython();
    }

    if (!pyInstance) {
        return "ERROR: Impossibile caricare l'interprete Python locale.";
    }

    // Assicuriamoci che l'input del terminale sia nascosto all'inizio
    hideTerminalInput();

    try {
        pyInstance.globals.set("js_request_input", requestInput);

        await pyInstance.runPythonAsync(`
import sys
import builtins
import ast
from io import StringIO

sys.stdout = StringIO()

js_func = globals()['js_request_input']

async def _custom_input(prompt_msg=""):
    res = await js_func(prompt_msg)
    return str(res)

builtins.input = _custom_input

def _prepare_and_transform(code_str):
    tree = ast.parse(code_str)
    
    class InputTransformer(ast.NodeTransformer):
        def visit_Call(self, node):
            self.generic_visit(node)
            if isinstance(node.func, ast.Name) and node.func.id == 'input':
                return ast.Await(value=node)
            return node

    transformed = InputTransformer().visit(tree)
    
    wrapper_func = ast.AsyncFunctionDef(
        name='_user_async_runner',
        args=ast.arguments(
            posonlyargs=[], args=[], vararg=None, kwonlyargs=[],
            kw_defaults=[], kwarg=None, defaults=[]
        ),
        body=transformed.body,
        decorator_list=[],
        returns=None
    )
    
    wrapper_module = ast.Module(body=[wrapper_func], type_ignores=[])
    ast.fix_missing_locations(wrapper_module)
    return wrapper_module
`);

        await pyInstance.runPythonAsync(`
_transformed_ast = _prepare_and_transform(${JSON.stringify(code)})
_compiled_code = compile(_transformed_ast, filename="<user_code>", mode="exec")
`);

        await pyInstance.runPythonAsync(`
_env = globals()
exec(_compiled_code, _env)
await _env['_user_async_runner']()
`);

        let output = await pyInstance.runPythonAsync("sys.stdout.getvalue()");
        return output || "(Esecuzione completata senza output)";
    } catch (error) {
        return "ERROR:\n" + error.toString();
    } finally {
        hideTerminalInput();
    }
}

/*
 Gestione dell'Input Inline nel Terminale
*/
function requestInput(message) {
    return new Promise((resolve) => {
        inputResolver = resolve;
        
        const outputEl = document.getElementById("console-output");
        const inputRow = document.getElementById("terminal-input-row");
        const inputField = document.getElementById("terminal-input-field");

        // Se c'è un messaggio di prompt (es. "Come ti chiami? "), lo stampiamo nell'output
        if (message && outputEl) {
            outputEl.innerText += message;
        }

        // Mettiamo in pausa il monitoraggio durante l'input
        if (typeof pauseMonitoring === "function") pauseMonitoring();

        // Mostriamo il campo di testo in calce al terminale
        if (inputRow && inputField) {
            inputRow.hidden = false;
            inputRow.style.display = "flex";
            inputField.value = "";
            setTimeout(() => inputField.focus(), 50);
        }
    });
}

function handleTerminalKeyDown(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        submitTerminalInput();
    }
}

function submitTerminalInput() {
    const outputEl = document.getElementById("console-output");
    const inputField = document.getElementById("terminal-input-field");
    const value = inputField ? inputField.value : "";

    // Stampiamo la risposta dell'utente direttamente nel terminale seguita da a capo
    if (outputEl) {
        outputEl.innerText += value + "\n";
    }

    hideTerminalInput();

    // Riattiviamo il monitoraggio anti-cheat
    if (typeof resumeMonitoring === "function") resumeMonitoring();

    if (inputResolver) {
        const resolve = inputResolver;
        inputResolver = null;
        resolve(value);
    }
}

function hideTerminalInput() {
    const inputRow = document.getElementById("terminal-input-row");
    const inputField = document.getElementById("terminal-input-field");

    if (inputRow) {
        inputRow.hidden = true;
        inputRow.style.display = "none";
    }
    if (inputField) {
        inputField.value = "";
    }
}