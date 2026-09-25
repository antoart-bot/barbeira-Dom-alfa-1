import {
    ref,
    get,
    update,
    push,
    runTransaction,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { db } from "./firebase.js";
import { CONFIG } from "./config.js";


// ========================================
// CONFIGURAÇÃO DO CLIENTE
// ========================================

let CONFIG_CLIENTE = {
    ...CONFIG
};

let CAMINHO_BARBEIRO =
    `barbeiros/${CONFIG.id}`;


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
// CARREGAR CONFIGURAÇÃO DO CLIENTE
// ========================================

async function carregarConfiguracaoCliente() {

    const clienteId =
        descobrirCliente();

    CAMINHO_BARBEIRO =
        `barbeiros/${clienteId}`;

    console.log(
        "CLIENTE DO AGENDAMENTO:",
        clienteId
    );

    console.log(
        "CAMINHO DO AGENDAMENTO:",
        CAMINHO_BARBEIRO
    );

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

        if (
            snapshot.exists()
        ) {

            const dados =
                snapshot.val();

            CONFIG_CLIENTE = {
                ...CONFIG,
                ...dados
            };

            console.log(
                "CONFIGURAÇÃO DO AGENDAMENTO:",
                CONFIG_CLIENTE
            );

        } else {

            console.warn(
                "Configuração do cliente não encontrada. Usando CONFIG padrão."
            );

            CONFIG_CLIENTE = {
                ...CONFIG
            };

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar configuração do cliente:",
            erro
        );

        CONFIG_CLIENTE = {
            ...CONFIG
        };

    }

}


// ========================================
// ELEMENTOS
// ========================================

const dataInput =
    document.getElementById(
        "dataCliente"
    );

const listaHorarios =
    document.getElementById(
        "listaHorarios"
    );

const confirmar =
    document.getElementById(
        "confirmarAgendamento"
    );

const mensagem =
    document.getElementById(
        "mensagemAgendamento"
    );

const abrirAgendamento =
    document.getElementById(
        "abrirAgendamento"
    );


// ========================================
// HORÁRIO SELECIONADO
// ========================================

let horarioSelecionado =
    null;


// ========================================
// DATA ATUAL
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


dataInput.min =
    obterDataHoje();

dataInput.value =
    obterDataHoje();


// ========================================
// FORMATAR DATA
// ========================================

function formatarData(data) {

    const partes =
        data.split("-");

    if (
        partes.length !== 3
    ) {

        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// ========================================
// MODAL DE CONFIRMAÇÃO
// ========================================

function mostrarConfirmacao({
    nome,
    servico,
    data,
    horario
}) {

    return new Promise(
        (resolve) => {

            const modal =
                document.createElement(
                    "div"
                );

            modal.className =
                "modal-confirmacao";

            modal.innerHTML = `
                <div class="modal-confirmacao-conteudo">

                    <button
                        type="button"
                        class="modal-fechar"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                    <div class="modal-icone">
                        ✂
                    </div>

                    <h3>
                        Confirmar agendamento?
                    </h3>

                    <p class="modal-subtitulo">
                        Confira os dados antes de confirmar.
                    </p>

                    <div class="resumo-agendamento">

                        <div class="resumo-item">
                            <span>Cliente</span>
                            <strong>${nome}</strong>
                        </div>

                        <div class="resumo-item">
                            <span>Serviço</span>
                            <strong>${servico}</strong>
                        </div>

                        <div class="resumo-item">
                            <span>Data</span>
                            <strong>
                                ${formatarData(data)}
                            </strong>
                        </div>

                        <div class="resumo-item">
                            <span>Horário</span>
                            <strong>${horario}</strong>
                        </div>

                    </div>

                    <div class="modal-acoes">

                        <button
                            type="button"
                            class="modal-cancelar"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            class="modal-confirmar"
                        >
                            Confirmar
                        </button>

                    </div>

                </div>
            `;

            document.body.appendChild(
                modal
            );

            requestAnimationFrame(
                () => {

                    modal.classList.add(
                        "ativo"
                    );

                }
            );

            const fechar =
                (resultado) => {

                    modal.classList.remove(
                        "ativo"
                    );

                    setTimeout(
                        () => {

                            modal.remove();

                        },
                        200
                    );

                    resolve(
                        resultado
                    );

                };


            modal
                .querySelector(
                    ".modal-fechar"
                )
                .addEventListener(
                    "click",
                    () => {

                        fechar(false);

                    }
                );


            modal
                .querySelector(
                    ".modal-cancelar"
                )
                .addEventListener(
                    "click",
                    () => {

                        fechar(false);

                    }
                );


            modal
                .querySelector(
                    ".modal-confirmar"
                )
                .addEventListener(
                    "click",
                    () => {

                        fechar(true);

                    }
                );


            modal.addEventListener(
                "click",
                (e) => {

                    if (
                        e.target === modal
                    ) {

                        fechar(false);

                    }

                }
            );

        }
    );

}


// ========================================
// MENSAGEM DE SUCESSO
// ========================================

function mostrarSucesso({
    nome,
    telefone,
    servico,
    data,
    horario
}) {

    const nomeBarbearia =
        String(
            CONFIG_CLIENTE.nome ||
            CONFIG.nome
        );


    const mensagemWhatsApp =
        encodeURIComponent(
            `*NOVO AGENDAMENTO - ${nomeBarbearia.toUpperCase()}*\n\n` +
            `Olá! Um novo horário foi agendado pelo site.\n\n` +
            `*Cliente:* ${nome}\n` +
            `*Serviço:* ${servico}\n` +
            `*Data:* ${formatarData(data)}\n` +
            `*Horário:* ${horario}\n` +
            `*Contato:* ${telefone}\n\n` +
            `Agendamento realizado pelo site.`
        );


    const numeroWhatsApp =
        CONFIG_CLIENTE.whatsapp ||
        CONFIG.whatsapp;


    const linkWhatsApp =
        `https://wa.me/${numeroWhatsApp}?text=${mensagemWhatsApp}`;


    mensagem.innerHTML = `

        <div class="sucesso-agendamento">

            <div class="sucesso-icone">
                ✓
            </div>

            <h3>
                Agendamento confirmado!
            </h3>

            <p>
                Seu horário está reservado para:
            </p>

            <strong>
                ${formatarData(data)}
                às
                ${horario}
            </strong>

            <p>
                Serviço:
                <strong>${servico}</strong>
            </p>

            <span>
                Aguardamos você na
                ${CONFIG_CLIENTE.nome || CONFIG.nome}.
                ✂️
            </span>

            <a
                href="${linkWhatsApp}"
                target="_blank"
                rel="noopener noreferrer"
                class="botao-whatsapp-agendamento"
            >
                💬 Avisar pelo WhatsApp
            </a>

        </div>

    `;

}


// ========================================
// CARREGAR HORÁRIOS
// ========================================

async function carregarHorarios() {

    const data =
        dataInput.value;

    horarioSelecionado =
        null;

    listaHorarios.innerHTML =
        "";


    if (!data) {

        listaHorarios.innerHTML =
            "<p>Escolha uma data.</p>";

        return;
    }


    listaHorarios.innerHTML =
        "<p>Carregando horários...</p>";


    try {

        const horariosRef =
            ref(
                db,
                `${CAMINHO_BARBEIRO}/horarios/${data}`
            );


        const snapshot =
            await get(
                horariosRef
            );


        if (
            !snapshot.exists()
        ) {

            listaHorarios.innerHTML =
                "<p>Nenhum horário disponível para esta data.</p>";

            return;
        }


        const horarios =
            snapshot.val();


        const horariosOrdenados =
            Object.entries(
                horarios
            ).sort(
                (
                    [horarioA],
                    [horarioB]
                ) => {

                    const [horaA, minutoA] =
                        horarioA
                            .split(":")
                            .map(Number);

                    const [horaB, minutoB] =
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


        listaHorarios.innerHTML =
            "";


        let encontrouHorario =
            false;


        horariosOrdenados.forEach(
            ([horario, dados]) => {

                if (
                    !dados ||
                    dados.disponivel !== true
                ) {

                    return;

                }


                encontrouHorario =
                    true;


                const botao =
                    document.createElement(
                        "button"
                    );


                botao.type =
                    "button";


                botao.className =
                    "horario";


                botao.textContent =
                    horario;


                botao.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".horario"
                            )
                            .forEach(
                                (btn) => {

                                    btn.classList.remove(
                                        "selecionado"
                                    );

                                }
                            );


                        botao.classList.add(
                            "selecionado"
                        );


                        horarioSelecionado =
                            horario;


                        mensagem.innerHTML =
                            "";

                    }
                );


                listaHorarios.appendChild(
                    botao
                );

            }
        );


        if (
            !encontrouHorario
        ) {

            listaHorarios.innerHTML =
                "<p>Não há horários disponíveis para esta data.</p>";

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar horários:",
            erro
        );


        listaHorarios.innerHTML =
            "<p>Erro ao carregar os horários.</p>";

    }

}


// ========================================
// TROCAR DATA
// ========================================

dataInput.addEventListener(
    "change",
    carregarHorarios
);


// ========================================
// BOTÃO ABRIR AGENDAMENTO
// ========================================

if (
    abrirAgendamento
) {

    abrirAgendamento.addEventListener(
        "click",
        () => {

            const secaoAgendamento =
                document.getElementById(
                    "agendamento"
                );


            if (
                secaoAgendamento
            ) {

                secaoAgendamento.scrollIntoView({
                    behavior: "smooth"
                });

            }


            carregarHorarios();

        }
    );

}


// ========================================
// CONFIRMAR AGENDAMENTO
// ========================================

confirmar.addEventListener(
    "click",
    async () => {

        if (
            confirmar.disabled
        ) {

            return;
        }


        const nome =
            document
                .getElementById(
                    "nomeCliente"
                )
                .value
                .trim();


        const telefone =
            document
                .getElementById(
                    "telefoneCliente"
                )
                .value
                .trim();


        const servico =
            document
                .getElementById(
                    "servicoCliente"
                )
                .value;


        const data =
            dataInput.value;


        // ========================================
        // VALIDAR CAMPOS
        // ========================================

        if (
            !nome ||
            !telefone ||
            !servico ||
            !data ||
            !horarioSelecionado
        ) {

            mensagem.textContent =
                "Preencha todos os campos e escolha um horário.";

            return;
        }


        const horario =
            horarioSelecionado;


        // ========================================
        // CONFIRMAÇÃO
        // ========================================

        const usuarioConfirmou =
            await mostrarConfirmacao({
                nome,
                servico,
                data,
                horario
            });


        if (
            !usuarioConfirmou
        ) {

            mensagem.textContent =
                "Agendamento cancelado.";

            return;
        }


        mensagem.textContent =
            "Confirmando agendamento...";


        confirmar.disabled =
            true;


        try {

            // ========================================
            // REFERÊNCIA DO HORÁRIO
            // ========================================

            const disponivelRef =
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}/disponivel`
                );


            // ========================================
            // VERIFICAR DISPONIBILIDADE
            // ========================================

            const disponibilidadeAtual =
                await get(
                    disponivelRef
                );


            console.log(
                "DATA:",
                data
            );

            console.log(
                "HORÁRIO:",
                horario
            );

            console.log(
                "CAMINHO:",
                `${CAMINHO_BARBEIRO}/horarios/${data}/${horario}/disponivel`
            );

            console.log(
                "VALOR DIRETO DO FIREBASE:",
                disponibilidadeAtual.val()
            );


            if (
                !disponibilidadeAtual.exists()
            ) {

                mensagem.textContent =
                    "Esse horário não existe no banco de dados.";

                await carregarHorarios();

                return;
            }


            if (
                disponibilidadeAtual.val() !== true
            ) {

                mensagem.textContent =
                    "Esse horário não está mais disponível.";

                await carregarHorarios();

                return;
            }


            // ========================================
            // RESERVAR HORÁRIO
            // ========================================

            const horarioAtual =
                disponibilidadeAtual.val();

            if (horarioAtual !== true) {

                mensagem.textContent =
                    "Esse horário não está mais disponível.";

                await carregarHorarios();

                return;
            }

            // Reserva o horário antes de criar o agendamento.
            // As Rules do Firebase exigem que o horário esteja
            // indisponível para permitir a criação anônima do agendamento.
            await set(
                disponivelRef,
                false
            );

            console.log(
                "HORÁRIO RESERVADO COM SUCESSO:",
                horario
            );


            // ========================================
            // CRIAR AGENDAMENTO
            // ========================================

            const agendamentosRef =
                ref(
                    db,
                    `${CAMINHO_BARBEIRO}/agendamentos`
                );


            const novoAgendamento =
                push(
                    agendamentosRef
                );


            try {

                await update(
                    novoAgendamento,
                    {

                        nome:
                            nome,

                        telefone:
                            telefone,

                        servico:
                            servico,

                        data:
                            data,

                        horario:
                            horario,

                        status:
                            "confirmado",

                        criadoEm:
                            new Date()
                                .toISOString()

                    }
                );


                // ========================================
                // NOTIFICAÇÃO PARA O BARBEIRO
                // ========================================

                try {

                    const respostaNotificacao =
                        await fetch(
                            "https://plain-credit-3c23.vitorarthurxxx.workers.dev/",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        nome:
                                            nome,

                                        servico:
                                            servico,

                                        data:
                                            data,

                                        horario:
                                            horario

                                    })

                            }
                        );


                    const resultadoNotificacao =
                        await respostaNotificacao.json();


                    console.log(
                        "Resultado da notificação:",
                        resultadoNotificacao
                    );


                } catch (
                    erroNotificacao
                ) {

                    console.error(
                        "Erro ao enviar notificação:",
                        erroNotificacao
                    );

                }


            } catch (
                erroAgendamento
            ) {

                console.error(
                    "Erro ao criar agendamento:",
                    erroAgendamento
                );


                // ========================================
                // LIBERAR HORÁRIO
                // ========================================

                try {

                    await set(
                        disponivelRef,
                        true
                    );

                } catch (
                    erroLiberar
                ) {

                    console.error(
                        "Erro ao liberar horário:",
                        erroLiberar
                    );

                }


                mensagem.textContent =
                    "Não foi possível concluir o agendamento. Tente novamente.";

                return;

            }


            // ========================================
            // SUCESSO
            // ========================================

            mostrarSucesso({
                nome,
                telefone,
                servico,
                data,
                horario
            });


            // ========================================
            // LIMPAR CAMPOS
            // ========================================

            document
                .getElementById(
                    "nomeCliente"
                )
                .value = "";


            document
                .getElementById(
                    "telefoneCliente"
                )
                .value = "";


            document
                .getElementById(
                    "servicoCliente"
                )
                .value = "";


            horarioSelecionado =
                null;


            // ========================================
            // ATUALIZAR HORÁRIOS
            // ========================================

            await carregarHorarios();


        } catch (erro) {

            console.error(
                "ERRO COMPLETO AO AGENDAR:",
                erro
            );


            mensagem.textContent =
                "Não foi possível realizar o agendamento. Tente novamente.";

        } finally {

            confirmar.disabled =
                false;

        }

    }
);


// ========================================
// INICIAR SITE
// ========================================

async function iniciarAgendamento() {

    await carregarConfiguracaoCliente();

    await carregarHorarios();

}


// ========================================
// INICIAR
// ========================================

iniciarAgendamento();