varying vec2 vUv;
uniform sampler2D uTexture;
void main() {

    // gl_FragColor = vec4( 0., 1., 0., 1 );
    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = vec4( vUv, 0., 1.0 );
        // gl_FragColor = color;

}