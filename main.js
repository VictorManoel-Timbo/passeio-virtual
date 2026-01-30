main();

//
// começa aqui
//
function main() {
  const canvas = document.querySelector("#glCanvas");
  // Inicializa o contexto GL
  const gl = canvas.getContext("webgl");

  // Só continua se o WebGL estiver disponível e funcionando
  if (!gl) {
    alert(
      "Incapaz de inicializar o WebGL.Seu navegador ou sua máquina não suporta.",
    );
    return;
  }

  // Define a cor para preto totalmente opaca (sem transparência)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Limpa o buffer de cores com uma cor específica
  gl.clear(gl.COLOR_BUFFER_BIT);
}