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
    centerRadius = 1.325,
    rings = 8,
    ringScale = 0.2,
    ringRadiusScale = 0.11,
    ringTiltStep = 0.08,
    ringLift = 0.08,
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
      rings,
      ringScale,
      ringRadiusScale,
      ringTiltStep,
      ringLift,
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
      rings,
      ringScale,
      ringRadiusScale,
      ringTiltStep,
      ringLift,
    } = this.params;

    for (let r = 0; r < rings; r++) {
      const t = rings > 1 ? r / (rings - 1) : 0;
      const scale = THREE.MathUtils.lerp(1, ringScale, t);
      const radiusScale = THREE.MathUtils.lerp(1, ringRadiusScale, t);
      const ringLength = petalLength * scale;
      const ringWidth = petalWidth * scale;
      const ringCenter = centerRadius * radiusScale;
      const ringTilt = tilt + ringTiltStep * r;
      const ringCount = Math.max(5, Math.round(petalCount * Math.pow(0.9, r)));
      const ringOffset = r * Math.PI * (3 - Math.sqrt(5));

      const geometry = this.#createPetalGeometry(
        ringLength,
        ringWidth,
        cup,
        bend,
      );

      const ring = new THREE.Group();
      ring.position.y = -ringLift * r;
      this.add(ring);

      for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2 + ringOffset;
        const petal = new THREE.Mesh(geometry, this.material);
        petal.rotation.order = "YXZ";
        petal.rotation.y = angle;
        petal.rotation.x = -(Math.PI / 2) + ringTilt;
        petal.position.x = Math.sin(angle) * ringCenter;
        petal.position.z = Math.cos(angle) * ringCenter;
        ring.add(petal);
      }
    }

    this.rotation.x = -Math.PI / 2;
  }
}
