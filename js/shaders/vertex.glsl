varying vec2 vUv;
uniform float time;
uniform sampler2D uTexture;

void main() {
//    float fastTime = time * 2.;
// newpos.z +=  sin( fastTime + position.x*10. ) * 0.1;
    vUv = uv;
    vec3  newpos = position;
    vec4 color = texture2D(uTexture, vUv);
    newpos.xy = color.xy;
    // newpos.x += 1.;
    // vec4 -> rgb + alpha
    vec4 mvPosition = modelViewMatrix * vec4( newpos, 1. ) ;

    gl_PointSize = ( 1.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition ;

}