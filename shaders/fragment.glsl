precision mediump float;

// Spotlight (Teto)
uniform vec3 u_CeilingPos;
uniform vec3 u_CeilingDir;
uniform float u_CeilingCutoff;
uniform vec3 u_CeilingColor;

// Point Light (Esfera)
uniform vec3 u_SpherePos;
uniform vec3 u_SphereColor;

uniform vec3 u_ViewPos; // Posição da Câmera
uniform sampler2D u_Sampler;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;
varying vec2 v_TexCoord;

void main() {
  vec4 texColor = texture2D(u_Sampler, v_TexCoord);

  vec3 norm = normalize(v_Normal);
  vec3 viewDir = normalize(u_ViewPos - v_Position);
  vec3 result = vec3(0.5); // Luz ambiente global

    // --- 1. LUZ MÓVEL (POINT LIGHT) ---
  vec3 sphereLightDir = normalize(u_SpherePos - v_Position);

    // Difusa
  float diffS = max(dot(norm, sphereLightDir), 0.0);
  vec3 diffuseS = diffS * u_SphereColor;

    // Especular (Brilho)
  vec3 reflectDirS = reflect(-sphereLightDir, norm);
  float specS = pow(max(dot(viewDir, reflectDirS), 0.0), 32.0); // 32.0 é o brilho (shininess)
  vec3 specularS = 0.5 * specS * u_SphereColor;

  result += (diffuseS + specularS);

    // --- 2. LUZ TETO (SPOTLIGHT) ---
  vec3 lightToFrag = normalize(v_Position - u_CeilingPos);
  float theta = dot(lightToFrag, normalize(u_CeilingDir));

  if(theta > u_CeilingCutoff) {
    vec3 ceilingLightDir = normalize(u_CeilingPos - v_Position);

        // Difusa
    float diffC = max(dot(norm, ceilingLightDir), 0.0);

        // Especular (Brilho)
    vec3 reflectDirC = reflect(-ceilingLightDir, norm);
    float specC = pow(max(dot(viewDir, reflectDirC), 0.0), 32.0);
    vec3 specularC = 0.5 * specC * u_CeilingColor;

        // Suavização da borda do cone
    float intensity = clamp((theta - u_CeilingCutoff) / (1.0 - u_CeilingCutoff), 0.0, 1.0);

    result += (diffC * u_CeilingColor + specularC) * intensity;
  }

  gl_FragColor = vec4(result, 1.0) * v_Color * texColor;
}