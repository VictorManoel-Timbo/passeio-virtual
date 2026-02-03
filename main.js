import { OBJDoc } from "./loaders/objParser.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Camera } from "./engine/camera.js";
import { loadTextFile } from "./engine/utils.js";
import { Scenario } from "./scenario.js";
import { Geometry } from "./geometry.js";

class App {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) alert("WebGL não suportado");

    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.camera = new Camera(this.gl);
    this.renderList = [];
    this.keys = {};
    this.lastTime = 0;
    this.locations = null; // Será preenchido no init

    this.onEvent(); // Configura os ouvintes de teclado
    this.init();
  }

  async loadModel(url) {
    const response = await fetch(url);
    const text = await response.text();

    const objDoc = new OBJDoc(url);
    await objDoc.parse(text, 1.0, false);

    // Aguarda carregar os materiais (.mtl)
    while (!objDoc.isMTLComplete()) {
      await new Promise(r => setTimeout(r, 100));
    }

    const drawingInfo = objDoc.getDrawingInfo();
    const mesh = new Mesh(this.gl, drawingInfo);
    this.renderList.push(mesh);
  }

  async init() {
    const vsSource = await loadTextFile('.//shaders/vertex.glsl');
    const fsSource = await loadTextFile('./shaders/fragment.glsl');

    this.program = this.createProgram(vsSource, fsSource);
    this.gl.useProgram(this.program);

    this.locations = this.getLocations();

    this.camera = new Camera(this.gl);
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    await this.loadModel('./assets/caneca.obj');

    this.scenario = new Scenario(this.gl);

    this.start()
  }

  onEvent() {
    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
  }

  createProgram(vs, fs) {
    const gl = this.gl;
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);

    const prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return prog;
    }

    alert("Erro de linguagem " + gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
  }

  getLocations() {
    return {
      // Atributos (Vertex Data)
      a_Position: this.gl.getAttribLocation(this.program, 'a_Position'),
      a_Normal: this.gl.getAttribLocation(this.program, 'a_Normal'),
      a_Color: this.gl.getAttribLocation(this.program, 'a_Color'),

      // Uniforms (Matrizes)
      u_MvpMatrix: this.gl.getUniformLocation(this.program, 'u_MvpMatrix'),
      u_ModelMatrix: this.gl.getUniformLocation(this.program, 'u_ModelMatrix'),
      u_NormalMatrix: this.gl.getUniformLocation(this.program, 'u_NormalMatrix'),

      // Uniforms (Phong Lighting)
      u_LightPos: this.gl.getUniformLocation(this.program, 'u_LightPos'),
      u_ViewPos: this.gl.getUniformLocation(this.program, 'u_ViewPos'),
      u_LightColor: this.gl.getUniformLocation(this.program, 'u_LightColor'),

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

    this.renderList.forEach(mesh => {
      let modelMatrix = Transform.identity();
      modelMatrix = Transform.translate(modelMatrix, 0, 1.5, 0);
      mesh.draw(this.gl, this.locations, viewProjMatrix, modelMatrix);
    });

  }

  cleanup() {
    console.log("Iniciando limpeza de recursos...");

    // 1. Para o loop de renderização
    if (this.requestID) {
      cancelAnimationFrame(this.requestID);
    }

    // 2. Limpa os buffers de cada Mesh na GPU
    this.renderList.forEach(mesh => {
      this.gl.deleteBuffer(mesh.vertexBuffer);
      this.gl.deleteBuffer(mesh.normalBuffer);
      this.gl.deleteBuffer(mesh.colorBuffer);
    });

    // 3. Deleta o programa de Shader
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }

    // 4. Remove eventos globais
    window.removeEventListener('keydown', this._keyDownRef);
    window.removeEventListener('keyup', this._keyUpRef);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.useProgram(null);

    // 5. Reseta as listas locais
    this.renderList = [];
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
window.addEventListener('beforeunload', () => {
  app.cleanup();
});