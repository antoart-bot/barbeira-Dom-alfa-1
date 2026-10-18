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
const duracaoServico = document.getElementById("duracaoServico");
const descricaoServico = document.getElementById("descricaoServico");
const detalhesServico = document.getElementById("detalhesServico");
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

    document.title = `Painel — ${nome}`;
}


// =========================================================
// CARREGAR CONFIGURAÇÃO DO CLIENTE
// =========================================================

async function carregarConfiguracaoCliente() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    try {

        const configuracoesRef = ref(
            db,
            `${CAMINHO_BARBEIRO}/configuracoes`
        );

        const snapshot = await get(configuracoesRef);

        if (!snapshot.exists()) {

            console.warn(
                "Nenhuma configuração encontrada para este cliente."
            );

            CONFIG_CLIENTE = {
                nome: CONFIG.nome
            };

            return;
        }

        CONFIG_CLIENTE = snapshot.val();

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

    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = String(
        hoje.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


const dataHoje = obterDataHoje();

if (dataPainel) {
    dataPainel.min = dataHoje;
    dataPainel.value = dataHoje;
}


// =========================================================
// LIMPAR HORÁRIOS DE DIAS PASSADOS
// NÃO APAGA AGENDAMENTOS
// =========================================================

async function limparHorariosPassados() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const hoje = obterDataHoje();

    try {

        const horariosRef = ref(
            db,
            `${CAMINHO_BARBEIRO}/horarios`
        );

        const snapshot = await get(horariosRef);

        if (!snapshot.exists()) {
            return;
        }

        const horarios = snapshot.val();
        const exclusoes = {};

        Object.keys(horarios).forEach((data) => {

            if (data < hoje) {
                exclusoes[data] = null;
            }
        });

        if (Object.keys(exclusoes).length === 0) {
            return;
        }

        await update(horariosRef, exclusoes);

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

let idsAgendamentosConhecidos = new Set();

let idsAgendamentosNotificados = new Set();

let primeiraLeituraAgendamentos = true;

let notificacoesAtivas = false;

let monitoramentoIniciado = false;

let pararMonitoramento = null;


// =========================================================
// PEDIR PERMISSÃO PARA NOTIFICAÇÕES
// =========================================================

async function prepararNotificacoes() {

    if (!("Notification" in window)) {

        console.log(
            "Este navegador não suporta notificações."
        );

        notificacoesAtivas = false;
        return;
    }

    if (Notification.permission === "default") {

        const permissao =
            await Notification.requestPermission();

        console.log(
            "Permissão para notificações:",
            permissao
        );
    }

    notificacoesAtivas =
        Notification.permission === "granted";

    console.log(
        "NOTIFICAÇÕES ATIVAS:",
        notificacoesAtivas
    );

    console.log(
        "PERMISSÃO:",
        Notification.permission
    );
}


// =========================================================
// CATEGORIAS E PROCEDIMENTOS
// =========================================================

let categoriasServicos = {};
let itensServicos = {};

const caminhoCategorias = () => `${CAMINHO_BARBEIRO}/servicos/categorias`;
const caminhoItensServicos = () => `${CAMINHO_BARBEIRO}/servicos/itens`;

function normalizarTexto(valor) {
    return String(valor || "").trim().toLocaleLowerCase("pt-BR");
}

function formatarPrecoServico(preco) {
    if (preco === null || preco === undefined || preco === "") return "Após avaliação";
    return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDuracaoServico(minutos) {
    const total = Number(minutos);
    if (!Number.isFinite(total) || total <= 0) return "Definida na avaliação";
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    if (horas && resto) return `${horas}h ${resto}min`;
    if (horas) return `${horas} ${horas === 1 ? "hora" : "horas"}`;
    return `${resto} minutos`;
}

function mostrarMensagemServicos(texto, erro = false) {
    if (!mensagemServicos) return;
    mensagemServicos.textContent = texto;
    mensagemServicos.classList.toggle("mensagem-erro", erro);
}

function gerarValorServico(nome) {
    const base = normalizarTexto(nome)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "procedimento";
    return `${base}_${Date.now().toString(36)}`;
}

async function importarProcedimentosAntigos() {
    // Só importa a configuração local para o estabelecimento deste próprio site.
    // Não copia procedimentos da Karen para outros clientes do Firebase.
    if (CAMINHO_BARBEIRO !== `barbeiros/${CONFIG.id}` || !Array.isArray(CONFIG.servicos)) return;

    const categoriasPorNome = new Map(
        Object.entries(categoriasServicos).map(([id, item]) => [normalizarTexto(item?.nome), id])
    );

    for (const antigo of CONFIG.servicos) {
        const nomeCategoria = String(antigo.categoria || "Procedimentos").trim();
        const chaveCategoria = normalizarTexto(nomeCategoria);
        let categoriaId = categoriasPorNome.get(chaveCategoria);

        if (!categoriaId) {
            const novaCategoria = push(ref(db, caminhoCategorias()));
            await update(novaCategoria, { nome: nomeCategoria, criadoEm: new Date().toISOString() });
            categoriaId = novaCategoria.key;
            categoriasServicos[categoriaId] = { nome: nomeCategoria };
            categoriasPorNome.set(chaveCategoria, categoriaId);
        }

        const valorAntigo = String(antigo.valor || "");
        const jaExiste = Object.values(itensServicos).some(item =>
            item && ((valorAntigo && item.valor === valorAntigo) || normalizarTexto(item.nome) === normalizarTexto(antigo.nome))
        );
        if (jaExiste) continue;

        const novoServico = push(ref(db, caminhoItensServicos()));
        const registro = {
            nome: antigo.nome,
            preco: antigo.preco ?? null,
            categoriaId,
            valor: valorAntigo || gerarValorServico(antigo.nome),
            minutos: Number.isFinite(Number(antigo.minutos)) && antigo.minutos !== null ? Number(antigo.minutos) : null,
            duracao: antigo.duracao || "Definida na avaliação",
            descricao: antigo.descricao || "",
            detalhes: Array.isArray(antigo.detalhes) ? antigo.detalhes : [],
            criadoEm: new Date().toISOString()
        };
        await update(novoServico, registro);
        itensServicos[novoServico.key] = registro;
    }
}

function atualizarSeletorCategorias() {
    if (!categoriaServico) return;
    const valorAnterior = categoriaServico.value;
    categoriaServico.replaceChildren();
    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = "Selecione uma categoria";
    categoriaServico.appendChild(inicial);

    Object.entries(categoriasServicos)
        .filter(([, categoria]) => categoria && categoria.nome)
        .sort((a, b) => String(a[1].nome).localeCompare(String(b[1].nome), "pt-BR"))
        .forEach(([id, categoria]) => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = categoria.nome;
            categoriaServico.appendChild(option);
        });

    if (valorAnterior && categoriasServicos[valorAnterior]) categoriaServico.value = valorAnterior;
    if (salvarServico) salvarServico.disabled = Object.keys(categoriasServicos).length === 0;
}

function criarElementoServico(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function renderizarServicos() {
    if (!listaServicos) return;
    listaServicos.replaceChildren();

    const categorias = Object.entries(categoriasServicos)
        .filter(([, categoria]) => categoria && categoria.nome)
        .map(([id, categoria]) => ({ id, nome: categoria.nome }));

    if (!categorias.length) {
        listaServicos.appendChild(criarElementoServico("p", "vazio", "Nenhuma categoria cadastrada."));
        return;
    }

    categorias.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    categorias.forEach(categoria => {
        const grupo = criarElementoServico("section", "grupo-servicos-painel");
        const topo = criarElementoServico("div", "topo-grupo-servicos");
        topo.appendChild(criarElementoServico("h3", "", categoria.nome));
        const editarCategoria = criarElementoServico("button", "botao-secundario", "Renomear");
        editarCategoria.type = "button";
        editarCategoria.addEventListener("click", () => editarCategoriaPainel(categoria.id));
        const excluirCategoria = criarElementoServico("button", "botao-secundario", "Excluir categoria");
        excluirCategoria.type = "button";
        excluirCategoria.addEventListener("click", () => excluirCategoriaPainel(categoria.id));
        const acoesCategoria = criarElementoServico("div", "acoes-servicos-painel");
        acoesCategoria.append(editarCategoria, excluirCategoria);
        topo.appendChild(acoesCategoria);
        grupo.appendChild(topo);

        const servicos = Object.entries(itensServicos)
            .filter(([, item]) => item && item.categoriaId === categoria.id)
            .sort((a, b) => String(a[1].nome || "").localeCompare(String(b[1].nome || ""), "pt-BR"));

        if (!servicos.length) grupo.appendChild(criarElementoServico("p", "texto-vazio-servicos", "Nenhum procedimento nesta categoria."));

        servicos.forEach(([id, item]) => {
            const card = criarElementoServico("article", "procedimento-painel");
            const conteudo = criarElementoServico("div", "procedimento-painel-conteudo");
            conteudo.appendChild(criarElementoServico("h4", "", item.nome || "Sem nome"));
            conteudo.appendChild(criarElementoServico("p", "procedimento-meta", `${formatarPrecoServico(item.preco)} · ${formatarDuracaoServico(item.minutos)}`));
            if (item.descricao) conteudo.appendChild(criarElementoServico("p", "procedimento-descricao-painel", item.descricao));
            if (Array.isArray(item.detalhes) && item.detalhes.length) {
                const lista = document.createElement("ul");
                item.detalhes.forEach(detalhe => lista.appendChild(criarElementoServico("li", "", detalhe)));
                conteudo.appendChild(lista);
            }
            card.appendChild(conteudo);
            const acoes = criarElementoServico("div", "acoes-servicos-painel");
            const editar = criarElementoServico("button", "botao-secundario", "Editar");
            editar.type = "button";
            editar.addEventListener("click", () => editarProcedimentoPainel(id));
            const excluir = criarElementoServico("button", "botao-secundario", "Excluir");
            excluir.type = "button";
            excluir.addEventListener("click", () => excluirProcedimentoPainel(id));
            acoes.append(editar, excluir);
            card.appendChild(acoes);
            grupo.appendChild(card);
        });
        listaServicos.appendChild(grupo);
    });
}

async function carregarServicosPainel() {
    if (!CAMINHO_BARBEIRO || !listaServicos) return;
    listaServicos.textContent = "Carregando procedimentos...";
    try {
        const [categoriasSnap, itensSnap] = await Promise.all([
            get(ref(db, caminhoCategorias())),
            get(ref(db, caminhoItensServicos()))
        ]);
        categoriasServicos = categoriasSnap.exists() ? categoriasSnap.val() : {};
        itensServicos = itensSnap.exists() ? itensSnap.val() : {};

        await importarProcedimentosAntigos();
        atualizarSeletorCategorias();
        renderizarServicos();
    } catch (erro) {
        console.error("Erro ao carregar procedimentos:", erro);
        listaServicos.textContent = "Não foi possível carregar os procedimentos.";
        mostrarMensagemServicos("Confira a conexão e as permissões do Firebase.", true);
    }
}

if (formCategoria) formCategoria.addEventListener("submit", async evento => {
    evento.preventDefault();
    const nome = nomeCategoria.value.trim();
    if (!nome) return mostrarMensagemServicos("Digite o nome da categoria.", true);
    if (Object.values(categoriasServicos).some(item => normalizarTexto(item?.nome) === normalizarTexto(nome))) {
        return mostrarMensagemServicos("Essa categoria já existe.", true);
    }
    salvarCategoria.disabled = true;
    try {
        await update(push(ref(db, caminhoCategorias())), { nome, criadoEm: new Date().toISOString() });
        formCategoria.reset();
        mostrarMensagemServicos("Categoria adicionada.");
        await carregarServicosPainel();
    } catch (erro) {
        console.error(erro);
        mostrarMensagemServicos("Não foi possível salvar a categoria. Verifique as permissões.", true);
    } finally { salvarCategoria.disabled = false; }
});

if (formServico) formServico.addEventListener("submit", async evento => {
    evento.preventDefault();
    const categoriaId = categoriaServico.value;
    const nome = nomeServico.value.trim();
    const precoTexto = precoServico.value.trim();
    const duracaoTexto = duracaoServico.value.trim();
    const descricao = descricaoServico.value.trim();
    const detalhes = detalhesServico.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const preco = precoTexto === "" ? null : Number(precoTexto);
    const minutos = duracaoTexto === "" ? null : Number(duracaoTexto);

    if (!categoriasServicos[categoriaId]) return mostrarMensagemServicos("Selecione uma categoria válida.", true);
    if (!nome) return mostrarMensagemServicos("Informe o nome do procedimento.", true);
    if (preco !== null && (!Number.isFinite(preco) || preco < 0 || preco > 99999)) return mostrarMensagemServicos("Informe um preço válido.", true);
    if (minutos !== null && (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440)) return mostrarMensagemServicos("A duração deve ser de 1 a 1440 minutos.", true);

    salvarServico.disabled = true;
    try {
        const registro = {
            nome, preco, minutos,
            duracao: formatarDuracaoServico(minutos),
            descricao, detalhes, categoriaId,
            valor: gerarValorServico(nome),
            criadoEm: new Date().toISOString()
        };
        await update(push(ref(db, caminhoItensServicos())), registro);
        formServico.reset();
        mostrarMensagemServicos("Procedimento adicionado e publicado no catálogo.");
        await carregarServicosPainel();
    } catch (erro) {
        console.error(erro);
        mostrarMensagemServicos("Não foi possível salvar o procedimento. Verifique as permissões.", true);
    } finally { salvarServico.disabled = false; }
});

async function editarCategoriaPainel(id) {
    const atual = categoriasServicos[id];
    if (!atual) return;
    const resposta = prompt("Nome da categoria:", atual.nome || "");
    if (resposta === null) return;
    const nome = resposta.trim();
    if (!nome) return mostrarMensagemServicos("O nome não pode ficar vazio.", true);
    if (Object.entries(categoriasServicos).some(([outroId, item]) => outroId !== id && normalizarTexto(item?.nome) === normalizarTexto(nome))) return mostrarMensagemServicos("Já existe uma categoria com esse nome.", true);
    try {
        await update(ref(db, `${caminhoCategorias()}/${id}`), { nome });
        mostrarMensagemServicos("Categoria atualizada.");
        await carregarServicosPainel();
    } catch (erro) { console.error(erro); mostrarMensagemServicos("Não foi possível editar a categoria.", true); }
}

async function excluirCategoriaPainel(id) {
    const categoria = categoriasServicos[id];
    if (!categoria) return;
    if (Object.values(itensServicos).some(item => item?.categoriaId === id)) return mostrarMensagemServicos("Mova ou exclua os procedimentos antes de remover a categoria.", true);
    if (!confirm(`Excluir a categoria \"${categoria.nome}\"?`)) return;
    try {
        await remove(ref(db, `${caminhoCategorias()}/${id}`));
        mostrarMensagemServicos("Categoria excluída.");
        await carregarServicosPainel();
    } catch (erro) { console.error(erro); mostrarMensagemServicos("Não foi possível excluir a categoria.", true); }
}


let procedimentoEditandoId = null;

function abrirModalProcedimento() {
    const modal = document.getElementById("modalEditarProcedimento");
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("modal-procedimento-aberto");

    requestAnimationFrame(() => {
        document.getElementById("editarNomeProcedimento")?.focus();
    });
}

function fecharModalProcedimento() {
    const modal = document.getElementById("modalEditarProcedimento");
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove("modal-procedimento-aberto");
    procedimentoEditandoId = null;
}

async function editarProcedimentoPainel(id) {
    const item = itensServicos[id];
    if (!item) return;

    const modal = document.getElementById("modalEditarProcedimento");
    const seletorCategoria = document.getElementById("editarCategoriaProcedimento");

    if (!modal || !seletorCategoria) {
        mostrarMensagemServicos(
            "A janela de edição não foi encontrada. Confira o HTML do painel.",
            true
        );
        return;
    }

    procedimentoEditandoId = id;

    document.getElementById("editarNomeProcedimento").value =
        item.nome || "";

    document.getElementById("editarPrecoProcedimento").value =
        item.preco === null || item.preco === undefined
            ? ""
            : String(item.preco);

    document.getElementById("editarDuracaoProcedimento").value =
        item.minutos === null || item.minutos === undefined
            ? ""
            : String(item.minutos);

    document.getElementById("editarDescricaoProcedimento").value =
        item.descricao || "";

    document.getElementById("editarDetalhesProcedimento").value =
        Array.isArray(item.detalhes)
            ? item.detalhes.join("\n")
            : "";

    seletorCategoria.replaceChildren();

    Object.entries(categoriasServicos)
        .filter(([, categoria]) => categoria && categoria.nome)
        .sort((a, b) =>
            String(a[1].nome).localeCompare(
                String(b[1].nome),
                "pt-BR"
            )
        )
        .forEach(([categoriaId, categoria]) => {
            const opcao = document.createElement("option");
            opcao.value = categoriaId;
            opcao.textContent = categoria.nome;
            seletorCategoria.appendChild(opcao);
        });

    if (categoriasServicos[item.categoriaId]) {
        seletorCategoria.value = item.categoriaId;
    }

    abrirModalProcedimento();
}


// Salvar todas as alterações do procedimento.
const formEditarProcedimento =
    document.getElementById("formEditarProcedimento");

if (formEditarProcedimento) {
    formEditarProcedimento.addEventListener("submit", async evento => {
        evento.preventDefault();

        const id = procedimentoEditandoId;
        if (!id || !itensServicos[id]) return;

        const nome =
            document.getElementById("editarNomeProcedimento").value.trim();

        const categoriaId =
            document.getElementById("editarCategoriaProcedimento").value;

        const precoTexto =
            document.getElementById("editarPrecoProcedimento").value.trim();

        const duracaoTexto =
            document.getElementById("editarDuracaoProcedimento").value.trim();

        const descricao =
            document.getElementById("editarDescricaoProcedimento").value.trim();

        const detalhes =
            document.getElementById("editarDetalhesProcedimento").value
                .split(/\r?\n/)
                .map(texto => texto.trim())
                .filter(Boolean);

        const preco = precoTexto === "" ? null : Number(precoTexto);
        const minutos = duracaoTexto === "" ? null : Number(duracaoTexto);

        if (!nome) {
            mostrarMensagemServicos("Informe o nome do procedimento.", true);
            document.getElementById("editarNomeProcedimento").focus();
            return;
        }

        if (!categoriasServicos[categoriaId]) {
            mostrarMensagemServicos("Selecione uma categoria válida.", true);
            return;
        }

        if (
            preco !== null &&
            (!Number.isFinite(preco) || preco < 0 || preco > 99999)
        ) {
            mostrarMensagemServicos("Informe um preço válido.", true);
            return;
        }

        if (
            minutos !== null &&
            (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440)
        ) {
            mostrarMensagemServicos(
                "A duração deve ser de 1 a 1440 minutos.",
                true
            );
            return;
        }

        const botaoSalvar =
            document.getElementById("salvarEdicaoProcedimento");

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        try {
            await update(ref(db, `${caminhoItensServicos()}/${id}`), {
                nome,
                categoriaId,
                preco,
                minutos,
                duracao: formatarDuracaoServico(minutos),
                descricao,
                detalhes,
                valor: gerarValorServico(nome)
            });

            fecharModalProcedimento();

            mostrarMensagemServicos(
                "Procedimento atualizado com sucesso."
            );

            await carregarServicosPainel();

        } catch (erro) {
            console.error("Erro ao editar procedimento:", erro);

            mostrarMensagemServicos(
                "Não foi possível salvar. Confira a conexão e as permissões do Firebase.",
                true
            );
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar alterações";
        }
    });
}


// Fechar pelos botões e clicando fora da janela.
document.getElementById("fecharModalProcedimento")
    ?.addEventListener("click", fecharModalProcedimento);

document.getElementById("cancelarEdicaoProcedimento")
    ?.addEventListener("click", fecharModalProcedimento);

document.querySelector("#modalEditarProcedimento [data-fechar-modal]")
    ?.addEventListener("click", fecharModalProcedimento);


// Fechar com a tecla Esc.
document.addEventListener("keydown", evento => {
    if (
        evento.key === "Escape" &&
        !document.getElementById("modalEditarProcedimento")?.hidden
    ) {
        fecharModalProcedimento();
    }
});


async function excluirProcedimentoPainel(id) {
    const item = itensServicos[id];
    if (!item || !confirm(`Excluir o procedimento \"${item.nome}\"?`)) return;
    try {
        await remove(ref(db, `${caminhoItensServicos()}/${id}`));
        mostrarMensagemServicos("Procedimento excluído.");
        await carregarServicosPainel();
    } catch (erro) { console.error(erro); mostrarMensagemServicos("Não foi possível excluir o procedimento.", true); }
}


// =========================================================
// AUTENTICAÇÃO
// =========================================================

onAuthStateChanged(
    auth,
    async (usuario) => {

        if (!usuario) {

            window.location.href = "login.html";
            return;
        }

        try {

            // Descobrir o cliente

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


            // Definir caminho

            CAMINHO_BARBEIRO =
                `barbeiros/${clienteId}`;

            console.log(
                "CAMINHO DO CLIENTE:",
                CAMINHO_BARBEIRO
            );


            // Carregar configuração

            await carregarConfiguracaoCliente();

            aplicarConfiguracaoCliente();

            await carregarServicosPainel();


            // Preparar notificações

            await prepararNotificacoes();

            console.log(
                "AUTH OK — preparando painel e notificações"
            );

            console.log(
                "notificacoesAtivas:",
                notificacoesAtivas
            );


            // Carregar painel

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
    agendamento,
    id
) {

    if (!notificacoesAtivas) {

        console.log(
            "NOTIFICAÇÕES DESATIVADAS"
        );

        return;
    }

    console.log(
        "MOSTRANDO NOTIFICAÇÃO:",
        id,
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

        const notificacao = new Notification(
            titulo,
            {
                body: corpo,

                // Identificação estável, sem Date.now()
                tag: `novo-${id}`,

                // Não solicitar novo alerta para a mesma tag
                renotify: false
            }
        );

        console.log(
            "NOTIFICAÇÃO CRIADA:",
            notificacao
        );

        notificacao.onclick = () => {
            window.focus();
            notificacao.close();
        };

    } catch (erro) {

        console.error(
            "ERRO AO CRIAR NOTIFICAÇÃO:",
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

    // Evitar criar listeners duplicados

    if (monitoramentoIniciado) {

        console.log(
            "Monitoramento já iniciado."
        );

        return;
    }

    monitoramentoIniciado = true;

    const agendamentosRef = ref(
        db,
        `${CAMINHO_BARBEIRO}/agendamentos`
    );

    pararMonitoramento = onValue(
        agendamentosRef,

        (snapshot) => {

            // Se não houver agendamentos

            if (!snapshot.exists()) {

                idsAgendamentosConhecidos = new Set();

                primeiraLeituraAgendamentos = false;

                console.log(
                    "Nenhum agendamento encontrado."
                );

                return;
            }

            const dados = snapshot.val();

            const idsAtuais = new Set(
                Object.keys(dados)
            );


            // Primeira leitura: registrar os existentes
            // sem notificar reservas antigas

            if (primeiraLeituraAgendamentos) {

                idsAgendamentosConhecidos = idsAtuais;

                primeiraLeituraAgendamentos = false;

                console.log(
                    "Monitoramento de agendamentos iniciado."
                );

                return;
            }


            // Procurar novos agendamentos

            idsAtuais.forEach((id) => {

                if (idsAgendamentosConhecidos.has(id)) {
                    return;
                }

                const agendamento = dados[id];

                if (
                    !agendamento ||
                    agendamento.status !== "confirmado"
                ) {
                    return;
                }

                // Impedir notificação repetida do mesmo ID

                if (idsAgendamentosNotificados.has(id)) {

                    console.log(
                        "Agendamento já notificado:",
                        id
                    );

                    return;
                }

                // Registrar ANTES de mostrar a notificação

                idsAgendamentosNotificados.add(id);

                console.log(
                    "NOVO AGENDAMENTO:",
                    id,
                    agendamento
                );

                mostrarNotificacaoAgendamento(
                    agendamento,
                    id
                );

                carregarAgendamentos();

                carregarHorarios();
            });


            // Atualizar IDs conhecidos

            idsAgendamentosConhecidos = idsAtuais;
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

                window.location.href = "index.html";

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

    const data = String(
        dataPainel?.value || obterDataHoje()
    );

    if (listaAgendamentos) {
        listaAgendamentos.innerHTML =
            "<p class='vazio'>Carregando...</p>";
    }

    try {

        const snapshot = await get(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/agendamentos`
            )
        );

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


        // Nenhum agendamento

        if (!snapshot.exists()) {

            if (listaAgendamentos) {
                listaAgendamentos.innerHTML =
                    "<p class='vazio'>Nenhum agendamento para esta data.</p>";
            }

            if (totalAgendados) {
                totalAgendados.textContent = "0";
            }

            return;
        }

        const dados = snapshot.val();

        const todosAgendamentos =
            Object.entries(dados);


        // Filtrar pela data e excluir cancelados

        const agendamentos =
            todosAgendamentos.filter(
                ([id, agendamento]) => {

                    if (!agendamento) {
                        return false;
                    }

                    const dataAgendamento =
                        String(agendamento.data || "");

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


        // Ordenar por horário

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

                return horarioA.localeCompare(horarioB);
            }
        );


        // Total agendados

        if (totalAgendados) {

            totalAgendados.textContent =
                String(agendamentos.length);

            totalAgendados.style.display = "block";
            totalAgendados.style.visibility = "visible";
            totalAgendados.style.opacity = "1";
        }


        // Nenhum agendamento nesta data

        if (agendamentos.length === 0) {

            if (listaAgendamentos) {
                listaAgendamentos.innerHTML =
                    "<p class='vazio'>Nenhum agendamento para esta data.</p>";
            }

            return;
        }


        // Limpar lista

        if (listaAgendamentos) {
            listaAgendamentos.innerHTML = "";
        }


        // Criar cards

        agendamentos.forEach(([id, agendamento]) => {

            if (!listaAgendamentos) {
                return;
            }

            const card = document.createElement("div");

            card.className = "agendamento";

            const horario =
                String(agendamento.horario || "--:--");

            const nome =
                String(agendamento.nome || "Cliente");

            const servico =
                String(agendamento.servico || "Não informado");

            const telefoneOriginal =
                String(agendamento.telefone || "");

            const telefone =
                telefoneOriginal.replace(/\D/g, "");

            let whatsapp = telefone;

            if (
                whatsapp &&
                !whatsapp.startsWith("55")
            ) {
                whatsapp = "55" + whatsapp;
            }

            let linkWhatsApp = "#";

            if (whatsapp) {
                linkWhatsApp =
                    `https://wa.me/${whatsapp}`;
            }

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
                        <strong>${servico}</strong>
                    </div>

                    <div>
                        <span>WhatsApp</span>
                        <strong>${telefoneOriginal || "Não informado"}</strong>
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


            // Botão cancelar

            const botaoCancelar =
                card.querySelector(".cancelar");

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

            listaAgendamentos.appendChild(card);
        });


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

    const data = String(
        dataPainel?.value || obterDataHoje()
    );

    if (listaHorarios) {
        listaHorarios.innerHTML =
            "<p class='vazio'>Carregando...</p>";
    }

    try {

        const horariosSnapshot = await get(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/horarios/${data}`
            )
        );

        const agendamentosSnapshot = await get(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/agendamentos`
            )
        );

        const horarios =
            horariosSnapshot.exists()
                ? Object.entries(horariosSnapshot.val())
                : [];

        const agendamentos =
            agendamentosSnapshot.exists()
                ? Object.values(agendamentosSnapshot.val())
                : [];


        // Horários ocupados

        const horariosOcupados =
            agendamentos
                .filter((agendamento) => {

                    return (
                        String(agendamento?.data || "") === data &&
                        String(
                            agendamento?.status || ""
                        ).toLowerCase() === "confirmado"
                    );
                })
                .map((agendamento) => {
                    return String(agendamento.horario || "");
                });


        // Ordenar horários

        horarios.sort(([horarioA], [horarioB]) => {

            const [horaA, minutoA] =
                String(horarioA).split(":").map(Number);

            const [horaB, minutoB] =
                String(horarioB).split(":").map(Number);

            return (
                horaA * 60 + minutoA -
                (horaB * 60 + minutoB)
            );
        });


        console.log(
            "HORÁRIOS ENCONTRADOS:",
            horarios
        );

        console.log(
            "HORÁRIOS OCUPADOS:",
            horariosOcupados
        );


        // Contadores

        let quantidadeDisponiveis = 0;
        let quantidadeOcupados = 0;

        horarios.forEach(([horario, dados]) => {

            const ocupado =
                horariosOcupados.includes(String(horario));

            if (ocupado) {
                quantidadeOcupados++;
                return;
            }

            if (dados && dados.disponivel === true) {
                quantidadeDisponiveis++;
            } else {
                quantidadeOcupados++;
            }
        });


        // Atualizar agendados

        const elementoAgendados =
            document.getElementById("totalAgendados");

        const elementoDisponiveis =
            document.getElementById("totalDisponiveis");

        const elementoOcupados =
            document.getElementById("totalOcupados");


        if (elementoAgendados) {

            const quantidadeAgendados =
                agendamentos.filter((agendamento) => {

                    return (
                        String(agendamento?.data || "") === data &&
                        String(
                            agendamento?.status || ""
                        ).toLowerCase() !== "cancelado"
                    );
                }).length;

            elementoAgendados.textContent =
                String(quantidadeAgendados);

            elementoAgendados.style.display = "block";
            elementoAgendados.style.visibility = "visible";
            elementoAgendados.style.opacity = "1";
        }


        // Atualizar disponíveis

        if (elementoDisponiveis) {

            elementoDisponiveis.textContent =
                String(quantidadeDisponiveis);

            elementoDisponiveis.style.display = "block";
            elementoDisponiveis.style.visibility = "visible";
            elementoDisponiveis.style.opacity = "1";
        }


        // Atualizar ocupados

        if (elementoOcupados) {

            elementoOcupados.textContent =
                String(quantidadeOcupados);

            elementoOcupados.style.display = "block";
            elementoOcupados.style.visibility = "visible";
            elementoOcupados.style.opacity = "1";
        }


        // Limpar lista

        if (listaHorarios) {
            listaHorarios.innerHTML = "";
        }


        // Nenhum horário

        if (horarios.length === 0) {

            if (listaHorarios) {
                listaHorarios.innerHTML =
                    "<p class='vazio'>Nenhum horário cadastrado para esta data.</p>";
            }

            return;
        }


        // Mostrar horários

        horarios.forEach(([horario, dados]) => {

            const ocupado =
                horariosOcupados.includes(String(horario));

            const disponivel =
                !ocupado &&
                dados &&
                dados.disponivel === true;

            const card = document.createElement("div");

            card.className = "horario-card";

            card.innerHTML = `

                <strong>${horario}</strong>

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
                listaHorarios.appendChild(card);
            }

            const botaoRemover =
                card.querySelector(".remover-horario");

            if (botaoRemover) {

                botaoRemover.addEventListener(
                    "click",
                    () => {
                        removerHorario(data, horario);
                    }
                );
            }
        });

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

    const confirmar = confirm(
        "Cancelar este agendamento?"
    );

    if (!confirmar) {
        return;
    }

    try {

        await update(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/agendamentos/${id}`
            ),
            {
                status: "cancelado"
            }
        );


        // Liberar horário

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

            const data = dataPainel.value;

            const horario = novoHorario.value;

            if (!data || !horario) {

                if (mensagem) {
                    mensagem.textContent =
                        "Escolha um horário.";
                }

                return;
            }

            try {

                const horarioRef = ref(
                    db,
                    `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}`
                );

                const snapshot = await get(horarioRef);

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

                novoHorario.value = "";

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

            const inicio = horaInicio.value;

            const fim = horaFim.value;

            const intervalo =
                Number(intervaloHorario.value);

            const pausaInicioValor =
                pausaInicio.value;

            const pausaFimValor =
                pausaFim.value;


            // Validações

            if (!inicio || !fim) {

                if (mensagem) {
                    mensagem.textContent =
                        "Preencha o início e o fim.";
                }

                return;
            }

            if (!intervalo || intervalo <= 0) {

                if (mensagem) {
                    mensagem.textContent =
                        "Escolha um intervalo válido.";
                }

                return;
            }

            const inicioPartes =
                inicio.split(":").map(Number);

            const fimPartes =
                fim.split(":").map(Number);

            const inicioMinutos =
                inicioPartes[0] * 60 + inicioPartes[1];

            const fimMinutos =
                fimPartes[0] * 60 + fimPartes[1];

            if (inicioMinutos >= fimMinutos) {

                if (mensagem) {
                    mensagem.textContent =
                        "O horário final deve ser maior que o inicial.";
                }

                return;
            }


            // Pausa

            let pausaInicioMinutos = null;

            let pausaFimMinutos = null;

            if (
                pausaInicioValor &&
                pausaFimValor
            ) {

                const pausaInicioPartes =
                    pausaInicioValor.split(":").map(Number);

                const pausaFimPartes =
                    pausaFimValor.split(":").map(Number);

                pausaInicioMinutos =
                    pausaInicioPartes[0] * 60 +
                    pausaInicioPartes[1];

                pausaFimMinutos =
                    pausaFimPartes[0] * 60 +
                    pausaFimPartes[1];

                if (
                    pausaInicioMinutos >= pausaFimMinutos
                ) {

                    if (mensagem) {
                        mensagem.textContent =
                            "O fim da pausa deve ser maior que o início.";
                    }

                    return;
                }
            }


            // Gerar horários

            try {

                gerarHorarios.disabled = true;

                if (mensagem) {
                    mensagem.textContent =
                        "Gerando horários para 7 dias...";
                }

                const atualizacoes = {};

                let totalHorarios = 0;

                const hoje = new Date();

                hoje.setHours(0, 0, 0, 0);


                // Gerar os próximos 7 dias

                for (let dia = 0; dia < 7; dia++) {

                    const data = new Date(hoje);

                    data.setDate(hoje.getDate() + dia);

                    const ano = data.getFullYear();

                    const mes = String(
                        data.getMonth() + 1
                    ).padStart(2, "0");

                    const numeroDia = String(
                        data.getDate()
                    ).padStart(2, "0");

                    const dataFirebase =
                        `${ano}-${mes}-${numeroDia}`;


                    // Horários do dia

                    for (
                        let minutos = inicioMinutos;
                        minutos < fimMinutos;
                        minutos += intervalo
                    ) {

                        // Pular pausa

                        if (
                            pausaInicioMinutos !== null &&
                            pausaFimMinutos !== null &&
                            minutos >= pausaInicioMinutos &&
                            minutos < pausaFimMinutos
                        ) {
                            continue;
                        }

                        const hora =
                            Math.floor(minutos / 60);

                        const minuto =
                            minutos % 60;

                        const horario =
                            `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;

                        const caminho =
                            `${CAMINHO_BARBEIRO}/horarios/${dataFirebase}/${horario}/disponivel`;

                        atualizacoes[caminho] = true;

                        totalHorarios++;
                    }
                }


                // Salvar no Firebase

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

                gerarHorarios.disabled = false;
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

    const confirmar = confirm(
        `Remover o horário ${horario}?`
    );

    if (!confirmar) {
        return;
    }

    try {

        const horarioRef = ref(
            db,
            `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}`
        );

        await remove(horarioRef);


        // Verificar remoção

        const verificar = await get(horarioRef);

        if (verificar.exists()) {

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