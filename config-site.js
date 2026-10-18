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




async function carregarServicosCliente(CONFIG_SITE) {
    const clienteId = descobrirCliente();

    
const servicosAntigos = Array.isArray(CONFIG_SITE.servicos)
    ? CONFIG_SITE.servicos.map(servico => {
        const nome = String(servico.nome || "")
            .trim()
            .toLocaleLowerCase("pt-BR");

        let categoria = "Outros";

        if (nome === "corte" || nome === "acabamento") {
            categoria = "Cortes";
        } else if (nome === "barba") {
            categoria = "Barba";
        } else if (
            nome === "corte + barba" ||
            nome === "corte e barba"
        ) {
            categoria = "Combos";
        }

        return {
            ...servico,
            categoria
        };
    })
    : [];


    try {
        const [categoriasSnapshot, itensSnapshot] = await Promise.all([
            get(ref(db, `barbeiros/${clienteId}/servicos/categorias`)),
            get(ref(db, `barbeiros/${clienteId}/servicos/itens`))
        ]);

        const categorias = categoriasSnapshot.exists()
            ? categoriasSnapshot.val()
            : {};

        const itens = itensSnapshot.exists()
            ? itensSnapshot.val()
            : {};

        const servicosNovos = Object.entries(itens)
            .filter(([, servico]) =>
                servico &&
                typeof servico.nome === "string" &&
                servico.nome.trim()
            )
            .map(([id, servico]) => ({
                id,
                nome: servico.nome,
                preco: Number(servico.preco) || 0,
                valor: servico.valor || id,
                categoria: categorias[servico.categoriaId]?.nome || "Outros",
                categoriaId: servico.categoriaId || ""
            }));

        // Se não existem serviços novos, mostra todos os antigos.
        if (servicosNovos.length === 0) {
            return servicosAntigos;
        }

        // Evita duplicar um serviço antigo caso ele já tenha sido
        // cadastrado também na nova estrutura, com o mesmo nome.
        const nomesNovos = new Set(
            servicosNovos.map(servico =>
                servico.nome.trim().toLocaleLowerCase("pt-BR")
            )
        );

        const antigosRestantes = servicosAntigos.filter(servico =>
            !nomesNovos.has(
                String(servico.nome || "")
                    .trim()
                    .toLocaleLowerCase("pt-BR")
            )
        );

        return [
            ...antigosRestantes,
            ...servicosNovos
        ];

    } catch (erro) {
        console.error("Erro ao carregar serviços do cliente:", erro);

        // Se o Firebase falhar, não esconde os serviços antigos.
        return servicosAntigos;
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
    // SERVIÇOS E CATEGORIAS
    // ========================================

    const listaServicos = document.querySelector(".service-list");

    const selectServicos = document.getElementById("servicoCliente");

    const servicos = await carregarServicosCliente(CONFIG_SITE);

    // Agrupar serviços por categoria
    const grupos = {};

    servicos.forEach(servico => {
        const categoria = servico.categoria || "Serviços";

        if (!grupos[categoria]) {
            grupos[categoria] = [];
        }

        grupos[categoria].push(servico);
    });

    // ========================================
    // LISTA VISUAL DE SERVIÇOS
    // ========================================

    if (listaServicos) {
        listaServicos.replaceChildren();

        if (servicos.length === 0) {
            const aviso = document.createElement("p");
            aviso.textContent = "Nenhum serviço cadastrado no momento.";
            listaServicos.appendChild(aviso);
        }

        let indice = 1;

        Object.entries(grupos).forEach(([categoria, itens]) => {
            const grupo = document.createElement("section");
            grupo.className = "service-category-group";

            const titulo = document.createElement("h3");
            titulo.className = "service-category-title";
            titulo.textContent = categoria;

            const lista = document.createElement("div");
            lista.className = "service-category-items";

            grupo.appendChild(titulo);
            grupo.appendChild(lista);

            itens.forEach(servico => {
                const link = document.createElement("a");
                link.href = "#contato";
                link.className = "service";

                const numero = document.createElement("span");
                numero.className = "service-index";
                numero.textContent = String(indice++).padStart(2, "0");

                const nome = document.createElement("h4");
                nome.textContent = servico.nome;

                const preco = document.createElement("span");
                preco.className = "service-price";
                preco.textContent = Number(servico.preco || 0)
                    .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    });

                const seta = document.createElement("span");
                seta.className = "service-arrow";
                seta.textContent = "↗";

                link.append(numero, nome, preco, seta);
                lista.appendChild(link);
            });

            listaServicos.appendChild(grupo);
        });
    }

    // ========================================
    // SELECT DE AGENDAMENTO
    // ========================================

    
if (selectServicos) {
    selectServicos.replaceChildren();

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Escolha um serviço";
    selectServicos.appendChild(opcaoInicial);

    const grupos = {};

    servicos.forEach(servico => {
        const categoria = servico.categoria || "Outros";

        if (!grupos[categoria]) {
            grupos[categoria] = [];
        }

        grupos[categoria].push(servico);
    });

    Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
        .forEach(([categoria, itens]) => {
            const grupo = document.createElement("optgroup");
            grupo.label = categoria;

            itens.forEach(servico => {
                const option = document.createElement("option");

                option.value = servico.valor || servico.id || servico.nome;
                option.textContent =
                    `${servico.nome} — ` +
                    Number(servico.preco || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    });

                option.dataset.nomeServico = servico.nome;
                option.dataset.categoria = categoria;

                grupo.appendChild(option);
            });

            selectServicos.appendChild(grupo);
        });
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