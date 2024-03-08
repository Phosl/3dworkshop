varying vec2 vUv;
uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform vec3 uMouse;

void main() {

    vec2 position = texture2D(uCurrentPosition, vUv).xy;
    vec2 original = texture2D(uOriginalPosition, vUv).xy;


    // force decay with distance
    // distance betwnen mouse and particle
    vec2 force = original - uMouse.xy;
    float len = length(force);
    // create a coefficient that decay with the distance
    // https://www.desmos.com/?lang=it
    //  1/max(1,x * 10)
    float forceFactor = 1./max(1.,len * 5.);

    vec2 positionToGo = original + normalize(force) * forceFactor * 0.1;
    //   position.xy += (positionToGo - position.xy) * duration;

    position.xy += (positionToGo - position.xy) * 0.05;

    // gl_FragColor = vec4(vUv,0.,1.0);


    // position.x += 0.001;
    // position.xy += normalize(position.xy - vec2(0.5,0.5)) * 0.01 ;
    // position.xy += normalize(position.xy ) * 0.001 ;

    gl_FragColor = vec4(position, 0.0, 1.0);

}