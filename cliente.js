import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import {
    auth,
    db
} from "./firebase.js";


export async function descobrirCliente() {

    const usuario =
        auth.currentUser;

    if (!usuario) {

        throw new Error(
            "Usuário não autenticado."
        );

    }

    const usuarioRef =
        ref(
            db,
            `usuarios/${usuario.uid}/clienteId`
        );

    const snapshot =
        await get(usuarioRef);

    if (!snapshot.exists()) {

        throw new Error(
            "Este usuário não possui um cliente vinculado."
        );

    }

    return snapshot.val();

}