import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import {GPUComputationRenderer} from 'three/examples/jsm/misc/GPUComputationRenderer.js'

import simVertex from './shaders/simVertex.glsl'
import simFragmentPosition from './shaders/simFragment.glsl'
import simFragmentVelocity from './shaders/simFragmentVelocity.glsl'

import texture from '../test.jpg'
import t1 from '../logo.png'
import t2 from '../super.png'
import GUI from 'lil-gui'

// lerp
function lerp(a, b, n) {
  return (1 - n) * a + n * b
}

// defaul load image
const loadImage = (path) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous' // avoid CORS if used with Canvas
    img.src = path
    img.onload = () => {
      resolve(img)
    }
    img.onerror = (e) => {
      reject(e)
    }
  })
}

export default class App {
  constructor(options) {
    this.size = 512
    this.number = this.size * this.size

    this.container = options.dom
    this.scene = new THREE.Scene()

    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    this.renderer.setClearColor(0x222222, 1)
    this.renderer.setSize(this.width, this.height)
    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.01, 10)
    this.camera.position.z = 2

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.time = 0

    // GUI
    this.setupSettings()

    // To load 2 texture
    Promise.all([this.getPixelDataFromImage(t1), this.getPixelDataFromImage(t2)]).then(
      (textures) => {
        this.data = this.getPointsOnSphere()
        this.data1 = textures[1]
        // moving all after load texture
        this.addObjects()
        this.initGPGPU()
        this.setupFBO()
        this.mouseEvents()
        this.setupResize()
        this.render()
      },
    )
  }

  //Setup GUI
  setupSettings() {
    this.settings = {
      progress: 0,
      particleSpeed: 0.001,
      particleSize: 2,
      frictionValue: 0.99,
    }
    this.gui = new GUI()
    this.gui.add(this.settings, 'progress', 0, 1, 0.001).onChange((val) => {
      this.simMaterial.uniforms.uProgress.value = val
    })

    this.gui.add(this.settings, 'particleSpeed', 0.0000001, 0.001, 0.000001).onChange((val) => {
      this.simMaterial.uniforms.particleSpeed.value = val
    })
    this.gui.add(this.settings, 'particleSize', 0.0001, 10, 0.00001).onChange((val) => {
      this.material.uniforms.particleSize.value = val
    })
    this.gui.add(this.settings, 'frictionValue', 0.01, 0.999, 0.001).onChange((val) => {
      this.simMaterial.uniforms.frictionValue.value = val
    })
  }

  getVelocitiesOnSphere() {
    const data = new Float32Array(4 * this.number)
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j
        // generate point on a sphere
        let theta = Math.random() * Math.PI * 2
        let phi = Math.acos(Math.random() * 2 - 1) // btw 0 and PI - uniform diffusion
        // let phi = Math.random() * Math.PI // non uniform diffusion

        data[4 * index] = 0
        data[4 * index + 1] = 0
        data[4 * index + 2] = 0
        data[4 * index + 3] = 0
      }
    }

    let dataTexture = new THREE.DataTexture(
      data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    dataTexture.needsUpdate = true
    return dataTexture
  }

  getPointsOnSphere() {
    const data = new Float32Array(4 * this.number)
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j
        // generate point on a sphere
        let theta = Math.random() * Math.PI * 2
        let phi = Math.acos(Math.random() * 2 - 1) // btw 0 and PI - uniform diffusion
        // let phi = Math.random() * Math.PI // non uniform diffusion

        let x = Math.sin(phi) * Math.cos(theta)
        let y = Math.sin(phi) * Math.sin(theta)
        let z = Math.cos(phi)

        data[4 * index] = x
        data[4 * index + 1] = y
        data[4 * index + 2] = z
        data[4 * index + 3] = (Math.random() - 0.5) * 0.01
      }
    }

    let dataTexture = new THREE.DataTexture(
      data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    dataTexture.needsUpdate = true
    return dataTexture
  }

  // Get pixels data from image
  async getPixelDataFromImage(url) {
    let img = await loadImage(url)
    let width = 200
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width
    let ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, width)
    let canvasData = ctx.getImageData(0, 0, width, width).data

    let pixels = []
    for (let i = 0; i < canvasData.length; i += 4) {
      let x = (i / 4) % width
      // divided by 4 becouse pixels has rgb + alpha
      // *** range by 0 to 200(width) thats its big and we use just range btw -1 to 1
      let y = Math.floor(i / 4 / width)
      // save pixels if black value
      if (canvasData[i] < 9) {
        // pixels.push({x, y})
        // *** the fix
        pixels.push({x: x / width - 0.5, y: 0.5 - y / width})
      }
    }
    console.log(pixels)

    // Create data Texture
    const data = new Float32Array(4 * this.number)

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j

        // random placement
        let randomPixels = pixels[Math.floor(Math.random() * pixels.length)]

        // random pixels in the screen
        if (Math.random() > 0.95) {
          // moltiply for 3 or 4 to fill all the screen with particle
          randomPixels = {x: 3 * (Math.random() - 0.5), y: 3 * (Math.random() - 0.5)}
        }

        // place

        data[4 * index] = randomPixels.x + (Math.random() - 0.5) * 0.01
        data[4 * index + 1] = randomPixels.y + (Math.random() - 0.5) * 0.01
        data[4 * index + 2] = (Math.random() - 0.5) * 0.01
        data[4 * index + 3] = (Math.random() - 0.5) * 0.01

        // place on the grid
        // data[4 * index] = lerp(-0.5, 0.5, j / (this.size - 1))
        // data[4 * index + 1] = lerp(-0.5, 0.5, i / (this.size - 1))
        // data[4 * index + 2] = 0
        // data[4 * index + 3] = 1
      }
    }

    let dataTexture = new THREE.DataTexture(
      data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    dataTexture.needsUpdate = true
    return dataTexture
  }

  // Mouse Events
  mouseEvents() {
    //Get intersection from particles in not raccomanded so ->
    //Create a plane to get intersection
    this.planeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 30, 30),
      new THREE.MeshNormalMaterial(),
    )

    this.dummy = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 10, 10),
      new THREE.MeshNormalMaterial({
        wireframe: true,
      }),
    )

    this.scene.add(this.dummy)
    // this.scene.add(this.planeMesh)

    window.addEventListener('mousemove', (e) => {
      this.pointer.x = (e.clientX / this.width) * 2 - 1
      this.pointer.y = -(e.clientY / this.height) * 2 + 1
      this.raycaster.setFromCamera(this.pointer, this.camera)

      //Intersect whit the Plane Mesh
      const intersects = this.raycaster.intersectObjects([this.planeMesh])
      if (intersects.length > 0) {
        this.dummy.position.copy(intersects[0].point)
        // console.log(intersects[0].point)
        // Update uniform on mouse position of simMaterial
        this.simMaterial.uniforms.uMouse.value = intersects[0].point
        this.positionUniforms.uMouse.value = intersects[0].point
        this.velocityUniforms.uMouse.value = intersects[0].point
      }
    })
  }

  // Resize
  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  // https://threejs.org/examples/webgl_gpgpu_birds.html
  initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer(this.size, this.size, this.renderer)

    if (this.renderer.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    this.pointsOnSphere = this.getPointsOnSphere()
    this.positionVariable = this.gpuCompute.addVariable(
      'uCurrentPosition',
      simFragmentPosition,
      this.pointsOnSphere,
    )

    this.velocityVariable = this.gpuCompute.addVariable(
      'uCurrentVelocity',
      simFragmentVelocity,
      this.getVelocitiesOnSphere,
    )

    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable,
    ])
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable,
    ])

    this.positionUniforms = this.positionVariable.material.uniforms
    this.velocityUniforms = this.velocityVariable.material.uniforms

    this.positionUniforms.uTime = {value: 0.0}
    this.positionUniforms.uMouse = {value: new THREE.Vector3(0, 0, 0)}

    this.velocityUniforms.uTime = {value: 0.0}
    this.velocityUniforms.uMouse = {value: new THREE.Vector3(0, 0, 0)}

    this.positionUniforms.uProgress = {value: 0.0}
    this.positionUniforms.uOriginalPosition = {value: this.pointsOnSphere}
    this.velocityUniforms.uOriginalPosition = {value: this.pointsOnSphere}
    this.material.uniforms.particleSize.value = 2
    this.gpuCompute.init()
  }

  // Setup FBO
  setupFBO() {
    // create Data Texture
    const data = new Float32Array(4 * this.number)

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j
        data[4 * index] = lerp(-0.5, 0.5, j / (this.size - 1))
        data[4 * index + 1] = lerp(-0.5, 0.5, i / (this.size - 1))
        data[4 * index + 2] = 0
        data[4 * index + 3] = 1
      }
    }

    this.positions = new THREE.DataTexture(
      data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    this.positions.needsUpdate = true

    // create FBO Scene
    this.sceneFBO = new THREE.Scene()
    this.cameraFBO = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2)
    this.cameraFBO.position.z = 1
    this.cameraFBO.lookAt(new THREE.Vector3(0, 0, 0))

    let geo = new THREE.PlaneGeometry(2, 2, 2, 2)
    // this.simMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xff0000,
    //   wireframe: true,
    // })
    this.simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0},
        // add mouse position as vector of 3 dim
        uMouse: {value: new THREE.Vector3(0, 0, 0)},
        uProgress: {value: 0},
        particleSpeed: {value: 0.001},
        frictionValue: {value: 0.99},
        uTime: {value: 0},
        // get the current position that update every frames
        // uCurrentPosition: {value: this.positions},
        // // preserve orginal position, static
        // uOriginalPosition: {value: this.positions},
        // Now we use the datatexture position
        uCurrentPosition: {value: this.data},
        uOriginalPosition: {value: this.data},
        uOriginalPosition1: {value: this.data1},
      },
      vertexShader: simVertex,
      fragmentShader: simFragmentPosition,
    })
    this.simMesh = new THREE.Mesh(geo, this.simMaterial)
    this.sceneFBO.add(this.simMesh)

    this.renderTarget = new THREE.WebGLRenderTarget(this.size, this.size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    })

    this.renderTarget1 = new THREE.WebGLRenderTarget(this.size, this.size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    })
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  addObjects() {
    this.geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(this.number * 3) // 3 dimension
    const uvs = new Float32Array(this.number * 2) // 2 dimensions

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j

        positions[3 * index] = j / this.size - 0.5
        positions[3 * index + 1] = i / this.size - 0.5
        positions[3 * index + 2] = 0
        uvs[2 * index] = j / (this.size - 1)
        uvs[2 * index + 1] = i / (this.size - 1)
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

    // this.material = new THREE.MeshNormalMaterial()

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0},
        // uTexture: {value: new THREE.TextureLoader().load(texture)},
        uTexture: {value: this.positions},
        particleSize: {value: 0.0001},
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      depthWrite: false,
      depthTest: false,
      transparent: true,
    })

    this.mesh = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  render() {
    this.time += 0.05
    this.material.uniforms.time.value = this.time

    // this.renderer.render(this.scene, this.camera)
    // this.renderer.render(this.sceneFBO, this.cameraFBO)

    // this.renderer.setRenderTarget(this.renderTarget)
    // this.renderer.render(this.sceneFBO, this.cameraFBO)

    // this.renderer.setRenderTarget(null)
    this.gpuCompute.compute()
    this.renderer.render(this.scene, this.camera)

    //swap render targets ( not need on GPGPU )
    // const tmp = this.renderTarget
    // this.renderTarget = this.renderTarget1
    // this.renderTarget1 = tmp

    this.material.uniforms.uTexture.value = this.gpuCompute.getCurrentRenderTarget(
      this.positionVariable,
    ).texture

    this.positionUniforms.uTime.value = this.time

    // this.simMaterial.uniforms.uCurrentPosition.value = this.renderTarget1.texture
    // this.simMaterial.uniforms.uTime.value = this.time

    window.requestAnimationFrame(this.render.bind(this))
  }
}

new App({
  dom: document.getElementById('container'),
})
