
import {
    ref,
    get,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";

import { CONFIG } from "./config.js";

import {
    descobrirCliente
} from "./cliente.js";


// ========================================
// CAMINHO DO CLIENTE
// ========================================

let CAMINHO_BARBEIRO = null;

let CONFIG_CLIENTE = null;


// ========================================
// ELEMENTOS
// ========================================

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


// ========================================
// CONFIGURAÇÃO DA BARBEARIA
// ========================================

function aplicarConfiguracaoCliente() {

    if (!CONFIG_CLIENTE) {
        return;
    }

    const nome =
        CONFIG_CLIENTE.nome ||
        CONFIG.nome ||
        "Painel";

    if (nomeBarbearia) {

        nomeBarbearia.textContent =
            nome;

    }

    document.title =
        `Painel — ${nome}`;

}


// ========================================
// CARREGAR CONFIGURAÇÃO DO CLIENTE
// ========================================

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


// ========================================
// DATA DE HOJE
// ========================================

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


// ========================================
// LIMPAR HORÁRIOS DE DIAS PASSADOS
// NÃO APAGA AGENDAMENTOS
// ========================================

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


// ========================================
// NOTIFICAÇÕES
// ========================================

let idsAgendamentosConhecidos =
    new Set();

let primeiraLeituraAgendamentos =
    true;

let notificacoesAtivas =
    false;


// ========================================
// PEDIR PERMISSÃO PARA NOTIFICAÇÕES
// ========================================

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


// ========================================
// AUTENTICAÇÃO
// ========================================

onAuthStateChanged(
    auth,
    async (usuario) => {

        if (!usuario) {

            window.location.href =
                "login.html";

            return;

        }

        try {

            // ========================================
            // DESCOBRIR CLIENTE
            // ========================================

            const clienteId =
                await descobrirCliente();

            console.log(
                "CLIENTE IDENTIFICADO:",
                clienteId
            );


            // ========================================
            // CAMINHO
            // ========================================

            CAMINHO_BARBEIRO =
                `barbeiros/${clienteId}`;

            console.log(
                "CAMINHO DO CLIENTE:",
                CAMINHO_BARBEIRO
            );


            // ========================================
            // CONFIGURAÇÃO
            // ========================================

            await carregarConfiguracaoCliente();

            aplicarConfiguracaoCliente();


            // ========================================
            // NOTIFICAÇÕES
            // ========================================

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


            // ========================================
            // CARREGAR PAINEL
            // ========================================

            await limparHorariosPassados();

            carregarAgendamentos();

            carregarHorarios();

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


// ========================================
// MOSTRAR NOTIFICAÇÃO
// ========================================

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
            `${agendamento.nome} agendou ${agendamento.servico} às ${agendamento.horario}.`;

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


// ========================================
// MONITORAR NOVOS AGENDAMENTOS
// ========================================

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


            // ========================================
            // PRIMEIRA LEITURA
            // ========================================

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


            // ========================================
            // PROCURAR NOVOS
            // ========================================

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


// ========================================
// SAIR
// ========================================

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


// ========================================
// CARREGAR AGENDAMENTOS
// ========================================

async function carregarAgendamentos() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const data =
        dataPainel.value;

    listaAgendamentos.innerHTML =
        "<p class='vazio'>Carregando...</p>";

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/agendamentos`
                )
            );


        // ========================================
        // DEBUG
        // ========================================

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

        console.log(
            "=========================="
        );


        // ========================================
        // NENHUM AGENDAMENTO
        // ========================================

        if (!snapshot.exists()) {

            listaAgendamentos.innerHTML =
                "<p class='vazio'>Nenhum agendamento.</p>";

            if (totalAgendados) {

                totalAgendados.textContent =
                    "0";

            }

            return;

        }


        const dados =
            snapshot.val();


        // ========================================
        // FILTRAR PELA DATA
        // ========================================

        const todosAgendamentos =
            Object.entries(dados);

        const agendamentos =
            todosAgendamentos.filter(
                ([id, agendamento]) => {

                    return (
                        agendamento.data === data &&
                        agendamento.status !==
                            "cancelado"
                    );

                }
            );


        console.log(
            "AGENDAMENTOS FILTRADOS:",
            agendamentos
        );


        // ========================================
        // TOTAL AGENDADOS
        // ========================================

        if (totalAgendados) {

            totalAgendados.textContent =
                agendamentos.length;

        }


        // ========================================
        // NENHUM AGENDAMENTO NA DATA
        // ========================================

        if (
            agendamentos.length === 0
        ) {

            listaAgendamentos.innerHTML =
                "<p class='vazio'>Nenhum agendamento para esta data.</p>";

            if (totalAgendados) {

                totalAgendados.textContent =
                    "0";

            }

            return;

        }


        listaAgendamentos.innerHTML =
            "";


        // ========================================
        // CRIAR CARDS
        // ========================================

        agendamentos.forEach(
            ([id, agendamento]) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "agendamento";


                // ========================================
                // TELEFONE
                // ========================================

                const telefone =
                    String(
                        agendamento.telefone ||
                            ""
                    ).replace(
                        /\D/g,
                        ""
                    );

                const whatsapp =
                    telefone.startsWith("55")
                        ? telefone
                        : "55" + telefone;


                // ========================================
                // CARD
                // ========================================

                card.innerHTML = `

                    <div class="horario">
                        ${agendamento.horario || ""}
                    </div>

                    <div class="cliente">
                        ${agendamento.nome || ""}
                    </div>

                    <div class="detalhes-agendamento">

                        <div>
                            <span>Serviço</span>

                            <strong>
                                ${agendamento.servico || ""}
                            </strong>
                        </div>

                        <div>
                            <span>WhatsApp</span>

                            <strong>
                                ${agendamento.telefone || ""}
                            </strong>
                        </div>

                    </div>

                    <div class="botoes">

                        <a
                            class="whatsapp"
                            href="https://wa.me/${whatsapp}"
                            target="_blank"
                            rel="noopener"
                        >
                            WhatsApp ↗
                        </a>

                        <button
                            class="cancelar"
                            type="button"
                        >
                            Cancelar
                        </button>

                    </div>

                `;


                // ========================================
                // CANCELAR
                // ========================================

                const botaoCancelar =
                    card.querySelector(
                        ".cancelar"
                    );

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


                listaAgendamentos.appendChild(
                    card
                );

            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar agendamentos:",
            erro
        );

        listaAgendamentos.innerHTML =
            "<p class='vazio'>Erro ao carregar agendamentos.</p>";

    }

}


// ========================================
// CARREGAR HORÁRIOS
// ========================================

async function carregarHorarios() {

    if (!CAMINHO_BARBEIRO) {
        return;
    }

    const data =
        dataPainel.value;

    listaHorarios.innerHTML =
        "<p class='vazio'>Carregando...</p>";

    try {

        // ========================================
        // BUSCAR HORÁRIOS
        // ========================================

        const horariosSnapshot =
            await get(
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/horarios/${data}`
                )
            );


        // ========================================
        // BUSCAR AGENDAMENTOS
        // ========================================

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


        // ========================================
        // HORÁRIOS OCUPADOS
        // ========================================

        const horariosOcupados =
            agendamentos
                .filter(
                    (agendamento) => {

                        return (
                            agendamento.data === data &&
                            agendamento.status ===
                                "confirmado"
                        );

                    }
                )
                .map(
                    (agendamento) => {

                        return String(
                            agendamento.horario
                        );

                    }
                );


        // ========================================
        // ORDENAR HORÁRIOS
        // ========================================

        horarios.sort(
            ([horarioA], [horarioB]) => {

                const [
                    horaA,
                    minutoA
                ] =
                    horarioA
                        .split(":")
                        .map(Number);

                const [
                    horaB,
                    minutoB
                ] =
                    horarioB
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


        // ========================================
        // DEBUG DOS HORÁRIOS
        // ========================================

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


        // ========================================
        // CONTADORES
        // ========================================

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


                /*
                 * AGENDAMENTO CONFIRMADO
                 * SEMPRE TEM PRIORIDADE.
                 */

                if (ocupado) {

                    quantidadeOcupados++;

                    return;

                }


                /*
                 * SEM AGENDAMENTO:
                 * verifica o Firebase.
                 */

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


        // ========================================
        // DEBUG DOS CONTADORES
        // ========================================

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


        // ========================================
        // ATUALIZAR RESUMO
        // ========================================

        if (totalDisponiveis) {

            totalDisponiveis.textContent =
                String(
                    quantidadeDisponiveis
                );

        }


        if (totalOcupados) {

            totalOcupados.textContent =
                String(
                    quantidadeOcupados
                );

        }


        // ========================================
        // LIMPAR LISTA
        // ========================================

        listaHorarios.innerHTML =
            "";


        // ========================================
        // NENHUM HORÁRIO
        // ========================================

        if (
            horarios.length === 0
        ) {

            listaHorarios.innerHTML =
                "<p class='vazio'>Nenhum horário cadastrado para esta data.</p>";

            return;

        }


        // ========================================
        // MOSTRAR HORÁRIOS
        // ========================================

        horarios.forEach(
            ([horario, dados]) => {

                const ocupado =
                    horariosOcupados.includes(
                        String(horario)
                    );


                /*
                 * O horário só fica disponível
                 * se não estiver ocupado E
                 * estiver marcado como disponível.
                 */

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


                listaHorarios.appendChild(
                    card
                );


                // ========================================
                // REMOVER HORÁRIO
                // ========================================

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

        listaHorarios.innerHTML =
            "<p class='vazio'>Erro ao carregar horários.</p>";

    }

}


// ========================================
// CANCELAR AGENDAMENTO
// ========================================

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

        // ========================================
        // CANCELAR AGENDAMENTO
        // ========================================

        await update(
            ref(
                db,
                `${CAMINHO_BARBEIRO}/agendamentos/${id}`
            ),
            {
                status: "cancelado"
            }
        );


        // ========================================
        // LIBERAR HORÁRIO
        // ========================================

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


// ========================================
// ADICIONAR HORÁRIO MANUALMENTE
// ========================================

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

                mensagem.textContent =
                    "Escolha um horário.";

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

                    mensagem.textContent =
                        "Esse horário já existe.";

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

                mensagem.textContent =
                    "✓ Horário adicionado.";


                await carregarHorarios();


            } catch (erro) {

                console.error(
                    "Erro ao adicionar horário:",
                    erro
                );

                mensagem.textContent =
                    "Erro ao adicionar horário.";

            }

        }
    );

}


// ========================================
// GERAR HORÁRIOS AUTOMATICAMENTE
// ========================================

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


            // ========================================
            // VALIDAÇÕES
            // ========================================

            if (!inicio || !fim) {

                mensagem.textContent =
                    "Preencha o início e o fim.";

                return;

            }


            if (
                !intervalo ||
                intervalo <= 0
            ) {

                mensagem.textContent =
                    "Escolha um intervalo válido.";

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

                mensagem.textContent =
                    "O horário final deve ser maior que o inicial.";

                return;

            }


            // ========================================
            // PAUSA
            // ========================================

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

                    mensagem.textContent =
                        "O fim da pausa deve ser maior que o início.";

                    return;

                }

            }


            // ========================================
            // GERAR
            // ========================================

            try {

                gerarHorarios.disabled =
                    true;


                mensagem.textContent =
                    "Gerando horários para 7 dias...";


                const atualizacoes = {};

                let totalHorarios =
                    0;


                // ========================================
                // HOJE
                // ========================================

                const hoje =
                    new Date();

                hoje.setHours(
                    0,
                    0,
                    0,
                    0
                );


                // ========================================
                // 7 DIAS
                // ========================================

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


                    // ========================================
                    // HORÁRIOS DO DIA
                    // ========================================

                    for (
                        let minutos =
                            inicioMinutos;

                        minutos <
                            fimMinutos;

                        minutos +=
                            intervalo
                    ) {


                        // ========================================
                        // PAUSA
                        // ========================================

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


                        // ========================================
                        // CAMINHO
                        // ========================================

                        const caminho =
                            `${CAMINHO_BARBEIRO}/horarios/${dataFirebase}/${horario}/disponivel`;


                        atualizacoes[caminho] =
                            true;


                        totalHorarios++;

                    }

                }


                // ========================================
                // SALVAR
                // ========================================

                await update(
                    ref(db),
                    atualizacoes
                );


                mensagem.textContent =
                    `✓ 7 dias gerados com sucesso. ${totalHorarios} horários criados.`;


                await carregarAgendamentos();

                await carregarHorarios();


            } catch (erro) {

                console.error(
                    "ERRO AO GERAR:",
                    erro
                );

                mensagem.textContent =
                    "Erro ao gerar os horários. Veja o console.";

            } finally {

                gerarHorarios.disabled =
                    false;

            }

        }
    );

}


// ========================================
// BOTÃO ATUALIZAR
// ========================================

if (atualizar) {

    atualizar.addEventListener(
        "click",
        () => {

            carregarAgendamentos();

            carregarHorarios();

        }
    );

}


// ========================================
// TROCAR DATA
// ========================================

if (dataPainel) {

    dataPainel.addEventListener(
        "change",
        () => {

            carregarAgendamentos();

            carregarHorarios();

        }
    );

}


// ========================================
// REMOVER HORÁRIO
// ========================================

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


        // ========================================
        // VERIFICAR REMOÇÃO
        // ========================================

        const verificar =
            await get(
                horarioRef
            );


        if (
            verificar.exists()
        ) {

            mensagem.textContent =
                "Não foi possível remover o horário.";

            return;

        }


        mensagem.textContent =
            "✓ Horário removido.";


        await carregarHorarios();


    } catch (erro) {

        console.error(
            "Erro ao remover horário:",
            erro
        );

        mensagem.textContent =
            "Erro ao remover horário.";

    }

}
