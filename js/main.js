/* ==========================================================
   Happy New Year AR
   main.js
   Version 2
========================================================== */

"use strict";

/* ==========================================================
   Global
========================================================== */

let animationStarted = false;

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

const TEST_STAGE = 1;


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

        if (animationStarted) {

            return;

        }

        animationStarted = true;

        console.log("Target Found (TEST_STAGE=" + TEST_STAGE + ")");

        runStagedSequence();

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

        animationStarted = false;

    });

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
   Staged Sequence Runner

   TEST_STAGE=0: 何もしない(targetFoundのログのみ。
                 カメラ/MindAR自体の動作確認専用)
   TEST_STAGE=1: 音(kiran)のみ
   TEST_STAGE=2: 音+光
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
    // STAGE 1: 光が走る演出の音 + 光
    //------------------------------------------------------

    playKiran();

    playLight();

    if (TEST_STAGE <= 1) {

        return;

    }

    await wait(1000);

    //------------------------------------------------------
    // STAGE 2以上: Happy / New / Year!
    //------------------------------------------------------

    showHappy();

    playKotsuzumi();

    playVoice();

    await wait(900);

    showNew();

    playKotsuzumi();

    await wait(900);

    showYear();

    playKotsuzumi();

    await wait(1200);

    playTaiko();

    if (TEST_STAGE <= 2) {

        return;

    }

    await wait(300);

    //------------------------------------------------------
    // STAGE 3以上: 紙吹雪
    //------------------------------------------------------

    startConfetti();

    if (TEST_STAGE <= 3) {

        return;

    }

    await wait(400);

    //------------------------------------------------------
    // STAGE 4以上: 門松
    //------------------------------------------------------

    playKadomatsu();

    showKadomatsu();

    await wait(1200);

    if (typeof showPerson === "function") {

        showPerson();

    }

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

        x:0.12,

        y:0.12,

        z:0.12,

        duration:500,

        easing:"easeOutElastic(1,.6)"

    });

    anime({

        targets:right.object3D.scale,

        x:0.12,

        y:0.12,

        z:0.12,

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