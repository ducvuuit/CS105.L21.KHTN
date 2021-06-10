/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import * as Dat from 'dat.gui';
import { WebGLRenderer, PerspectiveCamera, Vector2, MeshBasicMaterial  } from 'three';
import { ShaderMaterial, Layers, ReinhardToneMapping, NoToneMapping } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';
import { Block, Powerup } from 'objects';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';


let multiplayer = false;
const gui = new Dat.GUI(); // shared gui

// Initialize core ThreeJS components
const sceneL = new SeedScene(gui, false), sceneR = new SeedScene(gui, true);
const cameraL = new PerspectiveCamera(), cameraR = new PerspectiveCamera();
const renderer = new WebGLRenderer({antialias: true});

// Set up camera
cameraL.position.set(0, 0, -30);
cameraL.lookAt(0, 0, 0);

cameraR.position.set(0, 0, -30);
cameraR.lookAt(0, 0, 0);

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);

// canvas
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
const controlsL = new OrbitControls(cameraL, canvas);
controlsL.enableDamping = true;
controlsL.enablePan = false;
controlsL.enableZoom = true;
controlsL.minDistance = 10;
controlsL.maxDistance = 50;
controlsL.minPolarAngle = 0;
controlsL.maxPolarAngle = Math.PI/2 + 0.05;
controlsL.update();

const controlsR = new OrbitControls(cameraR, canvas);
controlsR.enableDamping = true;
controlsR.enablePan = false;
controlsR.enableZoom = true;
controlsR.minDistance = 10;
controlsR.maxDistance = 50;
controlsR.minPolarAngle = 0;
controlsR.maxPolarAngle = Math.PI/2 + 0.05;
controlsR.update();

renderer.setScissorTest(true);

// bloom stuff
const bloomLayer = new Layers();
bloomLayer.set(1);
const darkMaterial = new MeshBasicMaterial({color: 'black'});
const materials = {};
const params = {
    exposure: 0,
	bloomStrength: 1,
	bloomThreshold: 0,
	bloomRadius: 3
};

// regular render pass
const renderSceneL = new RenderPass(sceneL, cameraL);
const renderSceneR = new RenderPass(sceneR, cameraR);

// bloom pass
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

// bloom composers
const bloomComposerL = new EffectComposer(renderer);
bloomComposerL.renderToScreen = false;
bloomComposerL.addPass(renderSceneL);
bloomComposerL.addPass(bloomPass);

const bloomComposerR = new EffectComposer(renderer);
bloomComposerR.renderToScreen = false;
bloomComposerR.addPass(renderSceneR);
bloomComposerR.addPass(bloomPass);

// final pass
const makeFinalPass = (bloomComposer) => {
    const finalPass = new ShaderPass(
        new ShaderMaterial({
            uniforms: {
                baseTexture: {value: null},
                bloomTexture: {value: bloomComposer.renderTarget2.texture}
            },
            vertexShader: [
                "varying vec2 vUv;",
                "void main() {",
                    "vUv = uv;",
                    "gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0);",
                "}"
            ].join( "\n" ),
           fragmentShader: [
            "uniform sampler2D baseTexture;",
            "uniform sampler2D bloomTexture;",
            "varying vec2 vUv;",
            "vec4 getTexture(sampler2D texelToLinearTexture) {",
                "return mapTexelToLinear(texture2D(texelToLinearTexture, vUv));",
            "}",
            "void main() {",
                "gl_FragColor = (getTexture(baseTexture) + vec4(1.0) * getTexture(bloomTexture));",
            "}"
           ].join( "\n" ),
            defines: {}
        }), "baseTexture"
    );
    finalPass.needsSwap = true;
    return finalPass;
}

// final composer
const finalComposerL = new EffectComposer(renderer);
const finalComposerR = new EffectComposer(renderer);
finalComposerL.addPass(renderSceneL);
finalComposerR.addPass(renderSceneR);
finalComposerL.addPass(makeFinalPass(bloomComposerL));
finalComposerR.addPass(makeFinalPass(bloomComposerR));

// set all Block objects to bloom layer
const findBlocks = (obj) => {
    if (obj instanceof Block || obj instanceof Powerup) {
        obj.layers.enable(1);
        for (const child of obj.children) {
            child.layers.enable(1);
        }
    }
}

// temporarily set all non bloom layer objects to black
const darkenNonBloomed = (obj) => {
    if (bloomLayer.test(obj.layers) === false) {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
    }
}

// restore non bloom layer materials
const restoreMaterial = (obj) => {
    if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
    }
}

const renderScene = (neon, scene, camera, bloomComposer, finalComposer) => {
    if (neon) {
        renderer.toneMapping = ReinhardToneMapping;
        scene.traverse(findBlocks);
        scene.traverse(darkenNonBloomed);
        bloomComposer.render();
        scene.traverse(restoreMaterial);
        finalComposer.render();
    } else {
        renderer.toneMapping = NoToneMapping;
        renderer.render(scene, camera);
    }
}

// changes made to scene if there are 2 players
const handleMultiplayer = () => {
    // check for winner
    if (sceneR.state.gameOver) {
        sceneL.endGame("YOU WIN"); 
    } else if (sceneL.state.gameOver) {
        sceneR.endGame("YOU WIN"); 
    }

    // start games together
    if (sceneR.state.started) {
        sceneL.startGame();
        sceneR.state.started = false;
    }
}

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    // check if multiplayer setting has changed and resize window
    if (multiplayer != sceneR.state.Multiplayer) {
        multiplayer = sceneR.state.Multiplayer;
        windowResizeHandler();
    }

    // always render right scene
    let left = 0; 
    let width = window.innerWidth; 
    if (multiplayer) {
        left = window.innerWidth/2;
        width = window.innerWidth/2;
    }
    renderer.setScissor(left, 0, width, window.innerHeight);
    renderer.setViewport(left, 0, width, window.innerHeight);

    controlsR.update();
    renderScene(sceneR.state.Colors == "Neon", sceneR, cameraR, bloomComposerR, finalComposerR);
    sceneR.update && sceneR.update(timeStamp);

    // render left if multiplayer
    if (multiplayer) {
        renderer.setScissor(0, 0, window.innerWidth/2, window.innerHeight);
        renderer.setViewport(0, 0, window.innerWidth/2, window.innerHeight);

        // make sure scenes are in sync
        sceneL.state.Multiplayer = sceneR.state.Multiplayer; 
        sceneL.state.Powerups = sceneR.state.Powerups; 
        sceneL.state.Shape = sceneR.state.Shape; 
        sceneL.state.Colors = sceneR.state.Colors;

        controlsL.update();
        renderScene(sceneR.state.Colors == "Neon", sceneL, cameraL, bloomComposerL, finalComposerL);
        sceneL.update && sceneL.update(timeStamp);

        // deal with multiplayer updates
        handleMultiplayer();
    }

    // continue render loop
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;

    // set sizes of composers
    renderer.setSize(innerWidth, innerHeight);
    if (multiplayer) {
        bloomComposerL.setSize(innerWidth/2, innerHeight/2);
        finalComposerL.setSize(innerWidth/2, innerHeight/2);
        bloomComposerR.setSize(innerWidth/2, innerHeight/2);
        finalComposerR.setSize(innerWidth/2, innerHeight/2);
    } else {
        bloomComposerR.setSize(innerWidth, innerHeight);
        finalComposerR.setSize(innerWidth, innerHeight);
    }

    // update cameras
    cameraL.aspect = innerWidth / (2 * innerHeight);
    cameraL.updateProjectionMatrix();
    if (multiplayer) {
        cameraR.aspect = innerWidth / (2 * innerHeight);
        cameraR.updateProjectionMatrix();
    } else {
        cameraR.aspect = innerWidth / (innerHeight);
        cameraR.updateProjectionMatrix();
    }
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

// Key handler
const windowKeyHandler = (event) => {
    const keysR = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Shift']
    const keysL = ['w', 'a', 's', 'd', 'x', 'z']
    if (keysR.includes(event.key)) {
        sceneR.arrow(event.key); 
    }   
    if (keysL.includes(event.key)) {
        sceneL.arrow(event.key); 
    }
};
window.addEventListener('keydown', windowKeyHandler, false);