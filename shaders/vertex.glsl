attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec4 a_Color;

uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;

void main() {
    gl_Position = u_MvpMatrix * a_Position;

    // O segredo está aqui: usar a ModelMatrix para ter a posição REAL no mundo
    v_Position = vec3(u_ModelMatrix * a_Position);

    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Color = a_Color;
}