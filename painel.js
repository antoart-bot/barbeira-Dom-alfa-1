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

            const clienteId =
                await descobrirCliente();

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