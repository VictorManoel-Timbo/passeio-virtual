export class Light {
    constructor(position = [10.0, 10.0, 10.0], color = [1.0, 1.0, 1.0], intensity = 1.0) {
        // Propriedades da luz
        this.position = new Float32Array(position);  // Posição 3D (x, y, z) - usada para luz pontual/direcional
        this.color = new Float32Array(color);        // Cor RGB (0-1) - multiplicada pela intensidade
        this.intensity = intensity;                   // Intensidade (escalar) - afeta o brilho
        // Opcional: tipo de luz (ex.: 'point', 'directional') para extensões futuras
        this.type = 'point';  // Por padrão, luz pontual (como no shader atual)
    }

    // Método para atualizar uniforms no shader (chamado no render loop, ex.: em main.js render())
    setUniforms(gl, program) {
        // Obtém localizações dos uniforms (assumindo que já foram obtidas em getLocations())
        const u_LightPos = gl.getUniformLocation(program, 'u_LightPos');
        const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
        
        // Envia posição da luz (multiplicada por intensidade para brilho)
        const lightPosWithIntensity = [
            this.position[0] * this.intensity,
            this.position[1] * this.intensity,
            this.position[2] * this.intensity
        ];
        gl.uniform3fv(u_LightPos, lightPosWithIntensity);
        
        // Envia cor da luz
        gl.uniform3fv(u_LightColor, this.color);
        
        // Nota: u_ViewPos é enviado separadamente em main.js (posição da câmera)
    }

    // Método opcional para mover a luz (ex.: animação)
    move(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

    // Método opcional para alterar cor/intensidade
    setColor(r, g, b) {
        this.color[0] = r;
        this.color[1] = g;
        this.color[2] = b;
    }

    setIntensity(value) {
        this.intensity = Math.max(0, value);  // Evita valores negativos
    }
}