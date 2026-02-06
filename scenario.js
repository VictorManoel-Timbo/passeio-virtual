import { Geometry } from "./geometry.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Light } from "./engine/light.js";

export class Scenario {
    constructor(gl, loadedModels, globalTextures) {
        this.gl = gl;
        this.textures = globalTextures;
        this.models = loadedModels;

        // Inicialização de Arrays e Dicionários
        this.elements = [];
        this.entities = {};
        this.colliders = [];

        // 1. Configurações e Materiais
        this._initSettings();
        this._setupMaterials(gl);

        // 2. Componentes da Cena
        this._setupLights();
        this._initEntities();
        this._buildArchitecture(gl);
        this._setupColliders();
    }

    // --- MÉTODOS DE ORGANIZAÇÃO (PRIVADOS POR CONVENÇÃO) ---

    _initSettings() {
        // Centralizei as constantes aqui
        this.cfg = {
            roomSize: 240, wallH: 50, wallT: 2.0, pillarSize: 15.0,
            corrWidth: 24, corrLen: 60, frameW: 24, frameH: 32, frameY: 25,
            colors: {
                wall: [0.4, 0.4, 0.4, 1.0], pillar: [0.2, 0.2, 0.2, 1.0],
                frame: [0.4, 0.2, 0.1, 1.0], floor: [0.35, 0.15, 0.05, 1.0],
                ceiling: [0.02, 0.02, 0.25, 1.0]
            }
        };
        this.hS = this.cfg.roomSize / 2;
        this.hH = this.cfg.wallH / 2;
    }

    _setupMaterials(gl) {
        this.whiteGlTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteGlTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        this.solidTexture = {
            isLoaded: true,
            bind: (unit = 0) => {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, this.whiteGlTexture);
            }
        };
    }

    _setupLights() {
        this.ceilingLight = new Light("spot");
        this.ceilingLight.position = [0, this.cfg.wallH - 2, 0];
        this.ceilingLight.color = [1.2, 1.0, 0.0];

        this.movingLight = new Light("point");
        this.movingLight.color = [0.6, 0.8, 1.2];
    }

    _initEntities() {
        const modelConfigs = {
            // Adicionei a flag 'collidable' para decidir o que tem física
            'sun':   { pos: [0, 0, 0], scale: [4, 4, 4], collidable: false },
            'door':  { pos: [0, 0, 179], scale: [5.25, 6, 5.25], collidable: true },
            'saori': { pos: [0, 0, 0], scale: [25, 25, 25], collidable: true }
        };

        Object.keys(modelConfigs).forEach(id => {
            if (this.models[id]) {
                const conf = modelConfigs[id];
                const modelData = this.models[id];

                // 1. Gráficos (Visual)
                let matrix = Transform.translate(Transform.identity(), ...conf.pos);
                matrix = Transform.multiplyMatrices(matrix, Transform.scale(Transform.identity(), ...conf.scale));
                this.entities[id] = { data: modelData, matrix: matrix };

                // 2. Física (Colisão) - NOVO
                if (conf.collidable && modelData.bounds) {
                    const { min, max } = modelData.bounds; // Limites locais
                    const [sx, sy, sz] = conf.scale;       // Escala do objeto
                    const [px, py, pz] = conf.pos;         // Posição no mundo

                    // Calcula onde a caixa está no mundo real:
                    // (Mínimo Local * Escala) + Posição
                    const worldMinX = (min[0] * sx) + px;
                    const worldMaxX = (max[0] * sx) + px;
                    const worldMinZ = (min[2] * sz) + pz;
                    const worldMaxZ = (max[2] * sz) + pz;

                    // Adiciona à lista de colisores existente
                    // Usamos Math.min/max para garantir a ordem correta caso a escala seja negativa
                    this.colliders.push({
                        minX: Math.min(worldMinX, worldMaxX),
                        maxX: Math.max(worldMinX, worldMaxX),
                        minZ: Math.min(worldMinZ, worldMaxZ),
                        maxZ: Math.max(worldMinZ, worldMaxZ)
                    });
                }
            }
        });
    }

    // Configura onde as paredes estão (Fisicamente)
    _setupColliders() {
        const { roomSize, wallT, pillarSize, corrWidth, corrLen } = this.cfg;
        const hS = this.hS; // Metade da sala

        // Função auxiliar para criar caixas (Bounding Box)
        // x, z = centro; w, d = largura e profundidade total
        const addWall = (x, z, w, d) => {
            this.colliders.push({
                minX: x - w / 2, maxX: x + w / 2,
                minZ: z - d / 2, maxZ: z + d / 2
            });
        };

        // --- PAREDES DA SALA ---
        addWall(0, -hS, roomSize, wallT); // Fundo
        addWall(-hS, 0, wallT, roomSize); // Esquerda
        addWall(hS, 0, wallT, roomSize);  // Direita

        // --- PAREDES DA FRENTE (Calculadas para deixar o buraco do corredor) ---
        const frontWallW = (roomSize - corrWidth) / 2 - pillarSize;
        const frontCenter = (hS + (corrWidth/2 + pillarSize)) / 2;
        
        addWall(frontCenter, hS, frontWallW, wallT);  // Frente Dir
        addWall(-frontCenter, hS, frontWallW, wallT); // Frente Esq

        // --- PILARES (Tratados como quadrados sólidos) ---
        const pPos = [
            [hS, -hS], [-hS, -hS], [hS, hS], [-hS, hS], // Cantos
            [corrWidth/2 + pillarSize/2, hS], [-corrWidth/2 - pillarSize/2, hS] // Entrada Corredor
        ];
        pPos.forEach(p => addWall(p[0], p[1], pillarSize, pillarSize));

        // --- CORREDOR ---
        const corrZ = hS + corrLen / 2;
        addWall(corrWidth/2, corrZ, wallT, corrLen);  // Parede Dir Corredor
        addWall(-corrWidth/2, corrZ, wallT, corrLen); // Parede Esq Corredor
        addWall(0, hS + corrLen, corrWidth, wallT);   // Fundo Corredor
    }

    // Verifica se uma posição X, Z está dentro de alguma parede
    // Retorna true se bateu
    checkCollision(x, z, radius = 3.0) {
        for (const box of this.colliders) {
            if (x + radius > box.minX && x - radius < box.maxX &&
                z + radius > box.minZ && z - radius < box.maxZ) {
                return true;
            }
        }
        return false;
    }

    _buildArchitecture(gl) {
        const { pillarSize, wallH, frameW, frameH, colors, corrWidth } = this.cfg;
        const corridorZCenter = this.hS + this.cfg.corrLen / 2;

        // Meshes reutilizáveis
        const meshPillar = new Mesh(gl, { "default": Geometry.createBox(pillarSize, wallH, pillarSize, colors.pillar) });
        const meshFrame = new Mesh(gl, { "default": Geometry.createBox(frameW, frameH, 0.5, colors.frame) });

        // Controle de texturas das telas
        let currentTelaIndex = 1;
        const getTex = () => this.textures[`tela${currentTelaIndex++}`];

        // 1. Pilares (Cantos da Sala + Entrada do Corredor)
        const pillarPositions = [
            [this.hS, -this.hS], [-this.hS, -this.hS], // Cantos traseiros
            [this.hS, this.hS], [-this.hS, this.hS],   // Cantos frontais
            [corrWidth / 2 + pillarSize / 2, this.hS], // Entrada Corredor Dir
            [-corrWidth / 2 - pillarSize / 2, this.hS] // Entrada Corredor Esq
        ];

        pillarPositions.forEach(pos => {
            this.elements.push({
                mesh: meshPillar,
                matrix: Transform.translate(Transform.identity(), pos[0], this.hH, pos[1]),
                texture: this.textures['pillar']
            });
        });

        // 2. Galerias
        this._placeGallery(gl, meshPillar, meshFrame, getTex, 3, true, -1);
        this._placeGallery(gl, meshPillar, meshFrame, getTex, 2, false, 1);
        this._placeGallery(gl, meshPillar, meshFrame, getTex, 2, false, -1);

        // 3. Demais estruturas
        this._addStructureElements(gl, corridorZCenter, getTex);
    }

    _placeGallery(gl, meshPillar, meshFrame, getTex, count, isLongWall, side) {
        const step = this.cfg.roomSize / (count + 1);
        for (let i = 1; i <= count; i++) {
            const colPos = -this.hS + step * i;
            const framePos = colPos - (step / 2);
            const frameOffset = this.hS - (this.cfg.wallT / 2 + 0.3);

            // Lógica de Matrix para Pilares e Quadros
            let pM = isLongWall ? Transform.translate(Transform.identity(), colPos, this.hH, side * this.hS) : Transform.translate(Transform.identity(), side * this.hS, this.hH, colPos);
            this.elements.push({ mesh: meshPillar, matrix: pM, texture: this.textures['pillar'] });

            let fM = isLongWall ? Transform.translate(Transform.identity(), framePos, this.cfg.frameY, side * frameOffset) :
                Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, this.cfg.frameY, framePos), Transform.rotateY(Math.PI / 2));
            this.elements.push({ mesh: meshFrame, matrix: fM, texture: getTex() });

            if (i === count) {
                const lastFramePos = colPos + (step / 2);
                let lfM = isLongWall ? Transform.translate(Transform.identity(), lastFramePos, this.cfg.frameY, side * frameOffset) :
                    Transform.multiplyMatrices(Transform.translate(Transform.identity(), side * frameOffset, this.cfg.frameY, lastFramePos), Transform.rotateY(Math.PI / 2));
                this.elements.push({ mesh: meshFrame, matrix: lfM, texture: getTex() });
            }
        }
    }

    _addStructureElements(gl, corridorZCenter, getTex) {
        const { colors, wallT, wallH, corrWidth, corrLen, frameY } = this.cfg;
        const frontWallCenter = (this.hS + (corrWidth / 2 + this.cfg.pillarSize)) / 2;
        const frontWallW = (this.cfg.roomSize - corrWidth) / 2 - this.cfg.pillarSize;

        this.elements.push(
            // --- Quadros da Parede da Frente (Entrada do Corredor) ---
            { mesh: new Mesh(gl, { "default": Geometry.createBox(this.cfg.frameW, this.cfg.frameH, 0.5, colors.frame) }), matrix: Transform.translate(Transform.identity(), frontWallCenter, frameY, this.hS - 1.5), texture: getTex() },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(this.cfg.frameW, this.cfg.frameH, 0.5, colors.frame) }), matrix: Transform.translate(Transform.identity(), -frontWallCenter, frameY, this.hS - 1.5), texture: getTex() },

            // --- Tetos ---
            { mesh: new Mesh(gl, { "default": Geometry.createBox(this.cfg.roomSize, 0.5, this.cfg.roomSize, colors.ceiling) }), matrix: Transform.translate(Transform.identity(), 0, wallH, 0), texture: this.textures['ceiling'] },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(corrWidth, 0.5, corrLen, colors.ceiling) }), matrix: Transform.translate(Transform.identity(), 0, wallH, corridorZCenter), texture: this.textures['ceiling'] },

            // --- Paredes da Sala Principal ---
            { mesh: new Mesh(gl, { "default": Geometry.createBox(this.cfg.roomSize - this.cfg.pillarSize, wallH, wallT, colors.wall) }), matrix: Transform.translate(Transform.identity(), 0, this.hH, -this.hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, this.cfg.roomSize - this.cfg.pillarSize, colors.wall) }), matrix: Transform.translate(Transform.identity(), this.hS, this.hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, this.cfg.roomSize - this.cfg.pillarSize, colors.wall) }), matrix: Transform.translate(Transform.identity(), -this.hS, this.hH, 0) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, colors.wall) }), matrix: Transform.translate(Transform.identity(), frontWallCenter, this.hH, this.hS) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(frontWallW, wallH, wallT, colors.wall) }), matrix: Transform.translate(Transform.identity(), -frontWallCenter, this.hH, this.hS) },

            // --- Pisos ---
            { mesh: new Mesh(gl, { "default": Geometry.createPlane(this.cfg.roomSize, this.cfg.roomSize, colors.floor) }), matrix: Transform.identity() },
            { mesh: new Mesh(gl, { "default": Geometry.createPlane(corrWidth, corrLen, colors.floor) }), matrix: Transform.translate(Transform.identity(), 0, 0, corridorZCenter) },

            // --- Paredes do Corredor ---
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, colors.wall) }), matrix: Transform.translate(Transform.identity(), corrWidth / 2, this.hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(wallT, wallH, corrLen, colors.wall) }), matrix: Transform.translate(Transform.identity(), -corrWidth / 2, this.hH, corridorZCenter) },
            { mesh: new Mesh(gl, { "default": Geometry.createBox(corrWidth, wallH, wallT, colors.wall) }), matrix: Transform.translate(Transform.identity(), 0, this.hH, this.hS + corrLen) }
        );
    }

    update(deltaTime) {
        this.movingLight.updateOrbit(deltaTime, 90.0, 0.4, 40.0);
        if (this.entities['sun']) {
            const [lx, ly, lz] = this.movingLight.position;
            this.entities['sun'].matrix = Transform.multiplyMatrices(Transform.translate(Transform.identity(), lx, ly, lz), Transform.scale(Transform.identity(), 4, 4, 4));
        }
    }

    draw(gl, locations, viewProjMatrix) {
        this.ceilingLight.bind(gl, locations, "u_Ceiling");
        this.movingLight.bind(gl, locations, "u_Sphere");

        this.elements.forEach(el => el.mesh.draw(gl, locations, viewProjMatrix, el.matrix, { "default": el.texture || this.solidTexture }));
        Object.values(this.entities).forEach(ent => ent.data.mesh.draw(gl, locations, viewProjMatrix, ent.matrix, ent.data.textures));
    }
}