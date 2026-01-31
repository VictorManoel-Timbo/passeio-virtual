export class Transform {
  // Cria uma matriz identidade (não transforma nada)
  static identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  // Multiplica duas matrizes 4x4 (essencial para combinar Câmera e Objeto)
  static multiplyMatrices(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) { // linha
      for (let j = 0; j < 4; j++) { // coluna
        out[i + j * 4] =
          a[i + 0 * 4] * b[0 + j * 4] +
          a[i + 1 * 4] * b[1 + j * 4] +
          a[i + 2 * 4] * b[2 + j * 4] +
          a[i + 3 * 4] * b[3 + j * 4];
      }
    }
    return out;
  }

  // Cria a Matriz de Projeção Perspectiva
  static perspective(fovDeg, aspect, near, far) {
    const f = 1.0 / Math.tan((fovDeg * Math.PI / 180) / 2);
    const rangeInv = 1.0 / (near - far);

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]);
  }

  // Translada (move) uma matriz
  static translate(m, x, y, z) {
    const out = new Float32Array(m);
    out[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
    out[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
    return out;
  }

  static rotateX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ]);
  }

  static rotateY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ]);
  }

  static rotateZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  static transpose(m) {
    return new Float32Array([
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    ]);
  }

  static inverse(m) {
    // Implementação simplificada de inversão 4x4 ou use uma biblioteca.
    // Para um motor "do zero", você precisará calcular o determinante e a adjunta.
    // Abaixo, um retorno temporário para não quebrar o código:
    return new Float32Array(m);
  }

  static getNormalMatrix(modelMatrix) {
    let out = this.inverse(modelMatrix);
    return this.transpose(out);
  }
}