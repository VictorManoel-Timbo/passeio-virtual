import { OBJDoc } from "./loaders/objParser.js";
import { Camera } from "./engine/camera.js";
import { loadTextFile } from "./engine/utils.js";
import { Scenario } from "./scenario.js";
import { Texture } from "./engine/texture.js";
import { Mesh } from "./engine/mesh.js";
import { HUD } from "./hud.js";

class App {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) alert("WebGL não suportado");

    this.bgMusic = new Audio('./assets/trilha-sonora.mp3'); // Caminho do seu arquivo
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.5; 
    this.audioStarted = false;

    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.camera = new Camera(this.gl);
    this.keys = {};
    this.lastTime = 0;
    this.locations = null;
    this.textures = {};
    this.hud = new HUD(); // Inicializa a HUD

    this.onEvent();
    this.init();
  }

  async loadModel(url) {
    const response = await fetch(url);
    const text = await response.text();

    const objDoc = new OBJDoc(url);
    await objDoc.parse(text, 1.0, false);

    while (!objDoc.isMTLComplete()) {
      await new Promise(r => setTimeout(r, 100));
    }

    const drawingInfo = objDoc.getDrawingInfoGrouped();

    return drawingInfo
  }

  async loadAllTextures(url) {
    this.textures = {};
    try {
      const response = await fetch(url);
      const config = await response.json();

      const promises = Object.keys(config).map(key => {
        return new Promise((resolve) => {
          const tex = new Texture(this.gl, config[key]);
          this.textures[key] = tex;
          tex.image.onload = () => {
            tex.updateGPU();
            resolve();
          };
        });
      });
      await Promise.all(promises);
    } catch (e) {
      console.error("Erro no carregamento de texturas:", e);
    }
  }

  async init() {
    await this.setupGraphics();

    this.allTextures = {};
    await this.loadAllTextures("./textures.json");

    this.models = await this.loadModelsFromConfig('./models.json');

    this.scenario = new Scenario(this.gl, this.models, this.textures);

    this.start();
  }

  async setupGraphics() {
    const vsSource = await loadTextFile('./shaders/vertex.glsl');
    const fsSource = await loadTextFile('./shaders/fragment.glsl');

    this.program = this.createProgram(vsSource, fsSource);
    this.gl.useProgram(this.program);
    this.locations = this.getLocations();

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
  }

  async loadModelsFromConfig(jsonPath) {
    const response = await fetch(jsonPath);
    const config = await response.json();
    const loadedModels = {};

    for (const modelCfg of config.models) {
      loadedModels[modelCfg.id] = await this.processModel(modelCfg);
    }
    return loadedModels;
  }

  async processModel(modelCfg) {
    console.log(`Processando: ${modelCfg.id}`);

    const objDoc = new OBJDoc(modelCfg.path);
    const objText = await (await fetch(modelCfg.path)).text();

    await objDoc.parse(objText, 1.0, false);

    while (!objDoc.isMTLComplete()) {
      await new Promise(r => setTimeout(r, 50));
    }

    const folderPath = modelCfg.path.substring(0, modelCfg.path.lastIndexOf("/") + 1);
    const materialsMap = objDoc.getMaterialsInfo();
    const modelTextureDict = await this.resolveModelTextures(materialsMap, folderPath);

    const drawingInfo = objDoc.getDrawingInfoGrouped();

    const bounds = this.calculateBoundingBox(drawingInfo);

    return {
      mesh: new Mesh(this.gl, drawingInfo),
      textures: modelTextureDict,
      bounds: bounds
    };
  }

  calculateBoundingBox(drawingInfo) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    let groups = [];

    if (Array.isArray(drawingInfo)) {
      groups = drawingInfo;
    } else if (drawingInfo && typeof drawingInfo === 'object') {
      groups = [drawingInfo];
    }

    for (const group of groups) {
      if (!group.vertices) continue;

      const vertices = group.vertices;

      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
    }

    if (minX === Infinity) {
      return { min: [0, 0, 0], max: [0, 0, 0] };
    }

    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
  }

  async resolveModelTextures(materialsMap, folderPath) {
    const modelTextureDict = {};

    for (const [mtlName, texFileName] of Object.entries(materialsMap)) {
      if (!texFileName) continue;

      const fullPath = folderPath + texFileName;

      if (!this.allTextures[fullPath]) {
        const tex = new Texture(this.gl, fullPath);
        await new Promise(resolve => {
          tex.image.onload = () => { tex.updateGPU(); resolve(); };
          tex.image.onerror = () => { console.warn(`Erro: ${fullPath}`); resolve(); };
        });
        this.allTextures[fullPath] = tex;
      }
      modelTextureDict[mtlName] = this.allTextures[fullPath];
    }
    return modelTextureDict;
  }

  onEvent() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      if (!this.audioStarted) {
        this.bgMusic.play().catch(e => console.log("Aguardando interação para áudio"));
        this.audioStarted = true;
      }
    });

    window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

    this.canvas.addEventListener('mousedown', () => {
        if (!this.audioStarted) {
            this.bgMusic.play();
            this.audioStarted = true;
        }
    });
  }

  createProgram(vs, fs) {
    const gl = this.gl;

    // Compilar Shaders
    const vShader = this._compileShader(gl.VERTEX_SHADER, vs);
    const fShader = this._compileShader(gl.FRAGMENT_SHADER, fs);

    if (!vShader || !fShader) return null;

    // Criar e Linkar o Programa
    const prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);

    // Verificar linkagem
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return prog;
    }

    console.error("Erro ao linkar programa:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }

  _compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    }

    console.error("Erro de compilação (" + (type === gl.VERTEX_SHADER ? "Vertex" : "Fragment") + "):", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  getLocations() {
    return {
      // Atributos (Vertex Data)
      a_Position: this.gl.getAttribLocation(this.program, 'a_Position'),
      a_Normal: this.gl.getAttribLocation(this.program, 'a_Normal'),
      a_Color: this.gl.getAttribLocation(this.program, 'a_Color'),
      a_TexCoord: this.gl.getAttribLocation(this.program, "a_TexCoord"),

      // Uniforms (Matrizes)
      u_MvpMatrix: this.gl.getUniformLocation(this.program, 'u_MvpMatrix'),
      u_ModelMatrix: this.gl.getUniformLocation(this.program, 'u_ModelMatrix'),
      u_NormalMatrix: this.gl.getUniformLocation(this.program, 'u_NormalMatrix'),

      u_ViewPos: this.gl.getUniformLocation(this.program, 'u_ViewPos'),
      u_Sampler: this.gl.getUniformLocation(this.program, "u_Sampler"),
      u_UseTexture: this.gl.getUniformLocation(this.program, "u_UseTexture"),

      u_SpherePos: this.gl.getUniformLocation(this.program, 'u_SpherePos'),
      u_SphereColor: this.gl.getUniformLocation(this.program, 'u_SphereColor'),

      u_CeilingPos: this.gl.getUniformLocation(this.program, 'u_CeilingPos'),
      u_CeilingDir: this.gl.getUniformLocation(this.program, 'u_CeilingDir'),
      u_CeilingCutoff: this.gl.getUniformLocation(this.program, 'u_CeilingCutoff'),
      u_CeilingColor: this.gl.getUniformLocation(this.program, 'u_CeilingColor'),
    }
  }

  onLoop(deltaTime) {
    // 1. Salva a posição ANTES de se mover
    const oldX = this.camera.position[0];
    const oldZ = this.camera.position[2];

    this.camera.update(deltaTime, this.keys);

    // Se o cenário ainda não carregou, não faz colisão
    if (!this.scenario) return;

    this.scenario.update(deltaTime);

    // --- COLISÃO COM DESLIZAMENTO ---
    // Verifica colisão no eixo X
    if (this.scenario.checkCollision(this.camera.position[0], oldZ)) {
      this.camera.position[0] = oldX;
    }

    // Verifica colisão no eixo Z
    if (this.scenario.checkCollision(this.camera.position[0], this.camera.position[2])) {
      this.camera.position[2] = oldZ;
    }

    this.hud.update(this.camera.position, this.scenario.framePositions);
  }

  render() {
    if (!this.locations) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const viewProjMatrix = this.camera.viewProjMatrix;

    this.gl.uniform3fv(this.locations.u_ViewPos, new Float32Array(this.camera.position));

    if (this.scenario) {
      this.scenario.draw(this.gl, this.locations, viewProjMatrix);
    }

  }

  start(now = 0) {
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.onLoop(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.start(time));
  }
}

const engine = new App();