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
    vec2 position = texture2D(uCurrentPosition, vUv).xy;
    vec2 original = texture2D(uOriginalPosition, vUv).xy;
    vec2 original1 = texture2D(uOriginalPosition1, vUv).xy;

    vec2 velocity = texture2D(uCurrentPosition, vUv).zw;

    vec2 finalOriginal = mix(original,original1, uProgress);

    // friction
    velocity *= frictionValue;
    // particled attraction to shape force
    // direction where the force shoul be applied
    vec2 direction = normalize(finalOriginal - position);

    // apply when particle are far from orinal destination
    // so calulate distance
    float dist = length(finalOriginal - position);
    if(dist > 0.001) {
        velocity += direction * particleSpeed;
    }


    // mouse repel force
    float mouseDistance = distance(position,uMouse.xy);
    float maxDistance = 0.1;
    if(mouseDistance < maxDistance) {
        vec2 direction = normalize(position - uMouse.xy);
        // force -> accelleration
        // (1.0 - mouseDistance / maxDistance) this is important because at the edge of the mouse the result is 0
        velocity += direction * (1.0 - mouseDistance / maxDistance) * interactionForceValue;
    }

    // particle life - life span of the particle
    float lifespan = 10.;
    float age = mod(uTime + lifespan*offset, lifespan);
    if(age<1.) {
        velocity = vec2(0.0,0.0);
        position.xy = finalOriginal;
    }

    position.xy += velocity;

    gl_FragColor = vec4(position, velocity);

}