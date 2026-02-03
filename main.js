import { OBJDoc } from "./loaders/objParser.js";
import { Mesh } from "./engine/mesh.js";
import { Transform } from "./engine/transform.js";
import { Camera } from "./engine/camera.js";
import { loadTextFile } from "./engine/utils.js";
import { Geometry } from "./geometry.js";
import { Scenario } from "./scenario.js";

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

    // Criar primitivas na tela
    // Criar um chão verde
    //const planeData = Geometry.createPlane(20, 20, [0.2, 0.8, 0.2, 1.0]);
    //const floor = new Mesh(this.gl, planeData);
    //this.renderList.push(floor);

    // Criar um pilar alto e fino (paralelepípedo)
    //const boxData = Geometry.createBox(1, 5, 1, [0.8, 0.2, 0.2, 1.0]);
    //const pillar = new Mesh(this.gl, boxData);
    //this.renderList.push(pillar);

    // Uma esfera suave (32 segmentos)
    //const sphereData = Geometry.createSphere(2, 32, [0.3, 0.5, 0.9, 1.0]);
    //const sphere = new Mesh(this.gl, sphereData);
    //this.renderList.push(sphere);

    // Um cilindro amarelo
    //const cylinderData = Geometry.createCylinder(1.5, 4, 24, [1.0, 0.9, 0.0, 1.0]);
    //const cylinder = new Mesh(this.gl, cylinderData);
    //this.renderList.push(cylinder);

    //Coloquei para carregar algumas formas de teste
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
      u_NormalMatrix: this.gl.getUniformLocation(this.program, 'u_NormalMatrix'),

      // Uniforms (Phong Lighting) - NOVAS AQUI
      u_LightPos: this.gl.getUniformLocation(this.program, 'u_LightPos'),
      u_ViewPos: this.gl.getUniformLocation(this.program, 'u_ViewPos'),
      u_LightColor: this.gl.getUniformLocation(this.program, 'u_LightColor')
    }
  }

  onLoop(deltaTime) {
    // Atualizar câmera (Movimento WASD definido no camera.js)
    this.camera.update(deltaTime, this.keys);
  }

  render() {
    if (!this.locations) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const viewProjMatrix = this.camera.viewProjMatrix;
    const viewPos = new Float32Array(this.camera.position);

    // Enviar Uniforms Globais (Iluminação de Phong)
    this.gl.uniform3fv(this.locations.u_ViewPos, viewPos);
    this.gl.uniform3fv(this.locations.u_LightPos, new Float32Array([10.0, 10.0, 10.0]));
    this.gl.uniform3fv(this.locations.u_LightColor, new Float32Array([1.0, 1.0, 1.0]));

    this.renderList.forEach(mesh => {
      let modelMatrix = Transform.identity();

      mesh.draw(this.gl, this.locations, viewProjMatrix, modelMatrix);
    });

    // Desenha o cenário completo com uma única chamada
    if (this.scenario) {
        this.scenario.draw(this.gl, this.locations, viewProjMatrix);
    }

    // Desenha outros modelos (como a caneca)
    this.renderList.forEach(mesh => {
        let modelMatrix = Transform.identity();
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