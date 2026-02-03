import { Transform } from "./transform.js";

export class Mesh {
    constructor(gl, drawingInfo) {
        this.gl = gl;
        this.vertexCount = drawingInfo.vertices.length / 3;

        // Criação dos Buffers
        this.vertexBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.vertices);
        this.normalBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.normals);
        this.colorBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.colors);
    }

    _createBuffer(type, data) {
        const buf = this.gl.createBuffer();
        this.gl.bindBuffer(type, buf);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buf;
    }

    draw(gl, locations, viewProjMatrix, modelMatrix) {
        // Envia a MVP normal para o gl_Position
        const mvpMatrix = Transform.multiplyMatrices(viewProjMatrix, modelMatrix);
        gl.uniformMatrix4fv(locations.u_MvpMatrix, false, mvpMatrix);

        // ENVIE A MODEL MATRIX (Esta faltava para o cálculo de luz fixar no mundo)
        gl.uniformMatrix4fv(locations.u_ModelMatrix, false, modelMatrix);

        const normalMatrix = Transform.getNormalMatrix(modelMatrix);
        gl.uniformMatrix4fv(locations.u_NormalMatrix, false, normalMatrix);

        this._bindAttribute(locations.a_Position, this.vertexBuffer, 3);
        this._bindAttribute(locations.a_Normal, this.normalBuffer, 3);
        this._bindAttribute(locations.a_Color, this.colorBuffer, 4);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    _bindAttribute(location, buffer, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }
}