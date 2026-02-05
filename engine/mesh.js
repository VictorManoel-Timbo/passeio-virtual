import { Transform } from "./transform.js";

export class Mesh {
    constructor(gl, groupedDrawingInfo) {
        this.gl = gl;
        this.subMeshes = {}; // Dicionário de grupos de buffers

        // groupedDrawingInfo é o objeto retornado pelo objDoc.getDrawingInfoGrouped()
        for (const [materialName, data] of Object.entries(groupedDrawingInfo)) {
            this.subMeshes[materialName] = {
                vertexCount: data.vertices.length / 3,
                vertexBuffer: this._createBuffer(gl.ARRAY_BUFFER, data.vertices),
                normalBuffer: this._createBuffer(gl.ARRAY_BUFFER, data.normals),
                colorBuffer: this._createBuffer(gl.ARRAY_BUFFER, data.colors),
                texCoordBuffer: data.texCoords ? this._createBuffer(gl.ARRAY_BUFFER, data.texCoords) : null
            };
        }
    }

    _createBuffer(type, data) {
        const buf = this.gl.createBuffer();
        this.gl.bindBuffer(type, buf);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buf;
    }

    draw(gl, locations, viewProjMatrix, modelMatrix, textureDict = null) {
        // 1. Configurações Globais do Objeto (Matrizes)
        const mvpMatrix = Transform.multiplyMatrices(viewProjMatrix, modelMatrix);
        gl.uniformMatrix4fv(locations.u_MvpMatrix, false, mvpMatrix);
        gl.uniformMatrix4fv(locations.u_ModelMatrix, false, modelMatrix);

        const normalMatrix = Transform.getNormalMatrix(modelMatrix);
        gl.uniformMatrix4fv(locations.u_NormalMatrix, false, normalMatrix);

        // 2. Desenha cada Sub-Mesh (cada parte que usa um material/textura diferente)
        for (const [materialName, meshData] of Object.entries(this.subMeshes)) {

            // Tenta encontrar a textura correspondente a esta parte no dicionário
            if (textureDict && textureDict[materialName]) {
                const texture = textureDict[materialName];
                if (texture.isLoaded) {
                    texture.bind(0);
                    gl.uniform1i(locations.u_Sampler, 0);
                    // Aqui você poderia enviar um uniform "u_UseTexture = true" se seu shader suportar
                }
            }

            // Bind dos atributos desta sub-mesh específica
            this._bindAttribute(locations.a_Position, meshData.vertexBuffer, 3);
            this._bindAttribute(locations.a_Normal, meshData.normalBuffer, 3);
            this._bindAttribute(locations.a_Color, meshData.colorBuffer, 4);

            if (meshData.texCoordBuffer && locations.a_TexCoord !== -1) {
                this._bindAttribute(locations.a_TexCoord, meshData.texCoordBuffer, 2);
            }

            // Comando de desenho para esta parte
            gl.drawArrays(gl.TRIANGLES, 0, meshData.vertexCount);
        }
    }

    _bindAttribute(location, buffer, size) {
        if (location === -1 || location === undefined || location === null) return;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(location);
    }
}