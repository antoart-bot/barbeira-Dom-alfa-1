import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { db } from "./firebase.js";
import { CONFIG } from "./config.js";


// ========================================
// DESCOBRIR CLIENTE PELA URL
// ========================================

function descobrirCliente() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const clienteId =
        parametros.get("cliente");

    if (clienteId) {
        return clienteId;
    }

    return CONFIG.id;
}


// ========================================
// CARREGAR CONFIGURAÇÃO
// ========================================

async function carregarConfiguracao() {

    const clienteId =
        descobrirCliente();

    console.log(
        "CLIENTE DO SITE:",
        clienteId
    );

    const caminho =
        `barbeiros/${clienteId}/configuracoes`;

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    caminho
                )
            );

        if (!snapshot.exists()) {

            console.warn(
                "Configuração do cliente não encontrada. Usando CONFIG padrão."
            );

            return {
                ...CONFIG
            };
        }

        const configuracaoFirebase =
            snapshot.val();

        console.log(
            "CONFIGURAÇÃO DO SITE:",
            configuracaoFirebase
        );

        console.log(
            "NOME RECEBIDO DO FIREBASE:",
            configuracaoFirebase.nome
        );

        console.log(
            "CHAVES RECEBIDAS:",
            Object.keys(configuracaoFirebase)
        );

        return {
            ...CONFIG,
            ...configuracaoFirebase
        };

    } catch (erro) {

        console.error(
            "Erro ao carregar configuração:",
            erro
        );

        return {
            ...CONFIG
        };
    }
}


// ========================================
// FUNÇÃO AUXILIAR
// ========================================

function colocarTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.textContent =
            texto;
    }
}


// ========================================
// INICIAR SITE
// ========================================

async function iniciarSite() {

    const CONFIG_SITE =
        await carregarConfiguracao();


    // ========================================
    // TÍTULO
    // ========================================

    document.title =
        `${CONFIG_SITE.nome} — Barbearia`;


    // ========================================
    // NOMES
    // ========================================

    colocarTexto(
        "nomeIntro",
        CONFIG_SITE.nome
    );

    colocarTexto(
        "nomeIntroLink",
        CONFIG_SITE.nome
    );

    colocarTexto(
        "assinaturaBarbearia",
        CONFIG_SITE.nome.toUpperCase()
    );

    colocarTexto(
        "footerLogo",
        CONFIG_SITE.nome.toUpperCase()
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
            String(
                CONFIG_SITE.nome
            ).trim();

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
        CONFIG_SITE.cidade
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
                CONFIG_SITE.cidade;
        }
    );


    // ========================================
    // HORÁRIOS
    // ========================================

    const horarioDivs =
        document.querySelectorAll(
            ".contact-info div:first-child p"
        );

    if (
        horarioDivs.length >= 2 &&
        CONFIG_SITE.horario
    ) {

        horarioDivs[0].textContent =
            CONFIG_SITE.horario.semana || "";

        horarioDivs[1].textContent =
            CONFIG_SITE.horario.sabado || "";
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
        CONFIG_SITE.instagram
    ) {

        instagram.href =
            CONFIG_SITE.instagram;
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
        CONFIG_SITE.whatsapp
    ) {

        whatsapp.href =
            `https://wa.me/${CONFIG_SITE.whatsapp}`;
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
            `© ${anoAtual} ${CONFIG_SITE.nome}`;
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

    const servicos =
        Array.isArray(
            CONFIG_SITE.servicos
        )
            ? CONFIG_SITE.servicos
            : [];


    // ========================================
    // LISTA DE SERVIÇOS
    // ========================================

    if (listaServicos) {

        listaServicos.innerHTML =
            "";

        servicos.forEach(
            (
                servico,
                index
            ) => {

                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    "#contato";

                link.className =
                    "service";

                link.innerHTML = `
                    <span class="service-index">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                    <h3>
                        ${servico.nome}
                    </h3>

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

        servicos.forEach(
            (servico) => {

                const option =
                    document.createElement(
                        "option"
                    );

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


    // ========================================
    // CORES
    // ========================================

    if (CONFIG_SITE.cores) {

        if (
            CONFIG_SITE.cores.primaria
        ) {

            document.documentElement.style.setProperty(
                "--cor-primaria",
                CONFIG_SITE.cores.primaria
            );
        }

        if (
            CONFIG_SITE.cores.fundo
        ) {

            document.documentElement.style.setProperty(
                "--cor-fundo",
                CONFIG_SITE.cores.fundo
            );
        }
    }


    // ========================================
    // CONFIRMAÇÃO
    // ========================================

    console.log(
        "✓ SITE CONFIGURADO PARA:",
        CONFIG_SITE.nome
    );
}


// ========================================
// INICIAR
// ========================================

iniciarSite();