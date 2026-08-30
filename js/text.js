/* ==========================================================
   Happy New Year AR
   text.js
   Version 4 (1文字ずつ生成・自前スペーシング版)

   ※ 単語をまとめてgetPathする方式(Version3)で、
      フォント内部の文字送り幅データが原因と疑われる
      文字重なり/文字欠けが発生したため、
      1文字ずつ個別に生成し、間隔は自前で計算する方式に
      戻した。フォント側のデータが壊れていても影響を受けない。
========================================================== */

"use strict";

/* ==========================================================
   Global
========================================================== */

let textRoot = null;

let font = null;

const textGroups = {

    happy: null,
    new: null,
    year: null

};

const TEXT_COLOR = 0xf5d46b;

const TEXT_METALNESS = 0.85;

const TEXT_ROUGHNESS = 0.18;

const TEXT_DEPTH = 0.08;

// フォントサイズ = シーン上のメートル値をそのまま使う
const TEXT_SIZE = 0.10;

// 文字と文字の間隔(フォント内部の送り幅データに頼らず、
// ここで固定値として管理する)
const LETTER_SPACING = 0.077;

const BEVEL_THICKNESS = 0.003;

const BEVEL_SIZE = 0.002;

// 1文字ごとの登場ディレイ(ミリ秒)
const LETTER_DELAY = 80;


/* ==========================================================
   Base Material
   ※ 各文字はこれを clone() して使う(共有禁止)
========================================================== */

const baseMaterial = new THREE.MeshStandardMaterial({

    color: TEXT_COLOR,

    metalness: TEXT_METALNESS,

    roughness: TEXT_ROUGHNESS,

    envMapIntensity: 1.6,

    emissive: 0x5c4400,

    emissiveIntensity: 0.35

});


/* ==========================================================
   Ready State
   (main.js がフォント読み込み完了を待てるようにする)
========================================================== */

let resolveTextReady;

const textReadyPromise = new Promise((resolve) => {

    resolveTextReady = resolve;

});


/* ==========================================================
   Initialize
========================================================== */

window.addEventListener("DOMContentLoaded", async () => {

    textRoot = document.querySelector("#textRoot");

    if (!textRoot) {

        console.error("textRoot Not Found");

        resolveTextReady();

        return;

    }

    try {

        await loadFont();

        buildAllText();

    } catch (error) {

        console.error("Text Build Failed", error);

    } finally {

        resolveTextReady();

    }

});


/* ==========================================================
   Font Loader
========================================================== */

// ★検証用: フォント切り分けテスト中だった。
// 1文字ずつ生成方式に戻したことでフォント側の送り幅データに
// 依存しなくなったため、oshigo.otfへ復帰する。
const FONT_URL = "fonts/oshigo.otf";

async function loadFont() {

    return new Promise((resolve, reject) => {

        opentype.load(

            FONT_URL,

            function(error, loadedFont) {

                if (error) {

                    console.error(error);

                    reject(error);

                    return;

                }

                font = loadedFont;

                console.log("Font Loaded");

                resolve();

            }

        );

    });

}


/* ==========================================================
   opentype.js の Path → Three.js の Shapes へ変換
   ※ opentype.js の Path オブジェクトには toShapes() が無い。
      toShapes() は Three.js の ShapePath 側のメソッドなので、
      commands(M/L/C/Q/Z)を手動でShapePathに描き直す。
========================================================== */

function opentypePathToShapes(otPath) {

    const shapePath = new THREE.ShapePath();

    otPath.commands.forEach((cmd) => {

        switch (cmd.type) {

            case "M":

                shapePath.moveTo(cmd.x, cmd.y);

                break;

            case "L":

                shapePath.lineTo(cmd.x, cmd.y);

                break;

            case "C":

                shapePath.bezierCurveTo(

                    cmd.x1, cmd.y1,

                    cmd.x2, cmd.y2,

                    cmd.x, cmd.y

                );

                break;

            case "Q":

                shapePath.quadraticCurveTo(

                    cmd.x1, cmd.y1,

                    cmd.x, cmd.y

                );

                break;

            case "Z":

                shapePath.currentPath.closePath();

                break;

        }

    });

    return shapePath.toShapes(false);

}


/* ==========================================================
   Build All
========================================================== */

// 文字ブロック全体を年賀状の上部に寄せるためのオフセット
const TEXT_TOP_OFFSET = 0.55;

// 弧の半径(小さいほど強くカーブする)
const ARC_RADIUS = 1.0;

// スペースの幅(文字と同じ間隔を流用)
const SPACE_WIDTH = LETTER_SPACING;

let archGroup = null;

function buildAllText() {

    if (!font) {

        console.error("Font Not Loaded");

        return;

    }

    archGroup = new THREE.Group();

    archGroup.position.set(0, TEXT_TOP_OFFSET, 0);

    // タップ吹き出しと同様、カード面に対して少し起こす
    archGroup.rotation.x = THREE.MathUtils.degToRad(40);

    textRoot.object3D.add(archGroup);

    const PHRASE = "Happy New Year!";

    const chars = Array.from(PHRASE);

    //------------------------------------------------------
    // まず直線上での各文字の位置を計算(中央揃えのため)
    //------------------------------------------------------

    const offsets = [];

    let cursor = 0;

    chars.forEach((ch) => {

        offsets.push(cursor);

        cursor += (ch === " ") ? SPACE_WIDTH : LETTER_SPACING;

    });

    const totalWidth = cursor - LETTER_SPACING;

    //------------------------------------------------------
    // 直線上の位置を弧の上の位置・角度に変換して配置
    //------------------------------------------------------

    const happyLetters = [];

    const newLetters = [];

    const yearLetters = [];

    chars.forEach((ch, i) => {

        if (ch === " ") {

            return;

        }

        const linearX = offsets[i] - totalWidth / 2;

        const angle = linearX / ARC_RADIUS;

        const mesh = createLetter(ch);

        mesh.position.x = ARC_RADIUS * Math.sin(angle);

        mesh.position.y = -ARC_RADIUS * (1 - Math.cos(angle));

        // 弧の接線に合わせて傾ける
        // (rotation.zへの直接代入だと、基準姿勢のX=180度回転との
        //  組み合わせで向きが分かりにくくなるため、現在の向きに対する
        //  相対回転(rotateZ)で追加する)

        mesh.rotateZ(angle);

        archGroup.add(mesh);

        if (i < 5) {

            happyLetters.push(mesh);

        } else if (i < 9) {

            newLetters.push(mesh);

        } else {

            yearLetters.push(mesh);

        }

    });

    textGroups.happy = { letters: happyLetters };

    textGroups.new = { letters: newLetters };

    textGroups.year = { letters: yearLetters };

}


/* ==========================================================
   Create Letter
========================================================== */

function createLetter(character) {

    const path = font.getPath(

        character,

        0,

        0,

        TEXT_SIZE

    );

    const shapes = opentypePathToShapes(path);

    const geometry = new THREE.ExtrudeGeometry(

        shapes,

        {

            depth: TEXT_DEPTH,

            bevelEnabled: true,

            bevelThickness: BEVEL_THICKNESS,

            bevelSize: BEVEL_SIZE,

            bevelOffset: 0,

            bevelSegments: 6,

            curveSegments: 18

        }

    );

    geometry.computeBoundingBox();

    geometry.center();

    geometry.computeVertexNormals();

    const material = baseMaterial.clone();

    const mesh = new THREE.Mesh(

        geometry,

        material

    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    // 年賀状を正面からかざす想定。マーカーのローカルY軸が
    // 画像座標系(下向き正)のため、フォント座標系(上向き正)との
    // ズレを解消するためX軸を180度回転させる

    mesh.rotation.set(Math.PI, 0, 0);

    mesh.scale.set(0, 0, 0);

    return mesh;

}


/* ==========================================================
   Build Word
   1文字ずつ生成し、間隔は自前のLETTER_SPACINGで配置する
========================================================== */

/* ==========================================================
   Reset
========================================================== */

function resetWord(word) {

    if (!word) {

        return;

    }

    word.letters.forEach((mesh) => {

        mesh.scale.set(0, 0, 0);

    });

}


/* ==========================================================
   Reset All
========================================================== */

function resetText() {

    resetWord(textGroups.happy);

    resetWord(textGroups.new);

    resetWord(textGroups.year);

}


/* ==========================================================
   Animation Setting
========================================================== */

const BOUNCE_DURATION = 650;


/* ==========================================================
   Public Functions
========================================================== */

function showHappy() {

    playWord(textGroups.happy);

}


function showNew() {

    playWord(textGroups.new);

}


function showYear() {

    playWord(textGroups.year);

}


/* ==========================================================
   Play Word
   1文字ずつ、少しタイミングをずらしながらポップさせる
========================================================== */

function playWord(word) {

    if (!word) {

        return;

    }

    word.letters.forEach((mesh, index) => {

        popLetter(mesh, index);

    });

}


function popLetter(mesh, index) {

    const delay = index * LETTER_DELAY;

    mesh.scale.set(0, 0, 0);

    mesh.position.z = -0.08;

    mesh.rotation.x = THREE.MathUtils.degToRad(165);

    //------------------------------------------------------
    // ボヨヨン
    //------------------------------------------------------

    anime({

        targets: mesh.scale,

        x: [0, 1.35, 0.88, 1.08, 1],

        y: [0, 1.35, 0.88, 1.08, 1],

        z: [0, 1.35, 0.88, 1.08, 1],

        delay: delay,

        duration: BOUNCE_DURATION,

        easing: "easeOutElastic(1,.65)"

    });

    //------------------------------------------------------
    // 少し前へ
    //------------------------------------------------------

    anime({

        targets: mesh.position,

        z: [-0.08, 0.03, 0],

        delay: delay,

        duration: 420,

        easing: "easeOutBack"

    });

    //------------------------------------------------------
    // 起き上がる
    //------------------------------------------------------

    anime({

        targets: mesh.rotation,

        x: [

            THREE.MathUtils.degToRad(165),

            THREE.MathUtils.degToRad(186),

            THREE.MathUtils.degToRad(180)

        ],

        delay: delay,

        duration: 600,

        easing: "easeOutBack"

    });

    //------------------------------------------------------
    // 少し光る(自分専用のmaterialなので他の文字に影響しない)
    //------------------------------------------------------

    anime({

        targets: mesh.material,

        emissiveIntensity: [0.12, 0.65, 0.12],

        delay: delay,

        duration: 450,

        easing: "easeOutQuad"

    });

}


/* ==========================================================
   Hide
========================================================== */

function hideAllText() {

    resetText();

}


/* ==========================================================
   Marker Lost
========================================================== */

function resetAnimation() {

    hideAllText();

}


/* ==========================================================
   Dispose
========================================================== */

function disposeText() {

    Object.values(textGroups).forEach((word) => {

        if (!word) {

            return;

        }

        word.letters.forEach((mesh) => {

            if (mesh.geometry) {

                mesh.geometry.dispose();

            }

            if (mesh.material) {

                mesh.material.dispose();

            }

        });

    });

    if (archGroup && archGroup.parent) {

        archGroup.parent.remove(archGroup);

    }

    archGroup = null;

}


/* ==========================================================
   Rebuild
========================================================== */

function rebuildText() {

    disposeText();

    buildAllText();

}


/* ==========================================================
   Public
========================================================== */

window.showHappy = showHappy;

window.showNew = showNew;

window.showYear = showYear;

window.hideAllText = hideAllText;

window.resetAnimation = resetAnimation;

window.rebuildText = rebuildText;

window.waitForTextReady = function() {

    return textReadyPromise;

};
