import * as THREE from "three";

export default class Flower extends THREE.Group {
  constructor({
    color = new THREE.Color("#e8447a"),
    petalCount = 14,
    petalLength = 1,
    petalWidth = 0.35,
    cup = -0.95,
    bend = 0.5,
    tilt = 0,
    centerRadius = 1.3,
  } = {}) {
    super();
    this.params = {
      color,
      petalCount,
      petalLength,
      petalWidth,
      cup,
      bend,
      tilt,
      centerRadius,
    };
    this.material = this.#createMaterial();
    this.#createPetals();
  }

  #createMaterial() {
    return new THREE.MeshStandardMaterial({
      color: this.params.color,
      roughness: 0.5,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
  }

  #createPetalGeometry(length, width, cup, bend) {
    const geo = new THREE.PlaneGeometry(1, 1, 18, 28);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const v = THREE.MathUtils.clamp(y + 0.5, 0, 1);

      const profile = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.85);
      const halfWidth = profile * width * 0.5;
      const nx = x * 2 * halfWidth;

      const cupFactor = THREE.MathUtils.lerp(0.25, 1.0, v);
      const cupZ = ((nx * nx) / Math.max(halfWidth, 0.0001)) * cup * cupFactor;

      // Arc bend: petal centerline curves around X axis.
      // `bend` is the total bend angle (radians) from base to tip.
      const bendAngle = bend;
      let centerY, centerZ, sinT, cosT;
      if (Math.abs(bendAngle) > 1e-4) {
        const R = length / bendAngle;
        const theta = bendAngle * v;
        sinT = Math.sin(theta);
        cosT = Math.cos(theta);
        centerY = R * sinT;
        centerZ = R * (1 - cosT);
      } else {
        sinT = 0;
        cosT = 1;
        centerY = v * length;
        centerZ = 0;
      }

      // Offset cup along the surface normal so the bowl follows the bend.
      const py = centerY - cupZ * sinT;
      const pz = centerZ + cupZ * cosT;

      pos.setXYZ(i, nx, py, pz);
    }

    geo.computeVertexNormals();
    return geo;
  }

  #createPetals() {
    const {
      petalCount,
      petalLength,
      petalWidth,
      cup,
      bend,
      tilt,
      centerRadius,
    } = this.params;
    const geometry = this.#createPetalGeometry(
      petalLength,
      petalWidth,
      cup,
      bend,
    );

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(geometry, this.material);
      petal.rotation.order = "YXZ";
      petal.rotation.y = angle;
      petal.rotation.x = -(Math.PI / 2) + tilt;
      petal.position.x = Math.sin(angle) * centerRadius;
      petal.position.z = Math.cos(angle) * centerRadius;
      this.add(petal);
    }

    this.rotation.x = -Math.PI / 2;
  }
}
