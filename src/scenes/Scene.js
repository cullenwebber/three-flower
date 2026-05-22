import * as THREE from "three";
import WebGLContext from "../core/WebGLContext";
import ImportGltf from "../utils/ImportGltf";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Flower from "../meshes/Flower";

export default class Scene {
  constructor() {
    this.context = null;
    this.camera = null;
    this.cameraRig = null;
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 0;
    this.scene = null;
    this.envMap = null;
    this.#init();
  }

  async #init() {
    this.#setContext();
    this.#setupScene();
    this.#setupCamera();

    this.#addLights();
    await this.#addObjects();
  }

  #setContext() {
    this.context = new WebGLContext();
  }

  #setupScene() {
    this.scene = new THREE.Scene();
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(this.context.renderer);
    this.envMap = pmremGenerator.fromScene(environment).texture;
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 1.0;
    // this.scene.background = new THREE.Color(0x000000);
  }

  #setupCamera() {
    this.#calculateAspectRatio();
    this.camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 1, 100);
    this.camera.position.z = 3;

    this.controls = new OrbitControls(this.camera, this.context.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
  }

  #addLights() {}

  async #addObjects() {
    this.flower = new Flower();
    this.scene.add(this.flower);
  }

  #calculateAspectRatio() {
    const { width, height } = this.context.getFullScreenDimensions();
    this.width = width;
    this.height = height;
    this.aspectRatio = this.width / this.height;
  }

  animate(delta, elapsed) {
    this.controls?.update();
    // this.flower?.rotation.z += delta;
  }

  onResize(width, height) {
    this.width = width;
    this.height = height;
    this.aspectRatio = width / height;

    this.camera.aspect = this.aspectRatio;
    this.camera.updateProjectionMatrix();
  }
}
