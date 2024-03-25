varying vec2 vUv;
uniform float uProgress;
uniform float uTime;

// uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;

uniform vec3 uMouse;


float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {

	vec2 vUv = gl_FragCoord.xy / resolution.xy;
    float offset = rand(vUv);


    vec3 position = texture2D(uCurrentPosition, vUv).xyz ;
    vec3 original = texture2D(uOriginalPosition, vUv).xyz ;
    vec3 velocity = texture2D(uCurrentVelocity,vUv).xyz;

    // position += velocity;

    // // friction
    velocity *= 0.1;

    // particle Attraction
    vec3 direction = normalize(original - position);
    float dist = length(original - position);
    if(dist > 0.01) {
        velocity += direction * 0.001;
    }

    // mouse repel force
    float mouseDistance = distance(position,uMouse);
    // sized brush
    float maxDistance = 0.5;
    if(mouseDistance < maxDistance) {
        vec3 direction = normalize(position - uMouse);
        velocity += direction * (1.0 - mouseDistance / maxDistance) * 0.1;
    }


    // position.xy += velocity;

    gl_FragColor = vec4(velocity, 1.);

}



