/* ==========================================================
   Happy New Year AR
   confetti.js
   Version 2
========================================================== */

"use strict";

/* ==========================================================
   Settings
========================================================== */

const CONFETTI_COUNT = 90;

const CONFETTI_COLORS = [

    "#ffffff",
    "#ffe45e",
    "#ff4d6d",
    "#2ecc71",
    "#ff9f1c"

];


/* ==========================================================
   Start
========================================================== */

function startConfetti(){

    const root = document.querySelector("#confettiRoot");

    if(!root){

        console.error("Confetti Root Not Found");

        return;

    }

    while(root.firstChild){

        root.removeChild(root.firstChild);

    }

    for(let i=0;i<CONFETTI_COUNT;i++){

        createConfetti(root);

    }

}


/* ==========================================================
   Create
========================================================== */

function createConfetti(root){

    const plane = document.createElement("a-plane");

    const size = random(0.015,0.035);

    plane.setAttribute("width",size);

    plane.setAttribute("height",size*0.55);

    plane.setAttribute(

        "color",

        CONFETTI_COLORS[
            Math.floor(
                Math.random()*CONFETTI_COLORS.length
            )
        ]

    );

    plane.setAttribute("material",`

        side:double;

        transparent:true;

        opacity:1;

    `);

    plane.setAttribute(

        "position",

        "0 0 0.03"

    );

    root.appendChild(plane);

    animateConfetti(plane);

}


/* ==========================================================
   Animation
========================================================== */

function animateConfetti(entity){

    const obj = entity.object3D;

    const x = random(-0.7,0.7);

    const y = random(0.6,1.3);

    const z = random(-0.7,0.7);

    //------------------------------------------------------
    // 飛び出す
    //------------------------------------------------------

    anime({

        targets:obj.position,

        x:x,

        y:y,

        z:z,

        duration:1000,

        easing:"easeOutQuart"

    });

    //------------------------------------------------------
    // 落下
    //------------------------------------------------------

    anime({

        targets:obj.position,

        y:y-1.6,

        delay:700,

        duration:2400,

        easing:"easeInQuad"

    });

    //------------------------------------------------------
    // 左右に揺れる
    //------------------------------------------------------

    anime({

        targets:obj.position,

        x:[

            x,

            x+random(-0.12,0.12),

            x+random(-0.20,0.20),

            x+random(-0.15,0.15)

        ],

        duration:2600,

        easing:"easeInOutSine"

    });

    //------------------------------------------------------
    // 回転
    //------------------------------------------------------

    anime({

        targets:obj.rotation,

        x:random(8,18),

        y:random(8,18),

        z:random(8,18),

        duration:2600,

        easing:"linear"

    });

    //------------------------------------------------------
    // サイズ少し変化
    //------------------------------------------------------

    anime({

        targets:obj.scale,

        x:[1,1.25,1],

        y:[1,0.8,1],

        duration:1800,

        easing:"easeInOutSine"

    });

    //------------------------------------------------------
    // 消える
    //------------------------------------------------------

    anime({

        targets:entity.components.material.material,

        opacity:[

            1,

            1,

            0

        ],

        delay:2200,

        duration:500,

        easing:"linear",

        complete:()=>{

            if(entity.parentNode){

                entity.parentNode.removeChild(entity);

            }

        }

    });

}


/* ==========================================================
   Utility
========================================================== */

function random(min,max){

    return Math.random()*(max-min)+min;

}