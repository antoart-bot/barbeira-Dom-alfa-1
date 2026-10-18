/* ================================
   CURSOR PERSONALIZADO
================================ */

const cursor = document.querySelector(".cursor");
const cursorSmall = document.querySelector(".cursor-small");

let mouseX = 0;
let mouseY = 0;

let cursorX = 0;
let cursorY = 0;


/* Movimento do mouse */
document.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

    /* Só executa se o elemento existir */
    if (cursorSmall) {
        cursorSmall.style.left = mouseX + "px";
        cursorSmall.style.top = mouseY + "px";
    }

});


/* Animação do cursor */
function animateCursor() {

    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;

    /* Só executa se o cursor existir */
    if (cursor) {
        cursor.style.left = cursorX + "px";
        cursor.style.top = cursorY + "px";
    }

    requestAnimationFrame(animateCursor);
}

animateCursor();


/* ================================
   CURSOR INTERATIVO
================================ */

const links = document.querySelectorAll("a");

links.forEach(link => {

    link.addEventListener("mouseenter", () => {

        if (!cursor) return;

        cursor.style.width = "55px";
        cursor.style.height = "55px";
        cursor.style.background = "rgba(214,255,63,.08)";

    });


    link.addEventListener("mouseleave", () => {

        if (!cursor) return;

        cursor.style.width = "30px";
        cursor.style.height = "30px";
        cursor.style.background = "transparent";

    });

});


/* ================================
   PARALLAX DA IMAGEM
================================ */

const heroImage = document.querySelector(".hero-image");

window.addEventListener("scroll", () => {

    /* Se não existir imagem, não faz nada */
    if (!heroImage) return;

    const scroll = window.scrollY;

    if (scroll < window.innerHeight) {

        heroImage.style.transform =
            `scale(1.05) translateY(${scroll * 0.12}px)`;

    }

});


/* ================================
   REVELAÇÃO AO ROLAR
================================ */

const elements = document.querySelectorAll(
    ".service, .intro-content, .about-content, .contact-content"
);


/* Só cria o Observer se houver elementos */
if (elements.length > 0) {

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.style.opacity = "1";

                    entry.target.style.transform =
                        "translateY(0)";

                }

            });

        },
        {
            threshold: 0.15
        }
    );


    elements.forEach(element => {

        element.style.opacity = "0";

        element.style.transform =
            "translateY(35px)";

        element.style.transition =
            "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)";

        observer.observe(element);

    });

}