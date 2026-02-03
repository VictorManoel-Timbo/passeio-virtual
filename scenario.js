import { Geometry } from "./geometry.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Light } from "./engine/light.js"; // Importe a classe Light

export class Scenario {
    constructor(gl) {
        this.gl = gl;

        // --- 1. CONFIGURAÇÃO DAS LUZES ---
        this.ceilingLight = new Light("spot");
        this.ceilingLight.position = [0, 10, 0]; // Um pouco abaixo do topo
        this.ceilingLight.color = [0.4, 0.5, 0.6]; 

        this.movingLight = new Light("point");
        this.movingLight.color = [1.0, 1.0, 1.0]; // Luz branca

        // Objeto físico que representa a luz móvel
        const lightSphereData = Geometry.createSphere(5, 32, [1, 1, 0, 1]);
        this.lightObject = new Mesh(gl, lightSphereData);

        // --- 2. CONFIGURAÇÃO DA GEOMETRIA DO CENÁRIO ---
        this.elements = [];
        const size = 70;
        const wallHeight = 10; // Aumentei para ficar proporcional à luz
        const wallThick = 0.5;

        // Chão
        const floorData = Geometry.createPlane(size, size, [0.2, 0.2, 0.2, 1.0]);
        this.elements.push({
            mesh: new Mesh(gl, floorData),
            matrix: Transform.identity()
        });

        // Muros
        const wallLongData = Geometry.createBox(size, wallHeight, wallThick, [0.5, 0.5, 0.5, 1.0]);
        const wallSideData = Geometry.createBox(wallThick, wallHeight, size, [0.5, 0.5, 0.5, 1.0]);
        const wallLongMesh = new Mesh(gl, wallLongData);
        const wallSideMesh = new Mesh(gl, wallSideData);

        const halfSize = size / 2;
        const halfHeight = wallHeight / 2;

        this.elements.push(
            { mesh: wallLongMesh, matrix: Transform.translate(Transform.identity(), 0, halfHeight, -halfSize) },
            { mesh: wallLongMesh, matrix: Transform.translate(Transform.identity(), 0, halfHeight, halfSize) },
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), halfSize, halfHeight, 0) },
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), -halfSize, halfHeight, 0) }
        );
    }

    // Método para atualizar a animação das luzes do cenário
    update(deltaTime) {
        this.movingLight.updateOrbit(deltaTime, 20.0, 0.5, 5.0);
    }

    draw(gl, locations, viewProjMatrix) {
        // --- A. BIND DAS LUZES (Antes de desenhar qualquer coisa) ---
        this.ceilingLight.bind(gl, locations, "u_Ceiling");
        this.movingLight.bind(gl, locations, "u_Sphere");

        // --- B. DESENHAR GEOMETRIA ---
        this.elements.forEach(el => {
            el.mesh.draw(gl, locations, viewProjMatrix, el.matrix);
        });

        // --- C. DESENHAR OBJETO DA LUZ MÓVEL ---
        const lightMatrix = Transform.translate(
            Transform.identity(),
            ...this.movingLight.position
        );
        this.lightObject.draw(gl, locations, viewProjMatrix, lightMatrix);
    }
}