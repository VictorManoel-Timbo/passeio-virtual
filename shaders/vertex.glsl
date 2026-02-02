attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec4 a_Color;

uniform mat4 u_MvpMatrix;
uniform mat4 u_NormalMatrix;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;

void main() {
    gl_Position = u_MvpMatrix * a_Position;
    
    // Calcula a posição do vértice no mundo para a luz
    v_Position = vec3(u_MvpMatrix * a_Position); 
    
    // Transforma a normal para o espaço do mundo corretamente
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Color = a_Color;
}