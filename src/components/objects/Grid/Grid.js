import { Group, Vector3, LineDashedMaterial, BufferGeometry, LineSegments } from 'three';

class Grid extends Group {
    constructor() {
        // Call parent Group() constructor
        super();

        this.name = 'grid';

        // Make lines
        const width = 10;
        const height = 20;
        const z = 0.5;

        const points = [];
        for (let i = 0; i < width + 1; i++) {
            for (let j = 0; j < height + 1; j++) {
                const x = i - width/2;
                points.push(new Vector3(x, j, -z));
                points.push(new Vector3(x, j, z));
            }
        }

        for (let j = 0; j < height + 1; j++) {
            points.push(new Vector3(-width/2, j, -z));
            points.push(new Vector3(width/2, j, -z));
            points.push(new Vector3(-width/2, j, z));
            points.push(new Vector3(width/2, j, z));
        }

        for (let i = 0; i < width + 1; i++) {
            const x = i - width/2;
            points.push(new Vector3(x, 0, -z));
            points.push(new Vector3(x, height, -z));
            points.push(new Vector3(x, 0, z));
            points.push(new Vector3(x, height, z));
        }

        const lineGeometry = new BufferGeometry().setFromPoints(points);
        const lineMaterial = new LineDashedMaterial({color: 0xFFF8BBD0});
        const lines = new LineSegments(lineGeometry, lineMaterial);

        // add to mesh
        this.add(lines);
        this.position.y = -10;

        lineGeometry.dispose();
        lineMaterial.dispose();
    }
}

export default Grid;
