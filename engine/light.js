export class Light {
    constructor(type = "point") {
        this.type = type;
        this.position = [0, 0, 0];
        this.color = [1.0, 1.0, 1.0];
        this.direction = [0, -1, 0]; // Padrão: apontando para baixo
        this.cutoff = Math.cos(120 * Math.PI / 180);
        this.time = 0;
    }

    updateOrbit(deltaTime, radius, speed, height) {
        this.time += deltaTime;
        this.position[0] = Math.cos(this.time * speed) * radius;
        this.position[1] = height;
        this.position[2] = Math.sin(this.time * speed) * radius;
    }

    bind(gl, locations, prefix) {
        gl.uniform3fv(locations[`${prefix}Pos`], new Float32Array(this.position));
        gl.uniform3fv(locations[`${prefix}Color`], new Float32Array(this.color));
        if (this.type === "spot") {
            gl.uniform3fv(locations[`${prefix}Dir`], new Float32Array(this.direction));
            gl.uniform1f(locations[`${prefix}Cutoff`], this.cutoff);
        }
    }
}