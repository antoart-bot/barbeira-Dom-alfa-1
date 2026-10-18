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
    const clienteId = descobrirCliente();
    console.log("CLIENTE DO SITE:", clienteId);
    const caminho = `barbeiros/${clienteId}`;

    try {
        const [configSnap, categoriasSnap, itensSnap] = await Promise.all([
            get(ref(db, `${caminho}/configuracoes`)),
            get(ref(db, `${caminho}/servicos/categorias`)),
            get(ref(db, `${caminho}/servicos/itens`))
        ]);

        const configuracaoFirebase = configSnap.exists() ? configSnap.val() : {};
        const categorias = categoriasSnap.exists() ? categoriasSnap.val() : {};
        const itens = itensSnap.exists() ? itensSnap.val() : {};
        const servicosFirebase = Object.entries(itens)
            .filter(([, item]) => item && item.nome)
            .map(([id, item]) => ({
                ...item,
                id,
                categoria: categorias[item.categoriaId]?.nome || item.categoria || "Procedimentos",
                valor: item.valor || id,
                duracao: item.duracao || (item.minutos ? formatarDuracaoPublica(item.minutos) : "Definida na avaliação"),
                minutos: item.minutos === undefined ? null : item.minutos,
                descricao: item.descricao || "",
                detalhes: Array.isArray(item.detalhes) ? item.detalhes : []
            }));

        const servicos = servicosFirebase.length ? servicosFirebase : (clienteId === CONFIG.id ? CONFIG.servicos : []);
        console.log("CONFIGURAÇÃO DO SITE:", configuracaoFirebase);
        console.log("PROCEDIMENTOS CARREGADOS:", servicos.length);

        return {
            ...CONFIG,
            ...configuracaoFirebase,
            servicos,
            cores: CONFIG.cores
        };
    } catch (erro) {
        console.error("Erro ao carregar configuração:", erro);
        return {
            ...CONFIG,
            servicos: clienteId === CONFIG.id ? CONFIG.servicos : []
        };
    }
}

function formatarDuracaoPublica(minutos) {
    const total = Number(minutos);
    if (!Number.isFinite(total) || total <= 0) return "Definida na avaliação";
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    if (horas && resto) return `${horas}h ${resto}min`;
    if (horas) return `${horas} ${horas === 1 ? "hora" : "horas"}`;
    return `${resto} minutos`;
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
        `${CONFIG_SITE.nome} — Estética & Bem-estar`;


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
    const categorias = [...new Set(servicos.map(s => s.categoria || "Procedimentos"))];


    // ========================================
    // LISTA DE PROCEDIMENTOS POR CATEGORIA
    // ========================================

    if (listaServicos) {
        listaServicos.innerHTML = "";

        categorias.forEach((categoria, categoriaIndex) => {
            // Categorias recolhíveis deixam o catálogo mais limpo, especialmente no celular.
            const grupo = document.createElement("details");
            grupo.className = "service-category";

            const cabecalho = document.createElement("summary");
            cabecalho.className = "service-category-summary";
            const tituloCategoria = document.createElement("span");
            tituloCategoria.className = "service-category-title";
            tituloCategoria.textContent = categoria;
            const totalCategoria = servicos.filter(servico => (servico.categoria || "Procedimentos") === categoria).length;
            const contadorCategoria = document.createElement("span");
            contadorCategoria.className = "service-category-count";
            contadorCategoria.textContent = `${totalCategoria} ${totalCategoria === 1 ? "procedimento" : "procedimentos"}`;
            const setaCategoria = document.createElement("span");
            setaCategoria.className = "service-category-chevron";
            setaCategoria.setAttribute("aria-hidden", "true");
            setaCategoria.textContent = "＋";
            cabecalho.append(tituloCategoria, contadorCategoria, setaCategoria);
            grupo.appendChild(cabecalho);

            const grade = document.createElement("div");
            grade.className = "service-category-grid";

            servicos
                .filter(servico => (servico.categoria || "Procedimentos") === categoria)
                .forEach((servico, index) => {
                    const cartao = document.createElement("article");
                    cartao.className = "service service-card";

                    const numero = document.createElement("span");
                    numero.className = "service-index";
                    numero.textContent = String(servicos.indexOf(servico) + 1).padStart(2, "0");

                    const nome = document.createElement("h3");
                    nome.textContent = servico.nome;

                    const preco = document.createElement("strong");
                    preco.className = "service-price";
                    preco.textContent = servico.preco === null || servico.preco === undefined
                        ? "Após avaliação"
                        : `R$ ${Number(servico.preco).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

                    const duracao = document.createElement("p");
                    duracao.className = "service-duration";
                    duracao.textContent = `Duração: ${servico.duracao || "A combinar"}`;

                    cartao.append(numero, nome, preco, duracao);

                    if (servico.descricao) {
                        const descricao = document.createElement("p");
                        descricao.className = "service-description";
                        descricao.textContent = servico.descricao;
                        cartao.appendChild(descricao);
                    }

                    if (Array.isArray(servico.detalhes) && servico.detalhes.length) {
                        const lista = document.createElement("ul");
                        lista.className = "service-details";
                        servico.detalhes.forEach((detalhe) => {
                            const item = document.createElement("li");
                            item.textContent = detalhe;
                            lista.appendChild(item);
                        });
                        cartao.appendChild(lista);
                    }

                    const agendar = document.createElement("a");
                    agendar.className = "service-book-link";
                    agendar.href = "#agendamento";
                    agendar.textContent = "Agendar este procedimento ↗";
                    agendar.addEventListener("click", () => {
                        if (selectServicos) selectServicos.value = servico.valor;
                    });
                    cartao.appendChild(agendar);

                    grade.appendChild(cartao);
                });

            grupo.appendChild(grade);
            listaServicos.appendChild(grupo);
        });
    }

    // ========================================
    // SELECT DE SERVIÇOS
    // ========================================

    if (selectServicos) {
        selectServicos.innerHTML = '<option value="">Escolha uma categoria e um procedimento</option>';

        categorias.forEach((categoria) => {
            const grupoOpcoes = document.createElement("optgroup");
            grupoOpcoes.label = categoria;

            servicos
                .filter(servico => (servico.categoria || "Procedimentos") === categoria)
                .forEach((servico) => {
                    const option = document.createElement("option");
                    option.value = servico.valor;
                    const preco = servico.preco === null || servico.preco === undefined
                        ? "Após avaliação"
                        : `R$ ${Number(servico.preco).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    option.textContent = `${servico.nome} — ${preco}`;
                    grupoOpcoes.appendChild(option);
                });

            selectServicos.appendChild(grupoOpcoes);
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