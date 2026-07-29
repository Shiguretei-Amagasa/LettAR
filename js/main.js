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
// ★検証用フラグ
// true にすると、ターゲット検出時に演出(text/light/confetti)を
// 一切呼ばず、音を1つ鳴らすだけになる。
// カメラ映像・MindAR自体が正しく動いているかどうかだけを
// 切り分けるためのモード。確認できたら false に戻す。
//------------------------------------------------------

const TEST_MODE_AUDIO_ONLY = true;


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

        console.log("Target Found");

        if (TEST_MODE_AUDIO_ONLY) {

            console.log("[TEST_MODE] 音のみ再生します");

            playKiran();

            return;

        }

        startAnimation();

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

        if (TEST_MODE_AUDIO_ONLY) {

            console.log("[TEST_MODE] 音のみ再生します");

            playKiran();

            return;

        }

        startAnimation();

    });

}


/* ==========================================================
   Animation Sequence
========================================================== */

async function startAnimation() {

    console.log("Animation Start");

    //------------------------------------------------------
    // STEP 0
    // フォント/3Dテキスト構築の完了待ち
    // (通信が遅い環境でマーカーが先に見つかった場合の対策)
    //------------------------------------------------------

    if (typeof waitForTextReady === "function") {

        await waitForTextReady();

    }

    //------------------------------------------------------
    // STEP 1
    // 光
    //------------------------------------------------------

    playKiran();

    playLight();

    await wait(1000);

    //------------------------------------------------------
    // STEP 2
    // Happy
    //------------------------------------------------------

    showHappy();

    playKotsuzumi();

    playVoice();

    await wait(900);

    //------------------------------------------------------
    // STEP 3
    // New
    //------------------------------------------------------

    showNew();

    playKotsuzumi();

    await wait(900);

    //------------------------------------------------------
    // STEP 4
    // Year!
    //------------------------------------------------------

    showYear();

    playKotsuzumi();

    await wait(1200);

    //------------------------------------------------------
    // STEP 5
    // 和太鼓
    //------------------------------------------------------

    playTaiko();

    await wait(300);

    //------------------------------------------------------
    // STEP 6
    // 紙吹雪
    //------------------------------------------------------

    startConfetti();

    await wait(400);

    //------------------------------------------------------
    // STEP 7
    // 門松
    //------------------------------------------------------

    playKadomatsu();

    showKadomatsu();

    await wait(1200);

    //------------------------------------------------------
    // STEP 8
    // 将来
    //------------------------------------------------------

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