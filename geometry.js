export class Geometry {
    static createCube(size, color = [0.7, 0.7, 0.7, 1.0]) {
        const s = size / 2;

        // 24 Vértices (6 faces x 4 vértices por face, desenhados como 2 triângulos cada)
        // Total de 36 coordenadas (12 triângulos x 3 vértices)
        const v = new Float32Array([
            // Frente (Z+)
            -s, -s, s, s, -s, s, s, s, s, -s, -s, s, s, s, s, -s, s, s,
            // Atrás (Z-)
            -s, -s, -s, -s, s, -s, s, s, -s, -s, -s, -s, s, s, -s, s, -s, -s,
            // Cima (Y+)
            -s, s, -s, -s, s, s, s, s, s, -s, s, -s, s, s, s, s, s, -s,
            // Baixo (Y-)
            -s, -s, -s, s, -s, -s, s, -s, s, -s, -s, -s, s, -s, s, -s, -s, s,
            // Direita (X+)
            s, -s, -s, s, s, -s, s, s, s, s, -s, -s, s, s, s, s, -s, s,
            // Esquerda (X-)
            -s, -s, -s, -s, -s, s, -s, s, s, -s, -s, -s, -s, s, s, -s, s, -s
        ]);

        // Normais para cada face (essencial para o Phong)
        const n = new Float32Array([
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // Frente
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Atrás
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // Cima
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Baixo
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // Direita
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0  // Esquerda
        ]);

        // Cores (aplicando a mesma cor para todos os 36 vértices)
        const c = new Float32Array(36 * 4);
        for (let i = 0; i < 36; i++) {
            c.set(color, i * 4);
        }

        return { vertices: v, normals: n, colors: c };
    }

    static createPlane(width, depth) {
        const w = width / 2;
        const d = depth / 2;

        const vertices = new Float32Array([
            -w, 0, -d, -w, 0, d, w, 0, d,
            -w, 0, -d, w, 0, d, w, 0, -d
        ]);

        // Preencha as Normais (apontando para cima: Y=1)
        const normals = new Float32Array([
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0
        ]);

        // Preencha as Cores (RGBA para cada um dos 6 vértices)
        const colors = new Float32Array(6 * 4).fill(1.0)

        return { vertices, normals, colors };
    }
}