// uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform sampler2D uOriginalPosition1;

uniform float uProgress;
uniform float uTime;
uniform vec3 uMouse;



// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {

	vec2 vUv = gl_FragCoord.xy / resolution.xy;
    float offset = rand(vUv);

    vec3 position = texture2D(uCurrentPosition, vUv).xyz;
    vec3 velocity = texture2D(uCurrentVelocity,vUv).xyz;

    position += velocity  * 1.2;

    gl_FragColor = vec4(position, 1.0);

}