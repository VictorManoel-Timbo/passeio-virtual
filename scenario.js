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
        const corridorLength = 15; // Comprimento do corredor
        const narrowWidth = 10; // Largura estreita na entrada
        const wideWidth = size; // Largura larga depois

        // Chão principal
        const floorData = Geometry.createPlane(size, size, [0.01, 0.01, 0.05, 1.0]);
        this.elements.push({
            mesh: new Mesh(gl, floorData),
            matrix: Transform.identity()
        });

        // Chão do corredor estreito (próximo à entrada)
        const narrowLength = 15; // Parte estreita
        const narrowFloorData = Geometry.createPlane(narrowWidth, narrowLength, [0.01, 0.01, 0.05, 1.0]);
        this.elements.push({
            mesh: new Mesh(gl, narrowFloorData),
            matrix: Transform.translate(Transform.identity(), 0, 0, size / 2 + narrowLength / 2)
        });

        // Chão do corredor largo (depois da parte estreita)
        const wideLength = corridorLength - narrowLength;
        const wideFloorData = Geometry.createPlane(wideWidth, wideLength, [0.2, 0.2, 0.2, 1.0]);
        this.elements.push({
            mesh: new Mesh(gl, wideFloorData),
            matrix: Transform.translate(Transform.identity(), 0, 0, size / 2 + narrowLength + wideLength / 2)
        });

        // Muros
        const wallLongData = Geometry.createBox(size, wallHeight, wallThick, [0.01, 0.01, 0.05, 1.0]); // Azul meia noite ainda mais escuro
        const wallSideData = Geometry.createBox(wallThick, wallHeight, size, [0.01, 0.01, 0.05, 1.0]);
        const wallLongMesh = new Mesh(gl, wallLongData);
        const wallSideMesh = new Mesh(gl, wallSideData);

        const halfSize = size / 2;
        const halfHeight = wallHeight / 2;

        // Paredes da caixa (com abertura na frontal)
        const openingWidth = 10; // Largura da abertura ajustada para a largura estreita do corredor
        const wallSegmentWidth = (size - openingWidth) / 2; // Largura de cada segmento lateral

        // Paredes laterais da abertura frontal
        const frontWallData = Geometry.createBox(wallSegmentWidth, wallHeight, wallThick, [0.01, 0.01, 0.05, 1.0]);
        const frontWallMesh = new Mesh(gl, frontWallData);
        this.elements.push(
            { mesh: frontWallMesh, matrix: Transform.translate(Transform.identity(), -size/2 + wallSegmentWidth/2, halfHeight, halfSize) }, /* Lines 71-72 omitted */
            { mesh: frontWallMesh, matrix: Transform.translate(Transform.identity(), size/2 - wallSegmentWidth/2, halfHeight, halfSize) }  /* Lines 72-73 omitted */
        );

        // Outras paredes
        this.elements.push(
            { mesh: wallLongMesh, matrix: Transform.translate(Transform.identity(), 0, halfHeight, -halfSize) }, /* Lines 77-78 omitted */
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), halfSize, halfHeight, 0) }, /* Lines 78-79 omitted */
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), -halfSize, halfHeight, 0) }  /* Lines 79-80 omitted */
        );

        // Paredes laterais do corredor estreito
        const narrowSideData = Geometry.createBox(wallThick, wallHeight, narrowLength, [0.01, 0.01, 0.05, 1.0]);
        const narrowSideMesh = new Mesh(gl, narrowSideData);
        const narrowHalfWidth = narrowWidth / 2;
        this.elements.push(
            { mesh: narrowSideMesh, matrix: Transform.translate(Transform.identity(), narrowHalfWidth, halfHeight, size / 2 + narrowLength / 2) },
            { mesh: narrowSideMesh, matrix: Transform.translate(Transform.identity(), -narrowHalfWidth, halfHeight, size / 2 + narrowLength / 2) }
        );

        // Paredes laterais do corredor largo
        const wideSideData = Geometry.createBox(wallThick, wallHeight, wideLength, [0.01, 0.01, 0.05, 1.0]);
        const wideSideMesh = new Mesh(gl, wideSideData);
        const wideHalfWidth = wideWidth / 2;
        this.elements.push(
            { mesh: wideSideMesh, matrix: Transform.translate(Transform.identity(), wideHalfWidth, halfHeight, size / 2 + narrowLength + wideLength / 2) },
            { mesh: wideSideMesh, matrix: Transform.translate(Transform.identity(), -wideHalfWidth, halfHeight, size / 2 + narrowLength + wideLength / 2) }
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