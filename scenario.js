import { Geometry } from "./geometry.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Light } from "./engine/light.js";

export class Scenario {
    /**
     * @param {WebGLRenderingContext} gl 
     * @param {Object} loadedModels - Objeto contendo { id: { mesh, textures } }
     * @param {Object} globalTextures - Texturas avulsas (chão, sol, etc)
     */
    constructor(gl, loadedModels, globalTextures) {
        this.gl = gl;
        this.elements = [];
        this.textures = globalTextures; // Texturas como 'floor', 'sun', etc.
        this.models = loadedModels;      // Aqui está a Saori e outros OBJs

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
        const ceilingColor = [0.02, 0.05, 0.2, 1.0];

        // --- 3. CONFIGURAÇÃO DAS LUZES ---
        this.ceilingLight = new Light("spot");
        this.ceilingLight.position = [0, wallH - 2, 0];
        this.ceilingLight.color = [0.4, 0.5, 0.8];

        this.movingLight = new Light("point");
        this.movingLight.color = [0.6, 1.0, 0.8];

        this.sunData = this.models['sun'];
        this.sunMatrix = Transform.identity();

        // --- 4. GEOMETRIAS BÁSICAS ---
        // Criamos meshes estáticas usando o padrão de grupo único "default"
        const meshPillar = new Mesh(gl, { "default": Geometry.createBox(pillarSize, wallH, pillarSize, pillarColor) });
        const meshFrame = new Mesh(gl, { "default": Geometry.createBox(frameW, frameH, 0.5, frameColor) });
        const meshRoomCeiling = new Mesh(gl, { "default": Geometry.createBox(roomSize, 0.5, roomSize, ceilingColor) });
        const meshCorrCeiling = new Mesh(gl, { "default": Geometry.createBox(corrWidth, 0.5, corrLen, ceilingColor) });

        // --- 5. CONFIGURAÇÃO DO MODELO CENTRAL (Saori ou similar) ---
        // Usamos o ID definido no models.json
        if (this.models['saori']) {
            this.saoriData = this.models['saori'];
            this.saoriMatrix = Transform.multiplyMatrices(
                Transform.translate(Transform.identity(), 0, 0, 0),
                Transform.scale(Transform.identity(), 12, 12, 12)
            );
        }

        // --- 6. MONTAGEM DA ESTRUTURA (Pilares e Quadros) ---
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

        // --- 7. ADICIONANDO PAREDES E CHÃO ---
        this.elements.push(
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), frontWallCenter, frameY, hS - 0.7) },
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), -frontWallCenter, frameY, hS - 0.7) },
            { mesh: meshRoomCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, 0) },
            { mesh: meshCorrCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(roomSize - pillarSize, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), 0, hH, -hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor) }), matrix: Transform.translate(Transform.identity(), hS, hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor) }), matrix: Transform.translate(Transform.identity(), -hS, hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), frontWallCenter, hH, hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), -frontWallCenter, hH, hS) },

            // Chão com textura
            {
                mesh: new Mesh(gl, { "default": Geometry.createPlane(roomSize, roomSize, floorColor) }),
                matrix: Transform.identity(),
                texture: this.textures['floor']
            },
            {
                mesh: new Mesh(gl, { "default": Geometry.createPlane(corrWidth, corrLen, floorColor) }),
                matrix: Transform.translate(Transform.identity(), 0, 0, corridorZCenter),
                texture: this.textures['floor']
            },

            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, wallColor) }), matrix: Transform.translate(Transform.identity(), corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, wallColor) }), matrix: Transform.translate(Transform.identity(), -corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(corrWidth, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), 0, hH, hS + corrLen) }
        );
    }

    update(deltaTime) {
        this.movingLight.updateOrbit(deltaTime, 35.0, 0.4, 22.0);
        if (this.sunData) {
            const lx = this.movingLight.position[0];
            const ly = this.movingLight.position[1];
            const lz = this.movingLight.position[2];

            this.sunMatrix = Transform.translate(Transform.identity(), lx, ly, lz);
            this.sunMatrix = Transform.multiplyMatrices(this.sunMatrix, Transform.scale(Transform.identity(), 3, 3, 3));
        }
    }

    draw(gl, locations, viewProjMatrix) {
        this.ceilingLight.bind(gl, locations, "u_Ceiling");
        this.movingLight.bind(gl, locations, "u_Sphere");

        // Desenha elementos estáticos do cenário
        this.elements.forEach(el => {
            // Se o elemento tem uma textura única (como o chão), passamos ela num objeto
            const texParam = el.texture ? { "default": el.texture } : null;
            el.mesh.draw(gl, locations, viewProjMatrix, el.matrix, texParam);
        });

        if (this.saoriData) {
            this.saoriData.mesh.draw(gl, locations, viewProjMatrix, this.saoriMatrix, this.saoriData.textures);
        }

        // Desenha a esfera da luz
        if (this.sunData) {
            // O sol geralmente não deve ser afetado por sombras, mas no shader atual ele será tratado como um objeto comum
            this.sunData.mesh.draw(
                gl,
                locations,
                viewProjMatrix,
                this.sunMatrix,     // A matriz que atualizamos no update()
                this.sunData.textures // As texturas carregadas (Sun.mtl)
            );
        }
    }
}