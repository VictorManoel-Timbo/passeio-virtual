// stringParser.js

export class StringParser {
    constructor(str) {
        this.str = str;
        this.index = 0;
    }

    init(str) {
        this.str = str;
        this.index = 0;
    }

    skipDelimiters() {
        for (var i = this.index, len = this.str.length; i < len; i++) {
            var c = this.str.charAt(i);
            // Pula TAB, Espaço, Aspas e Parênteses
            if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') continue;
            break;
        }
        this.index = i;
    }

    getWord() {
        this.skipDelimiters();
        var start = this.index;
        for (var i = this.index, len = this.str.length; i < len; i++) {
            var c = this.str.charAt(i);
            if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') break;
        }
        this.index = i;
        if (start == i) return null;
        return this.str.substring(start, i);
    }

    getFloat() {
        return parseFloat(this.getWord());
    }

    getInt() {
        return parseInt(this.getWord());
    }
}