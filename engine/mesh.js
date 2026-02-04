import { Transform } from "./transform.js";

export class Mesh {
    constructor(gl, drawingInfo) {
        this.gl = gl;
        this.vertexCount = drawingInfo.vertices.length / 3;

        // Criação dos Buffers
        this.vertexBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.vertices);
        this.normalBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.normals);
        this.colorBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.colors);
        if (drawingInfo.texCoords) {
            this.texCoordBuffer = this._createBuffer(gl.ARRAY_BUFFER, drawingInfo.texCoords);
        }
    }

    _createBuffer(type, data) {
        const buf = this.gl.createBuffer();
        this.gl.bindBuffer(type, buf);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buf;
    }

    draw(gl, locations, viewProjMatrix, modelMatrix, texture = null) {
        // Envia a MVP normal para o gl_Position
        const mvpMatrix = Transform.multiplyMatrices(viewProjMatrix, modelMatrix);
        gl.uniformMatrix4fv(locations.u_MvpMatrix, false, mvpMatrix);

        // ENVIE A MODEL MATRIX (Esta faltava para o cálculo de luz fixar no mundo)
        gl.uniformMatrix4fv(locations.u_ModelMatrix, false, modelMatrix);

        const normalMatrix = Transform.getNormalMatrix(modelMatrix);
        gl.uniformMatrix4fv(locations.u_NormalMatrix, false, normalMatrix);

        if (texture && texture.isLoaded) {
            texture.bind(0); // Ativa TEXTURE0 e faz o bind
            gl.uniform1i(locations.u_Sampler, 0); // Avisa o shader para usar a unidade 0
        }

        this._bindAttribute(locations.a_Position, this.vertexBuffer, 3);
        this._bindAttribute(locations.a_Normal, this.normalBuffer, 3);
        this._bindAttribute(locations.a_Color, this.colorBuffer, 4);

        if (this.texCoordBuffer && locations.a_TexCoord !== -1) {
            this._bindAttribute(locations.a_TexCoord, this.texCoordBuffer, 2);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    _bindAttribute(location, buffer, size) {
        if (location === -1 || location === undefined) return;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }
}