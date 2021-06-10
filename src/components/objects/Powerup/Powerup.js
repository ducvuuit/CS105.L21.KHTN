import { Group, MeshBasicMaterial, CircleBufferGeometry, Mesh, DoubleSide, TextureLoader} from 'three';
import TEXTURE_FLASH from './flash.jpg';
import TEXTURE_SNAIL from './snail.png';
import TEXTURE_BOMB from './bomb.png';
import TEXTURE_SHUFF from './shuffle.jpg';


class Powerup extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            type: Math.floor(Math.random()*4),
            r: -1,
        };

        this.name = 'powerup';
        this.state.r = Math.floor(Math.random()*4);
        this.position.z = -0.501;

        const geometry = new CircleBufferGeometry(0.5, 32);
        let texture;
        
        switch (this.state.type) {
            case 0: // flash
                texture = new TextureLoader().load(TEXTURE_FLASH);
                break;
            case 1: // snail
                texture = new TextureLoader().load(TEXTURE_SNAIL);
                break;
            case 2: // bomb
                texture = new TextureLoader().load(TEXTURE_BOMB);
                break;
            case 3: // shuffle
                texture = new TextureLoader().load(TEXTURE_SHUFF);
                break;
        }
        const material = new MeshBasicMaterial({map: texture, side: DoubleSide, transparent: true});
        const circle = new Mesh(geometry, material);

        const circle_back = new Mesh(geometry, material);
        circle_back.translateZ(1.002);
        circle.add(circle_back);
        this.add(circle);

        texture.dispose();
        material.dispose();
        geometry.dispose();
    }

    execute(val, orient) {
        const scene = this.parent.parent.parent;
        switch (this.state.type) {
            case 0: // flash
                scene.state.speed += 0.01;
                return undefined;
            case 1: // snail
                if (scene.state.speed > 0.01)    
                    scene.state.speed -= 0.01;
                return undefined;
            case 2: // bomb
                if (orient == 'col') {
                    const flashTweens = [];
                    const cubes = [];
                    const rowsBelowCleared = [];

                    for (let j = -4.5; j < 5; j += 1) {
                        flashTweens[j] = [];
                        cubes[j] = [];
                    }
                    
                    for (let i = -9.5; i < 10; i += 1) {
                        rowsBelowCleared[i] = 0;
                    }

                    for (let i = -9.5; i < 10; i += 1) {
                        const cube = scene.state.board[val][i];
                        if (cube != undefined) {
                            scene.state.board[val][i] = undefined;
                            flashTweens[val][i] = scene.createFlashTween(cube);
                            cubes[val][i] = cube;

                            let powerupIndex = 0;
                            if (cube.parent.state.geo != 'Sphere') {
                                powerupIndex = 1;
                            }

                            if (cube.children[powerupIndex]) {
                                const ret = cube.children[powerupIndex].execute(i, 'row');
                                if (ret != undefined) {
                                    // copy over tweens
                                    const [powerupTweens, powerupCubes, powerupRowsBelowCleared] = ret;
                                    for (let i = -9.5; i < 10; i += 1) {
                                        rowsBelowCleared[i] += powerupRowsBelowCleared[i];
                                        for (let j = -4.5; j < 5; j += 1) {
                                            if (powerupTweens[j] && powerupTweens[j][i]) {
                                                flashTweens[j][i] = powerupTweens[j][i];
                                                cubes[j][i] = powerupCubes[j][i];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return [flashTweens, cubes, rowsBelowCleared];
                } else {
                    const flashTweens = [];
                    const cubes = [];
                    const rowsBelowCleared = [];

                    for (let j = -4.5; j < 5; j += 1) {
                        flashTweens[j] = [];
                        cubes[j] = [];
                    }

                    for (let i = -9.5; i < 10; i += 1) {
                        if (i > val) {
                            rowsBelowCleared[i] = 1;
                        } else {
                            rowsBelowCleared[i] = 0;
                        }
                    }

                    for (let j = -4.5; j < 5; j += 1) {
                        const cube = scene.state.board[j][val];
                        if (cube != undefined) {
                            scene.state.board[j][val] = undefined;
                            flashTweens[j][val] = scene.createFlashTween(cube);
                            cubes[j][val] = cube;

                            let powerupIndex = 0;
                            if (cube.parent.state.geo != 'Sphere') {
                                powerupIndex = 1;
                            }

                            if (cube.children[powerupIndex]) {
                                const ret = cube.children[powerupIndex].execute(j, 'col');
                                if (ret != undefined) {
                                    // copy over tweens
                                    const [powerupTweens, powerupCubes, powerupRowsBelowCleared] = ret;
                                    for (let i = -9.5; i < 10; i += 1) {
                                        rowsBelowCleared[i] += powerupRowsBelowCleared[i];
                                        for (let j = -4.5; j < 5; j += 1) {
                                            if (powerupTweens[j] && powerupTweens[j][i]) {
                                                flashTweens[j][i] = powerupTweens[j][i];
                                                cubes[j][i] = powerupCubes[j][i];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return [flashTweens, cubes, rowsBelowCleared]; 
                }
            case 3:
                for (let i = -9.5; i < 10; i += 1) {
                    let shuffled = [];
                    for (let j = 4.5; j > -5; j -= 1) {
                        shuffled[j] = scene.state.board[j][i];
                    }
                    shuffled = this.shuffle(shuffled);
                    for (let k = 4.5; k > -5; k -= 1) {
                        const cube = shuffled[k];
                        scene.state.board[k][i] = cube;
                        if (cube != undefined) {
                            const cur_x = cube.parent.position.x + cube.position.x;
                            cube.translateX(k - cur_x);
                        }
                    }
                }
                return undefined;
        }
    }

    shuffle(array) {
        var m = 10, t, i;
      
        // While there remain elements to shuffle…
        while (m) {
      
          // Pick a remaining element…
          i = Math.floor(Math.random() * m--);
      
          // And swap it with the current element.
          t = array[m - 4.5];
          array[m - 4.5] = array[i - 4.5];
          array[i - 4.5] = t;
        }
      
        return array;
      }
}

export default Powerup;
