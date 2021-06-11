import { Group, SpotLight, AmbientLight, HemisphereLight } from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);

        //const dir = new SpotLight(0xffffff, 1, 1, 1, 1, 1);
        const ambi = new AmbientLight(0xffffff, 1);
        //const hemi = new HemisphereLight(0xffffff, 0xffffff, 1);

        //dir.position.set(0, 0, 0);
        //dir.target.position.set(0, 0, 0);

        //this.add(ambi, hemi, dir);
        this.add(ambi);
    }
}

export default BasicLights;
