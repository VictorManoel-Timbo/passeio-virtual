// utils.js

/**
 * Calcula a Normal de uma face a partir de 3 pontos
 * Essencial para o cálculo de iluminação manual no motor
 */
export function calcNormal(p0, p1, p2) {
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);

    // Vetores das arestas
    for (var i = 0; i < 3; i++) {
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p1[i];
    }

    // Produto Vetorial (Cross Product)
    var c = [
        v0[1] * v1[2] - v0[2] * v1[1],
        v0[2] * v1[0] - v0[0] * v1[2],
        v0[0] * v1[1] - v0[1] * v1[0]
    ];

    // Normalização do vetor resultante
    var len = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
    if (len > 0) return [c[0] / len, c[1] / len, c[2] / len];

    return [0, 1, 0]; // Retorno padrão caso o cálculo falhe
}

/**
 * Utilitário para carregar arquivos de texto (Shaders, OBJs)
 */
export async function loadTextFile(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao carregar: ${url}`);
    return await response.text();
}