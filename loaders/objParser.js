import { StringParser } from "./stringParser.js";
import { calcNormal } from "../engine/utils.js";

/**
 * Estruturas de suporte para o modelo
 */
class OBJObject {
    constructor(name) {
        this.name = name;
        this.faces = [];
        this.numIndices = 0;
    }
    addFace(face) {
        this.faces.push(face);
        this.numIndices += face.numIndices;
    }
}

class Face {
    constructor(materialName) {
        this.materialName = materialName || "";
        this.vIndices = [];
        this.nIndices = [];
        this.tIndices = []; // Índices de textura (vt)
        this.numIndices = 0;
        this.normal = null;
    }
}

class MTLDoc {
    constructor() {
        this.complete = false;
        this.materials = [];
    }
}

class Material {
    constructor(name, r, g, b, a) {
        this.name = name;
        this.color = { r, g, b, a };
        this.map_Kd = null; // Caminho da imagem da textura
    }
}

/**
 * Classe Principal para processamento do ficheiro .obj e .mtl
 */
export class OBJDoc {
    constructor(fileName) {
        this.fileName = fileName;
        this.mtls = [];
        this.objects = [];
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
    }

    async parse(fileString, scale, reverse) {
        var lines = fileString.split('\n');
        lines.push(null);
        var index = 0;
        var line;
        var currentObject = null;
        var currentMaterialName = "";
        var sp = new StringParser();

        while ((line = lines[index++]) != null) {
            sp.init(line);
            var command = sp.getWord();
            if (command == null) continue;

            switch (command) {
                case '#': continue;
                case 'mtllib':
                    var path = this.parseMtllib(sp, this.fileName);
                    await this.loadMTL(path);
                    continue;
                case 'o':
                case 'g':
                    var object = new OBJObject(sp.getWord());
                    this.objects.push(object);
                    currentObject = object;
                    continue;
                case 'v':
                    this.vertices.push({
                        x: sp.getFloat() * scale,
                        y: sp.getFloat() * scale,
                        z: sp.getFloat() * scale
                    });
                    continue;
                case 'vn':
                    this.normals.push({
                        x: sp.getFloat(),
                        y: sp.getFloat(),
                        z: sp.getFloat()
                    });
                    continue;
                case 'vt':
                    this.texCoords.push({
                        u: sp.getFloat(),
                        v: sp.getFloat()
                    });
                    continue;
                case 'usemtl':
                    currentMaterialName = sp.getWord();
                    continue;
                case 'f':
                    var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
                    if (currentObject) currentObject.addFace(face);
                    continue;
            }
        }
        return true;
    }

    parseMtllib(sp, fileName) {
        var i = fileName.lastIndexOf("/");
        var dirPath = i > 0 ? fileName.substring(0, i + 1) : "";
        return dirPath + sp.getWord();
    }

    async loadMTL(path) {
        const mtl = new MTLDoc();
        this.mtls.push(mtl);
        try {
            const response = await fetch(path);
            if (response.status !== 404) {
                const text = await response.text();
                this.onReadMTLFile(text, mtl);
            } else {
                mtl.complete = true;
            }
        } catch (e) {
            mtl.complete = true;
        }
    }

    onReadMTLFile(fileString, mtl) {
        var lines = fileString.split('\n');
        lines.push(null);
        var index = 0, line;
        var sp = new StringParser();
        var currentMaterial = null;

        while ((line = lines[index++]) != null) {
            sp.init(line);
            var command = sp.getWord();
            if (command == null) continue;

            switch (command) {
                case 'newmtl':
                    var name = sp.getWord();
                    currentMaterial = new Material(name, 0.8, 0.8, 0.8, 1);
                    mtl.materials.push(currentMaterial);
                    continue;
                case 'Kd':
                case 'Ka':
                    if (currentMaterial) {
                        const r = sp.getFloat();
                        const g = sp.getFloat();
                        const b = sp.getFloat();
                        // Só atualiza se os valores forem válidos (não NaN)
                        if (!isNaN(r)) {
                            currentMaterial.color = { r: r, g: g, b: b, a: 1.0 };
                        }
                    }
                    continue;
                case 'map_Kd':
                    if (currentMaterial) {
                        currentMaterial.map_Kd = sp.getWord();
                    }
                    continue;
            }
        }
        mtl.complete = true;
    }

    parseFace(sp, materialName, vertices, reverse) {
        var face = new Face(materialName);
        for (; ;) {
            var word = sp.getWord();
            if (word == null) break;
            var subWords = word.split('/');
            if (subWords.length >= 1) face.vIndices.push(parseInt(subWords[0]) - 1);
            if (subWords.length >= 2 && subWords[1] !== "") face.tIndices.push(parseInt(subWords[1]) - 1);
            if (subWords.length >= 3) face.nIndices.push(parseInt(subWords[2]) - 1);
            else face.nIndices.push(-1);
        }

        var v0 = vertices[face.vIndices[0]];
        var v1 = vertices[face.vIndices[1]];
        var v2 = vertices[face.vIndices[2]];
        var normal = calcNormal([v0.x, v0.y, v0.z], [v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z]);
        if (reverse) normal = normal.map(n => -n);
        face.normal = { x: normal[0], y: normal[1], z: normal[2] };

        if (face.vIndices.length > 3) {
            var n = face.vIndices.length - 2;
            var newVIndices = [], newNIndices = [], newTIndices = [];
            for (var i = 0; i < n; i++) {
                newVIndices.push(face.vIndices[0], face.vIndices[i + 1], face.vIndices[i + 2]);
                newNIndices.push(face.nIndices[0], face.nIndices[i + 1], face.nIndices[i + 2]);
                if (face.tIndices.length > 0) newTIndices.push(face.tIndices[0], face.tIndices[i + 1], face.tIndices[i + 2]);
            }
            face.vIndices = newVIndices;
            face.nIndices = newNIndices;
            face.tIndices = newTIndices;
        }
        face.numIndices = face.vIndices.length;
        return face;
    }

    isMTLComplete() {
        return this.mtls.length == 0 || this.mtls.every(m => m.complete);
    }

    findMaterial(name) {
        for (let mtl of this.mtls) {
            for (let mat of mtl.materials) {
                if (mat.name == name) return mat;
            }
        }
        return null;
    }

    /**
     * Retorna um mapa de materiais para que o main.js saiba quais texturas carregar.
     */
    getMaterialsInfo() {
        const info = {};
        this.mtls.forEach(mtl => {
            mtl.materials.forEach(mat => {
                info[mat.name] = mat.map_Kd;
            });
        });
        return info;
    }

    /**
     * Agrupa a geometria por material (essencial para Saori e modelos complexos)
     */
    getDrawingInfoGrouped() {
        const groups = {};

        for (let object of this.objects) {
            for (let face of object.faces) {
                const mtlName = face.materialName;
                if (!groups[mtlName]) {
                    groups[mtlName] = { vertices: [], normals: [], texCoords: [], colors: [] };
                }

                const mat = this.findMaterial(mtlName);
                const color = mat ? mat.color : { r: 0.8, g: 0.8, b: 0.8, a: 1 };

                for (var i = 0; i < face.vIndices.length; i++) {
                    // Vértices
                    const v = this.vertices[face.vIndices[i]];
                    groups[mtlName].vertices.push(v.x, v.y, v.z);

                    // Normais
                    const nIdx = face.nIndices[i];
                    const n = nIdx >= 0 ? this.normals[nIdx] : face.normal;
                    groups[mtlName].normals.push(n.x, n.y, n.z);

                    // UVs
                    if (face.tIndices.length > i) {
                        const t = this.texCoords[face.tIndices[i]];
                        groups[mtlName].texCoords.push(t.u, 1.0 - t.v); // Flip V para WebGL
                    } else {
                        groups[mtlName].texCoords.push(0, 0);
                    }

                    // Cores (do MTL)
                    groups[mtlName].colors.push(color.r, color.g, color.b, color.a);
                }
            }
        }

        // Converte para TypedArrays
        for (let mtl in groups) {
            groups[mtl].vertices = new Float32Array(groups[mtl].vertices);
            groups[mtl].normals = new Float32Array(groups[mtl].normals);
            groups[mtl].colors = new Float32Array(groups[mtl].colors);
            groups[mtl].texCoords = new Float32Array(groups[mtl].texCoords);
        }
        return groups;
    }
}