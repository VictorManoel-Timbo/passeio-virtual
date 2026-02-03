export class Geometry {
    /**
     * Cria um Plano no eixo XZ (horizontal)
     * @param {number} width - Largura (X)
     * @param {number} depth - Profundidade (Z)
     * @param {Array} color - [R, G, B, A]
     */
    static createPlane(width, depth, color = [1.0, 1.0, 1.0, 1.0]) {
        const w = width / 2;
        const d = depth / 2;

        const vertices = new Float32Array([
            -w, 0, -d,  -w, 0, d,   w, 0, d,
            -w, 0, -d,   w, 0, d,   w, 0, -d
        ]);

        const normals = new Float32Array([
            0, 1, 0,  0, 1, 0,  0, 1, 0,
            0, 1, 0,  0, 1, 0,  0, 1, 0
        ]);

        const colors = new Float32Array(6 * 4);
        for (let i = 0; i < 6; i++) colors.set(color, i * 4);

        return { vertices, normals, colors };
    }

    /**
     * Cria um Paralelepípedo (Retângulo 3D)
     * @param {number} width - Largura (X)
     * @param {number} height - Altura (Y)
     * @param {number} depth - Profundidade (Z)
     * @param {Array} color - [R, G, B, A]
     */
    static createBox(width, height, depth, color = [0.7, 0.7, 0.7, 1.0]) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;

        // Definindo os 36 vértices (6 faces * 2 triângulos * 3 vértices)
        const v = new Float32Array([
            // Frente (Z+)
            -w, -h,  d,  w, -h,  d,  w,  h,  d,  -w, -h,  d,  w,  h,  d,  -w,  h,  d,
            // Atrás (Z-)
            -w, -h, -d, -w,  h, -d,  w,  h, -d,  -w, -h, -d,  w,  h, -d,  w, -h, -d,
            // Cima (Y+)
            -w,  h, -d, -w,  h,  d,  w,  h,  d,  -w,  h, -d,  w,  h,  d,  w,  h, -d,
            // Baixo (Y-)
            -w, -h, -d,  w, -h, -d,  w, -h,  d,  -w, -h, -d,  w, -h,  d,  -w, -h,  d,
            // Direita (X+)
             w, -h, -d,  w,  h, -d,  w,  h,  d,   w, -h, -d,  w,  h,  d,  w, -h,  d,
            // Esquerda (X-)
            -w, -h, -d, -w, -h,  d, -w,  h,  d,  -w, -h, -d, -w,  h,  d,  -w,  h, -d
        ]);

        // Normais (vetores perpendiculares a cada face)
        const n = new Float32Array([
             0, 0, 1,  0, 0, 1,  0, 0, 1,   0, 0, 1,  0, 0, 1,  0, 0, 1, // Frente
             0, 0,-1,  0, 0,-1,  0, 0,-1,   0, 0,-1,  0, 0,-1,  0, 0,-1, // Atrás
             0, 1, 0,  0, 1, 0,  0, 1, 0,   0, 1, 0,  0, 1, 0,  0, 1, 0, // Cima
             0,-1, 0,  0,-1, 0,  0,-1, 0,   0,-1, 0,  0,-1, 0,  0,-1, 0, // Baixo
             1, 0, 0,  1, 0, 0,  1, 0, 0,   1, 0, 0,  1, 0, 0,  1, 0, 0, // Direita
            -1, 0, 0, -1, 0, 0, -1, 0, 0,  -1, 0, 0, -1, 0, 0, -1, 0, 0  // Esquerda
        ]);

        const c = new Float32Array(36 * 4);
        for (let i = 0; i < 36; i++) c.set(color, i * 4);

        return { vertices: v, normals: n, colors: c };
    }

    /** Cria uma Esfera usando coordenadas polares
     * @param {number} radius - Raio da esfera
     * @param {number} segments - Quantidade de subdivisões (detalhe)
     */
    static createSphere(radius, segments, color = [0.7, 0.7, 0.7, 1.0]) {
        const vertices = [];
        const normals = [];
        const colors = [];

        for (let lat = 0; lat <= segments; lat++) {
            const theta = (lat * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= segments; lon++) {
                const phi = (lon * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                // Vértices e Normais (em uma esfera centrada em 0, a normal é a própria posição normalizada)
                vertices.push(radius * x, radius * y, radius * z);
                normals.push(x, y, z);
                
                // Cor
                colors.push(...color);
            }
        }

        // Criar os triângulos a partir da grade de pontos
        const finalVertices = [];
        const finalNormals = [];
        const finalColors = [];

        for (let lat = 0; lat < segments; lat++) {
            for (let lon = 0; lon < segments; lon++) {
                const first = lat * (segments + 1) + lon;
                const second = first + segments + 1;

                // Definimos dois triângulos por "quadrado" da grade
                const indices = [first, second, first + 1, second, second + 1, first + 1];

                indices.forEach(idx => {
                    finalVertices.push(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
                    finalNormals.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
                    finalColors.push(colors[idx * 4], colors[idx * 4 + 1], colors[idx * 4 + 2], colors[idx * 4 + 3]);
                });
            }
        }

        return {
            vertices: new Float32Array(finalVertices),
            normals: new Float32Array(finalNormals),
            colors: new Float32Array(finalColors)
        };
    }

    /**
     * Cria um Cilindro
     * @param {number} radius - Raio da base
     * @param {number} height - Altura total
     * @param {number} segments - Refinamento da borda circular
     */
    static createCylinder(radius, height, segments, color = [0.7, 0.7, 0.7, 1.0]) {
        const v = [];
        const n = [];
        const h = height / 2;

        for (let i = 0; i < segments; i++) {
            const theta1 = (i * 2 * Math.PI) / segments;
            const theta2 = ((i + 1) * 2 * Math.PI) / segments;

            const x1 = Math.cos(theta1), z1 = Math.sin(theta1);
            const x2 = Math.cos(theta2), z2 = Math.sin(theta2);

            // --- Lado (Corpo do cilindro) ---
            // Triângulo 1
            v.push(x1 * radius, h, z1 * radius,  x1 * radius, -h, z1 * radius,  x2 * radius, -h, z2 * radius);
            n.push(x1, 0, z1,  x1, 0, z1,  x2, 0, z2);
            // Triângulo 2
            v.push(x1 * radius, h, z1 * radius,  x2 * radius, -h, z2 * radius,  x2 * radius, h, z2 * radius);
            n.push(x1, 0, z1,  x2, 0, z2,  x2, 0, z2);

            // --- Topo (Tampa superior) ---
            v.push(0, h, 0,  x2 * radius, h, z2 * radius,  x1 * radius, h, z1 * radius);
            n.push(0, 1, 0,  0, 1, 0,  0, 1, 0);

            // --- Base (Tampa inferior) ---
            v.push(0, -h, 0,  x1 * radius, -h, z1 * radius,  x2 * radius, -h, z2 * radius);
            n.push(0, -1, 0,  0, -1, 0,  0, -1, 0);
        }

        const colors = new Float32Array((v.length / 3) * 4);
        for (let i = 0; i < v.length / 3; i++) colors.set(color, i * 4);

        return {
            vertices: new Float32Array(v),
            normals: new Float32Array(n),
            colors: colors
        };
    }
}