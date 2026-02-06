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
        this.textures = globalTextures;
        this.models = loadedModels;

        // --- 1. CONFIGURAÇÕES GERAIS ---
        const roomSize = 240;
        const wallH = 50;
        const wallT = 2.0;
        const pillarSize = 15.0;
        const corrWidth = 24;
        const corrLen = 60;

        const hS = roomSize / 2;
        const hH = wallH / 2;
        const corridorZCenter = hS + corrLen / 2;

        const frameW = 24;
        const frameH = 32;
        const frameY = 25;

        // --- 2. CORES ---
        const wallColor = [0.4, 0.4, 0.4, 1.0];
        const pillarColor = [0.2, 0.2, 0.2, 1.0];
        const frameColor = [0.4, 0.2, 0.1, 1.0];
        const floorColor = [0.35, 0.15, 0.05, 1.0];
        const ceilingColor = [0.02, 0.02, 0.25, 1.0];

        // --- 3. CONFIGURAÇÃO DAS LUZES ---
        this.ceilingLight = new Light("spot");
        this.ceilingLight.position = [0, wallH - 2, 0];
        this.ceilingLight.color = [1.2, 0.8, 0.0];

        this.movingLight = new Light("point");
        this.movingLight.color = [1.0, 0.8, 0.6];

        this.sunData = this.models['sun'];
        this.sunMatrix = Transform.identity();

        // --- CRIAR TEXTURA BRANCA AUXILIAR (Para objetos sólidos) ---
        // Cria uma textura de 1 pixel branco na memória da GPU
        this.whiteGlTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteGlTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255])); // R, G, B, A (Branco Total)

        // Objeto "falso" que imita sua classe Texture para ser usado no draw
        this.solidTexture = {
            isLoaded: true,  // Diz para a Mesh que pode desenhar
            texture: this.whiteGlTexture, // Segurança caso a Mesh tente acessar direto
            bind: (unit = 0) => {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, this.whiteGlTexture);
            }
        }

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
                Transform.scale(Transform.identity(), 20, 20, 20)
            );
        }

        // --- CONTROLE DAS TEXTURAS DOS QUADROS ---
        let currentTelaIndex = 1; // Começa na tela1

        // Função auxiliar para pegar a próxima textura da lista
        const getNextFrameTexture = () => {
            const texKey = `tela${currentTelaIndex}`; // Cria string "tela1", "tela2"...
            const texture = this.textures[texKey];    // Pega a textura carregada
            currentTelaIndex++;                       // Prepara para o próximo (1 -> 2)
            return texture;
        };

        // --- 6. MONTAGEM DA ESTRUTURA (Pilares e Quadros) ---
        const pillarPos = [
            [hS, -hS], [-hS, -hS], [hS, hS], [-hS, hS],
            [corrWidth / 2 + pillarSize / 2, hS], [-corrWidth / 2 - pillarSize / 2, hS]
        ];
        pillarPos.forEach(pos => {
            this.elements.push({
                mesh: meshPillar, matrix: Transform.translate(Transform.identity(), pos[0], hH, pos[1]),
                texture: this.textures['pillar']
            });
        });

        const placeGallery = (count, isLongWall, side) => {
            const step = roomSize / (count + 1);
            for (let i = 1; i <= count; i++) {
                // ... (código dos Pilares continua igual) ...
                const colPos = -hS + step * i;
                if (Math.abs(colPos) < hS - pillarSize) {
                    let pM = isLongWall ?
                        Transform.translate(Transform.identity(), colPos, hH, side * hS) :
                        Transform.translate(Transform.identity(), side * hS, hH, colPos);
                    this.elements.push({ mesh: meshPillar, matrix: pM, texture: this.textures['pillar'] });
                }

                // --- AQUI COMEÇA A MUDANÇA DOS QUADROS ---
                const framePos = colPos - (step / 2);
                const frameOffset = hS - (wallT / 2 + 0.3);

                let fM = isLongWall ?
                    Transform.translate(Transform.identity(), framePos, frameY, side * frameOffset) :
                    Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, frameY, framePos), Transform.rotateY(Math.PI / 2));

                // ADICIONA O QUADRO COM A PRÓXIMA TEXTURA
                this.elements.push({
                    mesh: meshFrame,
                    matrix: fM,
                    texture: getNextFrameTexture() // <--- CHAMA A FUNÇÃO AQUI
                });

                // Se for o último pilar, adiciona o quadro final da sequência
                if (i === count) {
                    const lastFramePos = colPos + (step / 2);
                    let lfM = isLongWall ?
                        Transform.translate(Transform.identity(), lastFramePos, frameY, side * frameOffset) :
                        Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, frameY, lastFramePos), Transform.rotateY(Math.PI / 2));

                    this.elements.push({
                        mesh: meshFrame,
                        matrix: lfM,
                        texture: getNextFrameTexture() // <--- CHAMA A FUNÇÃO AQUI TAMBÉM
                    });
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
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), frontWallCenter, frameY, hS - 1.5), texture: getNextFrameTexture() },
            { mesh: meshFrame, matrix: Transform.translate(Transform.identity(), -frontWallCenter, frameY, hS - 1.5), texture: getNextFrameTexture() },
            { mesh: meshRoomCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, 0), texture: this.textures['ceiling'] },
            { mesh: meshCorrCeiling, matrix: Transform.translate(Transform.identity(), 0, wallH, corridorZCenter), texture: this.textures['ceiling'] },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(roomSize - pillarSize, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), 0, hH, -hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor) }), matrix: Transform.translate(Transform.identity(), hS, hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, roomSize - pillarSize, wallColor) }), matrix: Transform.translate(Transform.identity(), -hS, hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), frontWallCenter, hH, hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), -frontWallCenter, hH, hS) },

            { mesh: new Mesh(gl, { "default": Geometry.createPlane(roomSize, roomSize, floorColor) }), matrix: Transform.identity() },
            { mesh: new Mesh(gl, { "default": Geometry.createPlane(corrWidth, corrLen, floorColor) }), matrix: Transform.translate(Transform.identity(), 0, 0, corridorZCenter) },

            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, wallColor) }), matrix: Transform.translate(Transform.identity(), corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, wallColor) }), matrix: Transform.translate(Transform.identity(), -corrWidth / 2, hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(corrWidth, wallH, wallT, wallColor) }), matrix: Transform.translate(Transform.identity(), 0, hH, hS + corrLen) }
        );
    }

    update(deltaTime) {
        this.movingLight.updateOrbit(deltaTime, 90.0, 0.4, 40.0);
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
            // Se o elemento tem textura, usa ela. 
            // Se NÃO tem, usa a textura branca sólida
            const textureToUse = el.texture ? el.texture : this.solidTexture;

            const texParam = { "default": textureToUse };

            el.mesh.draw(gl, locations, viewProjMatrix, el.matrix, texParam);
        })

        if (this.saoriData) {
            this.saoriData.mesh.draw(gl, locations, viewProjMatrix, this.saoriMatrix, this.saoriData.textures);
        }

        // Desenha a esfera da luz
        if (this.sunData) {
            // O sol geralmente não deve ser afetado por sombras, mas no shader atual ele será tratado como um objeto comum
            this.sunData.mesh.draw(gl, locations, viewProjMatrix, this.sunMatrix, this.sunData.textures);
        }
    }
}