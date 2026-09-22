import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { db } from "./firebase.js";
import { CONFIG } from "./config.js";


const CAMINHO_BARBEIRO =
    `barbeiros/${CONFIG.id}`;


async function migrar() {

    console.log("Iniciando migração...");

    try {

        // ========================================
        // LER DADOS ANTIGOS
        // ========================================

        const horariosSnapshot =
            await get(
                ref(db, "horarios")
            );

        const agendamentosSnapshot =
            await get(
                ref(db, "agendamentos")
            );

        const servicosSnapshot =
            await get(
                ref(db, "servicos")
            );


        const atualizacoes = {};


        // ========================================
        // HORÁRIOS
        // ========================================

        if (
            horariosSnapshot.exists()
        ) {

            atualizacoes[
                `${CAMINHO_BARBEIRO}/horarios`
            ] =
                horariosSnapshot.val();

            console.log(
                "✓ Horários preparados"
            );

        } else {

            console.log(
                "⚠ Nenhum horário encontrado"
            );

        }


        // ========================================
        // AGENDAMENTOS
        // ========================================

        if (
            agendamentosSnapshot.exists()
        ) {

            atualizacoes[
                `${CAMINHO_BARBEIRO}/agendamentos`
            ] =
                agendamentosSnapshot.val();

            console.log(
                "✓ Agendamentos preparados"
            );

        } else {

            console.log(
                "⚠ Nenhum agendamento encontrado"
            );

        }


        // ========================================
        // SERVIÇOS
        // ========================================

        if (
            servicosSnapshot.exists()
        ) {

            atualizacoes[
                `${CAMINHO_BARBEIRO}/servicos`
            ] =
                servicosSnapshot.val();

            console.log(
                "✓ Serviços preparados"
            );

        } else {

            console.log(
                "⚠ Nenhum serviço encontrado"
            );

        }


        // ========================================
        // CONFIGURAÇÕES
        // ========================================

        atualizacoes[
            `${CAMINHO_BARBEIRO}/configuracoes`
        ] = {

            nome:
                CONFIG.nome,

            cidade:
                CONFIG.cidade,

            whatsapp:
                CONFIG.whatsapp,

            instagram:
                CONFIG.instagram,

            horario:
                CONFIG.horario

        };


        // ========================================
        // ENVIAR
        // ========================================

        console.log(
            "Enviando dados para o Firebase..."
        );

        await update(
    ref(
        db,
        `${CAMINHO_BARBEIRO}/horarios`
    ),
    horariosSnapshot.exists()
        ? horariosSnapshot.val()
        : {}
);

await update(
    ref(
        db,
        `${CAMINHO_BARBEIRO}/agendamentos`
    ),
    agendamentosSnapshot.exists()
        ? agendamentosSnapshot.val()
        : {}
);

await update(
    ref(
        db,
        `${CAMINHO_BARBEIRO}/servicos`
    ),
    servicosSnapshot.exists()
        ? servicosSnapshot.val()
        : {}
);

await update(
    ref(
        db,
        `${CAMINHO_BARBEIRO}/configuracoes`
    ),
    {
        nome:
            CONFIG.nome,

        cidade:
            CONFIG.cidade,

        whatsapp:
            CONFIG.whatsapp,

        instagram:
            CONFIG.instagram,

        horario:
            CONFIG.horario
    }
);


        // ========================================
        // SUCESSO
        // ========================================

        console.log(
            "================================"
        );

        console.log(
            "✓ MIGRAÇÃO CONCLUÍDA!"
        );

        console.log(
            `✓ Barbeiro: ${CONFIG.id}`
        );

        console.log(
            "================================"
        );


    } catch (erro) {

        console.error(
            "❌ ERRO NA MIGRAÇÃO:",
            erro
        );

    }

}


migrar();