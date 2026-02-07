export class HUD {
    constructor() {
        this.hudElement = document.getElementById('hud-content');
        this.descriptionElement = document.getElementById('hud-description');
        this.imageElement = document.getElementById('hud-image');
        this.textElement = document.getElementById('hud-text');
        this.maxDistance = 35; // Distância máxima para mostrar HUD
        this.currentFrame = null;
        this.frameData = {
            // Quadros da parede traseira (lado negativo Z)
            frame_back_1: { 
                text: "P. Traseira: Constelação de Aquário",
                description: "Uma das 12 constelações do zodíaco. Aquário é representado pelo Portador de Água e é visível no hemisfério celeste norte.",
                image: "./assets/images/aquario"
            },
            frame_back_2: { 
                text: "P. Traseira: Constelação de Áries",
                description: "Constelação do zodíaco que marca a primavera no hemisfério norte. Conhecida por seus astros brilhantes e mitologia grega fascinante.",
                image: "./assets/images/aries"
            },
            frame_back_3: { 
                text: "P. Traseira: Constelação de Câncer",
                description: "A constelação mais fraca do zodíaco. Câncer contém o aglomerado de estrelas Messier 44, visível a olho nu em noites claras.",
                image: "./assets/images/cancer"
            },
            frame_back_4: { 
                text: "P. Traseira: Constelação de Capricórnio",
                description: "Constelação do zodíaco que marca o solstício de inverno no hemisfério norte. Representa a metade inferior do caminho do sol.",
                image: "./assets/images/capricornio"
            },

            // Quadros da parede frontal direita (lado positivo X)
            frame_front_right_1: { 
                text: "P. Direita: Constelação de Escorpião",
                description: "Uma das constelações mais reconhecíveis, Escorpião é dominada pela estrela avermelhada Antares, o coração do escorpião.",
                image: "./assets/images/escorpiao"
            },
            frame_front_right_2: { 
                text: "P. Direita: Constelação de Gêmeos",
                description: "Constelação do zodíaco caracterizada pelos gêmeos Castor e Pólux. Geralmente visível no céu de inverno do hemisfério norte.",
                image: "./assets/images/gemeos"
            },
            frame_front_right_3: { 
                text: "P. Direita: Constelação de Leão",
                description: "Uma das constelações mais luminosas do zodíaco. Leão contém a estrela brilhante Régulo e é facilmente identificável na primavera.",
                image: "./assets/images/leao"
            },

            // Quadros da parede frontal esquerda (lado negativo X)
            frame_front_left_1: { 
                text: "P. Esquerda: Constelação de Libra",
                description: "A única constelação zodiacal que representa um objeto inanimado - a balança. Libra é símbolo de equilíbrio e justiça.",
                image: "./assets/images/libra"
            },
            frame_front_left_2: { 
                text: "P. Esquerda: Constelação de Peixes",
                description: "Constelação do zodíaco que marca a primavera no hemisfério sul. Peixes é frequentemente representado por dois peixes ligados.",
                image: "./assets/images/peixes"
            },
            frame_front_left_3: { 
                text: "P. Esquerda: Constelação de Sagitário",
                description: "Constelação do zodíaco que representa o arqueiro centauro. Sagitário contém muitos objetos do espaço profundo interessantes.",
                image: "./assets/images/sagitario"
            },

            // Quadros da entrada do corredor
            frame_corridor_left: { 
                text: "Entrada: Constelação de Virgem",
                description: "Constelação do zodíaco que representa a deusa da justiça. Contém a estrela Spica e é a maior constelação do zodíaco.",
                image: "./assets/images/virgem"
            },
            frame_corridor_right: { 
                text: "Entrada: Constelação de Touro",
                description: "Constelação do zodíaco representada por um touro. Contém a estrela brilhante Aldebarã e o aglomerado Plêiades.",
                image: "./assets/images/touro"
            },
        };
    }

    // Calcula distância entre player e um ponto
    calculateDistance(playerPos, framePos) {
        const dx = playerPos[0] - framePos[0];
        const dz = playerPos[2] - framePos[2];
        return Math.sqrt(dx * dx + dz * dz);
    }

    // Atualiza o HUD baseado na proximidade dos quadros
    update(playerPos, framePositions) {
        let closestFrame = null;
        let closestDistance = this.maxDistance;

        // Verifica qual quadro está mais perto
        for (const [frameId, framePos] of Object.entries(framePositions)) {
            const distance = this.calculateDistance(playerPos, framePos);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestFrame = frameId;
            }
        }

        // Atualiza o HUD se mudou de quadro
        if (closestFrame !== this.currentFrame) {
            this.currentFrame = closestFrame;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        if (!this.hudElement || !this.descriptionElement || !this.imageElement || !this.textElement) return;

        if (this.currentFrame && this.frameData[this.currentFrame]) {
            const frameInfo = this.frameData[this.currentFrame];
            this.hudElement.textContent = frameInfo.text;
            this.textElement.textContent = frameInfo.description;
            
            // Carrega imagem com fallback WebP -> PNG
            this.loadImageWithFallback(frameInfo.image);
            
            this.hudElement.style.opacity = '1';
            this.descriptionElement.style.opacity = '1';
        } else {
            this.hudElement.style.opacity = '0';
            this.descriptionElement.style.opacity = '0';
            this.imageElement.style.opacity = '0';
        }
    }

    async loadImageWithFallback(basePath) {
        // Remove extensão se existir
        const pathWithoutExt = basePath.replace(/\.(webp|png)$/i, '');
        
        // Tenta WebP primeiro (mais eficiente)
        const webpPath = `${pathWithoutExt}.webp`;
        const pngPath = `${pathWithoutExt}.png`;
        
        try {
            // Tenta carregar WebP
            const webpResponse = await fetch(webpPath, { method: 'HEAD' });
            if (webpResponse.ok) {
                this.imageElement.src = webpPath;
                this.imageElement.style.opacity = '1';
                return;
            }
        } catch (e) {
            // WebP não encontrado, continua para PNG
        }
        
        try {
            // Fallback para PNG
            const pngResponse = await fetch(pngPath, { method: 'HEAD' });
            if (pngResponse.ok) {
                this.imageElement.src = pngPath;
                this.imageElement.style.opacity = '1';
                return;
            }
        } catch (e) {
            // PNG também não encontrado
        }
        
        // Se nenhuma imagem foi encontrada, oculta
        this.imageElement.style.opacity = '0';
        console.warn(`Nenhuma imagem encontrada para ${basePath} (WebP ou PNG)`);
    }

    // Método para adicionar ou atualizar informações de um quadro
    setFrameText(frameId, text) {
        if (!this.frameData[frameId]) {
            this.frameData[frameId] = {};
        }
        this.frameData[frameId].text = text;
    }

    hide() {
        if (this.hudElement) {
            this.hudElement.style.opacity = '0';
        }
        if (this.descriptionElement) {
            this.descriptionElement.style.opacity = '0';
        }
        if (this.imageElement) {
            this.imageElement.style.opacity = '0';
        }
        this.currentFrame = null;
    }
}
