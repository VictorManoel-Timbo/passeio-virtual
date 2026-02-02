import { OBJDoc } from "./objParser.js";
import { Mesh } from "./mesh.js";
import { Transform } from "./transform.js";
import { Camera } from "./camera.js";

class App {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) alert("WebGL não suportado");

    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.renderList = [];
    this.angleX = 0; // Inicializa o ângulo
    this.angleY = 0;
    this.angleZ = 0;

    this.keys = {}; // Garante que o objeto existe

    // Registra as teclas pressionadas
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this._initShaders();

    this.camera = new Camera(this.gl);
    this.lastTime = Date.now();
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

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return prog;
    }

    alert("Erro de linguagem " + gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
  }

  _initShaders() {
    const vsSource = /*glsl*/  `
            attribute vec4 a_Position;
            attribute vec3 a_Normal;
            attribute vec4 a_Color;

            uniform mat4 u_MvpMatrix;
            uniform mat4 u_ModelMatrix;
            uniform mat4 u_NormalMatrix;

            varying vec3 v_Normal;
            varying vec3 v_Position;
            varying vec4 v_Color;

            void main() {
              gl_Position = u_MvpMatrix * a_Position;
              // Calcula a posição do vértice no mundo para a luz
              v_Position = vec3(u_ModelMatrix * a_Position);
              // Transforma a normal para o espaço do mundo corretamente
              v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
              v_Color = a_Color;
            }
        `;
    const fsSource = /*glsl*/ `
            precision mediump float;

            uniform vec3 u_LightPos;    // Posição da lâmpada
            uniform vec3 u_ViewPos;     // Posição da câmera (this.cameraPos)
            uniform vec3 u_LightColor;

            varying vec3 v_Normal;
            varying vec3 v_Position;
            varying vec4 v_Color;

            void main() {
              // 1. Ambiental
              float ambientStrength = 10.2;
              vec3 ambient = ambientStrength * u_LightColor;

              // 2. Difusa
              float diffuseStrength = 10.8;
              vec3 norm = normalize(v_Normal);
              vec3 lightDir = normalize(u_LightPos - v_Position);
              float diff = max(dot(norm, lightDir), 0.0);
              vec3 diffuse = diff * diffuseStrength * u_LightColor;

              // 3. Especular (O brilho de Phong)
              float specularStrength = 1.5;
              vec3 viewDir = normalize(u_ViewPos - v_Position);
              vec3 reflectDir = reflect(-lightDir, norm); 
              float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0); // 32 = brilho
              vec3 specular = specularStrength * spec * u_LightColor;

              vec3 result = (ambient + diffuse + specular) * v_Color.rgb;
              gl_FragColor = vec4(result, v_Color.a);
            }
        `;
    // ... função de compilar shaders aqui ...
    this.program = this.createProgram(vsSource, fsSource);
    this.locations = {
      // Atributos (Vertex Data)
      a_Position: this.gl.getAttribLocation(this.program, 'a_Position'),
      a_Normal: this.gl.getAttribLocation(this.program, 'a_Normal'),
      a_Color: this.gl.getAttribLocation(this.program, 'a_Color'),

      // Uniforms (Matrizes)
      u_MvpMatrix: this.gl.getUniformLocation(this.program, 'u_MvpMatrix'),
      u_ModelMatrix: this.gl.getUniformLocation(this.program, 'u_ModelMatrix'),
      u_NormalMatrix: this.gl.getUniformLocation(this.program, 'u_NormalMatrix'),

      // Uniforms (Phong Lighting) - NOVAS AQUI
      u_LightPos: this.gl.getUniformLocation(this.program, 'u_LightPos'),
      u_ViewPos: this.gl.getUniformLocation(this.program, 'u_ViewPos'),
      u_LightColor: this.gl.getUniformLocation(this.program, 'u_LightColor')
    };
  }

  render = () => {
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1000; // segundos
    this.lastTime = now;

    // A câmera agora cuida de si mesma
    this.camera.update(deltaTime, this.keys);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST); // Ativa Z-Buffer (Requisito)
    this.gl.enable(this.gl.CULL_FACE);  // Ativa Back-face Culling (Requisito)
    this.gl.cullFace(this.gl.BACK);
    this.gl.useProgram(this.program);

    /*this.angleX += 0.5 * deltaTime;
    this.angleY += 1.2 * deltaTime;
    this.angleZ += 0.3 * deltaTime;*/

    const viewProjMatrix = this.camera.viewProjMatrix;

    // Envia a posição da câmera para o Phong (u_ViewPos)
    this.gl.uniform3fv(this.locations.u_ViewPos, new Float32Array(this.camera.position));

    // Envia a posição da luz (ex: vinda do alto e da direita)
    this.gl.uniform3fv(this.locations.u_LightPos, new Float32Array([10.0, 10.0, 10.0]));

    // Envia a cor da luz (Branca)
    this.gl.uniform3fv(this.locations.u_LightColor, new Float32Array([1.0, 1.0, 1.0]));

    this.renderList.forEach(mesh => {

      /*const rotX = Transform.rotateX(this.angleX);
      const rotY = Transform.rotateY(this.angleY);
      const rotZ = Transform.rotateZ(this.angleZ);

      let modelMatrix = Transform.multiplyMatrices(rotY, rotX);
      modelMatrix = Transform.multiplyMatrices(modelMatrix, rotZ);*/

      let modelMatrix = Transform.identity();

      mesh.draw(this.gl, this.locations, viewProjMatrix, modelMatrix);

    });

    requestAnimationFrame(this.render);
  }

  start() {
    this.render()
  }
}

const engine = new App();
engine.loadModel("./assets/caneca.obj");
engine.start();