const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

const ignoredDirs = new Set([".git", ".agents", ".codex", "scripts"]);
const textExtensions = new Set([".html", ".css", ".js", ".json"]);

function toPosix(filePath) {
    return path.relative(root, filePath).replace(/\\/g, "/");
}

function readUtf8(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (ignoredDirs.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function addFailure(filePath, message) {
    failures.push(`${toPosix(filePath)}: ${message}`);
}

function stripQueryAndHash(rawValue) {
    const hashIndex = rawValue.indexOf("#");
    const queryIndex = rawValue.indexOf("?");
    const cutPoints = [hashIndex, queryIndex].filter((index) => index >= 0);
    const cutIndex = cutPoints.length ? Math.min(...cutPoints) : rawValue.length;

    return rawValue.slice(0, cutIndex);
}

function getHash(rawValue) {
    const hashIndex = rawValue.indexOf("#");
    if (hashIndex < 0) return "";

    const queryIndex = rawValue.indexOf("?", hashIndex);
    const endIndex = queryIndex >= 0 ? queryIndex : rawValue.length;
    return rawValue.slice(hashIndex + 1, endIndex);
}

function isExternal(rawValue) {
    return /^(https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(rawValue);
}

function hasAnchor(content, hash) {
    if (!hash) return true;

    let decodedHash = hash;
    try {
        decodedHash = decodeURIComponent(hash);
    } catch (_) {
        decodedHash = hash;
    }

    const escaped = decodedHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const anchorPattern = new RegExp(`\\b(?:id|name)=["']${escaped}["']`, "i");
    return anchorPattern.test(content);
}

function resolveLocalReference(filePath, rawValue) {
    const cleanValue = stripQueryAndHash(rawValue.trim());
    const hash = getHash(rawValue.trim());

    if (!cleanValue) {
        return { targetPath: filePath, hash };
    }

    let decodedValue = cleanValue;
    try {
        decodedValue = decodeURIComponent(cleanValue);
    } catch (_) {
        decodedValue = cleanValue;
    }

    return {
        targetPath: path.resolve(path.dirname(filePath), decodedValue),
        hash,
    };
}

function validateHtml(filePath, content) {
    const fileName = path.basename(filePath);
    if (fileName !== fileName.toLowerCase()) {
        addFailure(filePath, "el nombre del archivo HTML debe estar en minusculas");
    }

    const checks = [
        [/<style\b/i, "contiene CSS embebido en una etiqueta <style>"],
        [/<script\b(?![^>]*\bsrc=)/i, "contiene JavaScript embebido sin src"],
        [/\sstyle=["']/i, "contiene estilos inline"],
        [/\son\w+=["']/i, "contiene manejadores de eventos inline"],
        [/Unidades\.html/, "conserva una referencia antigua a Unidades.html"],
        [/Actividad_3_/, "conserva una referencia antigua a Actividad_3_*"],
        [/["'(=]\s*(?:\.\.\/)?IMAGENES\/(?:IPNb|logoenmh|logoenmh1|logoenmh2)\.png/i, "usa un logo comun fuera de RECURSOS/img"],
        [/["'(=]\s*(?:\.\.\/)?UNIDAD_\d\/img\/(?:IPNb|logoenmh2)\.png/i, "usa un logo comun duplicado dentro de una unidad"],
        [/<div\s+class=["']figure-container["']/i, "usa div.figure-container en vez de figure.figure-container"],
        [/<(?:div|p)\s+class=["']figure-caption["']/i, "usa div/p.figure-caption en vez de figcaption.figure-caption"],
    ];

    for (const [pattern, message] of checks) {
        if (pattern.test(content)) addFailure(filePath, message);
    }

    const roleButtonPattern = /<[^>]+\brole=["']button["'][^>]*>/gi;
    const roleButtons = content.match(roleButtonPattern) || [];
    for (const tag of roleButtons) {
        if (!/\btabindex=["']0["']/i.test(tag)) {
            addFailure(filePath, "un elemento role=\"button\" no incluye tabindex=\"0\"");
            break;
        }
    }

    const refs = content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi);
    for (const [, rawValue] of refs) {
        const value = rawValue.trim();
        if (!value || isExternal(value)) continue;

        const { targetPath, hash } = resolveLocalReference(filePath, value);
        if (!fs.existsSync(targetPath)) {
            addFailure(filePath, `referencia local inexistente: ${rawValue}`);
            continue;
        }

        if (hash && path.extname(targetPath).toLowerCase() === ".html") {
            const targetContent = readUtf8(targetPath);
            if (!hasAnchor(targetContent, hash)) {
                addFailure(filePath, `ancla inexistente en ${toPosix(targetPath)}: #${hash}`);
            }
        }
    }
}

function validateTextEncoding(filePath, content) {
    if (/[\u00C3\u00C2\uFFFD]/.test(content)) {
        addFailure(filePath, "posible texto con codificacion mojibake");
    }
}

function validateCssOrJs(filePath, content) {
    if (/\bconsole\.log\s*\(/.test(content)) {
        addFailure(filePath, "contiene console.log");
    }

    if (/\bdebugger\b/.test(content)) {
        addFailure(filePath, "contiene debugger");
    }
}

function assertExists(basePath, relativePath, ownerPath, label) {
    const targetPath = path.resolve(basePath, relativePath);
    if (!fs.existsSync(targetPath)) {
        addFailure(ownerPath, `${label} no existe: ${relativePath}`);
    }
}

function validateNavigationData(filePath) {
    if (!fs.existsSync(filePath)) {
        failures.push("RECURSOS/data/navegacion.json: no existe");
        return;
    }

    const data = JSON.parse(readUtf8(filePath));
    assertExists(root, data.inicio, filePath, "inicio");
    assertExists(root, data.unidades, filePath, "unidades");

    for (const asset of Object.values(data.recursosComunes || {})) {
        assertExists(root, asset, filePath, "recurso comun");
    }

    for (const unidad of data.unidadesTematicas || []) {
        assertExists(root, unidad.indice, filePath, `indice de unidad ${unidad.numero}`);
        assertExists(root, unidad.referencias, filePath, `referencias de unidad ${unidad.numero}`);

        for (const tema of unidad.temas || []) {
            assertExists(root, tema.archivo, filePath, `tema ${tema.id}`);
            assertExists(root, tema.actividad, filePath, `actividad ${tema.id}`);
        }
    }
}

const files = walk(root);
const navigationPath = path.join(root, "RECURSOS", "data", "navegacion.json");
validateNavigationData(navigationPath);

for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!textExtensions.has(ext)) continue;

    const content = readUtf8(filePath);
    validateTextEncoding(filePath, content);

    if (ext === ".html") validateHtml(filePath, content);
    if (ext === ".css" || ext === ".js") validateCssOrJs(filePath, content);
}

if (failures.length) {
    console.error("Validacion con incidencias:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Validacion completada sin incidencias.");
