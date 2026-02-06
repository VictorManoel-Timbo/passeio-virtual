import { OBJDoc } from "./loaders/objParser.js";
import { Camera } from "./engine/camera.js";
import { loadTextFile } from "./engine/utils.js";
import { Scenario } from "./scenario.js";
import { Texture } from "./engine/texture.js";
import { Mesh } from "./engine/mesh.js";

class App {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) alert("WebGL não suportado");

    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.camera = new Camera(this.gl);
    this.keys = {};
    this.lastTime = 0;
    this.locations = null;
    this.textures = {};

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
    this.camera = new Camera(this.gl);

    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
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
    await objDoc.parse(objText, modelCfg.scale, false);

    while (!objDoc.isMTLComplete()) {
      await new Promise(r => setTimeout(r, 50));
    }

    const folderPath = modelCfg.path.substring(0, modelCfg.path.lastIndexOf("/") + 1);
    const materialsMap = objDoc.getMaterialsInfo();

    // Resolve as texturas do material
    const modelTextureDict = await this.resolveModelTextures(materialsMap, folderPath);

    return {
      mesh: new Mesh(this.gl, objDoc.getDrawingInfoGrouped()),
      textures: modelTextureDict
    };
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
    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
  }

  createProgram(vs, fs) {
    const gl = this.gl;

    // 1. Compilar Shaders
    const vShader = this._compileShader(gl.VERTEX_SHADER, vs);
    const fShader = this._compileShader(gl.FRAGMENT_SHADER, fs);

    if (!vShader || !fShader) return null;

    // 2. Criar e Linkar o Programa
    const prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);

    // 3. Verificar linkagem
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return prog;
    }

    console.error("Erro ao linkar programa:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }

  // Função auxiliar para evitar repetição de código
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

      // Uniforms (Phong Lighting)
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
    // Atualizar câmera (Movimento WASD definido no camera.js)
    this.camera.update(deltaTime, this.keys);

    if (this.scenario) {
      this.scenario.update(deltaTime);
    }
  }

  render() {
    if (!this.locations) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const viewProjMatrix = this.camera.viewProjMatrix;

    // Enviar a posição da câmera é necessária para o Especular
    this.gl.uniform3fv(this.locations.u_ViewPos, new Float32Array(this.camera.position));

    if (this.scenario) {
      this.scenario.draw(this.gl, this.locations, viewProjMatrix);
    }

  }

  cleanup() { //Esse tem que ser revisado
    console.log("Iniciando limpeza de recursos...");

    // 1. Para o loop de renderização
    if (this.requestID) {
      cancelAnimationFrame(this.requestID);
    }


    // 3. Deleta o programa de Shader
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }

    // 4. Remove eventos globais
    window.removeEventListener('keydown', this._keyDownRef);
    window.removeEventListener('keyup', this._keyUpRef);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.useProgram(null);

    this.locations = null;

    console.log("GPU e Memória limpas.");
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
