precision mediump float;

uniform vec3 u_LightPos;
uniform vec3 u_ViewPos;
uniform vec3 u_LightColor;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;

void main() {
  // Ambiental
    float ambientStrength = 1.5;
    vec3 ambient = ambientStrength * u_LightColor;

  // Difusa
    vec3 norm = normalize(v_Normal);
    vec3 lightDir = normalize(u_LightPos - v_Position);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * u_LightColor;

  // Especular
    float specularStrength = 1.5;
    vec3 viewDir = normalize(u_ViewPos - v_Position);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * u_LightColor;

    gl_FragColor = vec4((ambient + diffuse + specular), 2.0) * v_Color;
}