/* ==========================================================
   Happy New Year AR
   text.js
   Version 3 (単語単位で生成する版)
========================================================== */

"use strict";

/* ==========================================================
   Global
========================================================== */

let textRoot = null;

let font = null;

const textMeshes = {

    happy: null,
    new: null,
    year: null

};

const TEXT_COLOR = 0xf5d46b;

const TEXT_METALNESS = 1.0;

const TEXT_ROUGHNESS = 0.22;

const TEXT_DEPTH = 0.18;

// フォントサイズ = シーン上のメートル値をそのまま使う
// (旧版は TEXT_SIZE * 100 を渡していたため、
//  文字ジオメトリだけが実寸の約100倍で生成され、
//  配置座標(0.1〜0.4m台)と一致しないバグがあった)
const TEXT_SIZE = 0.22;

const LINE_SPACING = 0.42;

const BEVEL_THICKNESS = 0.015;

const BEVEL_SIZE = 0.010;


/* ==========================================================
   Base Material
   ※ 各単語はこれを clone() して使う(共有禁止)
========================================================== */

const baseMaterial = new THREE.MeshStandardMaterial({

    color: TEXT_COLOR,

    metalness: TEXT_METALNESS,

    roughness: TEXT_ROUGHNESS,

    envMapIntensity: 1.6,

    emissive: 0x3d2d00,

    emissiveIntensity: 0.12

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

async function loadFont() {

    return new Promise((resolve, reject) => {

        opentype.load(

            "fonts/oshigo.otf",

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
   Build All
========================================================== */

function buildAllText() {

    textMeshes.happy = buildWord(

        "Happy",

        0

    );

    textMeshes.new = buildWord(

        "New",

        -LINE_SPACING

    );

    textMeshes.year = buildWord(

        "Year!",

        -LINE_SPACING * 2

    );

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

    return shapePath.toShapes(true);

}


/* ==========================================================
   Build Word
   単語まるごと1つのGeometry/Meshとして生成する
   (文字送り・カーニングはopentype.jsに任せる)
========================================================== */

function buildWord(word, y) {

    if (!font) {

        console.error("Font Not Loaded");

        return null;

    }

    //------------------------------------------------------
    // フォントパス取得(単語単位・1回だけ)
    //------------------------------------------------------

    const path = font.getPath(

        word,

        0,

        0,

        TEXT_SIZE

    );

    //------------------------------------------------------
    // Shape生成(opentypeのcommandsをThree.jsのShapePathへ変換)
    //------------------------------------------------------

    const shapes = opentypePathToShapes(path);

    //------------------------------------------------------
    // Geometry生成
    //------------------------------------------------------

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

    //------------------------------------------------------
    // 中央揃え
    //------------------------------------------------------

    geometry.computeBoundingBox();

    geometry.center();

    //------------------------------------------------------
    // 法線
    //------------------------------------------------------

    geometry.computeVertexNormals();

    //------------------------------------------------------
    // Material(単語ごとに独立させる)
    //------------------------------------------------------

    const material = baseMaterial.clone();

    //------------------------------------------------------
    // Mesh
    //------------------------------------------------------

    const mesh = new THREE.Mesh(

        geometry,

        material

    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    mesh.position.set(

        0,

        y,

        0

    );

    // 年賀状を正面からかざす想定のため、回転なしを基準姿勢とする
    // (旧値の-90/180度は一度も実機検証されていなかった暫定値だった)

    mesh.rotation.set(0, 0, 0);

    //------------------------------------------------------
    // 初期状態(非表示)
    //------------------------------------------------------

    mesh.scale.set(

        0,

        0,

        0

    );

    mesh.visible = false;

    textRoot.object3D.add(mesh);

    return mesh;

}


/* ==========================================================
   Reset
========================================================== */

function resetWord(mesh) {

    if (!mesh) {

        return;

    }

    mesh.visible = false;

    mesh.scale.set(

        0,

        0,

        0

    );

}


/* ==========================================================
   Reset All
========================================================== */

function resetText() {

    resetWord(textMeshes.happy);

    resetWord(textMeshes.new);

    resetWord(textMeshes.year);

}


/* ==========================================================
   Animation Setting
========================================================== */

const BOUNCE_DURATION = 650;


/* ==========================================================
   Public Functions
========================================================== */

function showHappy() {

    playWord(

        textMeshes.happy

    );

}


function showNew() {

    playWord(

        textMeshes.new

    );

}


function showYear() {

    playWord(

        textMeshes.year

    );

}


/* ==========================================================
   Play Word
   (旧popLetterの単語版。indexによるdelayは不要なので廃止)
========================================================== */

function playWord(mesh) {

    if (!mesh) {

        return;

    }

    mesh.visible = true;

    //------------------------------------------------------
    // 初期状態
    //------------------------------------------------------

    mesh.scale.set(

        0,

        0,

        0

    );

    mesh.position.z =

        -0.08;

    mesh.rotation.x =

        THREE.MathUtils.degToRad(

            -15

        );

    //------------------------------------------------------
    // ボヨヨン
    //------------------------------------------------------

    anime({

        targets: mesh.scale,

        x: [

            0,

            1.35,

            0.88,

            1.08,

            1

        ],

        y: [

            0,

            1.35,

            0.88,

            1.08,

            1

        ],

        z: [

            0,

            1.35,

            0.88,

            1.08,

            1

        ],

        duration: BOUNCE_DURATION,

        easing: "easeOutElastic(1,.65)"

    });

    //------------------------------------------------------
    // 少し前へ
    //------------------------------------------------------

    anime({

        targets: mesh.position,

        z: [

            -0.08,

            0.03,

            0

        ],

        duration: 420,

        easing: "easeOutBack"

    });

    //------------------------------------------------------
    // 起き上がる
    //------------------------------------------------------

    anime({

        targets: mesh.rotation,

        x: [

            THREE.MathUtils.degToRad(

                -15

            ),

            THREE.MathUtils.degToRad(

                6

            ),

            THREE.MathUtils.degToRad(

                0

            )

        ],

        duration: 600,

        easing: "easeOutBack"

    });

    //------------------------------------------------------
    // 少し光る
    // ※ 自分専用のmaterial(clone済み)なので
    //   他の単語には影響しない
    //------------------------------------------------------

    anime({

        targets: mesh.material,

        emissiveIntensity: [

            0.12,

            0.65,

            0.12

        ],

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

    Object.values(textMeshes).forEach(mesh => {

        if (!mesh) {

            return;

        }

        if (mesh.geometry) {

            mesh.geometry.dispose();

        }

        if (mesh.material) {

            mesh.material.dispose();

        }

        if (mesh.parent) {

            mesh.parent.remove(mesh);

        }

    });

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


/* ==========================================================
   Future Extension
========================================================== */

/*

Version4

〇 日本語対応

〇 金箔マテリアル(HDRI Environment Map)

〇 Outline(縁取り)

〇 Bloom

〇 Spark(単語出現時に金色パーティクル)

〇 Reflection(床への映り込み)

〇 Year!のみ金色を強く

*/
