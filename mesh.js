import { Transform } from "./transform.js";

export class Mesh {
    constructor(gl, drawingInfo) {
        this.gl = gl;
        this.indicesCount = drawingInfo.indices.length;

        // Criação dos Buffers
        this.vertexBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.vertices);
        this.normalBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.normals);
        this.colorBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.colors);
        this.indexBuffer = this._createBuffer(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices);
    }

    _createBuffer(type, data) {
        const buf = this.gl.createBuffer();
        this.gl.bindBuffer(type, buf); // Verificar se pode usar
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW); // Verificar se pode usar
        return buf;
    }

    draw(gl, locations, viewProjMatrix, modelMatrix) {
        // 1. Enviar a MVP Matrix para posicionar os vértices
        const mvpMatrix = Transform.multiplyMatrices(viewProjMatrix, modelMatrix);
        gl.uniformMatrix4fv(locations.u_MvpMatrix, false, mvpMatrix);

        // 2. CALCULAR A MATRIZ NORMAL (Usando a sua nova função inverse!)
        // Isso garante que a normal aponte para o lado certo mesmo após girar
        const normalMatrix = Transform.getNormalMatrix(modelMatrix);
        gl.uniformMatrix4fv(locations.u_NormalMatrix, false, normalMatrix);

        // Ativação dos Atributos
        this._bindAttribute(locations.a_Position, this.vertexBuffer, 3);
        this._bindAttribute(locations.a_Normal, this.normalBuffer, 3);
        this._bindAttribute(locations.a_Color, this.colorBuffer, 4);

        // Desenho por Índices (Mais eficiente)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indicesCount, gl.UNSIGNED_SHORT, 0); // Mudar para método próprio
    }

    _bindAttribute(location, buffer, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0); // Verificar se pode usar
        this.gl.enableVertexAttribArray(location); // Verificar se pode usar
    }
}