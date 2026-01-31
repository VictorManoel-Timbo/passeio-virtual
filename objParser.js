import { StringParser } from "./stringParser.js";
import { calcNormal } from "./utils.js";

/**
 * Classes de Suporte para a Estrutura do Modelo
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
    }
}

/**
 * Classe Principal OBJDoc para processamento do ficheiro .obj
 */
export class OBJDoc {
    constructor(fileName) {
        this.fileName = fileName;
        this.mtls = [];
        this.objects = [];
        this.vertices = [];
        this.normals = [];
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
        var index = 0, line, name = "";
        var sp = new StringParser();

        while ((line = lines[index++]) != null) {
            sp.init(line);
            var command = sp.getWord();
            if (command == null) continue;

            switch (command) {
                case 'newmtl':
                    name = sp.getWord();
                    continue;
                case 'Kd':
                    if (name == "") continue;
                    mtl.materials.push(new Material(name, sp.getFloat(), sp.getFloat(), sp.getFloat(), 1));
                    name = "";
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
            if (subWords.length >= 3) face.nIndices.push(parseInt(subWords[2]) - 1);
            else face.nIndices.push(-1);
        }

        // Cálculo da normal da face para iluminação
        var v0 = vertices[face.vIndices[0]];
        var v1 = vertices[face.vIndices[1]];
        var v2 = vertices[face.vIndices[2]];
        var normal = calcNormal([v0.x, v0.y, v0.z], [v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z]);

        if (reverse) {
            normal = normal.map(n => -n);
        }
        face.normal = { x: normal[0], y: normal[1], z: normal[2] };

        // Triangulação manual para polígonos com mais de 3 vértices
        if (face.vIndices.length > 3) {
            var n = face.vIndices.length - 2;
            var newVIndices = [], newNIndices = [];
            for (var i = 0; i < n; i++) {
                newVIndices.push(face.vIndices[0], face.vIndices[i + 1], face.vIndices[i + 2]);
                newNIndices.push(face.nIndices[0], face.nIndices[i + 1], face.nIndices[i + 2]);
            }
            face.vIndices = newVIndices;
            face.nIndices = newNIndices;
        }
        face.numIndices = face.vIndices.length;
        return face;
    }

    isMTLComplete() {
        return this.mtls.length == 0 || this.mtls.every(m => m.complete);
    }

    findColor(name) {
        for (let mtl of this.mtls) {
            for (let mat of mtl.materials) {
                if (mat.name == name) return mat.color;
            }
        }
        return { r: 0.8, g: 0.8, b: 0.8, a: 1 };
    }

    /**
     * Organiza os dados para os Buffers do WebGL
     */
    getDrawingInfo() {
        var numIndices = this.objects.reduce((acc, obj) => acc + obj.numIndices, 0);
        var vertices = new Float32Array(numIndices * 3);
        var normals = new Float32Array(numIndices * 3);
        var colors = new Float32Array(numIndices * 4);
        var indices = new Uint16Array(numIndices);

        var index_indices = 0;
        for (let object of this.objects) {
            for (let face of object.faces) {
                var color = this.findColor(face.materialName);
                for (var k = 0; k < face.vIndices.length; k++) {
                    indices[index_indices] = index_indices;
                    var v = this.vertices[face.vIndices[k]];
                    vertices[index_indices * 3 + 0] = v.x;
                    vertices[index_indices * 3 + 1] = v.y;
                    vertices[index_indices * 3 + 2] = v.z;

                    colors[index_indices * 4 + 0] = color.r;
                    colors[index_indices * 4 + 1] = color.g;
                    colors[index_indices * 4 + 2] = color.b;
                    colors[index_indices * 4 + 3] = color.a;

                    var nIdx = face.nIndices[k];
                    var n = nIdx >= 0 ? this.normals[nIdx] : face.normal;
                    normals[index_indices * 3 + 0] = n.x;
                    normals[index_indices * 3 + 1] = n.y;
                    normals[index_indices * 3 + 2] = n.z;
                    index_indices++;
                }
            }
        }
        return { vertices, normals, colors, indices };
    }
}