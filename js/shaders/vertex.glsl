varying vec2 vUv;
uniform float time;
uniform float mouseX;
void main() {
   float fastTime = mouseX;
    vUv = uv;
    vec3  newpos = position;
    newpos.z +=  sin( fastTime + position.x*10. ) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4( newpos, 1.0 );

    gl_PointSize = ( 10.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition ;

}