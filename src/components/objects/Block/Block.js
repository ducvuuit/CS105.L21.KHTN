import { Group, Mesh, BoxBufferGeometry, SphereBufferGeometry, MeshPhongMaterial, MeshBasicMaterial } from 'three';
import { EdgesGeometry, LineBasicMaterial, LineDashedMaterial, LineSegments, TextureLoader } from 'three';
import { Powerup } from 'objects';
import TEXTURE_BRICK from './brick.jpg';
import TEXTURE_MARBLE from './marble.jpg';


class Block extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            shape: Math.floor(Math.random()*7),
            geo: 'Cube',
            continuousPos: 10,
            cubes: [],
            offsets: [],
            shadows: [],
            paused: false,
            powerup: undefined,
        };

        // starting position
        this.position.x = 9.5;
        this.position.y = 6.5;

        this.name = 'block';
        this.makeBlock(this.state.shape, parent);
        
        if (parent.state.Powerups && parent.state.level > 1) {
            const percent = [20, 10, 5, 4];
            const num = Math.min(parent.state.level, 5) - 2;
            const chance = Math.floor(Math.random()*percent[num]);
            if (chance == 0) {
                this.state.powerup = new Powerup(this);
                this.state.cubes[this.state.powerup.state.r].add(this.state.powerup);
            }
        }
    }

    start() {
        this.position.x = 0.5;
        this.position.y = 9.5;
        this.state.continuousPos = 10;

        for (let offset of this.state.offsets) {
            if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y] !== undefined) {
                this.position.y += 1;
                this.state.continuousPos += 1;
            }
        }

        this.updateShadow(this.parent);
        this.parent.addToUpdateList(this);
    }

    makeBlock(shape, parent) {
        let color;
        switch(shape) {
            case 0: { // O
                color = 0xfcff4a;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: -1, y: 0},
                    {x: 0, y: -1},
                    {x: -1, y: -1}
                ];
                break;
            }
            case 1: { // I
                color = 0x40fcff;
                this.state.offsets = [
                    {x: 1, y: 0},
                    {x: 0, y: 0},
                    {x: -1, y: 0},
                    {x: -2, y: 0}
                ];
                break;
            }
            case 2: { // S
                color = 0x24ab27;
                if (parent.state.Colors == 'Neon') color = 0x4aed5d;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: -1, y: 0},
                    {x: 0, y: -1},
                    {x: 1, y: -1}
                ];
                break;
            }
            case 3: { // Z
                color = 0xff0000;
                if (parent.state.Colors == 'Neon') color = 0xed4e40;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: 1, y: 0},
                    {x: 0, y: -1},
                    {x: -1, y: -1}
                ];
                break;
            }
            case 4: { // L
                color = 0xcf7f00;
                if (parent.state.Colors == 'Neon') color = 0xfa6c14;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: 1, y: 0},
                    {x: 1, y: -1},
                    {x: -1, y: 0},
                ];
                break;
            }
            case 5: { // J
                color = 0x121db8;
                if (parent.state.Colors == 'Neon') color = 0x3731eb;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: -1, y: 0},
                    {x: -1, y: -1},
                    {x: 1, y: 0},
                ];
                break;
            }
            case 6: { // T
                color = 0x8d0fb8;
                if (parent.state.Colors == 'Neon') color = 0xed4ee0;
                this.state.offsets = [
                    {x: 0, y: 0},
                    {x: 1, y: 0},
                    {x: -1, y: 0},
                    {x: 0, y: -1},
                ];
                break;
            }
        }

        let geometry;
        this.state.geo = parent.state.Shape;
        switch(parent.state.Shape) {
            case 'Cube':
                geometry = new BoxBufferGeometry(1, 1, 1);
                break;
            case 'Sphere':
                geometry = new SphereBufferGeometry(0.5);
                break;
        }

        let material;
        let shadowMaterial;
        let texture = undefined;
        switch(parent.state.Colors) {
            case 'Standard':
                material = new MeshPhongMaterial({color: color, transparent: true});
                shadowMaterial = new LineDashedMaterial({color: material.color, linewidth: 4});
                break;
            case 'Brick':
                texture = new TextureLoader().load(TEXTURE_BRICK);
                material = new MeshBasicMaterial({map: texture, transparent: true});
                shadowMaterial = new LineDashedMaterial({color: 0x633e3c, linewidth: 4});
                break;
            case 'Marble':
                texture = new TextureLoader().load(TEXTURE_MARBLE);
                material = new MeshBasicMaterial({map: texture, transparent: true});
                shadowMaterial = new LineDashedMaterial({color: 0x6e6b69, linewidth: 4});
                break;
            case 'Neon':
                material = new MeshPhongMaterial({color: color, transparent: true});
                shadowMaterial = new LineDashedMaterial({color: material.color, linewidth: 4});
                break;
        }

        if (texture !== undefined) texture.dispose();

        for (let i = 0; i < this.state.offsets.length; i++) {
            // make cube and translate
            const mesh = new Mesh(geometry, material.clone());
            mesh.translateX(this.state.offsets[i].x);
            mesh.translateY(this.state.offsets[i].y);
            
            // make outline
            if (parent.state.Shape == 'Cube') {
                const edgesGeometry = new EdgesGeometry(geometry);
                const edgesMaterial = new LineBasicMaterial({color: 0x000000, linewidth: 4, transparent: true});
                const edges = new LineSegments(edgesGeometry, edgesMaterial);
                mesh.add(edges);
            }

            // make shadow
            const shadowGeom = new EdgesGeometry(geometry);
            const shadow = new LineSegments(shadowGeom, shadowMaterial);
            shadow.translateX(this.state.offsets[i].x);
            shadow.translateY(this.state.offsets[i].y);

            // add to block
            this.state.cubes.push(mesh);
            this.state.shadows.push(shadow);
            this.add(mesh);
            this.add(shadow);
        }
    }

    floor() {
        for (let shadow of this.state.shadows) {
            this.remove(shadow);
            shadow.geometry.dispose();
            shadow.material.dispose();
        }
        this.parent.removeFromUpdateList();
        this.parent.updateBlock();
    }

    update(timeStamp) {
        if (!this.state.paused) { // hasn't hit floor or object yet
            for (let offset of this.state.offsets) {
                if (this.position.y + offset.y < -9) {
                    this.state.paused = true;
                    break;
                }
                if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y - 1] !== undefined) {
                    this.state.paused = true;
                    break;
                }
            }
            this.state.continuousPos -= this.parent.state.speed;
            this.position.y = Math.ceil(this.state.continuousPos) - 0.5;
        } else { // paused so it already hit floor or object
            let blocked = false;
            for (let offset of this.state.offsets) {
                if (this.position.y + offset.y < -9) { // hit floor
                    blocked = true;
                    const ceilPos = Math.ceil(this.state.continuousPos + offset.y) - 0.5;
                    if (ceilPos < -10) { // done moving
                        this.floor();
                        return;
                    }
                } else if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y - 1] !== undefined) {
                    // still above a block
                    blocked = true;
                    const ceilPos = Math.ceil(this.state.continuousPos + offset.y) - 0.5;
                    if (ceilPos < this.position.y + offset.y - 0.5) { // done moving
                        this.floor();
                        return;
                    }
                }
            }
            this.state.continuousPos -= this.parent.state.speed;
            if (!blocked) { // used to be blocked but is now free
                this.state.paused = false;
                this.position.y = Math.ceil(this.state.continuousPos) - 0.5;
            }
        }
        this.updateShadow(this.parent);
    }

    updateShadow(parent) {
        let minDropDist = this.position.y + 9.5;
        for (let offset of this.state.offsets) {
            // check for blocks below
            for (let y = this.position.y + offset.y - 1; y > -10; y--) {
                if (parent.state.board[this.position.x + offset.x][y] !== undefined) {
                    // found the block it would intersect
                    if (this.position.y + offset.y - y - 1 < minDropDist) {
                        minDropDist = this.position.y + offset.y - y - 1;
                    }
                    break;
                }
            }
            minDropDist = Math.min(minDropDist, this.position.y + offset.y + 9.5);
        }
        // move down
        for (let i = 0; i < this.state.offsets.length; i++) {
            this.state.shadows[i].position.x = this.state.offsets[i].x;
            this.state.shadows[i].position.y = this.state.offsets[i].y - minDropDist;
            this.state.shadows[i].visible = true;
        }
    }

    hideShadow() {
        for (let shadow of this.state.shadows) {
            shadow.visible = false;
        }
    }

    blockArrow(key) {
        switch(key) {
            case 'ArrowRight':
            case 'd':
                for (let offset of this.state.offsets) {
                    if (this.position.x + offset.x < -4) {
                        return;
                    }
                    if (this.parent.state.board[this.position.x + offset.x - 1][this.position.y + offset.y] !== undefined) {
                        return;
                    }
                }
                this.position.x -= 1;
                break;
            case 'ArrowLeft':
            case 'a': 
                for (let offset of this.state.offsets) {
                    if (this.position.x + offset.x > 4) {
                        return;
                    }
                    if (this.parent.state.board[this.position.x + offset.x + 1][this.position.y + offset.y] !== undefined) {
                        return;
                    }
                }
                this.position.x += 1;
                break;
            case 'ArrowDown':
            case 's':
                for (let offset of this.state.offsets) {
                    if (this.position.y + offset.y < -9) {
                        return;
                    }
                    if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y - 1] !== undefined) {
                        return;
                    }
                }
                this.state.continuousPos -= 1;
                this.position.y -= 1;
                this.updateShadow(this.parent);
                break;
            case ' ':
            case 'x': 
                // drop and floor
                const dropDist = this.state.offsets[0].y - this.state.shadows[0].position.y;
                this.state.continuousPos -= dropDist;
                this.position.y -= dropDist;
                this.floor();
                break;
            case 'ArrowUp':
            case 'w': 
                if (this.state.shape > 1) {
                    const newOffsets = [];
                    for (let i = 0; i < this.state.offsets.length; i++) {
                        // update offsets
                        newOffsets[i] = {};
                        newOffsets[i].x = -1*this.state.offsets[i].y;
                        newOffsets[i].y = this.state.offsets[i].x;
                    }

                    // check for collisions
                    let collideRight = false;
                    let collideLeft = false;
                    let collideUp = false;
                    let collideDown = false;
                    for (let offset of newOffsets) {
                        if (this.position.x + offset.x < -4.5) { // check right
                            collideRight = true;
                        } else if (this.position.x + offset.x > 4.5) { // check left
                            collideLeft = true;
                        }

                        if (this.position.y + offset.y > 9.5) { // check up
                            collideUp = true;
                        } else if (this.position.y + offset.y < -9.5) { // check down
                            collideDown = true;
                        }

                        // check block collisions, but not if the block is currently in a wall collision
                        if (this.position.x + offset.x < -4.5 || this.position.x + offset.x > 4.5) continue;
                        if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y] !== undefined) {
                            if (offset.x < 0) collideRight = true;
                            if (offset.x > 0) collideLeft = true;
                            if (offset.y < 0) collideDown = true;
                            if (offset.y > 0) collideUp = true;
                        }
                    }

                    if (collideRight && collideLeft) return;
                    if (collideUp && collideDown) return;

                    if (collideRight) {
                        for (let offset of newOffsets) {
                            if (this.parent.state.board[this.position.x + offset.x + 1][this.position.y + offset.y] !== undefined) {
                                return;
                            }
                        }
                        this.position.x += 1;
                    } else if (collideLeft) {
                        for (let offset of newOffsets) {
                            if (this.parent.state.board[this.position.x + offset.x - 1][this.position.y + offset.y] !== undefined) {
                                return;
                            }
                        }
                        this.position.x -= 1;
                    }

                    if (collideDown) {
                        if (!collideLeft && !collideRight) {
                            for (let offset of newOffsets) {
                                if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y + 1] !== undefined) {
                                    return;
                                }
                            }
                            this.position.y += 1;
                            this.state.continuousPos += 1;
                        }
                    } else if (collideUp) { // pretty sure this is only needed for blocks at the very top
                        this.position.y -= 1;
                        this.state.continuousPos -= 1;
                    }

                    for (let i = 0; i < this.state.offsets.length; i++) {
                        // update offsets
                        this.state.offsets[i].x = newOffsets[i].x;
                        this.state.offsets[i].y = newOffsets[i].y;

                        // update relative positions
                        this.state.cubes[i].position.x = this.state.offsets[i].x;
                        this.state.cubes[i].position.y = this.state.offsets[i].y;
                    }
                } else if (this.state.shape == 1) { // I block
                    if (this.state.offsets[0].y == 0) { // horizontal becoming vertical
                        const newOffsets = [];
                        for (let i = 0; i < this.state.offsets.length; i++) {
                            // update offsets
                            newOffsets[i] = {};
                            newOffsets[i].x = 0;
                            newOffsets[i].y = this.state.offsets[i].x;
                        }

                        // check for collisions
                        let collideUp = false;
                        let collideDown = false;
                        let dist = 0;
                        for (let offset of newOffsets) {
                            if (this.position.y + offset.y > 9.5) { // check up
                                collideUp = true;
                            } else if (this.position.y + offset.y < -9.5) { // check down
                                collideDown = true;
                                dist++;
                            }

                            // check block collisions
                            if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y] !== undefined) {
                                if (offset.y > 0) collideUp = true;
                                if (offset.y < 0) { collideDown = true; dist++; }
                            }
                        }

                        if (collideUp && collideDown) return;
                        if (collideUp) {
                            for (let offset of newOffsets) {
                                if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y - 1] !== undefined) {
                                    return;
                                }
                            }
                            this.position.y -= 1;
                            this.state.continuousPos -= 1;
                        } else if (collideDown) {
                            for (let offset of newOffsets) {
                                if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y + dist] !== undefined) {
                                    return;
                                }
                            }
                            this.position.y += dist;
                            this.state.continuousPos += dist;
                        }

                        for (let i = 0; i < this.state.offsets.length; i++) {
                            // update offsets
                            this.state.offsets[i].x = newOffsets[i].x;
                            this.state.offsets[i].y = newOffsets[i].y;
    
                            // update relative positions
                            this.state.cubes[i].position.x = this.state.offsets[i].x;
                            this.state.cubes[i].position.y = this.state.offsets[i].y;
                        }
                    } else { // vertical becoming horizontal
                        const newOffsets = [];
                        for (let i = 0; i < this.state.offsets.length; i++) {
                            // update offsets
                            newOffsets[i] = {};
                            newOffsets[i].x = this.state.offsets[i].y;
                            newOffsets[i].y = 0;
                        }

                        // check for collisions
                        let collideLeft = false;
                        let collideRight = false;
                        let dist = 0;
                        for (let offset of newOffsets) {
                            if (this.position.x + offset.x > 4.5) { // check left
                                collideLeft = true;
                            } else if (this.position.x + offset.x < -4.5) { // check right
                                collideRight = true;
                                dist++;
                            }

                            // check block collisions, but not if the block is currently in a wall collision
                            if (this.position.x + offset.x < -4.5 || this.position.x + offset.x > 4.5) continue;
                            if (this.parent.state.board[this.position.x + offset.x][this.position.y + offset.y] !== undefined) {
                                if (offset.x > 0) collideLeft = true;
                                if (offset.x < 0) { collideRight = true; dist++; }
                            }
                        }

                        if (collideLeft && collideRight) return;
                        if (collideLeft) {
                            for (let offset of newOffsets) {
                                if (this.parent.state.board[this.position.x + offset.x - 1][this.position.y + offset.y] !== undefined) {
                                    return;
                                }
                            }
                            this.position.x -= 1;
                        } else if (collideRight) {
                            for (let offset of newOffsets) {
                                if (this.parent.state.board[this.position.x + offset.x + dist][this.position.y + offset.y] !== undefined) {
                                    return;
                                }
                            }
                            this.position.x += dist;
                        }

                        for (let i = 0; i < this.state.offsets.length; i++) {
                            // update offsets
                            this.state.offsets[i].x = newOffsets[i].x;
                            this.state.offsets[i].y = newOffsets[i].y;
    
                            // update relative positions
                            this.state.cubes[i].position.x = this.state.offsets[i].x;
                            this.state.cubes[i].position.y = this.state.offsets[i].y;
                        }
                    }
                }
                this.updateShadow(this.parent);
                break;
        }
    }

    dispose() {
        for (const cube of this.state.cubes) {
            cube.geometry.dispose();
            cube.material.dispose();
            for (const child of cube.children) {
                child.geometry && child.geometry.dispose();
                child.material && child.material.dispose();
            }
        }
    }
}

export default Block;
