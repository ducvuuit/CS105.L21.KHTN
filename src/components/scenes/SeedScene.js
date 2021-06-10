import { Scene, Color, TextGeometry, MeshPhongMaterial, Mesh, Font } from 'three';
import { Block, Floor, Grid } from 'objects';
import { BasicLights } from 'lights';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

class SeedScene extends Scene {
    constructor(gui, addGui) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            // gui related state
            gui: gui,
            Start: this.startGame.bind(this),
            Multiplayer: false,
            Powerups: false,
            Shape: 'Cube',
            Colors: 'Standard',
            // multiplayer related state
            started: false,
            gameOver: false,
            // block related state
            updateList: [],
            curBlock: undefined,
            nextBlock: undefined,
            holdBlock: undefined,
            switched: false, // did curBlock just get switched out from hold?
            board: [],
            // progress/score related state
            score: 0,
            highScore: 0,
            level: 1,
            rows: 0,
            speed: 0.02,
            rowPoints: [40, 100, 300, 1200],
        };

        // Add meshes to scene
        const floor = new Floor();
        const grid = new Grid();
        const lights = new BasicLights();
        this.add(floor, grid, lights);

        // create text stuff
        this.updateScoreKeeper();
        this.makeText();

        // Populate GUI if told to by app
        if (addGui) {

            this.state.gui.add(this.state, 'Multiplayer');
            this.state.gui.add(this.state, 'Powerups');
            this.state.gui.add(this.state, 'Shape', ['Cube', 'Sphere']);
            this.state.gui.add(this.state, 'Colors', ['Standard', 'Brick', 'Marble', 'Neon']);
            this.state.gui.add(this.state, 'Start');
        }
    }

    // start a new game
    startGame() {
        this.state.started = true; 
        this.state.gameOver = false; 
        this.state.score = 0;
        this.state.level = 1;
        this.state.rows = 0;
        this.state.speed = 0.02;
        this.state.switched = false;

        if (this.state.nextBlock != undefined) {
            this.state.curBlock = undefined;
            this.state.nextBlock = undefined;
            this.state.holdBlock = undefined;
            this.removeFromUpdateList();
        }

        // Create grid
        for (let i = -4.5; i < 5; i += 1) {
            if (this.state.board[i] == undefined) {
                this.state.board[i] = [];
            }
            for (let j = -9.5; j < 10; j += 1) {
                this.state.board[i][j] = undefined;
            }
        }

        // remove any blocks from previous game
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child instanceof Block) {
                this.remove(child);
                child.dispose();
            }
            else if (child.name == 'game_over' || child.name == 'score') {
                this.remove(child);
            }
        }

        this.updateScoreKeeper();
        this.addBlock();
        this.addBlock();
    }

    // one time: make next and hold text
    makeText() {
        const fontJson = require('three/examples/fonts/optimer_bold.typeface.json');
        const font = new Font(fontJson);

        const nextGeometry = new TextGeometry('Next:', {
            font: font,
            size: 1.5,
            height: 0.25,
            curveSegments: 10,
        });
        const nextMaterial = new MeshPhongMaterial({color: 0x8a2be2});
        const nextMesh = new Mesh(nextGeometry, nextMaterial);
        nextMesh.rotateY(Math.PI);
        nextMesh.position.x = 11;
        nextMesh.position.y = 8;
        nextMesh.name = 'next';
        this.add(nextMesh);
        nextGeometry.dispose();
        nextMaterial.dispose();

        const holdGeometry = new TextGeometry('Hold:', {
            font: font,
            size: 1.5,
            height: 0.25,
            curveSegments: 10,
        });
        const holdMaterial = new MeshPhongMaterial({color: 0xffff33});
        const holdMesh = new Mesh(holdGeometry, holdMaterial);
        holdMesh.rotateY(Math.PI);
        holdMesh.position.x = 11.5;
        holdMesh.position.y = 2;
        holdMesh.name = 'hold';
        this.add(holdMesh);
        holdGeometry.dispose();
        holdMaterial.dispose();
    }

    // add a new block, update next block to current block, start the block
    addBlock() {
        const newBlock = new Block(this);
        this.state.curBlock = this.state.nextBlock;
        this.state.curBlock && this.state.curBlock.start();
        this.state.nextBlock = newBlock;
        this.state.nextBlock.hideShadow();
        this.add(newBlock);
    }

    holdBlock() {
        if (this.state.switched) return; // don't allow switching a block out then in

        this.state.switched = true;
        this.removeFromUpdateList();
        this.state.curBlock.position.x = 9.5;
        this.state.curBlock.position.y = 0;
        this.state.curBlock.hideShadow();

        if (this.state.holdBlock === undefined) {
            this.state.holdBlock = this.state.curBlock;
            this.addBlock();
        } else {
            const temp = this.state.holdBlock;
            this.state.holdBlock = this.state.curBlock;
            this.state.curBlock = temp;
            this.state.curBlock.start();
        }
    }

    // check for game over
    gameOver() {
        const cur = this.state.curBlock;
        for (let offset of cur.state.offsets) {
            if (cur.position.y + offset.y > 9.5) {
                this.state.gameOver = true; 
                return true;
            }
        }
        return false;
    }

    endGame(text) {
        this.state.curBlock = undefined;
        this.state.nextBlock = undefined;
        this.state.holdBlock = undefined;
        this.removeFromUpdateList();

        const fontJson = require('three/examples/fonts/optimer_bold.typeface.json');
        const font = new Font(fontJson);

        let size = 5;
        let color = 0x87071c;
        let x_pos = 20;
        let score_pos = 12;
        if (this.state.Multiplayer) {
            size = 3;
            x_pos = 11;
            score_pos = 3;

            if (text == "YOU WIN") {
                color = 0xfcca03;
            }
        }

        const geometry = new TextGeometry(text, {
            font: font,
            size: size,
            height: 1,
            curveSegments: 10,
            bevelEnabled: false,
        });
        const material = new MeshPhongMaterial({color: color});
        const mesh = new Mesh(geometry, material);
        mesh.rotateY(Math.PI);
        mesh.position.x = x_pos;
        mesh.position.z = -5;
        mesh.name = 'game_over';

        const scoreGeo = new TextGeometry( String('Score: ' + this.state.score), {
            font: font,
            size: 3,
            height: 1,
            curveSegments: 10,
            bevelEnabled: false,
        });
        const materialScore = new MeshPhongMaterial({color: 0x097025});
        const meshScore = new Mesh(scoreGeo, materialScore);
        meshScore.position.x = score_pos;
        meshScore.position.y = -5;
        meshScore.name = 'score'

        mesh.add(meshScore);
        this.add(mesh);

        geometry.dispose();
        material.dispose();
        scoreGeo.dispose();
        materialScore.dispose();
    }

    // update the block once a block has stopped moving
    updateBlock() {
        // check for game over
        if (this.gameOver()) {
            this.state.curBlock = undefined;
            this.state.nextBlock = undefined;
            this.state.holdBlock = undefined;

            this.endGame("GAME OVER");
            return;
        }

        // update board with cubes
        const x = this.state.curBlock.position.x;
        const y = this.state.curBlock.position.y;
        for (let i = 0; i < this.state.curBlock.state.cubes.length; i++) {
            const offset = this.state.curBlock.state.offsets[i];
            this.state.board[x + offset.x][y + offset.y] = this.state.curBlock.state.cubes[i];
        }
        this.state.curBlock = undefined;
        this.state.switched = false;


        // remove blocks if necessary
        const [rowsCleared, rowsBelowCleared, flashTweens, cubes] = this.clearBlocks();

        // if any blocks removed, shift remaining blocks down
        if (rowsCleared > 0) {
            const fallTweens = this.shiftBlocks(rowsBelowCleared)

            // deal with tweens
            for (let j = -4.5; j < 5; j += 1) {
                // for every column only start the falling once
                let addedFall = false;
                for (let i = -9.5; i < 10; i += 1) {
                    const flashTween = flashTweens[j][i];
                    if (flashTween) { // there is a block disappearing there
                        if (!addedFall) {
                            flashTween[0].onComplete(() => {
                                cubes[j][i].parent.remove(cubes[j][i]);
                                cubes[j][i].geometry.dispose();
                                cubes[j][i].material.dispose();
                                for (const child of cubes[j][i].children) {
                                    child.geometry && child.geometry.dispose();
                                    child.material && child.material.dispose();
                                }
                                for (let fallTween of fallTweens[j]) {
                                    fallTween.start();
                                }
                            });
                            addedFall = true;
                        } else {
                            flashTween[0].onComplete(() => {
                                cubes[j][i].parent.remove(cubes[j][i]);
                                cubes[j][i].geometry.dispose();
                                cubes[j][i].material.dispose();
                                for (const child of cubes[j][i].children) {
                                    child.geometry && child.geometry.dispose();
                                    child.material && child.material.dispose();
                                }
                            });
                        }
                        
                        for (const tween of flashTween) {
                            tween.start();
                        }
                    }
                }
            }

            // update score
            this.state.rows += rowsCleared;
            this.state.score += this.state.rowPoints[rowsCleared-1]*this.state.level;
            if (parseInt(this.state.rows/10) > this.state.level - 1) {
                this.state.level += 1;
                this.state.speed += 0.01;
            }
            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
            }
            this.updateScoreKeeper();

        } else {
            this.addBlock();
        }
    }

    clearBlocks() {
        let rowsCleared = 0;
        let rowsBelowCleared = [];
        let flashTweens = [];
        let cubes = [];
        let powerups = [];

        // initialize number of rows cleared below each row
        for (let i = -9.5; i < 10; i += 1) {
            rowsBelowCleared[i] = 0;
        }

        for (let i = -4.5; i < 5; i += 1) {
            flashTweens[i] = [];
            cubes[i] = [];
            powerups[i] = [];
        }

        // for each row clear it if needed
        for (let i = -9.5; i < 10; i += 1) {
            let count = 0;
            for (let j = -4.5; j < 5; j += 1) {
                if (this.state.board[j][i] != undefined) {
                    count++;
                }
            }

            if (count == 10) { // row is cleared
                rowsCleared++;

                // clear row 
                for (let j = -4.5; j < 5; j += 1) {
                    const cube = this.state.board[j][i];
                    this.state.board[j][i] = undefined;
                    cubes[j][i] = cube;
                    flashTweens[j][i] = this.createFlashTween(cube);

                    // check for powerups and remember them
                    let powerupIndex = 0;
                    if (cube.parent.state.geo != 'Sphere') {
                        powerupIndex = 1;
                    }

                    if (cube.children[powerupIndex]) {
                        powerups[j][i] = cube.children[powerupIndex];
                    }

                }

                // add to number of rows cleared for every row above this row
                for (let k = i + 1; k < 10; k +=1) {
                    rowsBelowCleared[k]++;
                }
            }
        }

        // check powerups if a row has been cleared
        if (rowsCleared > 0) {
            for (let i = -9.5; i < 10; i += 1) {
                const bombCols = [];
                const bombPowerups = [];
                const otherPowerups = [];
                for (let j = -4.5; j < 5; j += 1) {
                    if (powerups[j][i]) {
                        if (powerups[j][i].state.type == 2) {
                            bombPowerups.push(powerups[j][i]);
                            bombCols[powerups[j][i]] = j;
                        } else {
                            otherPowerups.push(powerups[j][i]);
                        }
                    }
                }

                for (let powerup of otherPowerups) { 
                    const ret = powerup.execute(0, 'col');
                    if (ret !== undefined) {
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

                for (let powerup of bombPowerups) {
                    const ret = powerup.execute(bombCols[powerup], 'col');
                    if (ret !== undefined) {
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
            rowsCleared = rowsBelowCleared[9.5];
        }

        return [rowsCleared, rowsBelowCleared, flashTweens, cubes];
    }

    shiftBlocks(rowsBelowCleared) {
        // shift all remaining blocks down if necessary
        let madeTween = false;
        const fallTweens = [];
        for (let j = -4.5; j < 5; j += 1) {
            fallTweens[j] = [];
        }

        for (let i = -9.5; i < 10; i += 1) {
            if (rowsBelowCleared[i] > 0) { // there are blocks in this row to be shifted down
                for (let j = -4.5; j < 5; j += 1) {
                    const cube = this.state.board[j][i];
                    if (cube != undefined) { // block exists in this square
                        const fallTween = this.createFallTween(cube, rowsBelowCleared[i]);
                        if (!madeTween) {
                            fallTween.onComplete(this.addBlock.bind(this));
                            madeTween = true;
                        }
                        fallTweens[j].push(fallTween);
                    }
                    this.state.board[j][i - rowsBelowCleared[i]] = cube;
                }
            }
        }

        return fallTweens;
    }

    createFlashTween(cube) {
        const flash = new TWEEN.Tween(cube.material).to({opacity: 0.0}, 700).easing(TWEEN.Easing.Linear.None);
        const flashColor = new TWEEN.Tween(cube.material.color).to({r: 1.0, g: 1.0, b: 1.0}, 500).easing(TWEEN.Easing.Linear.None);
        const flashTweens = [flash, flashColor];
        let powerupIndex = 0;
        if (cube.parent.state.geo != 'Sphere') {
            powerupIndex = 1;
            const flashEdge = new TWEEN.Tween(cube.children[0].material).to({opacity: 0.0}, 700).easing(TWEEN.Easing.Linear.None);
            flashTweens.push(flashEdge);
        }
                    
        if (cube.children[powerupIndex]) {
            const powerupMesh = cube.children[powerupIndex].children[0];
            const flashPowerup = new TWEEN.Tween(powerupMesh.material).to({opacity: 0.0}, 700).easing(TWEEN.Easing.Linear.None);
            flashTweens.push(flashPowerup);
        }

        return flashTweens;
    }

    createFallTween(cube, dist) {
        return new TWEEN.Tween(cube.position).to({y: cube.position.y - dist}, 300).easing(TWEEN.Easing.Quadratic.In);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    removeFromUpdateList() {
        this.state.updateList.shift();
    }

    update(timeStamp) {
        const { updateList } = this.state;

        if (this.state.Colors == "Neon") {
            this.background = undefined;
        }
        else {
            this.background = new Color(0x7ec0ee);
        }
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }

        // update Tweens
        TWEEN.update();
    }

    arrow(key) {
        if (key == 'Shift' || key == 'z') this.state.curBlock && this.holdBlock();
        else if (this.state.curBlock != undefined) this.state.curBlock.blockArrow(key);
    }

    // update visible score
    updateScoreKeeper() {
        const fontJson = require('three/examples/fonts/optimer_bold.typeface.json');
        const font = new Font(fontJson);

        const text = String('High Score: ' + this.state.highScore + '\nScore    : ' + this.state.score + '\nLevel: ' + this.state.level);
        const geometry = new TextGeometry(text, {
            font: font,
            size: 1,
            height: 0.25,
            curveSegments: 10,
            bevelEnabled: false,
        });

        const material = new MeshPhongMaterial({color: 0x1106a1});
        const mesh = new Mesh(geometry, material);
        mesh.rotateY(Math.PI);
        mesh.position.x = -7;
        mesh.position.y = 9;

        if (this.scoreKeeper != undefined) this.remove(this.scoreKeeper);
        this.scoreKeeper = mesh;
        this.add(mesh);
        geometry.dispose();
        material.dispose();
    }
}

export default SeedScene;
