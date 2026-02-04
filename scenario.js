import { Geometry } from "./geometry.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Light } from "./engine/light.js";

export class Scenario {
    constructor(gl, blenderModelData, textureDict) { // blenderModelData vindo do carregador OBJ
        this.gl = gl;
        this.elements = [];
        this.textures = textureDict;

        // --- 1. CONFIGURAÇÕES GERAIS ---
        const roomSize = 80;
        const wallH = 25;
        const wallT = 1.0;
        const pillarSize = 5.0;
        const corrWidth = 12;
        const corrLen = 30;

        const hS = roomSize / 2;
        const hH = wallH / 2;
        const corridorZCenter = hS + corrLen / 2;

        const frameW = 6;
        const frameH = 8;
        const frameY = 10;

        // --- 2. CORES ---
        const wallColor = [0.4, 0.4, 0.4, 1.0];
        const pillarColor = [0.2, 0.2, 0.2, 1.0];
        const frameColor = [0.4, 0.2, 0.1, 1.0];
        const floorColor = [0.25, 0.15, 0.05, 1.0];
        const ceilingColor = [0.02, 0.05, 0.2, 1.0]; // Azul escuro para o teto

        // --- 3. CONFIGURAÇÃO DAS LUZES ---
        this.ceilingLight = new Light("spot");
        this.ceilingLight.position = [0, wallH - 2, 0];
        this.ceilingLight.color = [0.4, 0.5, 0.8];

        this.movingLight = new Light("point");
        this.movingLight.color = [0.6, 1.0, 0.8];

        const lightSphereData = Geometry.createSphere(2, 32, [1, 1, 0, 1]);
        this.lightObject = new Mesh(gl, lightSphereData);

        // --- 4. GEOMETRIAS E MESHES ---
        const meshPillar = new Mesh(gl, Geometry.createBox(pillarSize, wallH, pillarSize, pillarColor));
        const meshFrame = new Mesh(gl, Geometry.createBox(frameW, frameH, 0.5, frameColor));

        // Teto plano para a sala e corredor
        const meshRoomCeiling = new Mesh(gl, Geometry.createBox(roomSize, 0.5, roomSize, ceilingColor));
        const meshCorrCeiling = new Mesh(gl, Geometry.createBox(corrWidth, 0.5, corrLen, ceilingColor));

        // --- 5. OBJETO CENTRAL (BLENDER) ---
        if (blenderModelData) {
            this.centralObject = new Mesh(gl, blenderModelData);
            this.centralObjectMatrix = Transform.translate(Transform.identity(), 0, 0, 0);
            this.centralObjectMatrix = Transform.scale(this.centralObjectMatrix, 13, 13, 13);
        }

        // --- 6. MONTAGEM DA ESTRUTURA ---
        const pillarPos = [
            [hS, -hS], [-hS, -hS], [hS, hS], [-hS, hS],
            [corrWidth / 2 + pillarSize / 2, hS], [-corrWidth / 2 - pillarSize / 2, hS]
        ];
        pillarPos.forEach(pos => {
            this.elements.push({ mesh: meshPillar, matrix: Transform.translate(Transform.identity(), pos[0], hH, pos[1]) });
        });

        const placeGallery = (count, isLongWall, side) => {
            const step = roomSize / (count + 1);
            for (let i = 1; i <= count; i++) {
                const colPos = -hS + step * i;
                if (Math.abs(colPos) < hS - pillarSize) {
                    let pM = isLongWall ?
                        Transform.translate(Transform.identity(), colPos, hH, side * hS) :
                        Transform.translate(Transform.identity(), side * hS, hH, colPos);
                    this.elements.push({ mesh: meshPillar, matrix: pM });
                }
                const framePos = colPos - (step / 2);
                const frameOffset = hS - (wallT / 2 + 0.3);
                let fM = isLongWall ?
                    Transform.translate(Transform.identity(), framePos, frameY, side * frameOffset) :
                    Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, frameY, framePos), Transform.rotateY(Math.PI / 2));
                this.elements.push({ mesh: meshFrame, matrix: fM });

                if (i === count) {
                    const lastFramePos = colPos + (step / 2);
                    let lfM = isLongWall ?
                        Transform.translate(Transform.identity(), lastFramePos, frameY, side * frameOffset) :
                        Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, frameY, lastFramePos), Transform.rotateY(Math.PI / 2));
                    this.elements.push({ mesh: meshFrame, matrix: lfM });
                }
            }
        };

        placeGallery(3, true, -1);
        placeGallery(2, false, 1);
        placeGallery(2, false, -1);

        const frontWallCenter = (hS + (corrWidth / 2 + pillarSize)) / 2;
        const frontWallW = (roomSize - corrWidth) / 2 - pillarSize;

        this.elements.push(
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), frontWallCenter, frameY, hS - 0.7) },
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), -frontWallCenter, frameY, hS - 0.7) },

            // Teto da sala e corredor
            { mesh: meshRoomCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, 0) },
            { mesh: meshCorrCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, corridorZCenter) },

            { mesh: new Mesh(gl, Geometry.createBox(roomSize - pillarSize, wallH, wallT, wallColor)), matrix: Transform.translate(Transform.identity(), 0, hH, -hS) },
            { mesh: new Mesh(gl, Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor)), matrix: Transform.translate(Transform.identity(), hS, hH, 0) },
            { mesh: new Mesh(gl, Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor)), matrix: Transform.translate(Transform.identity(), -hS, hH, 0) },
            { mesh: new Mesh(gl, Geometry.createBox(frontWallW, wallH, wallT, wallColor)), matrix: Transform.translate(Transform.identity(), frontWallCenter, hH, hS) },
            { mesh: new Mesh(gl, Geometry.createBox(frontWallW, wallH, wallT, wallColor)), matrix: Transform.translate(Transform.identity(), -frontWallCenter, hH, hS) },
            { mesh: new Mesh(gl, Geometry.createPlane(roomSize, roomSize, floorColor)), matrix: Transform.identity(), texture: this.textures['floor'] },
            { mesh: new Mesh(gl, Geometry.createPlane(corrWidth, corrLen, floorColor)), matrix: Transform.translate(Transform.identity(), 0, 0, corridorZCenter), texture: this.textures['floor'] },
            { mesh: new Mesh(gl, Geometry.createBox(wallT, wallH, corrLen, wallColor)), matrix: Transform.translate(Transform.identity(), corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, Geometry.createBox(wallT, wallH, corrLen, wallColor)), matrix: Transform.translate(Transform.identity(), -corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, Geometry.createBox(corrWidth, wallH, wallT, wallColor)), matrix: Transform.translate(Transform.identity(), 0, hH, hS + corrLen) }
        );
    }

    update(deltaTime) {
        this.movingLight.updateOrbit(deltaTime, 35.0, 0.4, 22.0);
    }

    draw(gl, locations, viewProjMatrix) {
        this.ceilingLight.bind(gl, locations, "u_Ceiling");
        this.movingLight.bind(gl, locations, "u_Sphere");

        this.elements.forEach(el => el.mesh.draw(gl, locations, viewProjMatrix, el.matrix, el.texture));

        // Desenhar Objeto Central do Blender
        if (this.centralObject) {
            this.centralObject.draw(gl, locations, viewProjMatrix, this.centralObjectMatrix);
        }

        const lightMatrix = Transform.translate(Transform.identity(), ...this.movingLight.position);
        this.lightObject.draw(gl, locations, viewProjMatrix, lightMatrix, this.textures['sun']);
    }
}