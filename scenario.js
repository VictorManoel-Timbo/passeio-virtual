import { Geometry } from "./geometry.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";

export class Scenario {
    constructor(gl) {
        this.gl = gl;
        this.elements = [];

        // Configurações do cenário
        const size = 20;       // Tamanho do quadrado (chão)
        const wallHeight = 3;  // Altura dos muros
        const wallThick = 0.5; // Espessura dos muros

        // 1. Criar o Chão (Plano)
        const floorData = Geometry.createPlane(size, size, [0.2, 0.2, 0.2, 1.0]);
        this.floor = {
            mesh: new Mesh(gl, floorData),
            matrix: Transform.identity()
        };

        // 2. Criar Geometria do Muro (reutilizável para os 4 lados)
        // Muros Laterais (Z): largura = size, profundidade = wallThick
        const wallLongData = Geometry.createBox(size, wallHeight, wallThick, [0.5, 0.5, 0.5, 1.0]);
        // Muros Frontais (X): largura = wallThick, profundidade = size
        const wallSideData = Geometry.createBox(wallThick, wallHeight, size, [0.5, 0.5, 0.5, 1.0]);

        const wallLongMesh = new Mesh(gl, wallLongData);
        const wallSideMesh = new Mesh(gl, wallSideData);

        const halfSize = size / 2;
        const halfHeight = wallHeight / 2;

        // 3. Posicionar os muros usando matrizes de translação
        this.elements = [
            this.floor,
            // Muro Norte (Z-)
            { mesh: wallLongMesh, matrix: Transform.translate(Transform.identity(), 0, halfHeight, -halfSize) },
            // Muro Sul (Z+)
            { mesh: wallLongMesh, matrix: Transform.translate(Transform.identity(), 0, halfHeight, halfSize) },
            // Muro Leste (X+)
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), halfSize, halfHeight, 0) },
            // Muro Oeste (X-)
            { mesh: wallSideMesh, matrix: Transform.translate(Transform.identity(), -halfSize, halfHeight, 0) },
        ];
    }

    draw(gl, locations, viewProjMatrix) {
        this.elements.forEach(el => {
            el.mesh.draw(gl, locations, viewProjMatrix, el.matrix);
        });
    }
}