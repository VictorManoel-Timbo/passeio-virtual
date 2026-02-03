import { Transform } from "./transform.js";

export class Camera {
    constructor(gl, fov = 45, near = 0.1, far = 1000) {
        this.gl = gl;
        this.canvas = gl.canvas;

        // Estado da Câmera
        this.position = [0, 10, 15];
        this.yaw = -90;
        this.pitch = 0;

        // Configurações de Projeção
        this.fov = fov;
        this.near = near;
        this.far = far;

        this.updateMatrices();
    }

    // Calcula as matrizes de visualização e projeção
    updateMatrices() {
        const aspect = this.canvas.width / this.canvas.height;
        this.projMatrix = Transform.perspective(this.fov, aspect, this.near, this.far);

        // Calcula o vetor de direção (Front)
        const yawRad = this.yaw * Math.PI / 180;
        const pitchRad = this.pitch * Math.PI / 180;

        const front = [
            Math.cos(yawRad) * Math.cos(pitchRad),
            Math.sin(pitchRad),
            Math.sin(yawRad) * Math.cos(pitchRad)
        ];

        // O ponto para onde estamos olhando
        const center = [
            this.position[0] + front[0],
            this.position[1] + front[1],
            this.position[2] + front[2]
        ];

        this.viewMatrix = Transform.lookAt(this.position, center, [0, 1, 0]);
        this.viewProjMatrix = Transform.multiplyMatrices(this.projMatrix, this.viewMatrix);
    }

    update(deltaTime, keys) {
        if (!keys) return;

        const moveSpeed = 5.0 * deltaTime;
        const rotationSpeed = 90.0 * deltaTime;

        if (keys['a']) this.yaw -= rotationSpeed;
        if (keys['d']) this.yaw += rotationSpeed;

        // Opcional: Adicionar Pitch (olhar para cima/baixo) com as setas
        if (keys['arrowup']) this.pitch = Math.min(this.pitch + rotationSpeed, 89);
        if (keys['arrowdown']) this.pitch = Math.max(this.pitch - rotationSpeed, -89);

        const yawRad = this.yaw * Math.PI / 180;

        // Movimento lateral (Strafe) - Opcional mas melhora a navegação
        if (keys['w']) {
            this.position[0] += Math.cos(yawRad) * moveSpeed;
            this.position[2] += Math.sin(yawRad) * moveSpeed;
        }
        if (keys['s']) {
            this.position[0] -= Math.cos(yawRad) * moveSpeed;
            this.position[2] -= Math.sin(yawRad) * moveSpeed;
        }

        this.updateMatrices();
    }
}