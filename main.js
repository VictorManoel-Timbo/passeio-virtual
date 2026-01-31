import { OBJDoc } from "./objParser.js";
import { Mesh } from "./mesh.js";
import { Transform } from "./transform.js";

class App {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) alert("WebGL não suportado");
    this.renderList = [];
    this.angleX = 0; // Inicializa o ângulo
    this.angleY = 0;
    this.angleZ = 0;
    this.lastTime = Date.now()

    // Defina matrizes iniciais para a câmera
    this.projMatrix = Transform.perspective(45, this.canvas.width / this.canvas.height, 0.1, 1000);
    this.cameraPos = [0, 0, 15]; // Posição inicial
    this.viewMatrix = Transform.lookAt(this.cameraPos, [0, 0, 0], [0, 1, 0]);

    this._initShaders();
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
    return prog;
  }

  _initShaders() {
    const vsSource = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            attribute vec4 a_Normal;
            uniform mat4 u_MvpMatrix;
            uniform mat4 u_NormalMatrix;
            varying vec4 v_Color;
            void main() {
                gl_Position = u_MvpMatrix * a_Position;
    
                vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
                
                vec3 lightDir = normalize(vec3(0.0, 1.0, 0.0)); 
                
                float nDotL = max(dot(normal, lightDir), 0.0);
                
                vec3 ambient = a_Color.rgb * 0.1; 
                vec3 diffuse = a_Color.rgb * nDotL * 25.0;

                v_Color = vec4(diffuse + ambient, a_Color.a);
            }
        `;
    const fsSource = `
            precision mediump float;
            varying vec4 v_Color;
            void main() { gl_FragColor = v_Color; }
        `;
    // ... função de compilar shaders aqui ...
    this.program = this.createProgram(vsSource, fsSource);
    this.locations = {
      a_Position: this.gl.getAttribLocation(this.program, 'a_Position'),  // Verificar se pode usar
      a_Color: this.gl.getAttribLocation(this.program, 'a_Color'),
      a_Normal: this.gl.getAttribLocation(this.program, 'a_Normal'),
      u_MvpMatrix: this.gl.getUniformLocation(this.program, 'u_MvpMatrix'), // Verificar se pode usar
      u_NormalMatrix: this.gl.getUniformLocation(this.program, 'u_NormalMatrix')
    };
  }

  render = () => {
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1000; // segundos
    this.lastTime = now;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.program);

    this.angleX += 0.5 * deltaTime;
    this.angleY += 1.2 * deltaTime;
    this.angleZ += 0.3 * deltaTime;

    const viewProjMatrix = Transform.multiplyMatrices(this.projMatrix, this.viewMatrix);

    this.renderList.forEach(mesh => {

      const rotX = Transform.rotateX(this.angleX);
      const rotY = Transform.rotateY(this.angleY);
      const rotZ = Transform.rotateZ(this.angleZ);

      let modelMatrix = Transform.multiplyMatrices(rotY, rotX);
      modelMatrix = Transform.multiplyMatrices(modelMatrix, rotZ);

      const mvpMatrix = Transform.multiplyMatrices(viewProjMatrix, modelMatrix);

      mesh.draw(this.gl, this.locations, viewProjMatrix, modelMatrix);
    });

    requestAnimationFrame(this.render);
  }

  start() {
    this.render()
  }
}

const engine = new App();
engine.loadModel("./models/caneca.obj");
engine.start();