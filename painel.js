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
    auth,
    app
} from "./firebase.js"; 

    import { CONFIG } from "./config.js";

    import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js";

const messaging = getMessaging(app);

    const CAMINHO_BARBEIRO =
        `barbeiros/${CONFIG.id}`;


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

        // ========================================
    // CONFIGURAÇÃO DA BARBEARIA
    // ========================================

    const nomeBarbearia =
        document.getElementById("nomeBarbearia");

    if (nomeBarbearia) {

        nomeBarbearia.textContent =
            CONFIG.nome;

    }

    document.title =
        `Painel — ${CONFIG.nome}`;


    // ========================================
    // DATA DE HOJE
    // ========================================

    function obterDataHoje() {

        const hoje = new Date();

        const ano =
            hoje.getFullYear();

        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                hoje.getDate()
            ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    dataPainel.value =
        obterDataHoje();


    // ========================================
    // LOGIN / AUTENTICAÇÃO
    // ========================================

async function prepararFCM() {
    try {
        if (!("serviceWorker" in navigator)) {
            console.log("Service Worker não suportado.");
            return;
        }

        const registroSW = await navigator.serviceWorker.register(
    "./firebase-messaging-sw.js"
);

        await navigator.serviceWorker.ready;

        console.log("Service Worker registrado:", registroSW);

        const permissao = await Notification.requestPermission();

        if (permissao !== "granted") {
            console.log("Permissão para notificações negada.");
            return;
        }

        const token = await getToken(messaging, {
            vapidKey:"BMlE30g7RCzkg0qauJHGOH3Mn7b6PUHIMnOmdynrL3rOHlez2__FXCXz7JW57KgSKdaQvRpGY77lX74JQT-FDFI",
            serviceWorkerRegistration: registroSW
        });

        if (!token) {
            console.log("Não foi possível obter o token FCM.");
            return;
        }

        console.log("TOKEN FCM:", token);

    } catch (erro) {
        console.error("Erro ao preparar FCM:", erro);
    }
}

    onAuthStateChanged(
        auth,
        async (usuario) => {

            if (!usuario) {

                window.location.href =
                    "login.html";

                return;
            }


            await prepararNotificacoes();
await prepararFCM();

carregarAgendamentos();
carregarHorarios();

monitorarNovosAgendamentos();

        }
    );


    // ========================================
    // NOTIFICAÇÕES DE NOVOS AGENDAMENTOS
    // ========================================

    let idsAgendamentosConhecidos = new Set();
    let primeiraLeituraAgendamentos = true;
    let notificacoesAtivas = false;


    // ========================================
    // PEDIR PERMISSÃO
    // ========================================

    async function prepararNotificacoes() {

        if (!("Notification" in window)) {

            console.log(
                "Este navegador não suporta notificações."
            );

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

    }


    // ========================================
    // MOSTRAR NOTIFICAÇÃO
    // ========================================

    function mostrarNotificacaoAgendamento(
        agendamento
    ) {

        if (!notificacoesAtivas) {
            return;
        }


        const titulo =
        `✂️ Novo agendamento — ${CONFIG.nome}`;


        const corpo =
            `${agendamento.nome} agendou ${agendamento.servico} às ${agendamento.horario}.`;


        const notificacao =
            new Notification(
                titulo,
                {
                    body: corpo,
                    icon: "/favicon.ico",
                    tag: "novo-agendamento"
                }
            );


        notificacao.onclick = () => {

            window.focus();

            notificacao.close();

        };

    }


    // ========================================
    // MONITORAR NOVOS AGENDAMENTOS
    // ========================================

    function monitorarNovosAgendamentos() {

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
                // Não notificar agendamentos antigos
                // ========================================

                if (primeiraLeituraAgendamentos) {

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


                                // Atualizar painel
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

                    mensagem.textContent =
                        "Erro ao sair da conta.";

                }

            }
        );

    }


    // ========================================
    // CARREGAR AGENDAMENTOS
    // ========================================

    async function carregarAgendamentos() {

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
            // NENHUM AGENDAMENTO NO BANCO
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

            const agendamentos =
                Object.entries(dados)

                    .filter(
                        ([id, agendamento]) => {

                            return (
                                agendamento.data === data &&
                                agendamento.status !== "cancelado"
                            );

                        }
                    )

                    .sort(
                        ([idA, a], [idB, b]) => {

                            return String(
                                a.horario
                            ).localeCompare(
                                String(b.horario)
                            );

                        }
                    );


            // ========================================
            // TOTAL DE AGENDADOS
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
                            agendamento.telefone || ""
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
                            ${agendamento.horario}
                        </div>

                        <div class="cliente">
                            ${agendamento.nome}
                        </div>

                        <div class="info">
                            Serviço: ${agendamento.servico}
                        </div>

                        <div class="info">
                            WhatsApp: ${agendamento.telefone}
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
                    // BOTÃO CANCELAR
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
                                agendamento.status === "confirmado"
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


            // ========================================
            // CONTADORES
            // ========================================

            let quantidadeDisponiveis =
                0;

            let quantidadeOcupados =
                0;


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


                    if (disponivel) {

                        quantidadeDisponiveis++;

                    } else {

                        quantidadeOcupados++;

                    }

                }
            );


            // ========================================
            // ATUALIZAR RESUMO
            // ========================================

            if (totalDisponiveis) {

                totalDisponiveis.textContent =
                    quantidadeDisponiveis;

            }


            if (totalOcupados) {

                totalOcupados.textContent =
                    quantidadeOcupados;

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


                    const disponivel =
                        !ocupado &&
                        dados &&
                        dados.disponivel === true;


                    // ========================================
                    // CRIAR CARD
                    // ========================================

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
        // MARCAR AGENDAMENTO COMO CANCELADO
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


        mensagem.textContent =
            "✓ Agendamento cancelado.";


        await carregarAgendamentos();
        await carregarHorarios();


    } catch (erro) {

        console.error(
            "Erro ao cancelar:",
            erro
        );

        mensagem.textContent =
            "Erro ao cancelar o agendamento.";

    }

}

    // ========================================
    // ADICIONAR HORÁRIO MANUALMENTE
    // ========================================

    if (adicionarHorario) {

        adicionarHorario.addEventListener(
            "click",
            async () => {

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

                    let totalHorarios = 0;


                    // ========================================
                    // DATA DE HOJE
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
                            // CAMINHO FIREBASE
                            // ========================================

                            const caminho =
                            `${CAMINHO_BARBEIRO}/horarios/${dataFirebase}/${horario}/disponivel`;


                            atualizacoes[caminho] =
                                true;


                            totalHorarios++;

                        }

                    }


                    // ========================================
                    // ENVIAR TUDO DE UMA VEZ
                    // ========================================

                    await update(
                        ref(db),
                        atualizacoes
                    );


                    mensagem.textContent =
                        `✓ 7 dias gerados com sucesso. ${totalHorarios} horários criados.`;


                    // ========================================
                    // ATUALIZAR PAINEL
                    // ========================================

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
            // VERIFICAR SE REALMENTE FOI REMOVIDO
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