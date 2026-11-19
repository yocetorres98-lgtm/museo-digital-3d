/* ============================================================
   Museo Guía 3D — plaza exterior + 13 salas
   12 salas municipales alrededor de un patio central
   1 pabellón de estadísticas en el centro del patio
   Motor: three.js r128 (incluido localmente, funciona sin internet)
   ============================================================ */

const RUTA_IMG = "img/";

// ------------------------------------------------------------
// Geometría general del recinto
// ------------------------------------------------------------
const EXT = {
    LIM: 46,            // límite caminable y muros perimetrales
    JAR: 24,            // cara de las salas que da al patio central
    ANCHO_PAB: 14,      // profundidad de una sala (de la puerta al fondo)
    LARGO_PAB: 12,      // anchura de una sala a lo largo del borde
    MEDIO: 6,           // LARGO_PAB / 2
    ALTO: 5.2,
    MEDIA_PUERTA: 2,    // media anchura del hueco de la puerta
    ESPE: 0.2,          // medio espesor del muro
    HALL: 8,            // semiancho del pabellón de estadísticas (16 x 16)
    SPAWN_X: 0,
    SPAWN_Z: 43
};

// Reparto de las 13 salas. Los 12 primeros lugares son los municipios de
// data.js, en su mismo orden; el último es la sala de estadísticas.
// rot: 0 (este) | PI (oeste) | PI/2 (norte) | -PI/2 (sur)
const DISTRIBUCION = [
    { fila: "norte", cx: -18, paredes: [true, false] },
    { fila: "norte", cx: -6, paredes: [true, false] },
    { fila: "norte", cx: 6, paredes: [true, false] },
    { fila: "norte", cx: 18, paredes: [true, true] },
    { fila: "este", cz: -12, paredes: [true, false] },
    { fila: "este", cz: 0, paredes: [true, false] },
    { fila: "este", cz: 12, paredes: [true, true] },
    { fila: "sur", cx: 17, paredes: [true, true] },
    { fila: "sur", cx: -17, paredes: [true, true] },
    { fila: "oeste", cz: 12, paredes: [true, false] },
    { fila: "oeste", cz: 0, paredes: [true, false] },
    { fila: "oeste", cz: -12, paredes: [true, true] },
    { fila: "hall" }
];

// ------------------------------------------------------------
// Estado del juego
// ------------------------------------------------------------
const estado = {
    sala: -1,             // índice de la sala actual (-1 = patio/exterior)
    puerta: 0,            // puerta por la que se entró a la sala actual
    obra: 0,              // siguiente obra por ver dentro de la sala
    tiempo: 0,
    visitadas: {},
    salasCompletadas: 0
};

const jugador = {
    pos: new THREE.Vector3(EXT.SPAWN_X, 1.7, EXT.SPAWN_Z),
    yaw: 0,               // mirando hacia -z (hacia el museo)
    pitch: 0,
    vel: new THREE.Vector3(),
    alturaOjos: 1.7
};

const entrada = { x: 0, y: 0, activa: false };

// datos del visitante que registró la app (los pasa Kotlin)
let claveActual = "";
let correoActual = "";

const salas = [];              // las 13 salas del museo
const imagenesCargadas = { ok: 0, fallo: 0 };

// Si una fotografía no está en img/, se repite otra que sí exista para que
// ningún cuadro quede vacío. Se recorre la lista en orden.
const RESERVA_FOTOS = [
    "ameca1.jpg", "chalco1.jpg", "tepe3.jpg", "tlama2.jpg",
    "ozumba1.jpg", "tema2.jpg", "nepa1.jpg", "eca1.jpg", "co1.jpg"
];
let reservaFoto = 0;

// Imágenes de personajes/ que se repiten cuando falta un retrato o un póster.
const RESERVA_PERSONAJES = [
    "galeria_imagen_1.jpg", "galeria_imagen_2.jpg", "galeria_imagen_3.jpg",
    "personaje_2.jpg", "personaje_3.jpg", "personaje_4.jpg", "personaje_5.jpg"
];
let reservaPoster = 0;

// ------------------------------------------------------------
// Escena / render
// ------------------------------------------------------------
const escena = new THREE.Scene();
escena.background = new THREE.Color(0xa9b6b7);
escena.fog = new THREE.Fog(0xa9b6b7, 60, 175);

const camara = new THREE.PerspectiveCamera(72, 1, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("lienzo").appendChild(renderer.domElement);

function redimensionar() {
    const w = window.innerWidth, h = window.innerHeight;
    // En vertical la pantalla es angosta: se abre el campo de visión para que
    // se vea el mismo ancho que en horizontal.
    const aspecto = w / h;
    camara.aspect = aspecto;
    camara.fov = aspecto < 1 ? 84 : 74;
    camara.updateProjectionMatrix();
    renderer.setSize(w, h, false);
}
window.addEventListener("resize", redimensionar);
redimensionar();

// ------------------------------------------------------------
// Luces
// ------------------------------------------------------------
escena.add(new THREE.AmbientLight(0xf7ecd8, 0.78));
escena.add(new THREE.HemisphereLight(0xdbe4e6, 0x6d5b45, 0.36));

const sol = new THREE.DirectionalLight(0xffe6bd, 1.0);
sol.position.set(30, 46, 34);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.camera.left = -52;
sol.shadow.camera.right = 52;
sol.shadow.camera.top = 60;
sol.shadow.camera.bottom = -60;
sol.shadow.camera.far = 140;
escena.add(sol);

// ------------------------------------------------------------
// Materiales compartidos
// ------------------------------------------------------------
const matPasto = new THREE.MeshStandardMaterial({ color: 0x7b8564, roughness: 1 });
const matPlaza = new THREE.MeshStandardMaterial({ color: 0xb8b1a4, roughness: 0.95 });
const matCamino = new THREE.MeshStandardMaterial({ color: 0xb08a5f, roughness: 0.9 });
const matPared = new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.9 });
const matZocalo = new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 0.65 });
const madMarco = new THREE.MeshStandardMaterial({ color: 0x5b3d26, roughness: 0.5, metalness: 0.15 });
const matOro = new THREE.MeshStandardMaterial({ color: 0xe2b04a, roughness: 0.3, metalness: 0.7, emissive: 0x6b4c00 });
const matPiso = new THREE.MeshStandardMaterial({ color: 0xa39d92, roughness: 0.85 });
const matAmarilloBajo = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xfbf3c4).convertSRGBToLinear()
});const matTecho = new THREE.MeshStandardMaterial({ color: 0xeee4d2, roughness: 1 });
const matMadera = new THREE.MeshStandardMaterial({ color: 0x5b3d26, roughness: 0.8 });
const matPiedra = new THREE.MeshStandardMaterial({ color: 0x8d8b86, roughness: 0.9 });
const matLuzTecho = new THREE.MeshBasicMaterial({ color: 0xfff1cf });
const matAlfombra = new THREE.MeshStandardMaterial({ color: 0x6e6459, roughness: 1 });

function cajaG(grupo, w, h, d, material, x, y, z, sombra) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = sombra !== false;
    m.receiveShadow = sombra !== false;
    grupo.add(m);
    return m;
}

function caja(w, h, d, material, x, y, z, sombra) {
    return cajaG(escena, w, h, d, material, x, y, z, sombra);
}

// ------------------------------------------------------------
// Regiones caminables y obstáculos
// ------------------------------------------------------------
const regiones = [];    // rectángulos por los que SÍ puede caminar el jugador
const obstaculos = [];  // rectángulos por los que NO puede pasar

function agregarRegion(xA, xB, zA, zB) {
    regiones.push({
        xMin: Math.min(xA, xB), xMax: Math.max(xA, xB),
        zMin: Math.min(zA, zB), zMax: Math.max(zA, zB)
    });
}

function agregarObstaculo(xA, xB, zA, zB) {
    obstaculos.push({
        xMin: Math.min(xA, xB), xMax: Math.max(xA, xB),
        zMin: Math.min(zA, zB), zMax: Math.max(zA, zB)
    });
}

// ------------------------------------------------------------
// Textos, letreros y paneles informativos
// ------------------------------------------------------------
function envolver(ctx, texto, maxPx) {
    const palabras = String(texto).split(/\s+/);
    const lineas = [];
    let actual = "";
    for (let i = 0; i < palabras.length; i++) {
        const prueba = actual ? actual + " " + palabras[i] : palabras[i];
        if (ctx.measureText(prueba).width > maxPx && actual) {
            lineas.push(actual);
            actual = palabras[i];
        } else {
            actual = prueba;
        }
    }
    if (actual) lineas.push(actual);
    return lineas;
}

function texturaCanvas(c) {
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
}

/** Texto suelto en un plano de 1 m de alto (letreros y cartelas). */
function crearTexto(texto, tam, color) {
    const MAX_PX = 880;
    const ALTO_L = 150;

    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.font = "bold 128px sans-serif";

    const lineas = envolver(ctx, texto, MAX_PX);

    let anchoPx = 0;
    lineas.forEach(function (l) { anchoPx = Math.max(anchoPx, ctx.measureText(l).width); });

    c.width = Math.min(MAX_PX + 40, anchoPx + 40);
    c.height = lineas.length * ALTO_L + 20;

    const c2 = c.getContext("2d");
    c2.font = "bold 128px sans-serif";
    c2.fillStyle = color;
    c2.textAlign = "center";
    c2.textBaseline = "middle";
    lineas.forEach(function (l, i) {
        c2.fillText(l, c.width / 2, ALTO_L / 2 + 10 + i * ALTO_L);
    });

    const mat = new THREE.MeshBasicMaterial({ map: texturaCanvas(c), transparent: true, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(c.width / c.height, 1), mat);
    m.renderOrder = 6;
    return m;
}

/** Reduce el letrero para que nunca supere una anchura máxima en metros. */
function crearLetrero(texto, color, anchoMax) {
    const m = crearTexto(texto, 1, color);
    const w = m.geometry.parameters.width;
    if (w > anchoMax) {
        const s = anchoMax / w;
        m.scale.set(s, s, 1);
    }
    return m;
}

function rellenarRedondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** Panel informativo de pared: título negro sobre amarillo muy bajo. */
function crearPanel(titulo, cuerpo, color, anchoM, altoM) {
    const PX = 150;
    const c = document.createElement("canvas");
    c.width = Math.round(anchoM * PX);
    c.height = Math.round(altoM * PX);
    const ctx = c.getContext("2d");

    // Fondo amarillo muy bajo y texto negro para conservar el contraste.
    ctx.fillStyle = "#FBF6D5";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

    ctx.fillStyle = "#F7EDB0";
    ctx.fillRect(10, 10, c.width - 20, 56);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let t = titulo;
    while (ctx.measureText(t).width > c.width - 46 && t.length > 6) {
        t = t.substring(0, t.length - 2);
    }
    ctx.fillText(t, 24, 38);

    ctx.fillStyle = "#000000";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const lineas = envolver(ctx, cuerpo, c.width - 48);
    let y = 86;
    for (let i = 0; i < lineas.length && y < c.height - 18; i++) {
        ctx.fillText(lineas[i], 24, y);
        y += 29;
    }

    return new THREE.Mesh(new THREE.PlaneGeometry(anchoM, altoM),
        new THREE.MeshBasicMaterial({ map: texturaCanvas(c) }));
}

/** Marco de madera que enmarca un panel sobre el muro. */
function marcoDePanel(grupo, ancho, alto, x, y, z, giro) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho + 0.4, alto + 0.4), madMarco);
    m.position.set(x, y, z);
    m.rotation.y = giro;
    grupo.add(m);
    return m;
}

/** Panel a partir de una función que dibuja directamente en el canvas. */
function crearPanelDibujo(funcion, anchoM, altoM, px) {
    const P = px || 200;
    const c = document.createElement("canvas");
    c.width = Math.round(anchoM * P);
    c.height = Math.round(altoM * P);
    funcion(c.getContext("2d"), c.width, c.height);
    return new THREE.Mesh(new THREE.PlaneGeometry(anchoM, altoM),
        new THREE.MeshBasicMaterial({ map: texturaCanvas(c) }));
}

// ------------------------------------------------------------
// Plaza exterior: pasto, camino, muros y recepción
// ------------------------------------------------------------
const LIM = EXT.LIM;
caja(LIM * 2 + 10, 0.3, LIM * 2 + 10, matPasto, 0, -0.16, 0, false);
caja(LIM * 2, 0.3, LIM * 2, matPlaza, 0, -0.145, 0, false);
caja(22, 0.3, LIM * 2, matCamino, 0, -0.13, 0, false);

// muros perimetrales
const MT = 0.4, MH = 2.0;
caja(LIM * 2 + MT * 2, MH, MT, matPiedra, 0, MH / 2, -LIM - MT / 2, false);
caja(LIM * 2 + MT * 2, MH, MT, matPiedra, 0, MH / 2, LIM + MT / 2, false);
caja(MT, MH, LIM * 2, matPiedra, -LIM - MT / 2, MH / 2, 0, false);
caja(MT, MH, LIM * 2, matPiedra, LIM + MT / 2, MH / 2, 0, false);

// recepción, detrás del punto de aparición
caja(12, 1.15, 1.4, matMadera, 11, 0.58, 43.7, true);
caja(14, 5.0, 0.5, matPared, 11, 2.5, 45.6, false);
// El muro de recepción se remata más abajo con el cuadro de agradecimiento
// (crearAgradecimientoRecepcion), que sustituye al antiguo letrero de texto.
agregarObstaculo(5, 17, 43, 45.2);

// cartel de bienvenida a la izquierda del camino
caja(0.35, 3.0, 0.35, matMadera, -12, 1.5, 41, true);
const cartelBienvenida = crearLetrero("13 salas · Recorrido libre", "#ffffff", 9);
cartelBienvenida.position.set(-12, 3.6, 41);
cartelBienvenida.rotation.y = 0;
cartelBienvenida.material.depthWrite = false;
escena.add(cartelBienvenida);

// volcanes al fondo (decoración)
function crearVolcan(x, z, radio, alto, color) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(radio, alto, 26),
        new THREE.MeshStandardMaterial({ color: color, roughness: 1, flatShading: true }));
    m.position.set(x, alto / 2 - 2, z);
    escena.add(m);
    const nieve = new THREE.Mesh(new THREE.ConeGeometry(radio * 0.34, alto * 0.26, 26),
        new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 1, flatShading: true }));
    nieve.position.set(x, alto - 2 - alto * 0.13, z);
    escena.add(nieve);
}
crearVolcan(48, -78, 28, 46, 0x7c7466);
crearVolcan(-52, -84, 32, 28, 0x857b6c);
crearVolcan(0, -96, 24, 34, 0x776f62);

// árboles, bancas y fuente
function crearArbol(x, z) {
    caja(0.5, 3, 0.5, matMadera, x, 1.5, z, true);
    const copa = new THREE.Mesh(new THREE.SphereGeometry(1.9, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0x5f6d52, roughness: 1, flatShading: true }));
    copa.position.set(x, 3.9, z);
    copa.castShadow = true;
    escena.add(copa);
    agregarObstaculo(x - 0.7, x + 0.7, z - 0.7, z + 0.7);
}

function crearBanca(x, z, horizontal) {
    const ancho = horizontal ? 2.4 : 0.7;
    const fondo = horizontal ? 0.7 : 2.4;
    caja(ancho, 0.12, fondo, matMadera, x, 0.48, z, true);
    caja(horizontal ? 0.15 : ancho, 0.5, horizontal ? fondo : 0.15, matMadera,
        x + (horizontal ? -ancho / 2 + 0.1 : 0), 0.75, z + (horizontal ? 0 : -fondo / 2 + 0.1), true);
    agregarObstaculo(x - ancho / 2, x + ancho / 2, z - fondo / 2, z + fondo / 2);
}

crearBanca(-9, 36, false);
crearBanca(9, 36, false);
crearBanca(-21, 14, false);
crearBanca(21, 14, false);
crearBanca(-21, -14, false);
crearBanca(21, -14, false);
crearArbol(-30, 33);
crearArbol(30, 33);
crearArbol(-33, 22);
crearArbol(33, 22);
crearArbol(-33, -22);
crearArbol(33, -22);
crearArbol(-30, -33);
crearArbol(30, -33);
crearArbol(-13, 41);
crearArbol(-18, -41);
crearArbol(18, -41);

caja(6.4, 0.5, 6.4, matPiedra, 0, 0.25, -41, true);
caja(5.4, 0.45, 5.4, new THREE.MeshStandardMaterial({ color: 0x748f98, roughness: 0.25, metalness: 0.1 }), 0, 0.52, -41, false);
caja(1.1, 2.2, 1.1, matPiedra, 0, 1.6, -41, true);
caja(2.4, 0.35, 2.4, matPiedra, 0, 2.9, -41, true);
agregarObstaculo(-3.2, 3.2, -44.2, -37.8);

// ------------------------------------------------------------
// Regiones caminables del recinto
// ------------------------------------------------------------
const JAR = EXT.JAR;                 // 24
const FONDO = JAR + EXT.ANCHO_PAB;   // 38: cara exterior de las salas

// bandas exteriores (entre las salas y el muro perimetral)
agregarRegion(-LIM, LIM, -LIM, -FONDO);
agregarRegion(-LIM, LIM, FONDO, LIM);
agregarRegion(-LIM, -FONDO, -FONDO, FONDO);
agregarRegion(FONDO, LIM, -FONDO, FONDO);

// bloques y pasos que unen las bandas exteriores con el patio
agregarRegion(-FONDO, -JAR, -FONDO, -JAR);   // noroeste
agregarRegion(JAR, FONDO, -FONDO, -JAR);     // noreste
agregarRegion(-FONDO, -JAR, JAR, FONDO);     // suroeste
agregarRegion(JAR, FONDO, JAR, FONDO);       // sureste

agregarRegion(-FONDO, -JAR, -JAR, -18);      // hueco norte del ala oeste
agregarRegion(-FONDO, -JAR, 18, JAR);        // hueco sur del ala oeste
agregarRegion(JAR, FONDO, -JAR, -18);        // hueco norte del ala este
agregarRegion(JAR, FONDO, 18, JAR);          // hueco sur del ala este

agregarRegion(-11, 11, JAR, FONDO);          // entrada principal (fila sur)

// patio central, en cuatro franjas para no cruzar el pabellón central
agregarRegion(-JAR, JAR, -JAR, -EXT.HALL - 0.3);
agregarRegion(-JAR, JAR, EXT.HALL + 0.3, JAR);
agregarRegion(-JAR, -EXT.HALL - 0.3, -EXT.HALL - 0.3, EXT.HALL + 0.3);
agregarRegion(EXT.HALL + 0.3, JAR, -EXT.HALL - 0.3, EXT.HALL + 0.3);

// ------------------------------------------------------------
// Construcción de salas
// ------------------------------------------------------------
function municipioPorId(id) {
    for (let i = 0; i < MUNICIPIOS.length; i++) {
        if (MUNICIPIOS[i].id === id) return MUNICIPIOS[i];
    }
    return MUNICIPIOS[0];
}

function rotarLocal(rot, lx, lz) {
    const c = Math.cos(rot), s = Math.sin(rot);
    return { x: lx * c + lz * s, z: -lx * s + lz * c };
}

function localAMundo(grupo, lx, ly, lz) {
    return new THREE.Vector3(lx, ly, lz).applyQuaternion(grupo.quaternion).add(grupo.position);
}

/** Muro local lleno. */
function muro(g, w, h, d, x, y, z) {
    return cajaG(g, w, h, d, matPared, x, y, z, false);
}

/**
 * Construye el cuerpo de una sala en coordenadas locales.
 * El origen local es el centro de la puerta; el interior va hacia +x
 * y la sala ocupa z desde -MEDIO hasta +MEDIO.
 */
function crearCuerpoSala(cfg) {
    const g = new THREE.Group();
    g.position.set(cfg.pos.x, 0, cfg.pos.z);
    g.rotation.y = cfg.rot;
    escena.add(g);

    const A = EXT.ANCHO_PAB, M = EXT.MEDIO, H = EXT.ALTO, MP = EXT.MEDIA_PUERTA, E = EXT.ESPE;

    // piso, techo y luz de techo
    cajaG(g, A, 0.3, M * 2, matPiso, A / 2, -0.15, 0, false);
    cajaG(g, A + 1.6, 0.45, M * 2 + 1.6, matTecho, A / 2, H + 0.22, 0, false);
    const luz = new THREE.Mesh(new THREE.PlaneGeometry(A - 2.4, M * 2 - 2.4), matLuzTecho);
    luz.rotation.x = Math.PI / 2;
    luz.position.set(A / 2, H - 0.06, 0);
    g.add(luz);

    // muro del fondo
    muro(g, 0.4, H, M * 2, A, H / 2, 0);

    // zócalo de madera, listón dorado y cornisa: el sello del museo
    cajaG(g, 0.14, 0.9, M * 2, matZocalo, A - E - 0.07, 0.45, 0, false);
    cajaG(g, 0.06, 0.06, M * 2, matOro, A - E - 0.15, 0.93, 0, false);
    cajaG(g, 0.18, 0.22, M * 2, matMadera, A - E - 0.09, H - 0.16, 0, false);

    // alfombra de piedra que guía la mirada hacia las fotografías
    cajaG(g, 8.6, 0.02, 8.8, matAlfombra, A / 2 + 1.6, 0.012, 0, false);

    // muros laterales (el de la derecha solo si no hay sala contigua)
    if (cfg.paredes[0]) {
        muro(g, A, H, 0.4, A / 2, H / 2, -M);
        cajaG(g, A - 2 * E, 0.9, 0.14, matZocalo, A / 2, 0.45, -(M - E - 0.07), false);
        cajaG(g, A - 2 * E, 0.06, 0.06, matOro, A / 2, 0.93, -(M - E - 0.15), false);
        cajaG(g, A - 2 * E, 0.22, 0.18, matMadera, A / 2, H - 0.16, -(M - E - 0.09), false);
    }
    if (cfg.paredes[1]) {
        muro(g, A, H, 0.4, A / 2, H / 2, M);
        cajaG(g, A - 2 * E, 0.9, 0.14, matZocalo, A / 2, 0.45, M - E - 0.07, false);
        cajaG(g, A - 2 * E, 0.06, 0.06, matOro, A / 2, 0.93, M - E - 0.15, false);
        cajaG(g, A - 2 * E, 0.22, 0.18, matMadera, A / 2, H - 0.16, M - E - 0.09, false);
    }

    // muro frontal con el hueco de la puerta
    const tramo = M - MP;
    muro(g, 0.4, H, tramo, 0, H / 2, -(MP + tramo / 2));
    muro(g, 0.4, H, tramo, 0, H / 2, (MP + tramo / 2));
    muro(g, 0.4, H - 3.9, MP * 2, 0, (3.9 + H) / 2, 0);   // dintel
    [-(MP + tramo / 2), (MP + tramo / 2)].forEach(function (z) {
        cajaG(g, 0.14, 0.9, tramo, matZocalo, E + 0.07, 0.45, z, false);
        cajaG(g, 0.06, 0.06, tramo, matOro, E + 0.15, 0.93, z, false);
    });

    // marco de la puerta con el color de la sala
    const matTema = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.7 });
    cajaG(g, 0.35, 3.9, 0.35, matTema, 0, 1.95, -(MP + 0.16), true);
    cajaG(g, 0.35, 3.9, 0.35, matTema, 0, 1.95, (MP + 0.16), true);
    cajaG(g, 0.35, 0.35, MP * 2 + 0.7, matTema, 0, 3.85, 0, true);

    // letrero exterior y cartel interior con el nombre de la sala
    const letrero = crearLetrero(cfg.num + "  " + cfg.emoji + "  " + cfg.nombre, "#000000", 9.5);
    letrero.position.set(-(E + 0.1), 4.62, 0);
    letrero.rotation.y = -Math.PI / 2;
    letrero.material.depthWrite = false;

    // fondo amarillo muy bajo para que el nombre se lea desde el patio
    const anchoLetrero = letrero.geometry.parameters.width * letrero.scale.x;
    const altoLetrero = Math.max(0.8, letrero.scale.y + 0.34);
    cajaG(g, 0.07, altoLetrero, anchoLetrero + 0.6,
        matAmarilloBajo, -(E + 0.04), 4.62, 0, false);
    cajaG(g, 0.02, 0.05, anchoLetrero + 0.72,
        matOro, -(E + 0.07), 4.62 + altoLetrero / 2, 0, false);

    g.add(letrero);

    const cartel = crearPanel(cfg.nombre, cfg.subtitulo, cfg.color, 3.8, 1.1);
    cartel.position.set(E + 0.12, 4.55, 0);
    cartel.rotation.y = -Math.PI / 2;
    g.add(cartel);
    marcoDePanel(g, 3.8, 1.1, E + 0.15, 4.55, 0, -Math.PI / 2);

    // AABB en coordenadas del mundo, para saber si el jugador está dentro
    let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
    [[0, -M], [0, M], [A, -M], [A, M]].forEach(function (p) {
        const w = rotarLocal(cfg.rot, p[0], p[1]);
        xMin = Math.min(xMin, w.x); xMax = Math.max(xMax, w.x);
        zMin = Math.min(zMin, w.z); zMax = Math.max(zMax, w.z);
    });

    return {
        grupo: g, num: cfg.num, tema: cfg.tema, color: cfg.color,
        rot: cfg.rot, pos: cfg.pos, normal: cfg.normal,
        aabb: {
            xMin: cfg.pos.x + xMin + 0.4, xMax: cfg.pos.x + xMax - 0.4,
            zMin: cfg.pos.z + zMin + 0.4, zMax: cfg.pos.z + zMax - 0.4
        },
        vistas: {}, obras: [],
        puertas: [{ x: cfg.pos.x, z: cfg.pos.z, nx: cfg.normal.x, nz: cfg.normal.z }]
    };
}

/** Regiones caminables de una sala con una sola puerta frontal. */
function regionesDeSala(s) {
    const A = EXT.ANCHO_PAB, M = EXT.MEDIO, MP = EXT.MEDIA_PUERTA, E = EXT.ESPE;
    // interior
    const i0 = rotarLocal(s.rot, E + 0.5, -(M - 0.5));
    const i1 = rotarLocal(s.rot, A - E - 0.5, (M - 0.5));
    agregarRegion(s.pos.x + i0.x, s.pos.x + i1.x, s.pos.z + i0.z, s.pos.z + i1.z);
    // paso de la puerta
    const p0 = rotarLocal(s.rot, -1.2, -(MP - 0.2));
    const p1 = rotarLocal(s.rot, 1.2, (MP - 0.2));
    agregarRegion(s.pos.x + p0.x, s.pos.x + p1.x, s.pos.z + p0.z, s.pos.z + p1.z);
}

function crearSalaMunicipio(municipio, cfg) {
    cfg.tema = municipio;
    cfg.nombre = municipio.nombre;
    cfg.emoji = municipio.emoji;
    cfg.color = municipio.color;
    cfg.subtitulo = "Sala " + cfg.num + " de 13 · " +
        (municipio.lema || municipio.lugares.split(",")[0]);

    const s = crearCuerpoSala(cfg);
    s.municipio = municipio;

    const g = s.grupo;
    const A = EXT.ANCHO_PAB, M = EXT.MEDIO, E = EXT.ESPE;

    // 3 fotografías sobre el muro del fondo, mirando a la puerta
    [-4, 0, 4].forEach(function (z, k) {
        s.obras.push(crearObra(municipio, k, g, A - E - 0.08, z, -Math.PI / 2));
    });

    // 4 paneles informativos: dos por muro lateral
    const paneles = [
        ["Raíces", municipio.historia],
        ["Fiesta y memoria", municipio.cultura],
        ["Territorio vivido", municipio.lugares + " " + municipio.paisaje],
        ["Lo que da la tierra", municipio.cultivos + " " + municipio.riqueza]
    ];
    const px = [3.5, 10.5];
    paneles.forEach(function (p, i) {
        const lado = i < 2 ? -1 : 1;
        const giro = lado < 0 ? 0 : Math.PI;
        const panel = crearPanel(p[0], p[1], municipio.color, 4.8, 2.3);
        panel.position.set(px[i % 2], 2.35, lado * (M - E - 0.08));
        panel.rotation.y = giro;
        g.add(panel);
        marcoDePanel(g, 4.8, 2.3, px[i % 2], 2.35, lado * (M - E - 0.05), giro);
    });

    salas.push(s);
    regionesDeSala(s);
    return s;
}

function crearSalaEstadisticas(cfg) {
    cfg.tema = ESTADISTICAS;
    cfg.nombre = ESTADISTICAS.nombre;
    cfg.emoji = ESTADISTICAS.emoji;
    cfg.color = ESTADISTICAS.color;
    cfg.subtitulo = "Cuántos somos, cuánto abarca, a qué altura: el territorio en cifras.";

    const H = EXT.HALL, ALTO = EXT.ALTO, MP = EXT.MEDIA_PUERTA, E = EXT.ESPE;
    const g = new THREE.Group();
    g.position.set(-H, 0, 0);      // el pabellón ocupa x e z de -8 a 8
    g.rotation.y = 0;
    escena.add(g);

    const ancho = H * 2, fondo = H * 2;
    cajaG(g, ancho, 0.3, fondo, matPiso, ancho / 2, -0.15, 0, false);
    cajaG(g, ancho + 2.2, 0.45, fondo + 2.2, matTecho, ancho / 2, ALTO + 0.22, 0, false);

    const luz = new THREE.Mesh(new THREE.PlaneGeometry(ancho - 3, fondo - 3), matLuzTecho);
    luz.rotation.x = Math.PI / 2;
    luz.position.set(ancho / 2, ALTO - 0.06, 0);
    g.add(luz);

    // techo piramidal para que se vea desde cualquier punto de la plaza
    const techo = new THREE.Mesh(new THREE.ConeGeometry(ancho * 0.78, 3.0, 4),
        new THREE.MeshStandardMaterial({ color: 0x3a2c20, roughness: 0.85, flatShading: true }));
    techo.rotation.y = Math.PI / 4;
    techo.position.set(ancho / 2, ALTO + 1.9, 0);
    techo.castShadow = true;
    g.add(techo);
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), matOro);
    bola.position.set(cfg.pos.x, ALTO + 3.8, cfg.pos.z);
    escena.add(bola);

    // cuatro muros, cada uno con su hueco de puerta
    // muro de -x (local x = 0) y de +x (local x = ancho)
    [0, ancho].forEach(function (x) {
        muro(g, 0.4, ALTO, H - MP, x, ALTO / 2, -(MP + (H - MP) / 2));
        muro(g, 0.4, ALTO, H - MP, x, ALTO / 2, (MP + (H - MP) / 2));
        muro(g, 0.4, ALTO - 3.9, MP * 2, x, (3.9 + ALTO) / 2, 0);
    });
    // muro de -z (local z = -H) y de +z (local z = H)
    // segmentos de6 a 0 y de 10 a 16; el hueco de la puerta queda en [6, 10]
    [-H, H].forEach(function (z) {
        muro(g, H - MP, ALTO, 0.4, (H - MP) / 2, ALTO / 2, z);
        muro(g, H - MP, ALTO, 0.4, (ancho - (H - MP) / 2), ALTO / 2, z);
        muro(g, MP * 2, ALTO - 3.9, 0.4, ancho / 2, (3.9 + ALTO) / 2, z);
    });

    // zócalo, listón dorado y cornisa en los cuatro muros, cortados en las puertas
    const zo = 0.07, ra = 0.15, co = 0.09;
    const largoTramo = H - MP;
    const centrosX = [(H - MP) / 2, ancho - (H - MP) / 2];
    const centrosZ = [-(MP + largoTramo / 2), MP + largoTramo / 2];
    [-H, H].forEach(function (zw) {
        const dir = zw < 0 ? 1 : -1;
        centrosX.forEach(function (cx) {
            cajaG(g, largoTramo, 0.8, 0.12, matZocalo, cx, 0.4, zw + dir * (E + zo), false);
            cajaG(g, largoTramo, 0.06, 0.06, matOro, cx, 0.93, zw + dir * (E + ra), false);
            cajaG(g, largoTramo, 0.22, 0.18, matMadera, cx, ALTO - 0.16, zw + dir * (E + co), false);
        });
    });
    [0, ancho].forEach(function (xw) {
        const dir = xw === 0 ? 1 : -1;
        centrosZ.forEach(function (cz) {
            cajaG(g, 0.12, 0.8, largoTramo, matZocalo, xw + dir * (E + zo), 0.4, cz, false);
            cajaG(g, 0.06, 0.06, largoTramo, matOro, xw + dir * (E + ra), 0.93, cz, false);
            cajaG(g, 0.18, 0.22, largoTramo, matMadera, xw + dir * (E + co), ALTO - 0.16, cz, false);
        });
    });

    // marcos de las cuatro puertas
    [0, ancho].forEach(function (x) {
        const dir = x === 0 ? -1 : 1;
        cajaG(g, 0.35, 3.9, 0.35, matOro, x + dir * 0.1, 1.95, -(MP + 0.16), true);
        cajaG(g, 0.35, 3.9, 0.35, matOro, x + dir * 0.1, 1.95, (MP + 0.16), true);
        cajaG(g, 0.35, 0.35, MP * 2 + 0.7, matOro, x + dir * 0.1, 3.85, 0, true);
    });
    [-H, H].forEach(function (z) {
        const dir = z === -H ? -1 : 1;
        cajaG(g, 0.35, 3.9, 0.35, matOro, ancho / 2 - (MP + 0.16), 1.95, z + dir * 0.1, true);
        cajaG(g, 0.35, 3.9, 0.35, matOro, ancho / 2 + (MP + 0.16), 1.95, z + dir * 0.1, true);
        cajaG(g, MP * 2 + 0.7, 0.35, 0.35, matOro, ancho / 2, 3.85, z + dir * 0.1, true);
    });

    // letreros sobre cada puerta, mirando hacia fuera
    const caratula = ESTADISTICAS.emoji + "  " + ESTADISTICAS.nombre;
    [[-H, -1, 0, 0], [H, 1, 0, 0], [0, 0, -H, -1], [0, 0, H, 1]].forEach(function (d) {
        const lx = d[0] === 0 ? (d[2] === -H ? ancho / 2 : ancho / 2) : (d[0] === -H ? 0 : ancho);
        const lz = d[2] === 0 ? (d[0] === -H ? 0 : 0) : (d[2] === -H ? -H : H);
        const letrero = crearLetrero(caratula, "#ffffff", 9);
        if (d[1] !== 0) {
            letrero.position.set(lx + d[1] * (E + 0.1), 4.62, 0);
            letrero.rotation.y = d[1] < 0 ? -Math.PI / 2 : Math.PI / 2;
        } else {
            letrero.position.set(ancho / 2, 4.62, lz + d[3] * (E + 0.1));
            letrero.rotation.y = d[3] < 0 ? Math.PI : 0;
        }
        letrero.material.depthWrite = false;
        g.add(letrero);
    });

    // paneles: dos por lado
    const W = 5.2, HH = 3.6, yP = 2.5;
    function colocar(mesh, x, z, phi) {
        mesh.position.set(x, yP, z);
        mesh.rotation.y = phi;
        g.add(mesh);
        marcoDePanel(g, W, HH,
            x - Math.sin(phi) * 0.03, yP, z - Math.cos(phi) * 0.03, phi);
    }
    // Recorrido sugerido en sentido de las manecillas del reloj, entrando por
    // la puerta oeste (la de acceso por defecto): 1 → 4.
    // Las gráficas de población, superficie, altitud y reparto territorial se
    // retiraron de los muros; solo quedan los paneles informativos.
    // muro norte (local z = -H), cara interior +z
    // los segmentos ocupan x 0..6 y 10..16; el hueco está en 6..10
    colocar(crearPanelDibujo(dibujarBienvenida, W, HH, 200), 3, -H + E + 0.08, 0);      // 1
    colocar(crearPanelDibujo(dibujarCifras, W, HH, 200), 13, -H + E + 0.08, 0);          // 2
    // muro oeste (local x = 0), cara interior +x; hueco en z -2..2
    colocar(crearPanelDibujo(dibujarNotas, W, HH, 200), E + 0.08, 5, Math.PI / 2);      // 3
    colocar(crearPanelDibujo(dibujarComoVisitar, W, HH, 200), E + 0.08, -5, Math.PI / 2); // 4

    // AABB del pabellón
    const s = {
        grupo: g, num: cfg.num, tema: ESTADISTICAS, color: ESTADISTICAS.color,
        rot: 0, pos: cfg.pos, normal: cfg.normal, municipio: null, vistas: {}, obras: [],
        aabb: { xMin: -H + 0.4, xMax: H - 0.4, zMin: -H + 0.4, zMax: H - 0.4 },
        puertas: [
            { x: -H, z: 0, nx: -1, nz: 0 },
            { x: H, z: 0, nx: 1, nz: 0 },
            { x: 0, z: -H, nx: 0, nz: -1 },
            { x: 0, z: H, nx: 0, nz: 1 }
        ]
    };

    // Kiosco central con las tres fotografías de la sala
    const CX = ancho / 2, CZ = 0, Y = 2.3, RADIO_CARA = 1.06;

    const baseKiosco = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.85, 0.45, 40), matPiedra);
    baseKiosco.position.set(CX, 0.225, CZ);
    baseKiosco.castShadow = true;
    baseKiosco.receiveShadow = true;
    g.add(baseKiosco);

    const aroKiosco = new THREE.Mesh(new THREE.CylinderGeometry(2.78, 2.78, 0.1, 40), matOro);
    aroKiosco.position.set(CX, 0.5, CZ);
    aroKiosco.castShadow = true;
    g.add(aroKiosco);

    // prisma de tres caras: una fotografía por cara
    const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3.7, 3), matMadera);
    nucleo.rotation.y = -Math.PI / 3;
    nucleo.position.set(CX, 0.5 + 3.7 / 2, CZ);
    nucleo.castShadow = true;
    nucleo.receiveShadow = true;
    g.add(nucleo);

    const remate = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, 0.16, 3), matOro);
    remate.rotation.y = -Math.PI / 3;
    remate.position.set(CX, 4.2, CZ);
    remate.castShadow = true;
    g.add(remate);

    for (let k = 0; k < 3; k++) {
        const a = k * 2 * Math.PI / 3 + Math.PI / 3;
        const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.7, 10), matOro);
        pilar.position.set(CX + Math.sin(a) * 2.0, 0.5 + 3.7 / 2, CZ + Math.cos(a) * 2.0);
        pilar.castShadow = true;
        g.add(pilar);
    }

    ESTADISTICAS.imagenes.forEach(function (datos, k) {
        const ang = k * 2 * Math.PI / 3;
        const obra = crearFotoEstadistica(
            datos, k, g,
            CX + Math.sin(ang) * RADIO_CARA, Y, CZ + Math.cos(ang) * RADIO_CARA,
            ang
        );
        s.obras.push(obra);
    });

    // el kiosco es un obstáculo: hay que rodearlo para ver las tres caras
    const centroKiosco = localAMundo(g, CX, 0, CZ);
    obstaculos.push({
        xMin: centroKiosco.x - 2.55, xMax: centroKiosco.x + 2.55,
        zMin: centroKiosco.z - 2.55, zMax: centroKiosco.z + 2.55
    });

    salas.push(s);

    // interior + los cuatro pasos de puerta
    agregarRegion(-H + E + 0.5, H - E - 0.5, -H + E + 0.5, H - E - 0.5);
    agregarRegion(-H - 1.2, -H + 1.2, -(MP - 0.2), (MP - 0.2));
    agregarRegion(H - 1.2, H + 1.2, -(MP - 0.2), (MP - 0.2));
    agregarRegion(-(MP - 0.2), (MP - 0.2), -H - 1.2, -H + 1.2);
    agregarRegion(-(MP - 0.2), (MP - 0.2), H - 1.2, H + 1.2);

    return s;
}

// ------------------------------------------------------------
// Gráficas de la sala de estadísticas
// Ya no se colocan en los muros (se retiraron por petición), pero se
// conservan aquí para poder reactivarlas volviendo a llamarlas desde
// crearSalaEstadisticas.
// ------------------------------------------------------------
function fondoPanel(ctx, w, h, titulo, paso) {
    ctx.fillStyle = "#17110c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#E2B04A";
    ctx.fillRect(0, 0, w, 84);
    ctx.fillStyle = "#17110c";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let t = titulo;
    const limite = paso ? w - 130 : w - 50;
    while (ctx.measureText(t).width > limite && t.length > 6) t = t.substring(0, t.length - 2);
    ctx.fillText(t, 26, 44);

    // Número del recorrido, para seguir los paneles en orden.
    if (paso) {
        ctx.beginPath();
        ctx.arc(w - 48, 42, 24, 0, Math.PI * 2);
        ctx.fillStyle = "#17110c";
        ctx.fill();
        ctx.fillStyle = "#E2B04A";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(paso), w - 48, 43);
    }
}

function dibujarCifras(ctx, w, h) {
    fondoPanel(ctx, w, h, "Cifras clave", 2);
    const tarjetas = ESTADISTICAS.cifras;
    const cols = 2, filas = 3, mx = 28, my = 108, gap = 20;
    const cw = (w - mx * 2 - gap * (cols - 1)) / cols;
    const ch = (h - my - 26 - gap * (filas - 1)) / filas;
    tarjetas.forEach(function (t, i) {
        const x = mx + (i % cols) * (cw + gap);
        const y = my + Math.floor(i / cols) * (ch + gap);
        ctx.fillStyle = "#1e1711";
        rellenarRedondeado(ctx, x, y, cw, ch, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(226,176,74,0.55)";
        ctx.lineWidth = 4;
        rellenarRedondeado(ctx, x, y, cw, ch, 20);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#E2B04A";
        ctx.font = "bold 68px sans-serif";
        ctx.fillText(t.valor, x + cw / 2, y + ch * 0.38);
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "28px sans-serif";
        ctx.fillText(t.etiqueta, x + cw / 2, y + ch * 0.75);
    });
}

function dibujarPoblacion(ctx, w, h) {
    fondoPanel(ctx, w, h, "Población aproximada (hab.)", 3);
    const datos = MUNICIPIOS.slice().sort(function (a, b) { return b.poblacion - a.poblacion; });
    const max = datos[0].poblacion;
    const izq = 250, der = 130, alto = 40, gap = 8, y0 = 104;
    ctx.textBaseline = "middle";
    datos.forEach(function (d, i) {
        const y = y0 + i * (alto + gap);
        ctx.textAlign = "right";
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "25px sans-serif";
        ctx.fillText(d.nombre.length > 18 ? d.nombre.substring(0, 16) + "…" : d.nombre, izq - 14, y + alto / 2);
        const anchoMax = w - izq - der;
        const bw = anchoMax * (d.poblacion / max);
        ctx.fillStyle = "#1e1711";
        ctx.fillRect(izq, y, anchoMax, alto);
        ctx.fillStyle = d.color;
        ctx.fillRect(izq, y, bw, alto);
        ctx.textAlign = "left";
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "bold 23px sans-serif";
        ctx.fillText(d.poblacion.toLocaleString("es-MX"), izq + bw + 10, y + alto / 2);
    });
}

function dibujarSuperficie(ctx, w, h) {
    fondoPanel(ctx, w, h, "Superficie municipal (km²)", 5);
    const datos = MUNICIPIOS.slice().sort(function (a, b) { return b.superficie - a.superficie; });
    const max = datos[0].superficie;
    const izq = 250, der = 110, alto = 40, gap = 8, y0 = 104;
    ctx.textBaseline = "middle";
    datos.forEach(function (d, i) {
        const y = y0 + i * (alto + gap);
        ctx.textAlign = "right";
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "25px sans-serif";
        ctx.fillText(d.nombre.length > 18 ? d.nombre.substring(0, 16) + "…" : d.nombre, izq - 14, y + alto / 2);
        const anchoMax = w - izq - der;
        const bw = anchoMax * (d.superficie / max);
        ctx.fillStyle = "#1e1711";
        ctx.fillRect(izq, y, anchoMax, alto);
        ctx.fillStyle = d.color;
        ctx.fillRect(izq, y, bw, alto);
        ctx.textAlign = "left";
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "bold 23px sans-serif";
        ctx.fillText(String(d.superficie), izq + bw + 10, y + alto / 2);
    });
}

function dibujarAltitud(ctx, w, h) {
    fondoPanel(ctx, w, h, "Altitud de la cabecera (m s.n.m.)", 4);
    const datos = MUNICIPIOS;
    const min = 1800, max = 2600;
    const base = h - 96, tope = 118, area = base - tope;
    const paso = (w - 60) / datos.length;
    const bw = paso * 0.56;
    ctx.strokeStyle = "rgba(245,234,214,0.25)";
    ctx.lineWidth = 2;
    for (let v = 2000; v <= 2600; v += 200) {
        const y = base - area * ((v - min) / (max - min));
        ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(w - 24, y); ctx.stroke();
        ctx.fillStyle = "rgba(245,234,214,0.6)";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(String(v), 26, y - 4);
    }
    datos.forEach(function (d, i) {
        const x = 30 + i * paso + (paso - bw) / 2;
        const bh = area * ((Math.max(min, d.altitud) - min) / (max - min));
        ctx.fillStyle = d.color;
        ctx.fillRect(x, base - bh, bw, bh);
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "bold 17px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(String(d.altitud), x + bw / 2, base - bh - 6);
        ctx.save();
        ctx.translate(x + bw / 2, base + 10);
        ctx.rotate(-Math.PI / 3);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.font = "20px sans-serif";
        const partes = d.nombre.split(" ");
        const etiqueta = (partes[0] === "San" || partes[0] === "Santa") && partes.length > 1
            ? partes[1] : partes[0];
        ctx.fillText(etiqueta, 0, 0);
        ctx.restore();
    });
}

function dibujarDonut(ctx, w, h) {
    fondoPanel(ctx, w, h, "Reparto de la superficie", 6);
    const datos = MUNICIPIOS.slice().sort(function (a, b) { return b.superficie - a.superficie; });
    const series = datos.slice(0, 6).map(function (d) {
        return { etiqueta: d.nombre, valor: d.superficie, color: d.color };
    });
    const resto = datos.slice(6).reduce(function (s, d) { return s + d.superficie; }, 0);
    series.push({ etiqueta: "Otros 6 municipios", valor: resto, color: "#6b7280" });
    const total = series.reduce(function (s, d) { return s + d.valor; }, 0);

    const cx = 270, cy = 400, r = 175, ri = 96;
    let ang = -Math.PI / 2;
    series.forEach(function (d) {
        const a2 = ang + (d.valor / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, ang, a2);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
        ang = a2;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, ri, 0, Math.PI * 2);
    ctx.fillStyle = "#17110c";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#E2B04A";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("1 142", cx, cy - 16);
    ctx.fillStyle = "#F1E7D4";
    ctx.font = "22px sans-serif";
    ctx.fillText("km²", cx, cy + 22);

    series.forEach(function (d, i) {
        const y = 138 + i * 60;
        ctx.fillStyle = d.color;
        ctx.fillRect(500, y - 15, 30, 30);
        ctx.textAlign = "left";
        ctx.fillStyle = "#F1E7D4";
        ctx.font = "25px sans-serif";
        ctx.fillText(d.etiqueta, 546, y);
        ctx.textAlign = "right";
        ctx.font = "bold 25px sans-serif";
        ctx.fillText(Math.round((d.valor / total) * 100) + " %", w - 36, y);
    });
}

function dibujarParrafos(ctx, w, h, titulo, parrafos, paso) {
    fondoPanel(ctx, w, h, titulo, paso);
    ctx.fillStyle = "#F1E7D4";
    ctx.font = "26px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = 118;
    parrafos.forEach(function (p) {
        envolver(ctx, p, w - 56).forEach(function (l) {
            if (y < h - 30) { ctx.fillText(l, 28, y); y += 36; }
        });
        y += 22;
    });
}

function dibujarBienvenida(ctx, w, h) {
    dibujarParrafos(ctx, w, h, "Bienvenida · doce voces", [
        ESTADISTICAS.bienvenida,
        "Los doce municipios suman cerca de 401 mil habitantes repartidos en poco más de 1 142 kilómetros cuadrados, entre los volcanes Popocatépetl e Iztaccíhuatl.",
        "En el kiosco central hay tres fotografías de la región; en los muros, los paneles numerados del 1 al 4 reúnen la bienvenida, las cifras clave, las fuentes y cómo recorrer el museo."
    ], 1);
}

function dibujarComoVisitar(ctx, w, h) {
    dibujarParrafos(ctx, w, h, "Cómo recorrer el museo", [
        "Al entrar al recorrido apareces en la plaza exterior, frente a la entrada principal. No hay un orden obligatorio: puedes visitar las salas en el orden que prefieras.",
        "Camina hasta la puerta de cualquier sala y pulsa «Entrar a la sala». Dentro, acércate a cada fotografía y pulsa «Ver obra». Cuando quieras, pulsa «Regresar al exterior».",
        "El botón «Salas» del HUD abre el índice completo de las 13 salas y te lleva directamente a la que elijas."
    ], 4);
}

function dibujarNotas(ctx, w, h) {
    dibujarParrafos(ctx, w, h, "Fuentes y notas", [
        ESTADISTICAS.nota,
        "La población y la superficie se presentan redondeadas; la altitud corresponde a la cabecera municipal.",
        "El museo reúne 36 fotografías, tres por municipio, con su historia, su cultura, sus lugares representativos, sus paisajes y sus cultivos."
    ], 3);
}

// ------------------------------------------------------------
// Montaje de las 13 salas
// ------------------------------------------------------------
(function montarSalas() {
    DISTRIBUCION.forEach(function (cfg, i) {
        const num = i + 1;
        if (cfg.fila === "hall") {
            crearSalaEstadisticas({ num: num, pos: { x: 0, z: 0 }, rot: 0, normal: { x: 0, z: 1 } });
            return;
        }
        const filas = {
            norte: { rot: Math.PI / 2, normal: { x: 0, z: 1 } },
            este: { rot: 0, normal: { x: -1, z: 0 } },
            sur: { rot: -Math.PI / 2, normal: { x: 0, z: -1 } },
            oeste: { rot: Math.PI, normal: { x: 1, z: 0 } }
        }[cfg.fila];
        const pos = cfg.fila === "este" || cfg.fila === "oeste"
            ? { x: cfg.fila === "este" ? JAR : -JAR, z: cfg.cz }
            : { x: cfg.cx, z: cfg.fila === "norte" ? -JAR : JAR };
        crearSalaMunicipio(MUNICIPIOS[i], {
            num: num, pos: pos, rot: filas.rot, normal: filas.normal,
            paredes: cfg.paredes
        });
    });
})();

// ------------------------------------------------------------
// Raíces del Tiempo: retratos en los pasillos y videos en las salas
// ------------------------------------------------------------
// Los pasillos son las bandas de 8 m que quedan entre las espaldas de las
// salas (a 38 m del centro) y los muros perimetrales (a 46 m). Aquí se
// montan los retratos y el mobiliario; las proyecciones se colocan afuera
// de la puerta de cada sala municipal, mirando al patio.
const RUTA_PERSONAJES = "personajes/";
const cargadorGaleria = new THREE.TextureLoader();
const pantallasGaleria = [];
const cachePostersGaleria = {};
const esperandoPoster = {};

const matMarcoGaleria = new THREE.MeshStandardMaterial({ color: 0x3f2a1a, roughness: 0.55, metalness: 0.18 });
const matFileteGaleria = new THREE.MeshStandardMaterial({ color: 0xd9a94b, roughness: 0.35, metalness: 0.65 });
const matAlfombraGaleria = new THREE.MeshStandardMaterial({ color: 0x6d2f2b, roughness: 1 });
const matPantallaFondo = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.7 });
const matLuzCalida = new THREE.MeshBasicMaterial({ color: 0xffe1a8 });
const matPlanta = new THREE.MeshStandardMaterial({ color: 0x4f6b45, roughness: 1, flatShading: true });
const matMaceta = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.9 });

/** Placa rectangular de texto (rótulos, cartelas y letreros de la galería). */
function placaGaleria(texto, anchoM, altoM, fondo, borde, colorTexto) {
    const PX = 320;
    const c = document.createElement("canvas");
    c.width = Math.max(64, Math.round(anchoM * PX));
    c.height = Math.max(40, Math.round(altoM * PX));
    const ctx = c.getContext("2d");
    ctx.fillStyle = fondo || "#FBF6D5";
    ctx.fillRect(0, 0, c.width, c.height);

    const grosor = Math.max(3, Math.round(PX * 0.018));
    if (borde) {
        ctx.strokeStyle = borde;
        ctx.lineWidth = grosor;
        ctx.strokeRect(grosor / 2, grosor / 2, c.width - grosor, c.height - grosor);
    }

    let fuente = Math.round(c.height * 0.5);
    const limite = c.width - grosor * 2 - c.width * 0.08;
    ctx.font = "bold " + fuente + "px sans-serif";
    while (ctx.measureText(texto).width > limite && fuente > 8) {
        fuente -= 1;
        ctx.font = "bold " + fuente + "px sans-serif";
    }
    ctx.fillStyle = colorTexto || "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, c.width / 2, c.height / 2 + c.height * 0.04);

    return new THREE.Mesh(new THREE.PlaneGeometry(anchoM, altoM),
        new THREE.MeshBasicMaterial({ map: texturaCanvas(c) }));
}

/** Carga una imagen sobre un material ya creado; si falla repite otra. */
function cargarTexturaGaleria(archivo, material, esRespaldo) {
    cargadorGaleria.load(RUTA_PERSONAJES + archivo, function (tex) {
        tex.encoding = THREE.sRGBEncoding;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        material.map = tex;
        material.color.set(0xffffff);
        material.needsUpdate = true;
    }, undefined, function () {
        if (!esRespaldo) {
            const alternativa = RESERVA_PERSONAJES.filter(function (n) {
                return n !== archivo;
            })[0];
            puente("aviso", "No se pudo cargar " + archivo + "; se usó " + alternativa);
            cargarTexturaGaleria(alternativa, material, true);
            return;
        }
        puente("aviso", "No se pudo cargar " + archivo);
    });
}

/** Retrato enmarcado con lámpara de cuadro y cartela. */
function crearRetratoGaleria(datos, x, y, z, giro) {
    const grupo = new THREE.Group();
    grupo.position.set(x, y, z);
    grupo.rotation.y = giro;

    cajaG(grupo, 1.9, 1.4, 0.16, matMarcoGaleria, 0, 0, 0, true);
    cajaG(grupo, 1.72, 1.22, 0.05, matFileteGaleria, 0, 0, 0.095, false);

    const material = new THREE.MeshBasicMaterial({ color: 0x241a12 });
    const foto = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 1.03), material);
    foto.position.z = 0.125;
    grupo.add(foto);
    cargarTexturaGaleria(datos.archivo, material);

    // lámpara de cuadro
    cajaG(grupo, 0.66, 0.07, 0.18, matFileteGaleria, 0, 0.79, 0.12, false);
    cajaG(grupo, 0.5, 0.025, 0.05, matLuzCalida, 0, 0.745, 0.2, false);

    const placa = placaGaleria(datos.titulo, 1.18, 0.24, "#FBF6D5", "#C79A45", "#000000");
    placa.position.set(0, -0.87, 0.025);
    grupo.add(placa);

    escena.add(grupo);
}

/** Prepara una textura de póster con el mismo filtrado que las fotografías. */
function prepararTexturaGaleria(tex) {
    tex.encoding = THREE.sRGBEncoding;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
}

function colocarPosterGaleria(archivo, tex) {
    cachePostersGaleria[archivo] = tex;
    const pendientes = esperandoPoster[archivo] || [];
    delete esperandoPoster[archivo];
    pendientes.forEach(function (fn) { fn(tex); });
}

/** Carga el póster de un video una sola vez y lo comparte entre pantallas. */
function cargarPosterGaleria(archivo, aplicar) {
    if (cachePostersGaleria[archivo]) {
        aplicar(cachePostersGaleria[archivo]);
        return;
    }
    if (esperandoPoster[archivo]) {
        esperandoPoster[archivo].push(aplicar);
        return;
    }
    esperandoPoster[archivo] = [aplicar];
    cargadorGaleria.load(RUTA_PERSONAJES + archivo + ".jpg", function (tex) {
        prepararTexturaGaleria(tex);
        colocarPosterGaleria(archivo, tex);
    }, undefined, function () {
        // Póster sin archivo: se repite una imagen existente para no dejar
        // la pantalla en negro.
        const alternativa = RESERVA_PERSONAJES[reservaPoster++ % RESERVA_PERSONAJES.length];
        cargadorGaleria.load(RUTA_PERSONAJES + alternativa, function (tex) {
            prepararTexturaGaleria(tex);
            colocarPosterGaleria(archivo, tex);
            puente("aviso", "No se pudo cargar " + archivo + ".jpg; se usó " + alternativa);
        }, undefined, function () {
            delete esperandoPoster[archivo];
            puente("aviso", "No se pudo cargar " + archivo + ".jpg");
        });
    });
}

/** Pantalla de video en la fachada exterior, junto a la puerta de una sala. */
function crearPantallaEntrada(sala, datos) {
    const grupo = new THREE.Group();
    grupo.position.set(-0.32, 2.35, 3.75);
    grupo.rotation.y = -Math.PI / 2;
    sala.grupo.add(grupo);

    // marco de madera, fondo oscuro y filete dorado
    cajaG(grupo, 2.65, 2.05, 0.16, matMarcoGaleria, 0, 0, 0, true);
    cajaG(grupo, 2.49, 1.89, 0.05, matPantallaFondo, 0, 0.06, 0.095, false);
    cajaG(grupo, 2.48, 0.05, 0.03, matFileteGaleria, 0, 0.815, 0.115, false);
    cajaG(grupo, 2.48, 0.05, 0.03, matFileteGaleria, 0, -0.575, 0.115, false);
    cajaG(grupo, 0.05, 1.44, 0.03, matFileteGaleria, -1.215, 0.12, 0.115, false);
    cajaG(grupo, 0.05, 1.44, 0.03, matFileteGaleria, 1.215, 0.12, 0.115, false);

    const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), material);
    pantalla.position.set(0, 0.12, 0.11);
    grupo.add(pantalla);

    let usandoVideo = false;
    let texturaPoster = null;
    cargarPosterGaleria(datos.archivo, function (tex) {
        texturaPoster = tex;
        if (!usandoVideo) {
            material.map = tex;
            material.color.set(0xffffff);
            material.needsUpdate = true;
        }
    });

    const placa = placaGaleria(datos.etiqueta, 2.2, 0.24, "#FBF6D5", "#C79A45", "#000000");
    placa.position.set(0, -0.82, 0.115);
    grupo.add(placa);

    // lámpara y visera para que la pantalla se lea desde el patio
    cajaG(grupo, 0.72, 0.06, 0.14, matFileteGaleria, 0, 0.98, 0.12, false);
    cajaG(grupo, 0.56, 0.025, 0.05, matLuzCalida, 0, 0.945, 0.18, false);
    cajaG(grupo, 2.85, 0.09, 0.5, matMarcoGaleria, 0, 1.09, 0.14, true);
    cajaG(grupo, 2.85, 0.035, 0.52, matOro, 0, 1.14, 0.14, false);

    // El video vive fuera del lienzo: solo se muestra a través de la textura.
    const video = document.createElement("video");
    video.src = RUTA_PERSONAJES + datos.archivo + ".mp4";
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("disableremoteplayback", "");
    video.style.position = "fixed";
    video.style.left = "-4px";
    video.style.top = "-4px";
    video.style.width = "2px";
    video.style.height = "2px";
    video.style.opacity = "0.01";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    const texturaVideo = new THREE.VideoTexture(video);
    texturaVideo.encoding = THREE.sRGBEncoding;
    texturaVideo.generateMipmaps = false;
    texturaVideo.minFilter = THREE.LinearFilter;
    texturaVideo.magFilter = THREE.LinearFilter;

    const mundo = localAMundo(sala.grupo, -0.32, 2.35, 3.75);

    const pantallaGaleria = {
        video: video, textura: texturaVideo, material: material,
        x: mundo.x, z: mundo.z, reproduciendo: false,
        solicitando: false, bloqueado: false,
        activarVideo: function () {
            usandoVideo = true;
            material.map = texturaVideo;
            material.color.set(0xffffff);
            material.needsUpdate = true;
        },
        volverAPoster: function () {
            usandoVideo = false;
            if (!texturaPoster) return;
            material.map = texturaPoster;
            material.color.set(0xffffff);
            material.needsUpdate = true;
        }
    };

    // Si el dispositivo no puede decodificar el MP4, se conserva el póster.
    video.addEventListener("error", function () {
        pantallaGaleria.reproduciendo = false;
        pantallaGaleria.solicitando = false;
        pantallaGaleria.bloqueado = true;
        pantallaGaleria.volverAPoster();
        puente("aviso", "No se pudo reproducir " + datos.archivo + ".mp4");
    });

    pantallasGaleria.push(pantallaGaleria);
}

/** Cuadro fijo en la fachada exterior, junto a la puerta de una sala. */
function crearCuadroEntrada(sala, datos) {
    const grupo = new THREE.Group();
    grupo.position.set(-0.32, 2.35, 3.75);
    grupo.rotation.y = -Math.PI / 2;
    sala.grupo.add(grupo);

    // mismo marco de madera, fondo oscuro y filete dorado que las pantallas
    cajaG(grupo, 2.65, 2.05, 0.16, matMarcoGaleria, 0, 0, 0, true);
    cajaG(grupo, 2.49, 1.89, 0.05, matPantallaFondo, 0, 0.06, 0.095, false);
    cajaG(grupo, 2.48, 0.05, 0.03, matFileteGaleria, 0, 0.815, 0.115, false);
    cajaG(grupo, 2.48, 0.05, 0.03, matFileteGaleria, 0, -0.575, 0.115, false);
    cajaG(grupo, 0.05, 1.44, 0.03, matFileteGaleria, -1.215, 0.12, 0.115, false);
    cajaG(grupo, 0.05, 1.44, 0.03, matFileteGaleria, 1.215, 0.12, 0.115, false);

    const material = new THREE.MeshBasicMaterial({ color: 0x241a12 });
    const alto = 1.35;
    const ancho = Math.min(2.4, alto * (datos.aspecto || 1.5));
    const foto = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), material);
    foto.position.set(0, 0.12, 0.11);
    grupo.add(foto);
    cargarTexturaGaleria(datos.archivo, material);

    const placa = placaGaleria(datos.etiqueta, 2.2, 0.24, "#FBF6D5", "#C79A45", "#000000");
    placa.position.set(0, -0.82, 0.115);
    grupo.add(placa);

    // lámpara y visera, iguales a las de las proyecciones
    cajaG(grupo, 0.72, 0.06, 0.14, matFileteGaleria, 0, 0.98, 0.12, false);
    cajaG(grupo, 0.56, 0.025, 0.05, matLuzCalida, 0, 0.945, 0.18, false);
    cajaG(grupo, 2.85, 0.09, 0.5, matMarcoGaleria, 0, 1.09, 0.14, true);
    cajaG(grupo, 2.85, 0.035, 0.52, matOro, 0, 1.14, 0.14, false);
}

/**
 * Cuadro de agradecimiento en el muro de recepción, justo donde antes estaba
 * el letrero "MUSEO DIGITAL 3D · Región de los Volcanes". El nombre del museo
 * se conserva en una placa sobre el marco.
 */
function crearAgradecimientoRecepcion() {
    const grupo = new THREE.Group();
    grupo.position.set(11, 2.8, 45.34);
    grupo.rotation.y = Math.PI;
    escena.add(grupo);

    // marco de madera con filete dorado
    cajaG(grupo, 2.8, 3.72, 0.18, matMarcoGaleria, 0, 0, 0, true);
    cajaG(grupo, 2.62, 3.54, 0.05, matFileteGaleria, 0, 0, 0.105, false);

    const material = new THREE.MeshBasicMaterial({ color: 0x241a12 });
    const foto = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 3.5), material);
    foto.position.set(0, 0, 0.135);
    grupo.add(foto);
    cargarTexturaGaleria("agradecimiento.jpg", material);

    // lámpara de cuadro sobre el marco
    cajaG(grupo, 1.3, 0.06, 0.22, matFileteGaleria, 0, 1.88, 0.15, false);
    cajaG(grupo, 1.0, 0.025, 0.08, matLuzCalida, 0, 1.85, 0.22, false);

    // el nombre del museo se mantiene sobre el cuadro, como en el letrero anterior
    const museo = placaGaleria("MUSEO DIGITAL 3D · REGIÓN DE LOS VOLCANES",
        7.0, 0.28, "#FBF6D5", "#E2B04A", "#000000");
    museo.position.set(0, 2.06, 0.05);
    grupo.add(museo);
}

/** Tapiz decorativo con un paisaje de volcanes, para los muros largos. */
function crearTapizGaleria(x, z, giro) {
    const c = document.createElement("canvas");
    c.width = 480;
    c.height = 640;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#6d2f2b";
    ctx.fillRect(0, 0, c.width, c.height);

    // cielo
    ctx.fillStyle = "#d9b77c";
    ctx.fillRect(28, 28, c.width - 56, 250);
    ctx.fillStyle = "#e9d3a0";
    ctx.beginPath();
    ctx.arc(340, 108, 52, 0, Math.PI * 2);
    ctx.fill();

    // volcanes
    ctx.fillStyle = "#7b4a33";
    ctx.beginPath();
    ctx.moveTo(28, 278);
    ctx.lineTo(150, 120);
    ctx.lineTo(232, 278);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5b3828";
    ctx.beginPath();
    ctx.moveTo(165, 278);
    ctx.lineTo(320, 150);
    ctx.lineTo(452, 278);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f4efe2";
    ctx.beginPath();
    ctx.moveTo(136, 145);
    ctx.lineTo(150, 120);
    ctx.lineTo(164, 145);
    ctx.lineTo(150, 156);
    ctx.closePath();
    ctx.fill();

    // franjas y greca
    ctx.fillStyle = "#4a2a20";
    ctx.fillRect(28, 278, c.width - 56, 120);
    ctx.fillStyle = "#c99a4c";
    ctx.fillRect(28, 398, c.width - 56, 14);
    ctx.fillRect(28, 430, c.width - 56, 14);
    for (let i = 0; i < 8; i++) {
        const bx = 52 + i * 48;
        ctx.fillRect(bx, 446, 10, 34);
        ctx.fillRect(bx + 10, 470, 24, 10);
    }
    ctx.fillStyle = "#e2b04a";
    ctx.fillRect(28, 548, c.width - 56, 6);
    ctx.fillStyle = "#3c2118";
    ctx.fillRect(28, 566, c.width - 56, 46);

    const grupo = new THREE.Group();
    grupo.position.set(x, 2.5, z);
    grupo.rotation.y = giro;

    cajaG(grupo, 2.0, 2.8, 0.12, matMarcoGaleria, 0, 0, 0, false);
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6),
        new THREE.MeshBasicMaterial({ map: texturaCanvas(c) }));
    plano.position.z = 0.07;
    grupo.add(plano);
    cajaG(grupo, 2.12, 0.07, 0.16, matFileteGaleria, 0, 1.44, 0.02, false);
    cajaG(grupo, 2.12, 0.07, 0.16, matFileteGaleria, 0, -1.44, 0.02, false);

    escena.add(grupo);
}

/** Banca de galería: el respaldo queda del lado +z local. */
function crearBancaGaleria(x, z, giro) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);
    grupo.rotation.y = giro;

    const ancho = 2.2, fondo = 0.62;
    cajaG(grupo, ancho, 0.12, fondo, matMadera, 0, 0.48, 0, true);
    [-1, 1].forEach(function (s) {
        cajaG(grupo, 0.12, 0.46, 0.12, matMadera, s * (ancho / 2 - 0.18), 0.23, -0.2, true);
        cajaG(grupo, 0.12, 0.46, 0.12, matMadera, s * (ancho / 2 - 0.18), 0.23, 0.2, true);
    });
    cajaG(grupo, ancho, 0.5, 0.12, matMadera, 0, 0.78, 0.28, true);
    cajaG(grupo, ancho - 0.2, 0.06, fondo - 0.12, matAlfombraGaleria, 0, 0.57, 0, false);
    escena.add(grupo);

    const vertical = Math.abs(Math.sin(giro)) > 0.5;
    if (vertical) agregarObstaculo(x - 0.5, x + 0.5, z - 1.2, z + 1.2);
    else agregarObstaculo(x - 1.2, x + 1.2, z - 0.5, z + 0.5);
}

function crearPlantaGaleria(x, z) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);

    const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 10), matMaceta);
    maceta.position.y = 0.25;
    maceta.castShadow = true;
    grupo.add(maceta);

    const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6), matMadera);
    tallo.position.y = 1.0;
    grupo.add(tallo);

    const copa = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), matPlanta);
    copa.position.y = 1.65;
    copa.scale.set(0.9, 1.15, 0.9);
    copa.castShadow = true;
    grupo.add(copa);

    const copa2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 9, 7), matPlanta);
    copa2.position.set(0.25, 1.95, 0.12);
    copa2.castShadow = true;
    grupo.add(copa2);

    escena.add(grupo);
    agregarObstaculo(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
}

function crearFarolGaleria(x, z) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 8), matPiedra);
    base.position.y = 0.1;
    grupo.add(base);

    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.1, 8), matMadera);
    poste.position.y = 1.6;
    poste.castShadow = true;
    grupo.add(poste);

    cajaG(grupo, 0.5, 0.08, 0.5, matFileteGaleria, 0, 3.2, 0, true);
    const foco = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), matLuzCalida);
    foco.position.y = 3.45;
    grupo.add(foco);
    cajaG(grupo, 0.46, 0.07, 0.46, matFileteGaleria, 0, 3.69, 0, true);
    cajaG(grupo, 0.1, 0.12, 0.1, matFileteGaleria, 0, 3.78, 0, false);

    escena.add(grupo);
    agregarObstaculo(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
}

function crearApliqueGaleria(x, z, giro) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 3.15, z);
    grupo.rotation.y = giro;

    cajaG(grupo, 0.26, 0.1, 0.16, matFileteGaleria, 0, -0.13, 0.08, false);
    const luz = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.3, 10), matLuzCalida);
    luz.position.set(0, 0, 0.2);
    grupo.add(luz);

    escena.add(grupo);
}

function crearAlfombraGaleria(x, z, largo, ancho, vertical, y) {
    caja(vertical ? ancho : largo, 0.02, vertical ? largo : ancho,
        matAlfombraGaleria, x, y, z, false);
    const off = ancho / 2 - 0.08;
    if (vertical) {
        caja(0.08, 0.022, largo, matOro, x - off, y + 0.002, z, false);
        caja(0.08, 0.022, largo, matOro, x + off, y + 0.002, z, false);
    } else {
        caja(largo, 0.022, 0.08, matOro, x, y + 0.002, z - off, false);
        caja(largo, 0.022, 0.08, matOro, x, y + 0.002, z + off, false);
    }
}

/** Pórtico sobre la entrada principal, entre las dos salas del sur. */
function crearPortalGaleria() {
    caja(22.6, 0.9, 0.5, matMarcoGaleria, 0, 4.4, 38.25, true);
    caja(22.8, 0.08, 0.56, matOro, 0, 4.87, 38.25, false);

    [-10.75, 10.75].forEach(function (x) {
        caja(0.5, 4.0, 0.55, matMadera, x, 2.0, 38.3, true);
        caja(0.62, 0.18, 0.66, matFileteGaleria, x, 0.09, 38.3, false);
    });

    const titulo = placaGaleria("RAÍCES DEL TIEMPO", 7.2, 0.5, "#FBF6D5", "#E2B04A", "#000000");
    titulo.position.set(0, 4.52, 38.52);
    escena.add(titulo);

    const sub = placaGaleria("PASILLOS DEL MUSEO · RETRATOS Y MEMORIA", 6.4, 0.22, "#FBF6D5", "#8a6a2f", "#000000");
    sub.position.set(0, 4.08, 38.52);
    escena.add(sub);

    for (let i = -2; i <= 2; i++) {
        const foco = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 12), matLuzCalida);
        foco.position.set(i * 3.6, 3.93, 38.5);
        escena.add(foco);
    }

    agregarObstaculo(-11.05, -10.45, 38.02, 38.58);
    agregarObstaculo(10.45, 11.05, 38.02, 38.58);
}

// --- Retratos de la fachada sur ---
const RETRATOS_GALERIA = [
    { archivo: "personaje_1.jpg", titulo: "01 · PREHISPÁNICO" },
    { archivo: "personaje_2.jpg", titulo: "02 · COLONIAL" },
    { archivo: "personaje_3.jpg", titulo: "03 · NATURALISTA" },
    { archivo: "personaje_4.jpg", titulo: "04 · AGRARISTA" },
    { archivo: "personaje_5.jpg", titulo: "05 · ZAPATISTA" }
];

RETRATOS_GALERIA.forEach(function (retrato, i) {
    crearRetratoGaleria(retrato, 12.5 + i * 2.25, 2.2, 38.25, 0);
});

// cabecera de la pared de retratos
const cabeceraRetratos = new THREE.Group();
cabeceraRetratos.position.set(17, 3.62, 38.25);
cajaG(cabeceraRetratos, 6.0, 0.52, 0.06, matMarcoGaleria, 0, 0, 0, false);
const placaRetratos = placaGaleria("RETRATOS DE LA MEMORIA", 5.7, 0.4, "#FBF6D5", "#C79A45", "#000000");
placaRetratos.position.z = 0.04;
cabeceraRetratos.add(placaRetratos);
escena.add(cabeceraRetratos);

// --- Medios afuera de cada sala municipal: 9 videos y 3 imágenes ---
// Se alternan para que el patio no repita el mismo medio en salas vecinas.
const MEDIOS_ENTRADA = [
    { tipo: "video", archivo: "galeria_video_1", etiqueta: "MEMORIA EN MOVIMIENTO" },
    { tipo: "video", archivo: "galeria_video_2", etiqueta: "RELATOS DEL TERRITORIO" },
    { tipo: "imagen", archivo: "galeria_imagen_1.jpg", etiqueta: "MEMORIA VISUAL", aspecto: 1.25 },
    { tipo: "video", archivo: "galeria_video_3", etiqueta: "IMAGEN Y TIEMPO" },
    { tipo: "video", archivo: "galeria_video_4", etiqueta: "ARCHIVO VISUAL" },
    { tipo: "video", archivo: "galeria_video_5", etiqueta: "PAISAJE EN MOVIMIENTO" },
    { tipo: "imagen", archivo: "galeria_imagen_2.jpg", etiqueta: "PAISAJE Y MEMORIA", aspecto: 1.5 },
    { tipo: "video", archivo: "galeria_video_6", etiqueta: "MIRADAS DEL TERRITORIO" },
    { tipo: "video", archivo: "galeria_video_7", etiqueta: "TIEMPO Y TERRITORIO" },
    { tipo: "imagen", archivo: "galeria_imagen_3.jpg", etiqueta: "ARCHIVO GRÁFICO", aspecto: 1.5 },
    { tipo: "video", archivo: "galeria_video_8", etiqueta: "MEMORIA VIVA" },
    { tipo: "video", archivo: "galeria_video_9", etiqueta: "IMAGEN Y MEMORIA" }
];
salas.filter(function (s) { return !!s.municipio; }).forEach(function (sala, i) {
    const medio = MEDIOS_ENTRADA[i % MEDIOS_ENTRADA.length];
    if (medio.tipo === "video") {
        crearPantallaEntrada(sala, medio);
    } else {
        crearCuadroEntrada(sala, medio);
    }
});

// --- Alfombras, tapices, bancas, plantas y faroles ---
crearAlfombraGaleria(0, 42.2, LIM * 2 - 2, 3.4, false, 0.012);
crearAlfombraGaleria(-24.4, -42.2, 41.2, 3.4, false, 0.012);
crearAlfombraGaleria(24.4, -42.2, 41.2, 3.4, false, 0.012);
crearAlfombraGaleria(42.2, 0, LIM * 2 - 2, 3.4, true, 0.026);
crearAlfombraGaleria(-42.2, 0, LIM * 2 - 2, 3.4, true, 0.026);

crearTapizGaleria(38.25, -8, Math.PI / 2);
crearTapizGaleria(38.25, 8, Math.PI / 2);
crearTapizGaleria(-38.25, -8, -Math.PI / 2);
crearTapizGaleria(-38.25, 8, -Math.PI / 2);
crearTapizGaleria(-17, -38.25, Math.PI);
crearTapizGaleria(8, -38.25, Math.PI);

crearPortalGaleria();
crearAgradecimientoRecepcion();

crearBancaGaleria(-17, 41.6, 0);
crearBancaGaleria(42.0, 0, Math.PI / 2);
crearBancaGaleria(-9, -41.6, Math.PI);
crearBancaGaleria(-42.0, 0, -Math.PI / 2);
crearBancaGaleria(14.75, 39.7, Math.PI);
crearBancaGaleria(19.25, 39.7, Math.PI);

[
    [-19.8, 39.3], [-14.2, 39.3],
    [39.2, -2.9], [39.2, 2.9], [39.2, -15], [39.2, 15],
    [-39.2, -2.9], [-39.2, 2.9], [-39.2, -15], [-39.2, 15],
    [-15, -39.2], [-4.5, -39.2], [4.5, -39.2], [15, -39.2]
].forEach(function (p) { crearPlantaGaleria(p[0], p[1]); });

[
    [-36, 44.4], [36, 44.4], [-36, -44.4], [36, -44.4],
    [44.4, -36], [44.4, 36], [-44.4, -36], [-44.4, 36]
].forEach(function (p) { crearFarolGaleria(p[0], p[1]); });

crearApliqueGaleria(-21.8, 38.25, 0);
crearApliqueGaleria(-12.2, 38.25, 0);
crearApliqueGaleria(38.25, -12, Math.PI / 2);
crearApliqueGaleria(38.25, 12, Math.PI / 2);
crearApliqueGaleria(-38.25, -12, -Math.PI / 2);
crearApliqueGaleria(-38.25, 12, -Math.PI / 2);
crearApliqueGaleria(-12, -38.25, Math.PI);
crearApliqueGaleria(12, -38.25, Math.PI);

/**
 * Solo se reproduce la proyección más cercana, y únicamente cuando el
 * visitante está en el patio, afuera de las salas. Así se ahorra batería
 * y nunca se superponen dos videos.
 */
function actualizarGaleria() {
    const p = jugador.pos;

    let mejor = null, mejorD = Infinity;
    for (let i = 0; i < pantallasGaleria.length; i++) {
        const s = pantallasGaleria[i];
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        if (d < mejorD) { mejorD = d; mejor = s; }
    }

    for (let i = 0; i < pantallasGaleria.length; i++) {
        const s = pantallasGaleria[i];
        const debe = estado.sala < 0 && s === mejor && mejorD < 13 && !document.hidden;
        if (debe) {
            if (!s.reproduciendo && !s.solicitando && !s.bloqueado) {
                s.solicitando = true;
                const intento = s.video.play();
                if (intento && intento.then) {
                    intento.then(function () {
                        s.solicitando = false;
                        s.reproduciendo = true;
                        s.activarVideo();
                    }, function () {
                        s.solicitando = false;
                        s.bloqueado = true;
                    });
                } else {
                    s.solicitando = false;
                    s.reproduciendo = !s.video.paused;
                    if (s.reproduciendo) s.activarVideo();
                }
            }
        } else if (s.reproduciendo) {
            s.video.pause();
            s.reproduciendo = false;
        }
    }
}

// Si el navegador bloqueó el autoplay, el primer toque o tecla lo reintenta.
["pointerdown", "touchstart", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function () {
        for (let i = 0; i < pantallasGaleria.length; i++) pantallasGaleria[i].bloqueado = false;
    }, { once: true, passive: true });
});

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) return;
    for (let i = 0; i < pantallasGaleria.length; i++) {
        if (pantallasGaleria[i].reproduciendo) {
            pantallasGaleria[i].video.pause();
            pantallasGaleria[i].reproduciendo = false;
        }
    }
});

// ------------------------------------------------------------
// Obras (fotografías del museo)
// ------------------------------------------------------------
function ponerFotoEnMaterial(materialImagen, img, proporcion) {
    const textura = new THREE.Texture(img);
    textura.encoding = THREE.sRGBEncoding;
    textura.generateMipmaps = false;
    textura.minFilter = THREE.LinearFilter;
    textura.magFilter = THREE.LinearFilter;
    textura.wrapS = THREE.ClampToEdgeWrapping;
    textura.wrapT = THREE.ClampToEdgeWrapping;
    textura.needsUpdate = true;

    materialImagen.map = textura;
    materialImagen.color.set(0xffffff);
    materialImagen.needsUpdate = true;
    imagenesCargadas.ok++;
    ajustarProporcion(textura, img.width, img.height, proporcion);
}

function aplicarFoto(materialImagen, datos, municipio, proporcion) {
    const url = RUTA_IMG + datos.src;
    const img = new Image();

    img.onload = function () {
        ponerFotoEnMaterial(materialImagen, img, proporcion);
    };

    img.onerror = function () {
        // Cuadro sin archivo: se reutiliza una fotografía que sí exista.
        const alternativa = RESERVA_FOTOS[reservaFoto++ % RESERVA_FOTOS.length];
        const respaldo = new Image();
        respaldo.onload = function () {
            ponerFotoEnMaterial(materialImagen, respaldo, proporcion);
            puente("aviso", "No se pudo cargar " + datos.src + "; se usó " + alternativa);
        };
        respaldo.onerror = function () {
            imagenesCargadas.fallo++;
            materialImagen.map = texturaDeRespaldo(municipio);
            materialImagen.color.set(0xffffff);
            materialImagen.needsUpdate = true;
            puente("aviso", "No se pudo cargar " + datos.src);
        };
        respaldo.src = RUTA_IMG + alternativa;
    };

    img.src = url;
}

function ajustarProporcion(textura, ancho, alto, proporcion) {
    if (!ancho || !alto) return;
    const objetivo = proporcion || (3.25 / 2.6);
    const foto = ancho / alto;
    textura.wrapS = THREE.ClampToEdgeWrapping;
    textura.wrapT = THREE.ClampToEdgeWrapping;
    if (foto > objetivo) {
        textura.repeat.set(objetivo / foto, 1);
        textura.offset.set((1 - objetivo / foto) / 2, 0);
    } else {
        textura.repeat.set(1, foto / objetivo);
        textura.offset.set(0, (1 - foto / objetivo) / 2);
    }
    textura.needsUpdate = true;
}

function texturaDeRespaldo(municipio) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 400;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#E2B04A";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
    ctx.fillStyle = "#E2B04A";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(municipio.emoji, c.width / 2, c.height / 2 - 40);
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#F5EAD6";
    ctx.fillText(municipio.nombre, c.width / 2, c.height / 2 + 50);
    return texturaCanvas(c);
}

/** Fotografía enmarcada, colocada en coordenadas locales de la sala. */
function crearObra(municipio, indiceObra, grupoSala, x, z, rotY) {
    const datos = municipio.imagenes[indiceObra];
    const grupo = new THREE.Group();
    grupo.position.set(x, 2.35, z);
    grupo.rotation.y = rotY;

    const marco = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.85, 0.14), madMarco);
    marco.castShadow = true;
    grupo.add(marco);

    const planoGeo = new THREE.PlaneGeometry(3.25, 2.6);
    const materialImagen = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const imagen = new THREE.Mesh(planoGeo, materialImagen);
    imagen.position.z = 0.09;
    grupo.add(imagen);

    aplicarFoto(materialImagen, datos, municipio);

    const cartela = crearTexto(municipio.nombre, 0.24, "#f3e9c9");
    cartela.position.set(0, -1.78, 0.12);
    cartela.scale.setScalar(0.72);
    grupo.add(cartela);

    grupoSala.add(grupo);

    const posicion = localAMundo(grupoSala, x, 2.35, z);
    const normal = new THREE.Vector3(-1, 0, 0).applyQuaternion(grupoSala.quaternion);

    return {
        grupo: grupo, datos: datos, indiceObra: indiceObra, municipio: municipio,
        orden: indiceObra, clave: municipio.id + "_" + indiceObra,
        posicion: posicion, normal: normal
    };
}

/**
 * Fotografía pequeña del kiosco central de la sala de estadísticas.
 * La normal se calcula a partir del giro de la cara para que «Ver obra»
 * funcione desde el lado correcto del kiosco.
 */
function crearFotoEstadistica(datos, indice, grupoSala, x, y, z, rotY) {
    const ANCHO = 2.16, ALTO = 1.96;

    const grupo = new THREE.Group();
    grupo.position.set(x, y, z);
    grupo.rotation.y = rotY;

    const marco = new THREE.Mesh(new THREE.BoxGeometry(ANCHO, ALTO, 0.12), madMarco);
    marco.castShadow = true;
    grupo.add(marco);

    const materialImagen = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const plano = new THREE.PlaneGeometry(ANCHO - 0.2, ALTO - 0.2);
    const imagen = new THREE.Mesh(plano, materialImagen);
    imagen.position.z = 0.075;
    grupo.add(imagen);

    aplicarFoto(materialImagen, datos, ESTADISTICAS, (ANCHO - 0.2) / (ALTO - 0.2));

    if (datos.titulo) {
        const cartela = crearLetrero(datos.titulo, "#f3e9c9", ANCHO);
        cartela.position.set(0, -(ALTO / 2 + 0.24), 0.1);
        grupo.add(cartela);
    }

    grupoSala.add(grupo);

    const normal = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY))
        .applyQuaternion(grupoSala.quaternion);

    return {
        grupo: grupo, datos: datos, indiceObra: indice, municipio: ESTADISTICAS,
        orden: indice, clave: "estadisticas_" + indice,
        posicion: localAMundo(grupoSala, x, y, z), normal: normal
    };
}

// ------------------------------------------------------------
// Guía (NPC) en la plaza
// ------------------------------------------------------------
const guia = crearGuia();
guia.position.set(-6, 0, 39);
guia.userData.destino = new THREE.Vector3(-6, 0, 39);
escena.add(guia);

function crearGuia() {
    const g = new THREE.Group();

    const piel = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.7 });
    const vestido = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.8 });
    const blusa = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.8 });
    const cabello = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.85 });
    const oro = new THREE.MeshStandardMaterial({ color: 0xe2b04a, roughness: 0.35, metalness: 0.6 });

    const falda = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.62, 1.02, 20), vestido);
    falda.position.y = 0.55;
    falda.castShadow = true;
    g.add(falda);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.72, 18), blusa);
    torso.position.y = 1.28;
    torso.castShadow = true;
    g.add(torso);

    const cinturon = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.04, 8, 20), oro);
    cinturon.rotation.x = Math.PI / 2;
    cinturon.position.y = 1.0;
    g.add(cinturon);

    const chal = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.42, 0.4, 18, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 0.85, side: THREE.DoubleSide }));
    chal.position.y = 1.5;
    g.add(chal);

    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 12), piel);
    cuello.position.y = 1.70;
    g.add(cuello);

    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 18), piel);
    cabeza.position.y = 1.92;
    cabeza.castShadow = true;
    g.add(cabeza);

    const casquete = new THREE.Mesh(
        new THREE.SphereGeometry(0.255, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), cabello);
    casquete.position.y = 1.95;
    g.add(casquete);

    const melena = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.5, 18), cabello);
    melena.position.set(0, 1.72, -0.06);
    g.add(melena);

    const chongo = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), cabello);
    chongo.position.set(0, 1.98, -0.22);
    g.add(chongo);

    const blanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const negro = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    const rojo = new THREE.MeshStandardMaterial({ color: 0xb5432f, roughness: 0.5 });

    [-0.095, 0.095].forEach(function (x) {
        const ojoB = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), blanco);
        ojoB.position.set(x, 1.95, 0.20);
        g.add(ojoB);
        const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), negro);
        pupila.position.set(x, 1.95, 0.238);
        g.add(pupila);
    });
    [-0.09, 0.09].forEach(function (x) {
        const ceja = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.02), cabello);
        ceja.position.set(x, 2.02, 0.215);
        g.add(ceja);
    });
    const boca = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), rojo);
    boca.scale.set(1.4, 0.7, 0.6);
    boca.position.set(0, 1.84, 0.225);
    g.add(boca);

    function crearBrazo(lado) {
        const brazo = new THREE.Group();
        brazo.position.set(lado * 0.28, 1.58, 0);
        const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.62, 12), blusa);
        manga.position.y = -0.31;
        manga.castShadow = true;
        brazo.add(manga);
        const mano = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), piel);
        mano.position.y = -0.64;
        brazo.add(mano);
        g.add(brazo);
        return brazo;
    }
    const brazoIzq = crearBrazo(1);
    const brazoDer = crearBrazo(-1);

    const bocadillo = crearTexto("¡Hola! Soy tu guía", 0.28, "#ffffff");
    bocadillo.scale.setScalar(1.1);
    bocadillo.position.y = 2.5;
    bocadillo.visible = false;
    g.add(bocadillo);

    const sombra = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 20),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 })
    );
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.02;
    g.add(sombra);

    g.userData.destino = new THREE.Vector3(-6, 0, 39);
    g.userData.caminando = false;
    g.userData.bocadillo = bocadillo;
    g.userData.brazoIzq = brazoIzq;
    g.userData.brazoDer = brazoDer;
    g.userData.cabeza = cabeza;
    g.userData.falda = falda;
    return g;
}

// ------------------------------------------------------------
// Marcador de objetivo (aro dorado)
// ------------------------------------------------------------
const marcador = new THREE.Group();
const aro = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.075, 10, 28), matOro);
aro.rotation.x = Math.PI / 2;
marcador.add(aro);

const haz = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.62, 3.4, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe2b04a, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false })
);
haz.position.y = 1.7;
marcador.add(haz);

const chispa = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), matOro);
chispa.position.y = 0.1;
marcador.add(chispa);
marcador.visible = false;
escena.add(marcador);

// ------------------------------------------------------------
// Movimiento / colisión
// ------------------------------------------------------------
function puedeCaminar(x, z) {
    for (const o of obstaculos) {
        if (x >= o.xMin && x <= o.xMax && z >= o.zMin && z <= o.zMax) return false;
    }
    for (const r of regiones) {
        if (x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax) return true;
    }
    return false;
}

function moverJugador(dt) {
    const rap = entrada.activa ? 3.8 : 4.6;
    const adelante = new THREE.Vector3(-Math.sin(jugador.yaw), 0, -Math.cos(jugador.yaw));
    const derecha = new THREE.Vector3(Math.cos(jugador.yaw), 0, -Math.sin(jugador.yaw));

    const deseo = new THREE.Vector3()
        .addScaledVector(adelante, entrada.y)
        .addScaledVector(derecha, entrada.x);
    if (deseo.length() > 1) deseo.normalize();

    jugador.vel.x += (deseo.x * rap - jugador.vel.x) * Math.min(1, dt * 12);
    jugador.vel.z += (deseo.z * rap - jugador.vel.z) * Math.min(1, dt * 12);

    const nx = jugador.pos.x + jugador.vel.x * dt;
    const nz = jugador.pos.z + jugador.vel.z * dt;

    if (puedeCaminar(nx, jugador.pos.z)) jugador.pos.x = nx;
    else jugador.vel.x = 0;
    if (puedeCaminar(jugador.pos.x, nz)) jugador.pos.z = nz;
    else jugador.vel.z = 0;

    jugador.pos.y = jugador.alturaOjos + Math.sin(estado.tiempo * 9) * (entrada.activa ? 0.035 : 0.022);

    camara.position.copy(jugador.pos);
    camara.rotation.set(jugador.pitch, jugador.yaw, 0, "YXZ");
}

// ------------------------------------------------------------
// Controles táctiles (mirar alrededor)
// ------------------------------------------------------------
let arrastre = null;
document.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
        arrastre = { id: e.touches[0].identifier, x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
}, { passive: true });

document.addEventListener("touchmove", function (e) {
    for (const t of e.touches) {
        if (arrastre && t.identifier === arrastre.id) {
            const dx = t.clientX - arrastre.x;
            const dy = t.clientY - arrastre.y;
            arrastre.x = t.clientX;
            arrastre.y = t.clientY;
            mirar(dx, dy);
        }
    }
}, { passive: true });

document.addEventListener("touchend", function () { arrastre = null; }, { passive: true });

let mouseX = null;
let mouseY = null;
document.addEventListener("mousedown", function (e) { mouseX = e.clientX; mouseY = e.clientY; });
document.addEventListener("mouseup", function () { mouseX = null; });
document.addEventListener("mousemove", function (e) {
    if (mouseX === null) return;
    mirar(e.clientX - mouseX, e.clientY - mouseY);
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function mirar(dx, dy) {
    const s = 0.0035;
    jugador.yaw -= dx * s;
    jugador.pitch = Math.max(-1.35, Math.min(1.35, jugador.pitch - dy * s));
}

// Teclado (para probar en escritorio)
const teclas = {};
window.addEventListener("keydown", (e) => teclas[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => teclas[e.key.toLowerCase()] = false);

function leerTeclado() {
    if (entrada.activa) return;
    let x = 0, y = 0;
    if (teclas["a"] || teclas["arrowleft"]) x -= 1;
    if (teclas["d"] || teclas["arrowright"]) x += 1;
    if (teclas["w"] || teclas["arrowup"]) y += 1;
    if (teclas["s"] || teclas["arrowdown"]) y -= 1;
    entrada.x = x; entrada.y = y;
}

// ------------------------------------------------------------
// Lógica del recorrido libre
// ------------------------------------------------------------
function salaActual() { return estado.sala >= 0 ? salas[estado.sala] : null; }

/** Índice de la sala donde está el jugador, o -1 si está en el patio. */
function salaDondeEsta(x, z) {
    for (let i = 0; i < salas.length; i++) {
        const a = salas[i].aabb;
        if (x > a.xMin && x < a.xMax && z > a.zMin && z < a.zMax) return i;
    }
    return -1;
}

function marcarVisitada(i) {
    const s = salas[i];
    if (!s || estado.visitadas[i]) return;
    estado.visitadas[i] = 1;
    estado.salasCompletadas = Object.keys(estado.visitadas).length;
    puente("setProgreso", estado.salasCompletadas, salas.length);
    puente("salaDescubierta", s.tema.id);
    if (estado.salasCompletadas >= salas.length) {
        puente("juegoTerminado", estado.salasCompletadas, salas.length);
    }
}

function frenteDeObra(obra) {
    return {
        x: obra.posicion.x + obra.normal.x * 2.2,
        z: obra.posicion.z + obra.normal.z * 2.2
    };
}

function obraCercana(rango) {
    const s = salaActual();
    if (!s || !s.obras.length) return null;
    const limite = rango || 3.2;
    let mejor = null, mejorD = limite;
    s.obras.forEach(function (o) {
        const f = frenteDeObra(o);
        const d = Math.hypot(jugador.pos.x - f.x, jugador.pos.z - f.z);
        if (d < mejorD) { mejorD = d; mejor = o; }
    });
    return mejor;
}

/** Devuelve { sala, puerta } de la puerta más cercana, o null. */
function puertaCercana(rango) {
    if (estado.sala >= 0) return null;
    const limite = rango || 5.0;
    let mejor = null, mejorD = limite;
    salas.forEach(function (s, i) {
        s.puertas.forEach(function (p, k) {
            const d = Math.hypot(jugador.pos.x - p.x, jugador.pos.z - p.z);
            if (d < mejorD) { mejorD = d; mejor = { sala: i, puerta: k }; }
        });
    });
    return mejor;
}

function colocarMarcador(pos) {
    marcador.position.set(pos.x, 0.6, pos.z);
    marcador.visible = true;
}

function actualizarObjetivo() {
    const s = salaActual();
    if (!s) {
        marcador.visible = false;
        const p = puertaCercana();
        const cerca = p ? salas[p.sala].tema.nombre : null;
        puente("setObjetivo", cerca ? "Sala " + salas[p.sala].num + ": " + cerca : "Recorrido libre",
            cerca ? "Pulsa «Entrar a la sala» para visitarla" : "Elige cualquiera de las 13 salas");
        return;
    }
    if (s.obras.length && estado.obra < s.obras.length) {
        const obra = s.obras[estado.obra];
        puente("setObjetivo",
            s.tema.nombre,
            "Obra " + (estado.obra + 1) + "/" + s.obras.length + " — acércate y pulsa VER");
        colocarMarcador(new THREE.Vector3(frenteDeObra(obra).x, 0, frenteDeObra(obra).z));
    } else {
        marcador.visible = false;
        puente("setObjetivo", s.tema.nombre,
            s.obras.length ? "Has visto todas las obras. Regresa al exterior." : "Consulta los paneles del pabellón.");
    }
}

function cambiarUbicacion() {
    const el = document.getElementById("ubicacion");
    if (!el) return;
    const s = salaActual();
    el.textContent = s ? ("Sala " + s.num + " · " + s.tema.nombre) : "Plaza exterior · Recorrido libre";
}

function alEntrarSala(i) {
    estado.sala = i;
    estado.obra = 0;
    marcarVisitada(i);
    cambiarUbicacion();
    actualizarObjetivo();
}

function alSalirSala() {
    estado.sala = -1;
    estado.obra = 0;
    cambiarUbicacion();
    actualizarObjetivo();
}

function colocarJugador(x, z, dx, dz) {
    jugador.pos.set(x, jugador.alturaOjos, z);
    jugador.vel.set(0, 0, 0);
    jugador.yaw = Math.atan2(-dx, -dz);
    jugador.pitch = 0;
    camara.position.copy(jugador.pos);
    camara.rotation.set(0, jugador.yaw, 0, "YXZ");
}

/** Lleva al jugador dentro de la sala elegida, por la puerta indicada. */
function entrarASala(indice, idxPuerta) {
    const s = salas[indice];
    if (!s) return;
    const k = (idxPuerta == null) ? 0 : Math.min(idxPuerta, s.puertas.length - 1);
    const p = s.puertas[k];

    estado.sala = indice;
    estado.puerta = k;
    estado.obra = 0;
    colocarJugador(p.x - p.nx * 3, p.z - p.nz * 3, -p.nx, -p.nz);
    marcarVisitada(indice);
    cambiarUbicacion();
    actualizarObjetivo();
    mostrarDialogo(
        s.tema.emoji + " Sala " + s.num + " · " + s.tema.nombre,
        s.tema.id === "estadisticas"
            ? "En el kiosco central te esperan 3 fotografías: rodea el kiosco y pulsa «Ver obra» en cada una. Alrededor, los muros reúnen 4 paneles numerados del 1 al 4 con la bienvenida, las cifras clave, las fuentes y cómo recorrer el museo."
            : s.obras.length
            ? "Tienes " + s.obras.length + " fotografías por descubrir. Camina hasta un cuadro y pulsa «Ver obra». Cuando quieras, vuelve a la plaza."
            : "Sigue los paneles numerados del 1 al 4, en sentido de las manecillas del reloj: bienvenida, cifras clave, fuentes y cómo recorrer el museo.",
        [{ texto: "¡Explorar!", accion: "cerrar" }]
    );
}

/** Sale por la puerta más cercana y deja al jugador en el patio. */
function regresarAlExterior() {
    const s = salaActual();
    if (!s) return;
    // elige la puerta más cercana al jugador (no la de la entrada)
    let k = 0, mejor = Infinity;
    s.puertas.forEach(function (p, i) {
        const d = Math.hypot(jugador.pos.x - p.x, jugador.pos.z - p.z);
        if (d < mejor) { mejor = d; k = i; }
    });
    const p = s.puertas[k];
    colocarJugador(p.x + p.nx * 3.2, p.z + p.nz * 3.2, -p.nx, -p.nz);

    estado.sala = -1;
    estado.obra = 0;
    cambiarUbicacion();
    actualizarObjetivo();
    puente("aviso", "Estás en la plaza. Entra a la sala que quieras.");
}

function iniciarPartida(clave, correo) {
    claveActual = clave || "";
    correoActual = correo || "";
    document.getElementById("dialogo").classList.remove("visible");
    document.getElementById("visor").classList.remove("visible");
    const dir0 = document.getElementById("directorio");
    if (dir0) dir0.classList.remove("visible");
    dialogoPendiente = null;

    // siempre se empieza en la plaza exterior, viendo todas las salas
    estado.sala = -1;
    estado.obra = 0;
    colocarJugador(EXT.SPAWN_X, EXT.SPAWN_Z, 0, -1);

    cambiarUbicacion();
    actualizarObjetivo();

    const saludo = clave
        ? "¡Hola, " + clave + "! Bienvenido al Museo Digital 3D."
        : "¡Hola! Bienvenido al Museo Digital 3D.";
    mostrarDialogo(
        "Guía",
        saludo + " Estás en la plaza exterior del museo, frente a las " + salas.length +
        " salas de la Región de los Volcanes. No hay un orden obligatorio: elige la sala que " +
        "quieras, entra por su puerta y vuelve a la plaza cuando desees.",
        [{ texto: "¡Vamos!", accion: "cerrar" }]
    );
}

function hablarConGuia() {
    mostrarDialogo(
        "Guía",
        "Hay 13 salas: 12 municipios y una de estadísticas. " +
        "Camina hasta la puerta de cualquier sala y pulsa «Entrar a la sala»; " +
        "o usa el botón «Salas» del HUD para ir directamente a la que prefieras.",
        [{ texto: "¡Entendido!", accion: "cerrar" }]
    );
}

function verObra(obra) {
    const m = obra.municipio;
    const d = obra.datos;
    const texto = (d.leyenda && d.leyenda.length > 0) ? d.leyenda : m.cultura;

    const s = salaActual();
    if (s) {
        s.vistas[obra.clave] = 1;
        if (obra.orden >= estado.obra) estado.obra = obra.orden + 1;
    }
    if (m && m.id !== "estadisticas") puente("obraVista", m.id, obra.indiceObra);
    actualizarObjetivo();

    const titulo = (d.titulo && d.titulo.length > 0)
        ? d.titulo
        : m.nombre + " — fotografía " + (obra.indiceObra + 1) + " de " + m.imagenes.length;

    dialogoPendiente = function () {
        mostrarDialogo(titulo, texto, [{ texto: "Continuar", accion: "cerrar" }]);
    };
    abrirVisor(m, d, obra.indiceObra + 1);
}

// ------------------------------------------------------------
// Visor de imagen ampliada
// ------------------------------------------------------------
const RUTA_ABS = "file:///android_asset/web/";
let dialogoPendiente = null;

function abrirVisor(municipio, datos, numero) {
    document.getElementById("visorImg").src = RUTA_ABS + RUTA_IMG + datos.src;
    document.getElementById("visorMunicipio").textContent = municipio.nombre;
    document.getElementById("visorTitulo").textContent =
        datos.titulo && datos.titulo.length > 0 ? datos.titulo : "Fotografía " + numero + " de " + municipio.imagenes.length;
    document.getElementById("visorLeyenda").textContent =
        datos.leyenda && datos.leyenda.length > 0 ? datos.leyenda : municipio.cultura;
    document.getElementById("visorContador").textContent =
        numero + " / " + municipio.imagenes.length +
        (datos.fecha && datos.fecha.length > 0 ? "  ·  " + datos.fecha : "");
    document.getElementById("visor").classList.add("visible");
    puente("visorAbierto", true);
}

function cerrarVisor() {
    document.getElementById("visor").classList.remove("visible");
    puente("visorAbierto", false);
    if (dialogoPendiente) {
        const siguiente = dialogoPendiente;
        dialogoPendiente = null;
        siguiente();
    }
}

document.getElementById("visorCerrar").addEventListener("click", cerrarVisor);
document.getElementById("visor").addEventListener("click", function (e) {
    if (e.target.id === "visor") cerrarVisor();
});

function reiniciar() {
    estado.salasCompletadas = 0;
    estado.visitadas = {};
    document.getElementById("dialogo").classList.remove("visible");
    document.getElementById("visor").classList.remove("visible");
    dialogoPendiente = null;
    iniciarPartida(claveActual, correoActual);
}

// ------------------------------------------------------------
// Índice de salas (HUD)
// ------------------------------------------------------------
function abrirDirectorio() {
    const caja = document.getElementById("listaSalas");
    if (!caja || caja.childElementCount === 0) {
        salas.forEach(function (s, i) {
            const b = document.createElement("button");
            b.className = "filaSala";
            b.innerHTML = "<span class='numSala'>" + s.num + "</span>" +
                "<span class='emojiSala'>" + s.tema.emoji + "</span>" +
                "<span class='nombreSala'>" + s.tema.nombre + "</span>";
            b.onclick = function () {
                document.getElementById("directorio").classList.remove("visible");
                entrarASala(i, 0);
            };
            caja.appendChild(b);
        });
    }
    document.getElementById("directorio").classList.add("visible");
}

document.getElementById("directorioCerrar").addEventListener("click", function () {
    const d = document.getElementById("directorio");
    if (d) d.classList.remove("visible");
});
document.getElementById("directorio").addEventListener("click", function (e) {
    if (e.target.id === "directorio") {
        e.target.classList.remove("visible");
    }
});

// ------------------------------------------------------------
// Acciones del HUD (botones en pantalla)
// ------------------------------------------------------------
function alPulsarVer() {
    const o = obraCercana();
    if (o) { verObra(o); return; }
    const dG = Math.hypot(jugador.pos.x - guia.position.x, jugador.pos.z - guia.position.z);
    if (dG < 3.5) { hablarConGuia(); return; }
    puente("aviso", "Acércate a una fotografía o a la guía");
}

function alPulsarContexto() {
    if (estado.sala >= 0) { regresarAlExterior(); return; }
    const p = puertaCercana();
    if (p) entrarASala(p.sala, p.puerta);
}

(function conectarBotones() {
    const btnCtx = document.getElementById("btnContexto");
    const btnVer = document.getElementById("btnVerObra");
    const btnSalas = document.getElementById("btnSalas");
    [btnCtx, btnVer, btnSalas].forEach(function (b) {
        if (!b) return;
        b.addEventListener("touchstart", function (e) { e.stopPropagation(); }, { passive: true });
        b.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    });
    if (btnCtx) btnCtx.addEventListener("click", alPulsarContexto);
    if (btnVer) btnVer.addEventListener("click", function () {
        const o = obraCercana();
        if (o) verObra(o);
    });
    if (btnSalas) btnSalas.addEventListener("click", abrirDirectorio);
})();

let ultimoTextoCtx = "";
let verVisible = null;
let ctxVisible = null;

function actualizarBotones() {
    const btnCtx = document.getElementById("btnContexto");
    const btnVer = document.getElementById("btnVerObra");
    if (!btnCtx || !btnVer) return;

    let texto = "";
    if (estado.sala >= 0) {
        texto = "Regresar al exterior";
    } else {
        const p = puertaCercana();
        if (p) texto = "Entrar a la sala";
    }

    if (texto !== ultimoTextoCtx) {
        ultimoTextoCtx = texto;
        btnCtx.textContent = texto;
        const mostrar = texto.length > 0;
        if (mostrar !== ctxVisible) {
            ctxVisible = mostrar;
            btnCtx.classList.toggle("oculto", !mostrar);
        }
        btnCtx.classList.toggle("secundario", estado.sala >= 0);
    }

    const cerca = !!obraCercana(3.0);
    if (cerca !== verVisible) {
        verVisible = cerca;
        btnVer.classList.toggle("oculto", !cerca);
    }
}

// ------------------------------------------------------------
// Diálogo
// ------------------------------------------------------------
function mostrarDialogo(titulo, texto, botones) {
    const d = document.getElementById("dialogo");
    document.getElementById("dlgTitulo").textContent = titulo;
    document.getElementById("dlgTexto").textContent = texto;

    const cajaBotones = document.getElementById("dlgBotones");
    cajaBotones.innerHTML = "";
    (botones || [{ texto: "Continuar", accion: "cerrar" }]).forEach(function (b) {
        const btn = document.createElement("button");
        btn.className = "botonDialogo";
        btn.textContent = b.texto;
        btn.onclick = function () {
            d.classList.remove("visible");
            if (b.accion === "reiniciar") reiniciar();
        };
        cajaBotones.appendChild(btn);
    });

    d.classList.add("visible");
}

// ------------------------------------------------------------
// Puente con la app nativa
// ------------------------------------------------------------
function puente(metodo) {
    var args = Array.prototype.slice.call(arguments, 1);
    try {
        if (window.Android && typeof window.Android[metodo] === "function") {
            window.Android[metodo].apply(window.Android, args);
        }
    } catch (e) { /* modo navegador */ }
}

// lo invoca Kotlin (botón VER)
function pulsarVer() { alPulsarVer(); }

// ------------------------------------------------------------
// API que llama el código nativo (Kotlin)
// ------------------------------------------------------------
window.Juego = {
    setEntrada: function (x, y) {
        entrada.x = x;
        entrada.y = y;
        entrada.activa = (x !== 0 || y !== 0);
    },
    mirar: mirar,
    iniciarPartida: function (clave, correo) { iniciarPartida(clave, correo); },
    entrarASala: function (indice) { entrarASala(indice, 0); },
    regresarAlExterior: function () { regresarAlExterior(); },
    irASala: function (indice) { entrarASala(indice, 0); },        // compatibilidad
    salirAlPasillo: function () { regresarAlExterior(); },        // compatibilidad
    reiniciar: function () { reiniciar(); },
    cerrarVisor: function () { cerrarVisor(); },
    abrirDirectorio: function () { abrirDirectorio(); },
    estadoImagenes: function () { return imagenesCargadas; }
};

// Exponer acciones al código nativo
window.Accion = { ver: pulsarVer, dialogo: mostrarDialogo };

// ------------------------------------------------------------
// Bucle
// ------------------------------------------------------------
let ultimo = performance.now();

function animar() {
    const ahora = performance.now();
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    estado.tiempo += dt;

    leerTeclado();
    moverJugador(dt);
    actualizarGaleria();

    // detecta si el jugador entró o salió de una sala caminando
    const enSala = salaDondeEsta(jugador.pos.x, jugador.pos.z);
    if (enSala !== estado.sala) {
        if (enSala >= 0) alEntrarSala(enSala);
        else alSalirSala();
    }

    // guía: caminar hacia su destino + flotar
    const destino = guia.userData.destino;
    const dist = Math.hypot(guia.position.x - destino.x, guia.position.z - destino.z);
    if (dist > 0.15) {
        guia.position.x += (destino.x - guia.position.x) * Math.min(1, dt * 2.2);
        guia.position.z += (destino.z - guia.position.z) * Math.min(1, dt * 2.2);
        guia.rotation.y = Math.atan2(destino.x - guia.position.x, destino.z - guia.position.z);
        guia.position.y = Math.abs(Math.sin(estado.tiempo * 6)) * 0.09;
    } else {
        guia.userData.caminando = false;
        guia.position.y *= 0.9;
        guia.rotation.y = 0;   // mira hacia el punto de aparición (+z)
    }

    const dG = Math.hypot(jugador.pos.x - guia.position.x, jugador.pos.z - guia.position.z);
    guia.userData.bocadillo.visible = dG < 9;

    // animación de la guía: saluda o espera
    const bIzq = guia.userData.brazoIzq;
    const bDer = guia.userData.brazoDer;
    if (dG < 5.5 && estado.sala < 0) {
        bDer.rotation.z = -2.35 + Math.sin(estado.tiempo * 7) * 0.45;
        bDer.rotation.x = 0;
        bIzq.rotation.z = 0.14;
        bIzq.rotation.x = Math.sin(estado.tiempo * 1.8) * 0.12;
    } else {
        bIzq.rotation.z = 0.12 + Math.sin(estado.tiempo * 1.6) * 0.05;
        bDer.rotation.z = -0.12 - Math.sin(estado.tiempo * 1.6) * 0.05;
        bIzq.rotation.x = Math.sin(estado.tiempo * 1.6) * 0.09;
        bDer.rotation.x = Math.sin(estado.tiempo * 1.6) * 0.09;
    }
    guia.userData.cabeza.rotation.z = Math.sin(estado.tiempo * 1.4) * 0.05;

    // marcado
    if (marcador.visible) {
        aro.rotation.z += dt * 1.6;
        aro.position.y = Math.sin(estado.tiempo * 2.4) * 0.12;
        chispa.rotation.y += dt * 3;
        chispa.position.y = 0.25 + Math.sin(estado.tiempo * 3) * 0.08;
    }

    actualizarBotones();

    renderer.render(escena, camara);
    requestAnimationFrame(animar);
}

animar();

puente("escenaLista", salas.length);
window.guionListo = true;

// avisa cuántas fotos se pudieron cargar (el resto muestra un marco con el nombre)
setTimeout(function () {
    puente("imagenesCargadas", imagenesCargadas.ok, imagenesCargadas.fallo);
}, 1200);
