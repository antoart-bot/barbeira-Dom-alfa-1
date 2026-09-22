import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { auth } from "./firebase.js";


const form =
    document.getElementById("formLogin");

const mensagem =
    document.getElementById("mensagem");


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim();

        const senha =
            document.getElementById("senha").value;


        mensagem.textContent =
            "Entrando...";


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );


            window.location.href =
                "painel.html";


        } catch (erro) {

            console.error(erro);

            mensagem.textContent =
                "E-mail ou senha incorretos.";
        }

    }
);