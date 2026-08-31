/* ==========================================================
   Happy New Year AR
   main.js
   Version 2
========================================================== */

"use strict";

/* ==========================================================
   world-upright コンポーネント

   親(年賀状=markerRoot)がどんな向きに傾いても、
   このコンポーネントを付けたエンティティの「向き」だけは
   常にワールド基準で固定される(位置は親に追従したまま)。

   毎フレーム、親の現在のワールド回転の逆回転を
   自分のローカル回転として設定することで実現している。
========================================================== */

AFRAME.registerComponent("world-upright", {

    schema: {

        correction: { type: "vec3", default: { x: 0, y: 0, z: 0 } }

    },

    init: function () {

        this.parentWorldQuat = new THREE.Quaternion();

        this.correctionQuat = new THREE.Quaternion().setFromEuler(

            new THREE.Euler(

                THREE.MathUtils.degToRad(this.data.correction.x),

                THREE.MathUtils.degToRad(this.data.correction.y),

                THREE.MathUtils.degToRad(this.data.correction.z)

            )

        );

    },

    tick: function () {

        const parent = this.el.object3D.parent;

        if (!parent) {

            return;

        }

        parent.getWorldQuaternion(this.parentWorldQuat);

        this.el.object3D.quaternion

            .copy(this.parentWorldQuat)

            .invert()

            .multiply(this.correctionQuat);

    }

});


/* ==========================================================
   Global
========================================================== */

let animationStarted = false;

let awaitingTap = false;

//------------------------------------------------------
// ★検証用フラグ(段階テスト)
// 0: 何もしない。targetFoundが発火したことをconsole.logで
//    確認するだけ。カメラ/MindAR自体の動作確認専用。
// 1: 音(kiran)のみ
// 2: 音+光
// 3: 音+光+3D文字(Happy/New/Year!)+ナレーション+和太鼓
// 4: 上記+紙吹雪
// 5: 上記+門松(フル。最終的な本番相当)
//
// 数字を1つずつ上げながら、どの段階で問題が起きるかを
// 切り分けるためのもの。本番はここを5にしておく。
//------------------------------------------------------

const TEST_STAGE = 5;


/* ==========================================================
   Initialize
========================================================== */

window.addEventListener("DOMContentLoaded", () => {

    const marker = document.querySelector("#markerRoot");

    if (!marker) {

        console.error("Marker Not Found");

        return;

    }

    //------------------------------------------------------
    // Target Found
    //------------------------------------------------------

    marker.addEventListener("targetFound", () => {

        if (animationStarted || awaitingTap) {

            return;

        }

        console.log("Target Found (TEST_STAGE=" + TEST_STAGE + ")");

        showTapPrompt();

    });

    //------------------------------------------------------
    // Target Lost
    //------------------------------------------------------

    marker.addEventListener("targetLost", () => {

        console.log("Target Lost");

        //--------------------------------------------------
        // 演出をリセットして、再認識時に
        // もう一度最初から再生できるようにする
        //--------------------------------------------------

        if (typeof resetAnimation === "function") {

            resetAnimation();

        }

        hideTapPrompt();

        hidePics();

        animationStarted = false;

        awaitingTap = false;

    });

    //------------------------------------------------------
    // タップで演出開始(音声再生の許可もここで得る)
    //------------------------------------------------------

    document.addEventListener("click", onTapToStart);

    document.addEventListener("touchend", onTapToStart);

    //------------------------------------------------------
    // デバッグ起動ボタン
    // ?debug=1 の時だけ表示し、マーカーなしでテスト可能にする
    //------------------------------------------------------

    setupDebugButton();

});


/* ==========================================================
   Debug Button
========================================================== */

function setupDebugButton() {

    const params = new URLSearchParams(window.location.search);

    if (params.get("debug") !== "1") {

        return;

    }

    const btn = document.querySelector("#debugStartBtn");

    if (!btn) {

        return;

    }

    btn.classList.remove("debug");

    btn.style.display = "block";

    btn.addEventListener("click", () => {

        console.log("Debug Start");

        //--------------------------------------------------
        // 何度でも再テストできるように、毎回リセットしてから開始
        //--------------------------------------------------

        if (typeof resetAnimation === "function") {

            resetAnimation();

        }

        animationStarted = false;

        animationStarted = true;

        console.log("Debug Start (TEST_STAGE=" + TEST_STAGE + ")");

        runStagedSequence();

    });

}


/* ==========================================================
   Animation Sequence
========================================================== */

/* ==========================================================
   タップ吹き出し
========================================================== */

function showTapPrompt() {

    awaitingTap = true;

    const prompt = document.querySelector("#tapPrompt");

    if (!prompt) {

        return;

    }

    prompt.setAttribute("visible", true);

    prompt.setAttribute("animation__pop", {

        property: "scale",

        to: "1 1 1",

        dur: 300,

        easing: "easeOutBack"

    });

}


function hideTapPrompt() {

    const prompt = document.querySelector("#tapPrompt");

    if (!prompt) {

        return;

    }

    prompt.removeAttribute("animation__pop");

    prompt.setAttribute("scale", "0 0 0");

    prompt.setAttribute("visible", false);

}


function onTapToStart() {

    if (!awaitingTap) {

        return;

    }

    awaitingTap = false;

    animationStarted = true;

    hideTapPrompt();

    console.log("Tap To Start");

    runStagedSequence();

}


/* ==========================================================
   Staged Sequence Runner

   TEST_STAGE=0: 何もしない(targetFoundのログのみ。
                 カメラ/MindAR自体の動作確認専用)
   TEST_STAGE=1: 音(kiran)のみ
   TEST_STAGE=2: (欠番。光の演出は品質判断により削除済み)
   TEST_STAGE=3: +3D文字(Happy/New/Year!)+ナレーション+和太鼓
   TEST_STAGE=4: +紙吹雪
   TEST_STAGE=5: +門松(フル。本番相当)
========================================================== */

async function runStagedSequence() {

    if (TEST_STAGE <= 0) {

        console.log("[STAGE0] カメラ/認識の確認のみ。演出は呼びません。");

        return;

    }

    console.log("Animation Start");

    if (typeof waitForTextReady === "function") {

        await waitForTextReady();

    }

    //------------------------------------------------------
    // STAGE 1: 光が走る演出の音のみ
    //------------------------------------------------------

    playKiran();

    if (TEST_STAGE <= 1) {

        return;

    }

    //------------------------------------------------------
    // ※光の演出(playLight)はクオリティ判断により削除。
    //   STAGE2は欠番。音の余韻として少し間を置いてから文字へ。
    //------------------------------------------------------

    if (TEST_STAGE <= 2) {

        return;

    }

    await wait(400);

    //------------------------------------------------------
    // STAGE 3以上: Happy / New / Year!
    //------------------------------------------------------

    showHappy();

    playKotsuzumi();

    playVoice();

    await wait(600);

    showNew();

    playKotsuzumi();

    await wait(600);

    showYear();

    playKotsuzumi();

    await wait(900);

    playTaiko();

    if (TEST_STAGE <= 3) {

        return;

    }

    await wait(300);

    //------------------------------------------------------
    // STAGE 4以上: 紙吹雪
    //------------------------------------------------------

    startConfetti();

    showPics();

    if (TEST_STAGE <= 4) {

        return;

    }

    await wait(400);

    //------------------------------------------------------
    // STAGE 5以上: 門松
    //------------------------------------------------------

    playKadomatsu();

    showKadomatsu();

    await wait(1200);

    if (typeof showPerson === "function") {

        showPerson();

    }

}


/* ==========================================================
   Pics(紙吹雪のタイミングで起き上がる画像)
========================================================== */

function showPics() {

    ["#pics01Anchor", "#pics02Anchor"].forEach((selector, index) => {

        const el = document.querySelector(selector);

        if (!el) {

            return;

        }

        el.setAttribute("visible", true);

        el.object3D.scale.set(0, 0, 0);

        // カードに寝た状態(0度)からスタート

        el.object3D.rotation.x = 0;

        //------------------------------------------------------
        // ボヨヨンと拡大(アンカー=下端を基点に広がる)
        //------------------------------------------------------

        anime({

            targets: el.object3D.scale,

            x: [0, 1.15, 0.92, 1.04, 1],

            y: [0, 1.15, 0.92, 1.04, 1],

            z: [0, 1.15, 0.92, 1.04, 1],

            delay: index * 150,

            duration: 700,

            easing: "easeOutElastic(1,.6)"

        });

        //------------------------------------------------------
        // 起き上がる(下端を軸に、垂直より少し行き過ぎてから戻る)
        //------------------------------------------------------

        anime({

            targets: el.object3D.rotation,

            x: [

                0,

                THREE.MathUtils.degToRad(102),

                THREE.MathUtils.degToRad(90)

            ],

            delay: index * 150,

            duration: 700,

            easing: "easeOutBack"

        });

    });

}


function hidePics() {

    ["#pics01Anchor", "#pics02Anchor"].forEach((selector) => {

        const el = document.querySelector(selector);

        if (!el) {

            return;

        }

        el.setAttribute("visible", false);

        el.object3D.scale.set(0, 0, 0);

        el.object3D.rotation.x = 0;

    });

}


/* ==========================================================
   Kadomatsu
========================================================== */

function showKadomatsu() {

    const left = document.querySelector("#kadomatsuLeft");

    const right = document.querySelector("#kadomatsuRight");

    if (!left || !right) {

        return;

    }

    left.setAttribute("visible", true);

    right.setAttribute("visible", true);

    left.object3D.scale.set(0,0,0);

    right.object3D.scale.set(0,0,0);

    anime({

        targets:left.object3D.scale,

        x:0.6,

        y:0.6,

        z:0.6,

        duration:500,

        easing:"easeOutElastic(1,.6)"

    });

    anime({

        targets:right.object3D.scale,

        x:-0.6,

        y:0.6,

        z:0.6,

        duration:500,

        easing:"easeOutElastic(1,.6)"

    });

}


/* ==========================================================
   Utility
========================================================== */

function wait(ms){

    return new Promise(resolve=>{

        setTimeout(resolve,ms);

    });

}