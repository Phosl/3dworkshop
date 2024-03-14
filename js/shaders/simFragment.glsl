varying vec2 vUv;
uniform float uProgress;
uniform float particleSpeed;
uniform float interactionForceValue;
uniform float frictionValue;
uniform float uTime;

uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform sampler2D uOriginalPosition1;
uniform vec3 uMouse;


// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
    float offset = rand(vUv);
    vec3 position = texture2D(uCurrentPosition, vUv).xyz;
    vec3 original = texture2D(uOriginalPosition, vUv).xyz;
    vec3 original1 = texture2D(uOriginalPosition1, vUv).xyz;

    // vec2 velocity = texture2D(uCurrentPosition, vUv).zw;

    // vec2 finalOriginal = mix(original,original1, uProgress);
    vec3 finalOriginal = original;

    // friction
    // velocity *= frictionValue;
    // particled attraction to shape force
    // direction where the force shoul be applied
    vec3 direction = normalize(finalOriginal - position);

    // apply when particle are far from orinal destination
    // so calulate distance
    float dist = length(finalOriginal - position);
    if(dist > 0.001) {
        position += direction * particleSpeed;
    }


    // mouse repel force
    float mouseDistance = distance(position,uMouse);
    float maxDistance = 0.1;
    if(mouseDistance < maxDistance) {
        vec3 direction = normalize(position - uMouse);
        // force -> accelleration
        // (1.0 - mouseDistance / maxDistance) this is important because at the edge of the mouse the result is 0
        position += direction * (1.0 - mouseDistance / maxDistance) * interactionForceValue;
    }

    // particle lifecycle - life span of the particle
    float lifespan = 50.;
    float age = mod(uTime + lifespan*offset, lifespan);
    if(age<1.) {
        // velocity = vec2(0.0,0.001);
        position.xyz = finalOriginal;
    }

    // position.xy += velocity;

    gl_FragColor = vec4(position, 1);

}