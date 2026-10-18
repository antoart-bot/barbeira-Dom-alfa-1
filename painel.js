import {
    ref,
    get,
    update,
    remove,
    onValue,
    push

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { db, auth } from "./firebase.js";
import { CONFIG } from "./config.js";

import {
    descobrirCliente
} from "./cliente.js";


// =========================================================
// CAMINHO DO CLIENTE
// =========================================================

let CAMINHO_BARBEIRO = null;
let CONFIG_CLIENTE = null;


// =========================================================
// ELEMENTOS
// =========================================================

const dataPainel =
    document.getElementById("dataPainel");

const atualizar =
    document.getElementById("atualizar");

const totalAgendados =
    document.getElementById("totalAgendados");

const totalDisponiveis =
    document.getElementById("totalDisponiveis");

const totalOcupados =
    document.getElementById("totalOcupados");

const listaAgendamentos =
    document.getElementById("listaAgendamentos");

const listaHorarios =
    document.getElementById("listaHorarios");

const novoHorario =
    document.getElementById("novoHorario");

const adicionarHorario =
    document.getElementById("adicionarHorario");

const mensagem =
    document.getElementById("mensagem");

const sair =
    document.getElementById("sair");

const horaInicio =
    document.getElementById("horaInicio");

const horaFim =
    document.getElementById("horaFim");

const intervaloHorario =
    document.getElementById("intervaloHorario");

const pausaInicio =
    document.getElementById("pausaInicio");

const pausaFim =
    document.getElementById("pausaFim");

const gerarHorarios =
    document.getElementById("gerarHorarios");

const nomeBarbearia =
    document.getElementById("nomeBarbearia");

    
const formCategoria = document.getElementById("formCategoria");
const nomeCategoria = document.getElementById("nomeCategoria");
const salvarCategoria = document.getElementById("salvarCategoria");

const formServico = document.getElementById("formServico");
const categoriaServico = document.getElementById("categoriaServico");
const nomeServico = document.getElementById("nomeServico");
const precoServico = document.getElementById("precoServico");
const salvarServico = document.getElementById("salvarServico");

const listaServicos = document.getElementById("listaServicos");
const mensagemServicos = document.getElementById("mensagemServicos");



// =========================================================
// CONFIGURAÇÃO DA BARBEARIA
// =========================================================

function aplicarConfiguracaoCliente() {

    if (!CONFIG_CLIENTE) {
        return;
    }

    const nome =
        CONFIG_CLIENTE.nome ||
        CONFIG.nome ||
        "Painel";

    if (nomeBarbearia) {
        nomeBarbearia.textContent = nome;
    }

    document.title =
        `Painel — ${nome}`;
}


// =========================================================
// CARREGAR CONFIGURAÇÃO DO CLIENTE
// =========================================================

async function carregarConfiguracaoCliente() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    try {

        const configuracoesRef =
            ref(
                db,
                `${CAMINHO_BARBEIRO}/configuracoes`
            );

        const snapshot =
            await get(
                configuracoesRef
            );

        if (!snapshot.exists()) {

            console.warn(
                "Nenhuma configuração encontrada para este cliente."
            );

            CONFIG_CLIENTE = {
                nome: CONFIG.nome
            };

            return;
        }

        CONFIG_CLIENTE =
            snapshot.val();

        console.log(
            "CONFIGURAÇÃO DO CLIENTE:",
            CONFIG_CLIENTE
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar configuração do cliente:",
            erro
        );

        CONFIG_CLIENTE = {
            nome: CONFIG.nome
        };
    }
}


// =========================================================
// DATA DE HOJE
// =========================================================

function obterDataHoje() {

    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}


const dataHoje =
    obterDataHoje();


if (dataPainel) {

    dataPainel.min =
        dataHoje;

    dataPainel.value =
        dataHoje;
}


// =========================================================
// LIMPAR HORÁRIOS DE DIAS PASSADOS
// NÃO APAGA AGENDAMENTOS
// =========================================================

async function limparHorariosPassados() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const hoje =
        obterDataHoje();

    try {

        const horariosRef =
            ref(
                db,
                `${CAMINHO_BARBEIRO}/horarios`
            );

        const snapshot =
            await get(
                horariosRef
            );

        if (!snapshot.exists()) {
            return;
        }

        const horarios =
            snapshot.val();

        const exclusoes = {};

        Object.keys(horarios).forEach(
            (data) => {

                if (data < hoje) {

                    exclusoes[data] =
                        null;
                }
            }
        );

        if (
            Object.keys(exclusoes).length === 0
        ) {
            return;
        }

        await update(
            horariosRef,
            exclusoes
        );

        console.log(
            "Horários de dias passados removidos."
        );

    } catch (erro) {

        console.error(
            "Erro ao limpar horários passados:",
            erro
        );
    }
}


// =========================================================
// NOTIFICAÇÕES
// =========================================================

let idsAgendamentosConhecidos =
    new Set();

let primeiraLeituraAgendamentos =
    true;

let notificacoesAtivas =
    false;


// =========================================================
// PEDIR PERMISSÃO PARA NOTIFICAÇÕES
// =========================================================

async function prepararNotificacoes() {

    if (!("Notification" in window)) {

        console.log(
            "Este navegador não suporta notificações."
        );

        return;
    }

    if (
        Notification.permission ===
        "default"
    ) {

        const permissao =
            await Notification.requestPermission();

        console.log(
            "Permissão para notificações:",
            permissao
        );
    }

    notificacoesAtivas =
        Notification.permission ===
        "granted";

    console.log(
        "NOTIFICAÇÕES ATIVAS:",
        notificacoesAtivas
    );

    console.log(
        "PERMISSÃO:",
        Notification.permission
    );
}



/* =========================================================
   GESTÃO DE CATEGORIAS E SERVIÇOS
========================================================= */


let categoriasServicos = {};
let itensServicos = {};
let servicosAntigosPainel = {};


function identificarCategoriaAntiga(nomeServico) {
    const nome = String(nomeServico || "")
        .trim()
        .toLocaleLowerCase("pt-BR");

    // Combos primeiro, para "Corte + Barba" não virar apenas Corte.
    if (
        nome.includes("corte") &&
        nome.includes("barba")
    ) {
        return "Combos";
    }

    if (nome.includes("barba")) {
        return "Barba";
    }

    if (
        nome.includes("acabamento") ||
        nome.includes("pezinho") ||
        nome.includes("sobrancelha")
    ) {
        return "Acabamentos";
    }

    if (
        nome.includes("corte") ||
        nome.includes("degradê") ||
        nome.includes("social") ||
        nome.includes("infantil") ||
        nome.includes("máquina")
    ) {
        return "Cortes";
    }

    return "Outros";
}

async function garantirCategoriasAntigasNoFirebase() {
    const nomesExistentes = new Set(
        Object.values(categoriasServicos)
            .filter(Boolean)
            .map(categoria =>
                String(categoria.nome || "")
                    .trim()
                    .toLocaleLowerCase("pt-BR")
            )
    );

    for (const nome of Object.keys(servicosAntigosPainel)) {
        const nomeNormalizado = nome
            .trim()
            .toLocaleLowerCase("pt-BR");

        // Se já existe, não cria outra categoria.
        if (nomesExistentes.has(nomeNormalizado)) {
            continue;
        }

        const novaCategoriaRef = push(
            ref(db, caminhoCategorias())
        );

        const novaCategoria = {
            nome,
            criadoEm: new Date().toISOString()
        };

        await update(novaCategoriaRef, novaCategoria);

        // Atualiza a lista local sem precisar recarregar a página.
        categoriasServicos[novaCategoriaRef.key] = novaCategoria;

        nomesExistentes.add(nomeNormalizado);

        console.log("Categoria criada:", nome);
    }
}



function caminhoCategorias() {
    return `${CAMINHO_BARBEIRO}/servicos/categorias`;
}

function caminhoItensServicos() {
    return `${CAMINHO_BARBEIRO}/servicos/itens`;
}

function mostrarMensagemServicos(texto, erro = false) {
    if (!mensagemServicos) return;

    mensagemServicos.textContent = texto;
    mensagemServicos.style.color = erro ? "#d9534f" : "";
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
}

function formatarPreco(preco) {
    return Number(preco || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


async function carregarServicos() {
    if (!CAMINHO_BARBEIRO || !listaServicos) return;

    listaServicos.textContent = "Carregando serviços...";

    try {
        const [categoriasSnapshot, itensSnapshot] = await Promise.all([
            get(ref(db, caminhoCategorias())),
            get(ref(db, caminhoItensServicos()))
        ]);

        categoriasServicos = categoriasSnapshot.exists()
            ? categoriasSnapshot.val()
            : {};

        itensServicos = itensSnapshot.exists()
            ? itensSnapshot.val()
            : {};

        // Usa serviços antigos salvos na configuração do cliente.
        // Para o Dom Alfa original, também considera o config.js.
        let origemAntiga = [];

        if (Array.isArray(CONFIG_CLIENTE?.servicos)) {
            origemAntiga = CONFIG_CLIENTE.servicos;
        } else if (CAMINHO_BARBEIRO === `barbeiros/${CONFIG.id}`) {
            origemAntiga = Array.isArray(CONFIG.servicos)
                ? CONFIG.servicos
                : [];
        }

        // Não repete os serviços que já existem na estrutura nova.
        const nomesNovos = new Set(
            Object.values(itensServicos)
                .filter(Boolean)
                .map(servico =>
                    String(servico.nome || "")
                        .trim()
                        .toLocaleLowerCase("pt-BR")
                )
        );

        servicosAntigosPainel = {};

        origemAntiga.forEach((servico, indice) => {
            if (!servico?.nome) return;

            const nomeNormalizado = String(servico.nome)
                .trim()
                .toLocaleLowerCase("pt-BR");

            if (nomesNovos.has(nomeNormalizado)) return;

            const categoria = identificarCategoriaAntiga(servico.nome);

            if (!servicosAntigosPainel[categoria]) {
                servicosAntigosPainel[categoria] = [];
            }

            servicosAntigosPainel[categoria].push({
                id: `antigo-${indice}`,
                nome: servico.nome,
                preco: Number(servico.preco) || 0
            });
        });

            await garantirCategoriasAntigasNoFirebase();

            atualizarSeletorCategorias();
            renderizarServicos();

    } catch (erro) {
        console.error("Erro ao carregar serviços:", erro);

        listaServicos.textContent =
            "Não foi possível carregar os serviços.";

        mostrarMensagemServicos(
            "Erro ao carregar. Verifique a conexão e as permissões do Firebase.",
            true
        );
    }
}


function atualizarSeletorCategorias() {
    if (!categoriaServico) return;

    categoriaServico.replaceChildren();

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione uma categoria";
    categoriaServico.appendChild(opcaoInicial);

    Object.entries(categoriasServicos)
        .sort((a, b) =>
            String(a[1]?.nome || "").localeCompare(
                String(b[1]?.nome || ""),
                "pt-BR"
            )
        )
        .forEach(([id, categoria]) => {
            const opcao = document.createElement("option");
            opcao.value = id;
            opcao.textContent = categoria.nome || "Categoria sem nome";
            categoriaServico.appendChild(opcao);
        });

    if (salvarServico) {
        salvarServico.disabled =
            Object.keys(categoriasServicos).length === 0;
    }
}


function renderizarServicos() {
    if (!listaServicos) return;

    listaServicos.replaceChildren();

    const categorias = Object.entries(categoriasServicos)
        .map(([id, categoria]) => ({
            id,
            nome: categoria.nome || "Sem nome",
            antiga: false
        }));

    // Acrescenta as categorias dos serviços antigos.
    Object.keys(servicosAntigosPainel).forEach(nomeCategoria => {
        const jaExiste = categorias.some(categoria =>
            categoria.nome.trim().toLocaleLowerCase("pt-BR") ===
            nomeCategoria.toLocaleLowerCase("pt-BR")
        );

        if (!jaExiste) {
            categorias.push({
                id: `antiga-${nomeCategoria}`,
                nome: nomeCategoria,
                antiga: true
            });
        }
    });

    categorias.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
    );

    if (categorias.length === 0) {
        listaServicos.appendChild(
            criarElemento(
                "p",
                "vazio",
                "Nenhum serviço cadastrado."
            )
        );
        return;
    }

    categorias.forEach(categoria => {
        const grupo = criarElemento("div", "categoria-servicos");
        const cabecalho = criarElemento("div", "cabecalho-categoria");
        const titulo = criarElemento("h3", "", categoria.nome);
        const botoesCategoria = criarElemento("div", "acoes-categoria");

        // Categorias reais continuam editáveis.
        if (!categoria.antiga) {
            const editarCategoria = criarElemento(
                "button",
                "editar-categoria",
                "Editar"
            );

            editarCategoria.type = "button";
            editarCategoria.addEventListener("click", () => {
                editarCategoriaServico(categoria.id);
            });

            const excluirCategoria = criarElemento(
                "button",
                "excluir-categoria",
                "Excluir"
            );

            excluirCategoria.type = "button";
            excluirCategoria.addEventListener("click", () => {
                excluirCategoriaServico(categoria.id);
            });

            botoesCategoria.append(editarCategoria, excluirCategoria);
        }

        cabecalho.append(titulo, botoesCategoria);
        grupo.appendChild(cabecalho);

        const servicosDaCategoria = categoria.antiga
            ? []
            : Object.entries(itensServicos)
                .filter(([, servico]) =>
                    servico && servico.categoriaId === categoria.id
                )
                .map(([id, servico]) => ({
                    id,
                    nome: servico.nome || "Sem nome",
                    preco: servico.preco,
                    antigo: false
                }));

        // Se já existe uma categoria real com esse nome,
        // os serviços antigos aparecem dentro dela também.
        const categoriaAntigaCorrespondente =
            Object.keys(servicosAntigosPainel).find(nome =>
                nome.toLocaleLowerCase("pt-BR") ===
                categoria.nome.trim().toLocaleLowerCase("pt-BR")
            );

        if (categoria.antiga) {
            servicosDaCategoria.push(
                ...(servicosAntigosPainel[categoria.nome] || [])
                    .map(servico => ({ ...servico, antigo: true }))
            );
        } else if (categoriaAntigaCorrespondente) {
            servicosDaCategoria.push(
                ...(servicosAntigosPainel[categoriaAntigaCorrespondente] || [])
                    .map(servico => ({ ...servico, antigo: true }))
            );
        }

        servicosDaCategoria.sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR")
        );

        if (servicosDaCategoria.length === 0) {
            grupo.appendChild(
                criarElemento("p", "vazio", "Nenhum serviço nesta categoria.")
            );
        }

        servicosDaCategoria.forEach(servico => {
            const linha = criarElemento("div", "item-servico");
            const informacoes = criarElemento("div", "info-servico");
            const nome = criarElemento("strong", "", servico.nome);
            const preco = criarElemento(
                "span",
                "preco-servico",
                formatarPreco(servico.preco)
            );

            informacoes.append(nome, preco);
            linha.appendChild(informacoes);

            if (servico.antigo) {
                linha.appendChild(
                    criarElemento(
                        "span",
                        "servico-legado",
                        "Serviço existente"
                    )
                );
            } else {
                const acoes = criarElemento("div", "acoes-servico");

                const editar = criarElemento(
                    "button",
                    "editar-servico",
                    "Editar"
                );

                const excluir = criarElemento(
                    "button",
                    "excluir-servico",
                    "Excluir"
                );

                editar.type = "button";
                excluir.type = "button";

                editar.addEventListener("click", () => {
                    editarItemServico(servico.id);
                });

                excluir.addEventListener("click", () => {
                    excluirItemServico(servico.id);
                });

                acoes.append(editar, excluir);
                linha.appendChild(acoes);
            }

            grupo.appendChild(linha);
        });

        listaServicos.appendChild(grupo);
    });
}


/* Criar categoria */

if (formCategoria) {
    formCategoria.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!CAMINHO_BARBEIRO) return;

        const nome = nomeCategoria.value.trim();

        if (!nome) {
            mostrarMensagemServicos("Informe o nome da categoria.", true);
            return;
        }

        const duplicada = Object.values(categoriasServicos).some(
            categoria =>
                String(categoria?.nome || "").trim().toLocaleLowerCase("pt-BR") ===
                nome.toLocaleLowerCase("pt-BR")
        );

        if (duplicada) {
            mostrarMensagemServicos("Já existe uma categoria com esse nome.", true);
            return;
        }

        salvarCategoria.disabled = true;

        try {
            await push(ref(db, caminhoCategorias()), {
                nome,
                criadoEm: new Date().toISOString()
            });

            formCategoria.reset();
            mostrarMensagemServicos("Categoria criada com sucesso.");
            await carregarServicos();

        } catch (erro) {
            console.error("Erro ao criar categoria:", erro);
            mostrarMensagemServicos(
                "Não foi possível criar a categoria. Verifique as permissões.",
                true
            );
        } finally {
            salvarCategoria.disabled = false;
        }
    });
}

/* Editar categoria */

async function editarCategoriaServico(categoriaId) {
    const categoria = categoriasServicos[categoriaId];
    if (!categoria) return;

    const novoNome = prompt("Novo nome da categoria:", categoria.nome || "");
    if (novoNome === null) return;

    const nome = novoNome.trim();

    if (!nome) {
        mostrarMensagemServicos("O nome não pode ficar vazio.", true);
        return;
    }

    const duplicada = Object.entries(categoriasServicos).some(
        ([id, item]) =>
            id !== categoriaId &&
            String(item?.nome || "").trim().toLocaleLowerCase("pt-BR") ===
            nome.toLocaleLowerCase("pt-BR")
    );

    if (duplicada) {
        mostrarMensagemServicos("Já existe uma categoria com esse nome.", true);
        return;
    }

    try {
        await update(ref(db, `${caminhoCategorias()}/${categoriaId}`), {
            nome
        });

        mostrarMensagemServicos("Categoria atualizada.");
        await carregarServicos();

    } catch (erro) {
        console.error("Erro ao editar categoria:", erro);
        mostrarMensagemServicos("Não foi possível editar a categoria.", true);
    }
}

/* Excluir categoria sem serviços vinculados */

async function excluirCategoriaServico(categoriaId) {
    const categoria = categoriasServicos[categoriaId];
    if (!categoria) return;

    const possuiServicos = Object.values(itensServicos).some(
        servico => servico?.categoriaId === categoriaId
    );

    if (possuiServicos) {
        mostrarMensagemServicos(
            "Mova ou exclua os serviços desta categoria antes de excluí-la.",
            true
        );
        return;
    }

    if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return;

    try {
        await remove(ref(db, `${caminhoCategorias()}/${categoriaId}`));
        mostrarMensagemServicos("Categoria excluída.");
        await carregarServicos();

    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro);
        mostrarMensagemServicos("Não foi possível excluir a categoria.", true);
    }
}

/* Criar serviço */

if (formServico) {
    formServico.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!CAMINHO_BARBEIRO) return;

        const categoriaId = categoriaServico.value;
        const nome = nomeServico.value.trim();
        const preco = Number(precoServico.value);

        if (!categoriasServicos[categoriaId]) {
            mostrarMensagemServicos("Selecione uma categoria válida.", true);
            return;
        }

        if (!nome || !Number.isFinite(preco) || preco < 0 || preco > 99999) {
            mostrarMensagemServicos("Confira o nome e o preço informado.", true);
            return;
        }

        salvarServico.disabled = true;

        try {
            await push(ref(db, caminhoItensServicos()), {
                nome,
                preco,
                categoriaId,
                criadoEm: new Date().toISOString()
            });

            formServico.reset();
            atualizarSeletorCategorias();
            mostrarMensagemServicos("Serviço adicionado com sucesso.");
            await carregarServicos();

        } catch (erro) {
            console.error("Erro ao criar serviço:", erro);
            mostrarMensagemServicos(
                "Não foi possível adicionar o serviço. Verifique as permissões.",
                true
            );
        } finally {
            salvarServico.disabled =
                Object.keys(categoriasServicos).length === 0;
        }
    });
}

/* Editar serviço */

async function editarItemServico(servicoId) {
    const servico = itensServicos[servicoId];
    if (!servico) return;

    const novoNome = prompt("Nome do serviço:", servico.nome || "");
    if (novoNome === null) return;

    const nome = novoNome.trim();

    if (!nome) {
        mostrarMensagemServicos("O nome não pode ficar vazio.", true);
        return;
    }

    const precoAtual = Number(servico.preco || 0);
    const novoPrecoTexto = prompt(
        "Preço do serviço (use ponto para centavos, se necessário):",
        String(precoAtual)
    );

    if (novoPrecoTexto === null) return;

    const preco = Number(novoPrecoTexto);

    if (!Number.isFinite(preco) || preco < 0 || preco > 99999) {
        mostrarMensagemServicos("Informe um preço válido.", true);
        return;
    }

    try {
        await update(ref(db, `${caminhoItensServicos()}/${servicoId}`), {
            nome,
            preco
        });

        mostrarMensagemServicos("Serviço atualizado.");
        await carregarServicos();

    } catch (erro) {
        console.error("Erro ao editar serviço:", erro);
        mostrarMensagemServicos("Não foi possível editar o serviço.", true);
    }
}

/* Excluir serviço */

async function excluirItemServico(servicoId) {
    const servico = itensServicos[servicoId];
    if (!servico) return;

    if (!confirm(`Excluir o serviço "${servico.nome}"?`)) return;

    try {
        await remove(ref(db, `${caminhoItensServicos()}/${servicoId}`));
        mostrarMensagemServicos("Serviço excluído.");
        await carregarServicos();

    } catch (erro) {
        console.error("Erro ao excluir serviço:", erro);
        mostrarMensagemServicos("Não foi possível excluir o serviço.", true);
    }
}


// =========================================================
// AUTENTICAÇÃO
// =========================================================

onAuthStateChanged(
    auth,
    async (usuario) => {

        if (!usuario) {

            window.location.href =
                "login.html";

            return;
        }

        try {

            // =================================================
            // DESCOBRIR CLIENTE
            // =================================================

            let clienteId;

            try {
                clienteId = await descobrirCliente();
            } catch (erro) {
                console.warn(
                    "Não foi possível descobrir o cliente vinculado:",
                    erro.message
                );

                clienteId = CONFIG.id;
            }

            console.log(
                "CLIENTE IDENTIFICADO:",
                clienteId
            );



            // =================================================
            // CAMINHO
            // =================================================

            CAMINHO_BARBEIRO =
                `barbeiros/${clienteId}`;

            console.log(
                "CAMINHO DO CLIENTE:",
                CAMINHO_BARBEIRO
            );


            // =================================================
            // CONFIGURAÇÃO
            // =================================================

                await carregarConfiguracaoCliente();

                aplicarConfiguracaoCliente();

                await carregarServicos();


            // =================================================
            // NOTIFICAÇÕES
            // =================================================

            await prepararNotificacoes();

            console.log(
                "AUTH OK — preparando painel e notificações"
            );

            console.log(
                "TESTE NOTIFICAÇÃO:",
                Notification.permission
            );

            console.log(
                "notificacoesAtivas:",
                notificacoesAtivas
            );


            // =================================================
            // CARREGAR PAINEL
            // =================================================

            await limparHorariosPassados();

            await carregarAgendamentos();

            await carregarHorarios();

            monitorarNovosAgendamentos();

        } catch (erro) {

            console.error(
                "Erro ao identificar cliente:",
                erro
            );

            if (mensagem) {

                mensagem.textContent =
                    "Erro ao identificar o cliente.";
            }
        }
    }
);


// =========================================================
// MOSTRAR NOTIFICAÇÃO
// =========================================================

function mostrarNotificacaoAgendamento(
    agendamento
) {

    if (!notificacoesAtivas) {

        console.log(
            "NOTIFICAÇÕES DESATIVADAS"
        );

        return;
    }

    console.log(
        "MOSTRANDO NOTIFICAÇÃO REAL:",
        agendamento
    );

    try {

        const nomeBarbeariaAtual =
            CONFIG_CLIENTE?.nome ||
            CONFIG.nome ||
            "Barbearia";

            


        const titulo =
            `✂️ Novo agendamento — ${nomeBarbeariaAtual}`;

        const corpo =
            `${agendamento.nome || "Cliente"} agendou ${agendamento.servico || "um serviço"} às ${agendamento.horario || "--:--"}.`;

        const notificacao =
            new Notification(
                titulo,
                {
                    body: corpo,

                    tag:
                        `novo-${agendamento.data}-${agendamento.horario}-${Date.now()}`,

                    renotify: true
                }
            );

        console.log(
            "✅ NOTIFICAÇÃO CRIADA:",
            notificacao
        );

        notificacao.onclick = () => {

            window.focus();

            notificacao.close();
        };

    } catch (erro) {

        console.error(
            "💥 ERRO AO CRIAR NOTIFICAÇÃO:",
            erro
        );
    }
}


// =========================================================
// MONITORAR NOVOS AGENDAMENTOS
// =========================================================

function monitorarNovosAgendamentos() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const agendamentosRef =
        ref(
            db,
            `${CAMINHO_BARBEIRO}/agendamentos`
        );

    onValue(
        agendamentosRef,
        (snapshot) => {

            if (!snapshot.exists()) {

                idsAgendamentosConhecidos =
                    new Set();

                primeiraLeituraAgendamentos =
                    false;

                console.log(
                    "Nenhum agendamento encontrado."
                );

                return;
            }

            const dados =
                snapshot.val();

            const idsAtuais =
                new Set(
                    Object.keys(dados)
                );


            // =================================================
            // PRIMEIRA LEITURA
            // =================================================

            if (
                primeiraLeituraAgendamentos
            ) {

                idsAgendamentosConhecidos =
                    idsAtuais;

                primeiraLeituraAgendamentos =
                    false;

                console.log(
                    "Monitoramento de agendamentos iniciado."
                );

                return;
            }


            // =================================================
            // PROCURAR NOVOS
            // =================================================

            idsAtuais.forEach(
                (id) => {

                    if (
                        !idsAgendamentosConhecidos.has(
                            id
                        )
                    ) {

                        const agendamento =
                            dados[id];

                        if (
                            agendamento &&
                            agendamento.status ===
                                "confirmado"
                        ) {

                            console.log(
                                "NOVO AGENDAMENTO:",
                                agendamento
                            );

                            mostrarNotificacaoAgendamento(
                                agendamento
                            );

                            carregarAgendamentos();

                            carregarHorarios();
                        }
                    }
                }
            );


            idsAgendamentosConhecidos =
                idsAtuais;
        },

        (erro) => {

            console.error(
                "Erro ao monitorar agendamentos:",
                erro
            );
        }
    );
}


// =========================================================
// SAIR
// =========================================================

if (sair) {

    sair.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

            } catch (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );

                if (mensagem) {

                    mensagem.textContent =
                        "Erro ao sair da conta.";
                }
            }
        }
    );
}


// =========================================================
// CARREGAR AGENDAMENTOS
// =========================================================

async function carregarAgendamentos() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const data =
        String(
            dataPainel?.value || obterDataHoje()
        );

    if (listaAgendamentos) {

        listaAgendamentos.innerHTML =
            "<p class='vazio'>Carregando...</p>";
    }

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/agendamentos`
                )
            );


        // =================================================
        // DEBUG
        // =================================================

        console.log(
            "=== DEBUG AGENDAMENTOS ==="
        );

        console.log(
            "CAMINHO:",
            `${CAMINHO_BARBEIRO}/agendamentos`
        );

        console.log(
            "DATA SELECIONADA:",
            data
        );

        console.log(
            "SNAPSHOT EXISTE:",
            snapshot.exists()
        );

        console.log(
            "DADOS RECEBIDOS:",
            snapshot.val()
        );


        // =================================================
        // NENHUM AGENDAMENTO
        // =================================================

        if (!snapshot.exists()) {

            if (listaAgendamentos) {

                listaAgendamentos.innerHTML =
                    "<p class='vazio'>Nenhum agendamento para esta data.</p>";
            }

            if (totalAgendados) {

                totalAgendados.textContent =
                    "0";
            }

            return;
        }


        const dados =
            snapshot.val();


        // =================================================
        // TRANSFORMAR EM ARRAY
        // =================================================

        const todosAgendamentos =
            Object.entries(dados);


        // =================================================
        // FILTRAR PELA DATA
        // =================================================

        const agendamentos =
            todosAgendamentos.filter(
                ([id, agendamento]) => {

                    if (!agendamento) {
                        return false;
                    }

                    const dataAgendamento =
                        String(
                            agendamento.data || ""
                        );

                    const status =
                        String(
                            agendamento.status || ""
                        ).toLowerCase();

                    return (
                        dataAgendamento === data &&
                        status !== "cancelado"
                    );
                }
            );


        console.log(
            "AGENDAMENTOS FILTRADOS:",
            agendamentos
        );


        // =================================================
        // ORDENAR POR HORÁRIO
        // =================================================

        agendamentos.sort(
            ([, agendamentoA], [, agendamentoB]) => {

                const horarioA =
                    String(
                        agendamentoA?.horario || "99:99"
                    );

                const horarioB =
                    String(
                        agendamentoB?.horario || "99:99"
                    );

                return horarioA.localeCompare(
                    horarioB
                );
            }
        );


        // =================================================
        // TOTAL AGENDADOS
        // =================================================

        if (totalAgendados) {

            totalAgendados.textContent =
                String(
                    agendamentos.length
                );

            totalAgendados.style.display =
                "block";

            totalAgendados.style.visibility =
                "visible";

            totalAgendados.style.opacity =
                "1";
        }


        // =================================================
        // NENHUM AGENDAMENTO NA DATA
        // =================================================

        if (
            agendamentos.length === 0
        ) {

            if (listaAgendamentos) {

                listaAgendamentos.innerHTML =
                    "<p class='vazio'>Nenhum agendamento para esta data.</p>";
            }

            return;
        }


        // =================================================
        // LIMPAR LISTA
        // =================================================

        if (listaAgendamentos) {
            listaAgendamentos.innerHTML = "";
        }


        // =================================================
        // CRIAR CARDS
        // =================================================

        agendamentos.forEach(
            ([id, agendamento]) => {

                if (!listaAgendamentos) {
                    return;
                }


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "agendamento";


                // =================================================
                // DADOS
                // =================================================

                const horario =
                    String(
                        agendamento.horario || "--:--"
                    );

                const nome =
                    String(
                        agendamento.nome || "Cliente"
                    );

                const servico =
                    String(
                        agendamento.servico || "Não informado"
                    );

                const telefoneOriginal =
                    String(
                        agendamento.telefone || ""
                    );

                const telefone =
                    telefoneOriginal.replace(
                        /\D/g,
                        ""
                    );

                let whatsapp =
                    telefone;

                if (
                    whatsapp &&
                    !whatsapp.startsWith("55")
                ) {
                    whatsapp =
                        "55" + whatsapp;
                }


                // =================================================
                // LINK WHATSAPP
                // =================================================

                let linkWhatsApp = "#";

                if (whatsapp) {

                    linkWhatsApp =
                        `https://wa.me/${whatsapp}`;
                }


                // =================================================
                // CARD
                // =================================================

                card.innerHTML = `

                    <div class="horario">
                        ${horario}
                    </div>

                    <div class="cliente">
                        ${nome}
                    </div>

                    <div class="detalhes-agendamento">

                        <div>
                            <span>Serviço</span>

                            <strong>
                                ${servico}
                            </strong>
                        </div>

                        <div>
                            <span>WhatsApp</span>

                            <strong>
                                ${telefoneOriginal || "Não informado"}
                            </strong>
                        </div>

                    </div>

                    <div class="botoes">

                        ${
                            whatsapp
                                ? `
                                    <a
                                        class="whatsapp"
                                        href="${linkWhatsApp}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        WhatsApp ↗
                                    </a>
                                `
                                : `
                                    <span class="whatsapp" style="opacity:0.5;">
                                        Sem WhatsApp
                                    </span>
                                `
                        }

                        <button
                            class="cancelar"
                            type="button"
                        >
                            Cancelar
                        </button>

                    </div>
                `;


                // =================================================
                // BOTÃO CANCELAR
                // =================================================

                const botaoCancelar =
                    card.querySelector(
                        ".cancelar"
                    );

                if (botaoCancelar) {

                    botaoCancelar.addEventListener(
                        "click",
                        () => {

                            cancelarAgendamento(
                                id,
                                agendamento.data,
                                agendamento.horario
                            );

                        }
                    );
                }


                // =================================================
                // ADICIONAR CARD
                // =================================================

                listaAgendamentos.appendChild(
                    card
                );
            }
        );


        // =================================================
        // DEBUG FINAL
        // =================================================

        console.log(
            "CARDS CRIADOS:",
            listaAgendamentos
                ? listaAgendamentos.children.length
                : 0
        );

        console.log(
            "TOTAL AGENDADOS:",
            agendamentos.length
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar agendamentos:",
            erro
        );

        if (listaAgendamentos) {

            listaAgendamentos.innerHTML =
                "<p class='vazio'>Erro ao carregar agendamentos.</p>";
        }
    }
}


// =========================================================
// CARREGAR HORÁRIOS
// =========================================================

async function carregarHorarios() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const data =
        String(
            dataPainel?.value || obterDataHoje()
        );

    if (listaHorarios) {

        listaHorarios.innerHTML =
            "<p class='vazio'>Carregando...</p>";
    }

    try {

        // =================================================
        // BUSCAR HORÁRIOS
        // =================================================

        const horariosSnapshot =
            await get(
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/horarios/${data}`
                )
            );


        // =================================================
        // BUSCAR AGENDAMENTOS
        // =================================================

        const agendamentosSnapshot =
            await get(
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/agendamentos`
                )
            );


        const horarios =
            horariosSnapshot.exists()
                ? Object.entries(
                    horariosSnapshot.val()
                )
                : [];


        const agendamentos =
            agendamentosSnapshot.exists()
                ? Object.values(
                    agendamentosSnapshot.val()
                )
                : [];


        // =================================================
        // HORÁRIOS OCUPADOS
        // =================================================

        const horariosOcupados =
            agendamentos
                .filter(
                    (agendamento) => {

                        return (
                            String(
                                agendamento?.data || ""
                            ) === data &&

                            String(
                                agendamento?.status || ""
                            ).toLowerCase() ===
                                "confirmado"
                        );
                    }
                )
                .map(
                    (agendamento) => {

                        return String(
                            agendamento.horario || ""
                        );
                    }
                );


        // =================================================
        // ORDENAR HORÁRIOS
        // =================================================

        horarios.sort(
            ([horarioA], [horarioB]) => {

                const [
                    horaA,
                    minutoA
                ] =
                    String(
                        horarioA
                    )
                        .split(":")
                        .map(Number);

                const [
                    horaB,
                    minutoB
                ] =
                    String(
                        horarioB
                    )
                        .split(":")
                        .map(Number);

                const minutosA =
                    horaA * 60 +
                    minutoA;

                const minutosB =
                    horaB * 60 +
                    minutoB;

                return (
                    minutosA -
                    minutosB
                );
            }
        );


        // =================================================
        // DEBUG DOS HORÁRIOS
        // =================================================

        console.log(
            "========== DEBUG HORÁRIOS =========="
        );

        console.log(
            "DATA:",
            data
        );

        console.log(
            "HORÁRIOS ENCONTRADOS:",
            horarios
        );

        console.log(
            "HORÁRIOS OCUPADOS:",
            horariosOcupados
        );

        console.log(
            "TOTAL DE HORÁRIOS:",
            horarios.length
        );

        console.log(
            "===================================="
        );


        // =================================================
        // CONTADORES
        // =================================================

        let quantidadeDisponiveis =
            0;

        let quantidadeOcupados =
            0;


        horarios.forEach(
            ([horario, dados]) => {

                const horarioString =
                    String(horario);

                const ocupado =
                    horariosOcupados.includes(
                        horarioString
                    );


                if (ocupado) {

                    quantidadeOcupados++;

                    return;
                }


                if (
                    dados &&
                    dados.disponivel === true
                ) {

                    quantidadeDisponiveis++;

                } else {

                    quantidadeOcupados++;
                }
            }
        );


        // =================================================
        // DEBUG DOS CONTADORES
        // =================================================

        console.log(
            "========== RESUMO =========="
        );

        console.log(
            "Total:",
            horarios.length
        );

        console.log(
            "Disponíveis:",
            quantidadeDisponiveis
        );

        console.log(
            "Ocupados:",
            quantidadeOcupados
        );

        console.log(
            "Soma:",
            quantidadeDisponiveis +
            quantidadeOcupados
        );

        console.log(
            "============================"
        );


        // =================================================
        // ATUALIZAR RESUMO
        // =================================================

        const elementoAgendados =
            document.getElementById(
                "totalAgendados"
            );

        const elementoDisponiveis =
            document.getElementById(
                "totalDisponiveis"
            );

        const elementoOcupados =
            document.getElementById(
                "totalOcupados"
            );


        // =================================================
        // AGENDADOS
        // =================================================

        if (elementoAgendados) {

            const quantidadeAgendados =
                agendamentos.filter(
                    (agendamento) => {

                        return (
                            String(
                                agendamento?.data || ""
                            ) === data &&

                            String(
                                agendamento?.status || ""
                            ).toLowerCase() !==
                                "cancelado"
                        );
                    }
                ).length;

            elementoAgendados.textContent =
                String(
                    quantidadeAgendados
                );

            elementoAgendados.style.display =
                "block";

            elementoAgendados.style.visibility =
                "visible";

            elementoAgendados.style.opacity =
                "1";
        }


        // =================================================
        // DISPONÍVEIS
        // =================================================

        if (elementoDisponiveis) {

            elementoDisponiveis.textContent =
                String(
                    quantidadeDisponiveis
                );

            elementoDisponiveis.style.display =
                "block";

            elementoDisponiveis.style.visibility =
                "visible";

            elementoDisponiveis.style.opacity =
                "1";
        }


        // =================================================
        // OCUPADOS
        // =================================================

        if (elementoOcupados) {

            elementoOcupados.textContent =
                String(
                    quantidadeOcupados
                );

            elementoOcupados.style.display =
                "block";

            elementoOcupados.style.visibility =
                "visible";

            elementoOcupados.style.opacity =
                "1";
        }


        // =================================================
        // DEBUG FINAL DOS ELEMENTOS
        // =================================================

        console.log(
            "========== CONTADORES DOM =========="
        );

        console.log(
            "Agendados:",
            elementoAgendados?.textContent
        );

        console.log(
            "Disponíveis:",
            elementoDisponiveis?.textContent
        );

        console.log(
            "Ocupados:",
            elementoOcupados?.textContent
        );

        console.log(
            "===================================="
        );


        // =================================================
        // LIMPAR LISTA
        // =================================================

        if (listaHorarios) {
            listaHorarios.innerHTML = "";
        }


        // =================================================
        // NENHUM HORÁRIO
        // =================================================

        if (
            horarios.length === 0
        ) {

            if (listaHorarios) {

                listaHorarios.innerHTML =
                    "<p class='vazio'>Nenhum horário cadastrado para esta data.</p>";
            }

            return;
        }


        // =================================================
        // MOSTRAR HORÁRIOS
        // =================================================

        horarios.forEach(
            ([horario, dados]) => {

                const ocupado =
                    horariosOcupados.includes(
                        String(horario)
                    );


                const disponivel =
                    !ocupado &&
                    dados &&
                    dados.disponivel === true;


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "horario-card";


                card.innerHTML = `

                    <strong>
                        ${horario}
                    </strong>

                    <span class="${
                        disponivel
                            ? "disponivel"
                            : "ocupado"
                    }">

                        ${
                            disponivel
                                ? "Disponível"
                                : "Ocupado"
                        }

                    </span>

                    ${
                        disponivel
                            ? `
                                <button
                                    class="remover-horario"
                                    type="button"
                                >
                                    Remover
                                </button>
                            `
                            : ""
                    }

                `;


                if (listaHorarios) {

                    listaHorarios.appendChild(
                        card
                    );
                }


                // =================================================
                // REMOVER HORÁRIO
                // =================================================

                const botaoRemover =
                    card.querySelector(
                        ".remover-horario"
                    );


                if (botaoRemover) {

                    botaoRemover.addEventListener(
                        "click",
                        () => {

                            removerHorario(
                                data,
                                horario
                            );

                        }
                    );
                }

            }
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar horários:",
            erro
        );

        if (listaHorarios) {

            listaHorarios.innerHTML =
                "<p class='vazio'>Erro ao carregar horários.</p>";
        }
    }
}


// =========================================================
// CANCELAR AGENDAMENTO
// =========================================================

async function cancelarAgendamento(
    id,
    data,
    horario
) {

    const confirmar =
        confirm(
            "Cancelar este agendamento?"
        );

    if (!confirmar) {
        return;
    }

    try {

        // =================================================
        // CANCELAR AGENDAMENTO
        // =================================================

        await update(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/agendamentos/${id}`
            ),
            {
                status: "cancelado"
            }
        );


        // =================================================
        // LIBERAR HORÁRIO
        // =================================================

        await update(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}`
            ),
            {
                disponivel: true
            }
        );


        if (mensagem) {

            mensagem.textContent =
                "✓ Agendamento cancelado.";
        }


        await carregarAgendamentos();

        await carregarHorarios();

    } catch (erro) {

        console.error(
            "Erro ao cancelar:",
            erro
        );

        if (mensagem) {

            mensagem.textContent =
                "Erro ao cancelar o agendamento.";
        }
    }
}


// =========================================================
// ADICIONAR HORÁRIO MANUALMENTE
// =========================================================

if (adicionarHorario) {

    adicionarHorario.addEventListener(
        "click",
        async () => {

            if (!CAMINHO_BARBEIRO) {
                return;
            }

            const data =
                dataPainel.value;

            const horario =
                novoHorario.value;


            if (!data || !horario) {

                if (mensagem) {

                    mensagem.textContent =
                        "Escolha um horário.";
                }

                return;
            }


            try {

                const horarioRef =
                    ref(
                        db,
                        `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}`
                    );


                const snapshot =
                    await get(
                        horarioRef
                    );


                if (snapshot.exists()) {

                    if (mensagem) {

                        mensagem.textContent =
                            "Esse horário já existe.";
                    }

                    return;
                }


                await update(
                    horarioRef,
                    {
                        disponivel: true
                    }
                );


                novoHorario.value =
                    "";

                if (mensagem) {

                    mensagem.textContent =
                        "✓ Horário adicionado.";
                }


                await carregarHorarios();

            } catch (erro) {

                console.error(
                    "Erro ao adicionar horário:",
                    erro
                );

                if (mensagem) {

                    mensagem.textContent =
                        "Erro ao adicionar horário.";
                }
            }

        }
    );

}


// =========================================================
// GERAR HORÁRIOS AUTOMATICAMENTE
// =========================================================

if (gerarHorarios) {

    gerarHorarios.addEventListener(
        "click",
        async () => {

            if (!CAMINHO_BARBEIRO) {
                return;
            }


            const inicio =
                horaInicio.value;

            const fim =
                horaFim.value;

            const intervalo =
                Number(
                    intervaloHorario.value
                );

            const pausaInicioValor =
                pausaInicio.value;

            const pausaFimValor =
                pausaFim.value;


            // =================================================
            // VALIDAÇÕES
            // =================================================

            if (!inicio || !fim) {

                if (mensagem) {

                    mensagem.textContent =
                        "Preencha o início e o fim.";
                }

                return;
            }


            if (
                !intervalo ||
                intervalo <= 0
            ) {

                if (mensagem) {

                    mensagem.textContent =
                        "Escolha um intervalo válido.";
                }

                return;
            }


            const inicioPartes =
                inicio
                    .split(":")
                    .map(Number);

            const fimPartes =
                fim
                    .split(":")
                    .map(Number);


            const inicioMinutos =
                inicioPartes[0] * 60 +
                inicioPartes[1];

            const fimMinutos =
                fimPartes[0] * 60 +
                fimPartes[1];


            if (
                inicioMinutos >=
                fimMinutos
            ) {

                if (mensagem) {

                    mensagem.textContent =
                        "O horário final deve ser maior que o inicial.";
                }

                return;
            }


            // =================================================
            // PAUSA
            // =================================================

            let pausaInicioMinutos =
                null;

            let pausaFimMinutos =
                null;


            if (
                pausaInicioValor &&
                pausaFimValor
            ) {

                const pausaInicioPartes =
                    pausaInicioValor
                        .split(":")
                        .map(Number);

                const pausaFimPartes =
                    pausaFimValor
                        .split(":")
                        .map(Number);


                pausaInicioMinutos =
                    pausaInicioPartes[0] * 60 +
                    pausaInicioPartes[1];

                pausaFimMinutos =
                    pausaFimPartes[0] * 60 +
                    pausaFimPartes[1];


                if (
                    pausaInicioMinutos >=
                    pausaFimMinutos
                ) {

                    if (mensagem) {

                        mensagem.textContent =
                            "O fim da pausa deve ser maior que o início.";
                    }

                    return;
                }
            }


            // =================================================
            // GERAR
            // =================================================

            try {

                gerarHorarios.disabled =
                    true;

                if (mensagem) {

                    mensagem.textContent =
                        "Gerando horários para 7 dias...";
                }


                const atualizacoes = {};

                let totalHorarios =
                    0;


                // =================================================
                // HOJE
                // =================================================

                const hoje =
                    new Date();

                hoje.setHours(
                    0,
                    0,
                    0,
                    0
                );


                // =================================================
                // 7 DIAS
                // =================================================

                for (
                    let dia = 0;
                    dia < 7;
                    dia++
                ) {

                    const data =
                        new Date(hoje);


                    data.setDate(
                        hoje.getDate() +
                        dia
                    );


                    const ano =
                        data.getFullYear();

                    const mes =
                        String(
                            data.getMonth() + 1
                        ).padStart(
                            2,
                            "0"
                        );

                    const numeroDia =
                        String(
                            data.getDate()
                        ).padStart(
                            2,
                            "0"
                        );


                    const dataFirebase =
                        `${ano}-${mes}-${numeroDia}`;


                    // =================================================
                    // HORÁRIOS DO DIA
                    // =================================================

                    for (
                        let minutos =
                            inicioMinutos;

                        minutos <
                        fimMinutos;

                        minutos +=
                            intervalo
                    ) {


                        // =================================================
                        // PAUSA
                        // =================================================

                        if (
                            pausaInicioMinutos !== null &&
                            pausaFimMinutos !== null &&
                            minutos >=
                                pausaInicioMinutos &&
                            minutos <
                                pausaFimMinutos
                        ) {

                            continue;
                        }


                        const hora =
                            Math.floor(
                                minutos / 60
                            );

                        const minuto =
                            minutos % 60;


                        const horario =
                            `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;


                        // =================================================
                        // CAMINHO
                        // =================================================

                        const caminho =
                            `${CAMINHO_BARBEIRO}/horarios/${dataFirebase}/${horario}/disponivel`;


                        atualizacoes[caminho] =
                            true;

                        totalHorarios++;
                    }
                }


                // =================================================
                // SALVAR
                // =================================================

                await update(
                    ref(db),
                    atualizacoes
                );


                if (mensagem) {

                    mensagem.textContent =
                        `✓ 7 dias gerados com sucesso. ${totalHorarios} horários criados.`;
                }


                await carregarAgendamentos();

                await carregarHorarios();

            } catch (erro) {

                console.error(
                    "ERRO AO GERAR:",
                    erro
                );

                if (mensagem) {

                    mensagem.textContent =
                        "Erro ao gerar os horários. Veja o console.";
                }

            } finally {

                gerarHorarios.disabled =
                    false;
            }

        }
    );

}


// =========================================================
// BOTÃO ATUALIZAR
// =========================================================

if (atualizar) {

    atualizar.addEventListener(
        "click",
        async () => {

            await carregarAgendamentos();

            await carregarHorarios();

        }
    );

}


// =========================================================
// TROCAR DATA
// =========================================================

if (dataPainel) {

    dataPainel.addEventListener(
        "change",
        async () => {

            await carregarAgendamentos();

            await carregarHorarios();

        }
    );

}


// =========================================================
// REMOVER HORÁRIO
// =========================================================

async function removerHorario(
    data,
    horario
) {

    const confirmar =
        confirm(
            `Remover o horário ${horario}?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const horarioRef =
            ref(
                db,
                `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}`
            );


        await remove(
            horarioRef
        );


        // =================================================
        // VERIFICAR REMOÇÃO
        // =================================================

        const verificar =
            await get(
                horarioRef
            );


        if (
            verificar.exists()
        ) {

            if (mensagem) {

                mensagem.textContent =
                    "Não foi possível remover o horário.";
            }

            return;
        }


        if (mensagem) {

            mensagem.textContent =
                "✓ Horário removido.";
        }


        await carregarHorarios();

    } catch (erro) {

        console.error(
            "Erro ao remover horário:",
            erro
        );

        if (mensagem) {

            mensagem.textContent =
                "Erro ao remover horário.";
        }
    }
}