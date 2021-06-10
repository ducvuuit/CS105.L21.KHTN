import { Group, MeshBasicMaterial, Mesh, PlaneBufferGeometry } from 'three';

class Floor extends Group {
    constructor() {
        // Call parent Group() constructor
        super();

        this.name = 'floor';

        // Make floor
        const geometry = new PlaneBufferGeometry(12, 4).rotateX(-0.5*Math.PI);
        const material = new MeshBasicMaterial({color: 0x555555});
        const mesh = new Mesh(geometry, material);

        geometry.dispose();
        material.dispose();

        // add to mesh
        this.add(mesh);
        this.position.y = -10;
    }
}

export default Floor;
