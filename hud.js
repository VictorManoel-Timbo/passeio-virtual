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
                description: "Camus de Aquário Busca o Zero Absoluto com a Execução Aurora, pregando a frieza emocional para dominar o cosmo. A constelação é Ganimedes, o copeiro do Olimpo. Aquarianos são independentes, intelectuais e rebeldes, parecendo distantes para preservar sua visão lógica do mundo.",
                image: "./assets/images/aquario"
            },
            frame_back_2: { 
                text: "P. Traseira: Constelação de Áries",
                description: "Mu de Áries Mestre da telecinese e reparador de armaduras, usa a Extinção Estelar para equilibrar defesa e ataque. A constelação remete ao Carneiro de Ouro buscado pelos Argonautas. Arianos são líderes natos e impulsivos, refletindo a iniciativa de Mu como guardião da primeira casa.",
                image: "./assets/images/aries"
            },
            frame_back_3: { 
                text: "P. Traseira: Constelação de Câncer",
                description: "Máscara da Morte de Câncer Envia almas ao inferno com as Ondas do Inferno (Sekishiki).\
                 A constelação é o caranguejo gigante que distraiu Hércules em uma de suas tarefas. Cancerianos são \
                protetores com os seus, mas guardam rancor profundo e agem com autodefesa intensa quando feridos.",
                image: "./assets/images/cancer"
            },
            frame_back_4: { 
                text: "P. Traseira: Constelação de Capricórnio",
                description: "Shura de Capricórnio Possui a Excalibur nos braços, cortando qualquer matéria com lealdade absoluta. A constelação remete à cabra Amalteia, que amamentou Zeus. Capricornianos são a essência da disciplina e ambição, focados em alcançar o topo através do trabalho duro e responsabilidade.",
                image: "./assets/images/capricornio"
            },

            // Quadros da parede frontal direita (lado positivo X)
            frame_front_right_1: { 
                text: "P. Direita: Constelação de Escorpião",
                description: "Milo de Escorpião Ataca o sistema nervoso com a Agulha Escarlate.\
                 Na mitologia, o Escorpião matou o caçador Órion, por isso as constelações\
                 nunca aparecem juntas no céu. Escorpianos são intensos e misteriosos, com um instinto de vingança implacável e forte regeneração emocional.",
                image: "./assets/images/escorpiao"
            },
            frame_front_right_2: { 
                text: "P. Direita: Constelação de Gêmeos",
                description: "Saga de Gêmeos Possui poder cataclísmico com a Explosão Galáctica, sofrendo\
                 de dupla personalidade. A constelação honra os irmãos inseparáveis Castor e Pólux. Geminianos\
                 são marcados pela dualidade e adaptação rápida, mudando de humor como as faces da máscara de Saga.",
                image: "./assets/images/gemeos"
            },
            frame_front_right_3: { 
                text: "P. Direita: Constelação de Leão",
                description: "Aiolia de Leão Usa a velocidade da luz no\
                 Relâmpago de Plasma, representando a justiça direta. A constelação é o Leão de Nemeia,\
                 fera de pele impenetrável. Leoninos possuem magnetismo, orgulho e agem com o coração,\
                 buscando reconhecimento constante, assim como Aiolia busca honra.",
                image: "./assets/images/leao"
            },

            // Quadros da parede frontal esquerda (lado negativo X)
            frame_front_left_1: { 
                text: "P. Esquerda: Constelação de Libra",
                description: "Dohko de Libra O Mestre Ancião guarda as armas de ouro e usa a Cólera dos 100 Dragões. \
                Libra é a única constelação do zodíaco representada\
                 por um objeto inanimado (a balança). Librianos buscam harmonia e diplomacia acima de tudo, pesando decisões cuidadosamente como um juiz.",
                image: "./assets/images/libra"
            },
            frame_front_left_2: { 
                text: "P. Esquerda: Constelação de Peixes",
                description: "Afrodite de Peixes Usa rosas letais para lutar, acreditando que a força define a justiça. A constelação representa a deusa Afrodite e Eros fugindo transformados em peixes atados por uma corda. Piscianos são sensíveis e intuitivos, vivendo em um mundo de sonhos que contrasta com o pragmatismo deste cavaleiro.",
                image: "./assets/images/peixes"
            },
            frame_front_left_3: { 
                text: "P. Esquerda: Constelação de Sagitário",
                description: "Aiolos de Sagitário O herói que salvou Atena guia os cavaleiros com seu Trovão Atômico mesmo após a morte. A constelação é o sábio centauro Quíron, tutor de heróis. Sagitarianos valorizam a liberdade, a verdade e o otimismo, mirando sempre no futuro como a flecha de Aiolos.",
                image: "./assets/images/sagitario"
            },

            // Quadros da entrada do corredor
            frame_corridor_left: { 
                text: "Entrada: Constelação de Virgem",
                description: "Shaka de Virgem O \"homem mais próximo de Deus\", remove os sentidos com o Tesouro do Céu. \
                A constelação liga-se a Astreia, a deusa da pureza e justiça. \
                Virginianos são analíticos e buscam a perfeição, muitas vezes parecendo frios ou críticos devido ao alto padrão de exigência.",
                image: "./assets/images/virgem"
            },
            frame_corridor_right: { 
                text: "Entrada: Constelação de Touro",
                description: "Aldebaran de Touro \
                 Une força colossal e velocidade no Grande Chifre.\
                  A estrela principal da constelação, Aldebaran, \
                  é uma gigante laranja chamada \"Olho do Touro\". Taurinos são famosos pela teimosia e \
                  lealdade protetora, características que definem a postura inabalável deste cavaleiro.",
                image: "./assets/images/touro"
            },
            saori:{
                text: "Saori: Deusa da Justiça",
                description: "Saori Kido é a reencarnação da deusa grega Atena, protetora da Terra e líder dos Cavaleiros do Zodíaco.",
                image: "./assets/images/saori"
            }
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
