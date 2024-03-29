varying vec2 vUv;
uniform float time;
uniform sampler2D uTexture;
uniform float particleSize;

void main() {
//    float fastTime = time * 2.;
// newpos.z +=  sin( fastTime + position.x*10. ) * 0.1;
    vUv = uv;
    vec3  newpos = position;
    vec4 color = texture2D(uTexture, vUv);
    newpos.xyz = color.xyz;
    // newpos.x += 1.;
    // vec4 -> rgb + alpha
    vec4 mvPosition = modelViewMatrix * vec4( newpos, 1. ) ;

    gl_PointSize = ( particleSize / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition ;

}