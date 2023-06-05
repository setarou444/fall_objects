const body_element = document.getElementsByTagName('body')[0];
//canvas タグを作成
const new_element = document.createElement('canvas');
new_element.setAttribute('id', 'myExtension-Canvas');
body_element.appendChild(new_element);

const tec1 = chrome.runtime.getURL('img/snowflake1.png');
const tec2 = chrome.runtime.getURL('img/cherytest.png');

//manifestでweb_accessible_resourcesを使用して実際のページに埋め込む
// const injectScript = (filePath, tag) => {
//     var node = document.getElementsByTagName(tag)[0];
//     var script = document.createElement('script');
//     script.setAttribute('type', 'text/javascript');
//     script.setAttribute('src', filePath);
//     node.appendChild(script);
// }
// injectScript(chrome.runtime.getURL('js/three.min.js'), 'body');


var fall_state;
var params = {
    snowfall: 1
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

window.addEventListener('load', init);
function init() {
    let flag = false;
    let anime_id;

    const UPDATE_LOAD_COEFF = 0.5;
    const fps = 30;

    let targetInterval = 1000 / fps;
    let prevTime = window.performance.now() - targetInterval;

    // 視野角をラジアンに変換
    const fov = 45;
    const fovRad = (fov / 2) * (Math.PI / 180);
    // カメラ距離を求める
    let distance = (window.innerHeight / 2) / Math.tan(fovRad);

    //読み込みが終了してからでないファイルが参照できないのでthree.jsを継承できない
    class SnowFlakes extends THREE.Object3D {
        constructor() {
            super();
            this.fallList = [];
            this.angle = 0;

            let length = params.snowfall; //雪の数

            let geometry = new THREE.BufferGeometry();

            let materials = [];

            const textureLoader = new THREE.TextureLoader();

            let sprite1;
            let sprite2;
            let sprite3;
            let sprite4;
            let sprite5;

            if (fall_state === 'snow') {
                sprite1 = textureLoader.load(tec1);
                sprite2 = textureLoader.load(tec1);
                sprite3 = textureLoader.load(tec1);
                sprite4 = textureLoader.load(tec1);
                sprite5 = textureLoader.load(tec1);
            }
            else {
                sprite1 = textureLoader.load(tec2);
                sprite2 = textureLoader.load(tec2);
                sprite3 = textureLoader.load(tec2);
                sprite4 = textureLoader.load(tec2);
                sprite5 = textureLoader.load(tec2);
            }

            let vertices = [];
            //落下物の生成位置
            for (let i = 0; i < length; i++) {
                const x = getRandom(0, 500);
                const y = 500;
                const z = getRandom(0, 500);
                vertices.push(x, y, z);
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const parameters = [
                ["#FFFFFF", sprite1, getRandom(10, 10)],
                ["#FFFFFF", sprite2, getRandom(10, 15)],
                ["#FFFFFF", sprite3, getRandom(10, 15)],
                ["#FFFFFF", sprite4, getRandom(5, 10)],
                ["#FFFFFF", sprite5, getRandom(5, 10)]
            ];

            for (let i = 0; i < parameters.length; i++) {
                const sprite = parameters[i][1];
                const size = parameters[i][2];
                materials[i] = new THREE.PointsMaterial({
                    size: size,
                    map: sprite,
                    blending: THREE.AdditiveBlending,
                    depthTest: false,
                    transparent: true
                });

                let particles = new THREE.Points(geometry, materials[i]);
                particles.rotation.x = Math.random() * 360;
                particles.rotation.y = Math.random() * 360;
                particles.rotation.z = Math.random() * 360;
                particles.vx = 0;
                particles.vy = 0;
                particles.material.opacity = 1;

                this.add(particles);
                this.fallList.push(particles);
            }
        }

        update() {
            this.angle += 0.001;

            for (var i = 0; i < this.fallList.length; i++) {
                this.fallList[i].material.opacity += 0.01;
                this.fallList[i].vy -= 1;
                this.fallList[i].vx = Math.sin(this.angle) * Math.cos(this.angle) * 10;

                this.fallList[i].vx *= 0.2;
                this.fallList[i].vy *= 0.6;

                this.fallList[i].position.x += this.fallList[i].vx;
                this.fallList[i].position.y += this.fallList[i].vy;

                //画面外に出た時の処理
                if (this.fallList[i].position.y < -1000) {
                    this.fallList[i].material.opacity += 0.1;
                    this.remove(this.fallList[i]);
                    this.fallList.splice(i, 1);
                    i -= 1;
                }
            }
        }
    }

    let meshList = [];
    //レンダーの背景に透過を設定するためにalphaオプションをtrueに設定
    let renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#myExtension-Canvas'),
        alpha: true,
    });
    //canvas要素の解像度を設定。最低の1にしてフレームレートを安定させるようにする
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);


    //カメラの範囲が画面いっぱいになるようにカメラ位置を調整
    let camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = distance;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    let scene = new THREE.Scene();
    //シーンでの背景色は設定しない。設定してしまうとレンダーの背景色が反映されなくなる
    scene.background = null;

    window.addEventListener('resize', function () {
        onWindowResize(camera, renderer);
    }, false);

    // tick();
    function tick() {
        let currentTime = window.performance.now();
        let updated = false;

        const mesh = new SnowFlakes();
        if (!flag) {
            //アニメーションループの停止
            cancelAnimationFrame(anime_id);
            //レンダーの背景色を透明でクリア
            renderer.setClearColor(0x000000, 0);
            renderer.clear();

            scene.remove(mesh);
            removeObjectsWithChildren(scene);
            meshList.splice(0, meshList.length);
            return;
        }

        //fpsよりも更新回数が遅かった場合に抜けている更新分を補完する
        while (currentTime - prevTime > targetInterval * 0.5) {
            for (let i = 0; i < meshList.length; i++) {
                meshList[i].update();
            }
            updated = true;
            prevTime += targetInterval;
            const now = window.performance.now();
            const updateTime = now - currentTime;
            if (updateTime > targetInterval * UPDATE_LOAD_COEFF) {
                if (prevTime < now - targetInterval) {
                    prevTime = now - targetInterval;
                }
                break;
            }
        }

        //fpsに合わせて追加及びレンダリング
        if (updated) {
            scene.add(mesh);
            meshList.push(mesh);
            renderer.render(scene, camera);
        }

        //ブラウザの描画タイミングで呼ばれる。
        //ディスプレイのリフレッシュレートに合わせて行われる
        anime_id = requestAnimationFrame(tick);
    }

    //ウインドウリサイズ処理
    function onWindowResize(camera, renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        distance = (window.innerHeight / 2) / Math.tan(fovRad);
        camera.position.z = distance;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //オブジェクトを開放してメモリリークを防ぐ
    function removeObjectsWithChildren(obj) {

        if (obj.children.length > 0) {
            for (var x = obj.children.length - 1; x >= 0; x--) {
                removeObjectsWithChildren(obj.children[x]);
            }
        }

        if (obj.geometry) {
            obj.geometry.dispose();
        }

        if (obj.material) {
            if (obj.material.length) {
                for (let i = 0; i < obj.material.length; ++i) {

                    if (obj.material[i].map) obj.material[i].map.dispose();
                    if (obj.material[i].lightMap) obj.material[i].lightMap.dispose();
                    if (obj.material[i].bumpMap) obj.material[i].bumpMap.dispose();
                    if (obj.material[i].normalMap) obj.material[i].normalMap.dispose();
                    if (obj.material[i].specularMap) obj.material[i].specularMap.dispose();
                    if (obj.material[i].envMap) obj.material[i].envMap.dispose();

                    obj.material[i].dispose()
                }
            }
            else {
                if (obj.material.map) obj.material.map.dispose();
                if (obj.material.lightMap) obj.material.lightMap.dispose();
                if (obj.material.bumpMap) obj.material.bumpMap.dispose();
                if (obj.material.normalMap) obj.material.normalMap.dispose();
                if (obj.material.specularMap) obj.material.specularMap.dispose();
                if (obj.material.envMap) obj.material.envMap.dispose();

                obj.material.dispose();
            }
        }

        obj.removeFromParent();

        return true;
    }

    //メッセージ受信
    chrome.runtime.onMessage.addListener((request, options) => {
        if (request.name === 'displayUrl:contentScripts') {
            fall_state = request.data.fall;
            if (!flag) {
                flag = true;
                //レンダーの背景色を黒で透過率2％に設定
                renderer.setClearColor(0x000000, 0.3);
                prevTime = window.performance.now() - targetInterval;
                tick();
            }
            else {
                flag = false;
            }
        }
    });
}

