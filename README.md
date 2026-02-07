# Exposição do Zodíaco — Passeio Virtual 3D

**Descrição**

Este projeto é uma aplicação gráfica interativa desenvolvida em **WebGL** puro (sem bibliotecas de alto nível como Three.js), simulando um passeio virtual inspirado em cavaleiros do zodíaco. O usuário explora um ambiente 3D arquitetônico para visualizar e aprender sobre as 12 constelações do zodíaco. O motor implementa um pipeline gráfico completo, incluindo *parsing* de modelos OBJ/MTL, iluminação Phong (Spotlight e Point Lights), câmera em primeira pessoa e sistema de colisão com física de deslizamento.

---

## Recursos Principais

- **Motor Gráfico Próprio:** Implementação manual de shaders, buffers e matrizes de transformação.
- **Carregador de Modelos (OBJ/MTL):** Parser customizado para carregar geometria complexa e materiais (ex: personagem Saori, Sol).
- **Sistema de Iluminação Híbrido:**
    - *Luz Pontual (Sol):* Orbita o centro da cena com animação contínua.
    - *Spotlight (Teto):* Iluminação cônica fixa simulando luzes de galeria.
    - *Modelo de Phong:* Cálculos de componente ambiente, difusa e especular (brilho) nos shaders.
- **Física e Colisão:** Sistema AABB (*Axis-Aligned Bounding Box*) com resposta de deslizamento (*wall sliding*), impedindo que a câmera atravesse paredes ou objetos.
- **HUD Dinâmico:** Interface que detecta proximidade com obras de arte e exibe informações e imagens correspondentes via manipulação do DOM.
- **Geometria Procedural:** Geração via código de primitivas como Cubos, Esferas, Cilindros e Domos.

---

## Requisitos

- Navegador moderno com suporte a **WebGL**.
- Servidor local (devido às políticas de CORS para carregar texturas e modelos).

## Instalação e Execução

Como o projeto carrega arquivos locais (`.obj`, `.mtl`, `.png`, `.json`), é necessário rodar um servidor HTTP simples.

### Passo a Passo:

1.  **Clone o repositório** para sua máquina local.
2.  **Abra o terminal** na pasta raiz do projeto.
3.  **Inicie um servidor local** usando uma das opções abaixo:

    * **Python 3:** `python -m http.server 8000`
    * **Node.js (http-server):** `npx http-server .`
    * **VS Code (Live Server):** Clique com o botão direito no `index.html` e selecione "Open with Live Server".

4.  **Acesse o navegador** no endereço: `http://localhost:8000` (ou a porta indicada pelo seu servidor).

---

## Links do Projeto

* **Apresentação de Slides:** [Link para os Slides do Projeto](https://docs.google.com/presentation/d/1VEQSREYNiV7vHvvsuZwyPIydOGYoO0kH3rtbJiBH5fE/edit?usp=sharing)
* **Vídeo de Demonstração:** [Assista ao vídeo de execução no YouTube](https://youtu.be/eatv13TirXg?si=fjXqdabBRUSJKu_O)

---

## Controles

- **W / S:** Mover para frente e para trás.
- **A / D:** Girar a câmera para esquerda e direita(Yaw).
- **Setas cima / baixo:** Olhar para cima e para baixo(Pitch).
- **Interação com a tela:** Inicia a trilha sonora.

---

## Estrutura de Arquivos e Responsabilidades

**Núcleo (Engine)**
- `main.js`: Ponto de entrada. Gerencia o loop de renderização (requestAnimationFrame), inicializa o contexto WebGL, compila shaders e orquestra a atualização da lógica e desenho.
- `camera.js`: Implementa a câmera em primeira pessoa. Gerencia as matrizes de View e Projection, calcula vetores de direção baseados em ângulos de Euler e processa input de teclado.
- `mesh.js`: Abstração dos Vertex Buffer Objects (VBOs). Envia vértices, normais e coordenadas de textura para a GPU e executa os comandos de desenho (gl.drawArrays).
- `transform.js`: Biblioteca matemática para operações matriciais 4x4 (Translação, Rotação, Escala, Perspectiva, LookAt e Inversa) sem dependências externas.
- `texture.js`: Gerencia o carregamento assíncrono de imagens e configuração de parâmetros de textura WebGL (CLAMP_TO_EDGE, LINEAR).
- `light.js`: Define as estruturas de dados para luzes (Posição, Cor, Direção, Cutoff) e atualiza a lógica de órbita da luz pontual.

**Conteúdo e Lógica**
- `scenario.js`: Constrói o grafo da cena. Posiciona paredes, chão, teto e instancia os objetos carregados. Define também as caixas de colisão (colliders) do ambiente.
- `objParser.js / stringParser.js`: Lê e processa arquivos `.obj` (vértices, faces) e `.mtl` (materiais), convertendo texto bruto em arrays tipados para o WebGL.
- `geometry.js`: Fábrica de formas primitivas. Gera arrays de vértices e normais para Planos, Cubos, Esferas e Cilindros.
- `hud.js`: Lógica da interface 2D (HTML/CSS). Calcula a distância entre o jogador e os quadros para exibir o conteúdo correto.
- `utils.js`: Funções auxiliares, como cálculo manual de vetores normais e carregamento de arquivos de texto.

**Shaders**
- `vertex.glsl`: Calcula a posição final dos vértices (gl_Position) e transforma normais para o espaço do mundo.
- `fragment.glsl`: Implementa o cálculo de cor por pixel, texturização e a lógica de iluminação (interação luz-material).

---

## Como o Motor Funciona

O motor opera em um ciclo contínuo de atualização e renderização. A cada quadro:

1.  **Input e Câmera:** O `main.js` captura as teclas, atualiza a posição da câmera em `camera.js` e recalcula a matriz `ViewProjection`.
2.  **Física:** Antes de mover a câmera definitivamente, o sistema verifica colisões no `scenario.js`. Se a nova posição intersecta uma *Bounding Box* no eixo X ou Z, o movimento é cancelado naquele eixo específico, permitindo o deslizamento.
3.  **Lógica de Cena:** As luzes são atualizadas (o Sol gira) e o `hud.js` verifica se o jogador está perto de um quadro (Raycasting simplificado por distância euclidiana).
4.  **Renderização:**
    * O programa WebGL é ativado.
    * As luzes e a posição da câmera são enviadas como *uniforms* para os shaders.
    * O `scenario.js` percorre a lista de elementos. Para cada objeto, calcula-se a matriz `Model` (Mundo) e combina com a `ViewProjection` (Câmera).
    * O `mesh.js` ativa os buffers e texturas e comanda a GPU para desenhar os triângulos.

---

## Métodos

**App (Main)**
* `constructor()`: Inicializa o contexto WebGL, configura o áudio de fundo, instancia a câmera e o HUD, e define os eventos de entrada iniciais.
* `loadModel(url)`: Carrega e analisa um arquivo OBJ isolado, aguardando o processamento dos materiais (MTL) antes de retornar as informações de desenho.
* `loadAllTextures(url)`: Lê um arquivo JSON de configuração e carrega assincronamente todas as texturas listadas nele para a GPU
* `init()`: Configura o WebGL (`enable DEPTH_TEST`, `CULL_FACE`), compila os shaders e carrega os assets assincronamente.
* `setupGraphics()`: Carrega os arquivos de shader (`vertex` e `fragment`), cria o programa WebGL, mapeia as variáveis (locations) e ativa testes de profundidade e culling.
* `loadModelsFromConfig(jsonPath)`: Lê um arquivo JSON contendo a lista de modelos a serem carregados e itera sobre eles chamando o processamento individual.
* `processModel(modelCfg)`: Carrega a geometria e texturas de um modelo específico e calcula sua caixa de colisão (`bounds`) para uso na física.
* `calculateBoundingBox(drawingInfo)`: Analisa a geometria carregada de um OBJ e determina os limites mínimos e máximos (minX, maxX, etc.) para criar o colisor automaticamente.
* `resolveModelTextures(materialsMap, folderPath)`: Mapeia os materiais definidos no arquivo OBJ para os objetos de textura carregados, garantindo que não haja duplicação no carregamento.
* `onEvent()`: Configura os "listeners" do navegador para capturar entradas do teclado (movimentação) e cliques do mouse (início do áudio).
* `createProgram(vs, fs)`: Compila os shaders de vértice e fragmento e os linka para criar o programa executável na GPU.
* `_compileShader(type, source)`: Função auxiliar que compila um shader individualmente e verifica se houve erros de compilação.
* `getLocations()`: Obtém e armazena as referências de memória para todos os atributos e uniforms (matrizes, luzes, texturas) usados nos shaders.
* `onLoop(deltaTime)`: Atualiza a câmera, processa a colisão separada por eixos (X e Z) e atualiza o HUD.
* `render()`: Limpa os buffers de cor e profundidade, envia a posição da câmera para os shaders e comanda o desenho do cenário.
* `cleanup()`: Realiza a limpeza de recursos, cancelando o loop de animação, deletando o programa shader e removendo eventos.
* `start(now)`: Gerencia o loop principal de animação (`requestAnimationFrame`), calcula o tempo decorrido (`deltaTime`) e chama as funções de atualização e renderização. para criar o colisor automaticamente.

**Scenario**
* `constructor(gl, loadedModels, globalTextures)`: Inicializa a cena, configurando os arrays de elementos, entidades e colisores, além de disparar os métodos de configuração de materiais, luzes, arquitetura e física.
* `_initSettings()`: Define as constantes de escala do ambiente (tamanho da sala, altura das paredes, cores) e calcula variáveis auxiliares de posicionamento.
* `_setupMaterials(gl)`: Cria uma textura branca sólida de 1x1 pixel para ser usada como fallback em objetos que não possuem texturas externas, garantindo o funcionamento do shader de iluminação.
* `_setupLights()`: Instancia e configura as luzes da cena, incluindo um spotlight no teto e uma luz pontual móvel.
* `_initEntities()`: Configura os modelos 3D carregados (como o sol, a porta e a estátua), aplicando transformações de escala/translação e calculando suas caixas de colisão no espaço do mundo.
* `_setupColliders()`: Define manualmente as caixas delimitadoras (Bounding Boxes) para todas as paredes e pilares da sala principal e do corredor para o sistema de física.
* `checkCollision(x, z, radius)`: Percorre a lista de *colliders*. Retorna `true` se as coordenadas (x, z) do jogador, somadas a um raio de margem, entrarem em qualquer caixa delimitadora.
* `_buildArchitecture(gl)`: Método mestre que orquestra a construção procedural da exposição, instanciando pilares, quadros e chamando a criação das galerias e estruturas adicionais.
* `_placeGallery(gl, meshPillar, meshFrame, getTex, count, isLongWall, side)`: Posiciona logicamente uma fileira de pilares e quadros em uma parede específica, registrando as coordenadas de cada quadro no dicionário `framePositions` para interação com o HUD.
* `_addStructureElements(gl, corridorZCenter, getTex)`: Adiciona manualmente os elementos estáticos restantes, como os tetos, pisos e as paredes do corredor e da entrada.
* `update(deltaTime)`: Atualiza a lógica da cena a cada quadro, como a órbita da luz móvel e o acompanhamento visual do modelo do sol em relação à posição da luz.
* `draw(gl, locations, viewProjMatrix)`: Orquestra o desenho. Vincula as luzes globais e itera sobre entidades estáticas e dinâmicas chamando seus métodos de desenho.

**OBJDoc (Parser)**

* `constructor(fileName)`: Inicializa a instância do parser com o nome do arquivo e prepara os arrays internos para armazenar objetos, materiais, vértices, normais e coordenadas UV.
* `parse(fileString, scale, reverse)`: O ponto de entrada principal. Itera por cada linha do arquivo OBJ, identificando comandos como vértices (`v`), normais (`vn`), UVs (`vt`), faces (`f`) e definições de bibliotecas de materiais (`mtllib`).
* `parseMtllib(sp, fileName)`: Extrai o caminho do arquivo `.mtl` mencionado no OBJ, garantindo que o caminho seja relativo ao diretório do modelo.
* `loadMTL(path)`: Realiza a requisição assíncrona (fetch) do arquivo de material e inicia o processamento de suas propriedades.
* `onReadMTLFile(fileString, mtl)`: Analisa o conteúdo do arquivo MTL para capturar nomes de materiais, cores difusas (`Kd`) e caminhos de texturas (`map_Kd`).
* `parseFace(sp, materialName, vertices, reverse)`: Extrai os índices de uma face, realiza a triangulação automática para polígonos complexos e calcula a normal da face via produto vetorial.
* `isMTLComplete()`: Verifica se todos os materiais associados ao modelo foram carregados e processados com sucesso.
* `findMaterial(name)`: Busca um material específico pelo nome dentro das bibliotecas de materiais carregadas.
* `getMaterialsInfo()`: Retorna um mapeamento simplificado relacionando cada material ao seu respectivo arquivo de imagem de textura.
* `getDrawingInfoGrouped()`: Organiza toda a geometria do modelo em grupos baseados em materiais. Converte os dados brutos em `Float32Array`, facilitando o envio direto para os buffers da GPU.

**StringParser**

* `constructor(str)`: Cria o parser de strings inicializando o ponteiro de leitura na posição zero.
* `init(str)`: Reinicia o estado do parser para processar uma nova linha ou sequência de texto.
* `skipDelimiters()`: Avança o índice interno saltando espaços em branco, tabulações e aspas, parando no próximo caractere válido.
* `getWord()`: Captura e retorna a próxima sequência de caracteres (palavra) delimitada por espaços.
* `getFloat()`: Utiliza o `getWord` para extrair um valor e convertê-lo em número de ponto flutuante.
* `getInt()`: Utiliza o `getWord` para extrair um valor e convertê-lo em um número inteiro.

**Utils**

* `calcNormal(p0, p1, p2)`: Realiza o cálculo do produto vetorial entre dois vetores formados por três pontos para determinar a direção da face (Normal). O resultado é normalizado para ter comprimento 1.
* `loadTextFile(url)`: Função utilitária assíncrona que encapsula o `fetch` para carregar arquivos externos (como shaders ou modelos) e retornar seu conteúdo como texto puro.

**Transform (Math)**
* `lookAt(eye, center, up)`: Constrói a matriz de visualização da câmera, definindo a posição do observador e para onde ele está olhando no espaço 3D.
* `identity()`: Gera uma matriz neutra (Diagonal de 1s), usada como base para novas transformações.
* `multiplyMatrices(a, b)`: Multiplicação manual de matrizes 4x4, permitindo combinar translação, rotação e escala na matriz de modelo final.
* `perspective(fovDeg, aspect, near, far)`: Cria a matriz de projeção que define o campo de visão (FOV) e a profundidade, criando a ilusão de perspectiva.
* `translate(m, x, y, z)`: Aplica um deslocamento linear nos eixos X, Y ou Z.
* `rotateX/Y/Z(a)`: Aplica rotações em torno dos eixos principais usando funções trigonométricas (seno e cosseno).
* `inverse(m)`: Calcula a matriz inversa através de cofatores. Fundamental para transformar coordenadas de luz e visualização.
* `getNormalMatrix(modelMatrix)`: Gera a matriz específica para transformar vetores normais (Transposta da Inversa), garantindo que a iluminação permaneça correta mesmo se o objeto for escalonado.

**Geometry (Primitive Generation)**
* `createPlane(width, depth, color)`: Gera a geometria de um plano horizontal no eixo XZ. É ideal para construir o chão e o teto da galeria. Retorna 6 vértices (2 triângulos) com as normais apontando para cima (+Y).
* `createBox(width, height, depth, color)`: Cria um paralelepípedo (caixa 3D). Define 36 vértices para cobrir as 6 faces, calculando normais específicas para cada face para garantir que a iluminação reaja corretamente às superfícies planas.
* `createSphere(radius, segments, color)`: Gera uma esfera completa utilizando coordenadas polares. Calcula a posição de cada vértice em uma grade de latitude e longitude e os conecta em triângulos. As normais apontam para fora, partindo do centro.
* `createCylinder(radius, height, segments, color)`: Constrói um cilindro composto por três partes: o corpo lateral (formado por retângulos triangulados), a tampa superior e a tampa inferior. O parâmetro `segments` define o quão arredondada será a borda.
* `createDome(radius, segments, color)`: Cria uma semiesfera (domo). Diferente da esfera comum, este método inverte a ordem dos índices e a direção das normais, que apontam para o interior. Isso é utilizado para criar o efeito de "céu" ou teto curvo onde o jogador está dentro da geometria.

**Texture**
* `constructor(gl, url)`: Cria um novo objeto de textura WebGL. Inicializa o carregamento assíncrono da imagem a partir da URL fornecida e define o estado de carregamento como falso (`isLoaded = false`) até que os dados estejam prontos para a GPU.
* `updateGPU()`: Envia os dados da imagem carregada para a memória da GPU. Configura os parâmetros de amostragem (filtros LINEAR) e define o comportamento de borda como `CLAMP_TO_EDGE` para garantir compatibilidade com texturas que não possuem dimensões potência de dois.
* `bind(unit)`: Ativa a unidade de textura específica e vincula o objeto de textura atual para que o Shader possa acessá-lo durante o desenho.

**Mesh**
* `constructor(gl, groupedDrawingInfo)`: Organiza o modelo 3D em "Sub-Meshes". Para cada material do objeto, ele cria buffers de GPU específicos para vértices, normais, cores e coordenadas de textura.
* `_createBuffer(type, data)`: Método utilitário interno que cria, vincula e envia dados brutos para os buffers da GPU (`gl.ARRAY_BUFFER`).
* `draw(gl, locations, viewProjMatrix, modelMatrix, textureDict)`: O coração da renderização do objeto. Calcula a matriz MVP e a Matriz de Normal, percorre todas as sub-meshes, vincula as texturas correspondentes e executa o comando `gl.drawArrays`.
* `_bindAttribute(location, buffer, size)`: Conecta um buffer da GPU a um atributo específico do Shader (como `a_Position`), definindo como os dados devem ser interpretados (tamanho e tipo).

**Light**
* `constructor(type)`: Inicializa as propriedades da fonte de luz, suportando tipos como "point" (luz pontual) ou "spot" (lanterna/foco direcionado).
* `updateOrbit(deltaTime, radius, speed, height)`: Calcula o movimento circular da luz no tempo, permitindo que objetos como o "Sol" orbitem o cenário automaticamente.
* `bind(gl, locations, prefix)`: Envia as propriedades da luz (posição, cor, direção e ângulo de corte) para as variáveis uniformes do Shader correspondente.

**Camera**
* `constructor(gl, fov, near, far)`: Inicializa a câmara definindo a sua posição inicial, orientação (Yaw e Pitch) e as configurações de projeção (Campo de Visão, plano de corte próximo e distante). Invoca imediatamente o cálculo das matrizes iniciais.
* `updateMatrices()`: Calcula a matriz de Projeção (baseada no FOV) e a matriz de Visualização. Utiliza ângulos de *Yaw* (giro horizontal) e *Pitch* (giro vertical) para determinar o vetor de direção para onde o observador está olhando.
* `update(deltaTime, keys)`: Gerencia a entrada do usuário. Atualiza a posição $[x, z]$ para movimentação (W, S) e os ângulos de rotação para o controle de visão, garantindo que o movimento seja suave e independente da taxa de quadros (FPS).

**HUD**
* `constructor()`: Inicializa as referências aos elementos do HTML (títulos, descrições e imagens), define a distância de interação (`maxDistance`) e armazena o dicionário `frameData` com as informações históricas e mitológicas das constelações.
* `calculateDistance(playerPos, framePos)`: Realiza o cálculo matemático da distância Euclidiana no plano $XZ$ entre a posição atual do jogador e as coordenadas de um quadro.
* `update(playerPos, framePositions)`: Itera sobre todos os quadros da galeria para identificar qual deles é o mais próximo do jogador. Se o quadro estiver dentro do raio de alcance e for diferente do quadro visualizado anteriormente, dispara a atualização da interface.
* `updateDisplay()`: Altera dinamicamente o conteúdo dos elementos DOM (texto e descrição) e gerencia as transições de opacidade (fade-in/fade-out) da interface conforme o jogador entra ou sai do raio de interação.
* `loadImageWithFallback(basePath)`: Tenta carregar a imagem da constelação de forma assíncrona. Prioriza o formato `.webp` por ser mais leve e utiliza `.png` como fallback caso o navegador ou o servidor não suporte o primeiro formato.
* `setFrameText(frameId, text)`: Método utilitário que permite modificar ou injetar novos textos em um quadro específico em tempo de execução.
* `hide()`: Reseta o estado do HUD e oculta todos os elementos visuais, garantindo que a tela fique limpa quando o jogador não estiver próximo a nenhuma obra.

---

## Vídeo de Demonstração

*(Insira aqui o link para o vídeo do projeto, caso possua)*
