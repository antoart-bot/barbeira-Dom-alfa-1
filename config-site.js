import { CONFIG } from "./config.js";


// ========================================
// FUNÇÃO AUXILIAR
// ========================================

function colocarTexto(id, texto) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }

}


// ========================================
// TÍTULO DA PÁGINA
// ========================================

document.title =
    `${CONFIG.nome} — Barbearia`;


// ========================================
// NOMES DA BARBEARIA
// ========================================

colocarTexto(
    "nomeIntro",
    CONFIG.nome
);

colocarTexto(
    "assinaturaBarbearia",
    CONFIG.nome.toUpperCase()
);

colocarTexto(
    "footerLogo",
    CONFIG.nome.toUpperCase()
);


// ========================================
// LOGO
// ========================================

const logo =
    document.getElementById(
        "logoBarbearia"
    );

if (logo) {

    const nome =
        CONFIG.nome.trim();

    const partes =
        nome.split(" ");

    if (partes.length >= 2) {

        logo.innerHTML = `
            <span>${partes[0]}</span>
            ${partes.slice(1).join(" ")}
        `;

    } else {

        logo.textContent =
            nome.toUpperCase();

    }

}


// ========================================
// HERO — CIDADE
// ========================================

colocarTexto(
    "cidadeHero",
    CONFIG.cidade
);


// ========================================
// HERO — ANO
// ========================================

const anoAtual =
    new Date().getFullYear();

colocarTexto(
    "anoHero",
    `EST. ${anoAtual}`
);


// ========================================
// LOCAL
// ========================================

const locais =
    document.querySelectorAll(
        ".contact-info div:nth-child(2) p"
    );

locais.forEach(
    (elemento) => {

        elemento.textContent =
            CONFIG.cidade;

    }
);


// ========================================
// HORÁRIOS
// ========================================

const horarioDivs =
    document.querySelectorAll(
        ".contact-info div:first-child p"
    );

if (horarioDivs.length >= 2) {

    horarioDivs[0].textContent =
        CONFIG.horario.semana;

    horarioDivs[1].textContent =
        CONFIG.horario.sabado;

}


// ========================================
// INSTAGRAM
// ========================================

const instagram =
    document.getElementById(
        "instagramLink"
    );

if (
    instagram &&
    CONFIG.instagram
) {

    instagram.href =
        CONFIG.instagram;

}


// ========================================
// WHATSAPP
// ========================================

const whatsapp =
    document.getElementById(
        "whatsappLink"
    );

if (
    whatsapp &&
    CONFIG.whatsapp
) {

    whatsapp.href =
        `https://wa.me/${CONFIG.whatsapp}`;

}
// ========================================
// COPYRIGHT
// ========================================

const copyright =
    document.querySelector(
        ".footer-bottom span:first-child"
    );

if (copyright) {

    copyright.textContent =
        `© ${anoAtual} ${CONFIG.nome}`;

}


// ========================================
// SERVIÇOS
// ========================================

const listaServicos =
    document.querySelector(
        ".service-list"
    );

const selectServicos =
    document.getElementById(
        "servicoCliente"
    );


if (listaServicos) {

    listaServicos.innerHTML = "";


    CONFIG.servicos.forEach(
        (servico, index) => {

            const link =
                document.createElement("a");

            link.href =
                "#contato";

            link.className =
                "service";


            link.innerHTML = `
                <span class="service-index">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <h3>${servico.nome}</h3>

                <span class="service-price">
                    R$ ${servico.preco}
                </span>

                <span class="service-arrow">
                    ↗
                </span>
            `;


            listaServicos.appendChild(
                link
            );

        }
    );

}


// ========================================
// SELECT DE SERVIÇOS
// ========================================

if (selectServicos) {

    selectServicos.innerHTML = `
        <option value="">
            Escolha um serviço
        </option>
    `;


    CONFIG.servicos.forEach(
        (servico) => {

            const option =
                document.createElement("option");

            option.value =
                servico.valor;

            option.textContent =
                `${servico.nome} — R$ ${servico.preco}`;

            selectServicos.appendChild(
                option
            );

        }
    );

}