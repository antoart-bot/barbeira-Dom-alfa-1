import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import { auth, db } from "./firebase.js";

const conteudo=document.getElementById("conteudo");
const bloqueado=document.getElementById("bloqueado");
const form=document.getElementById("formEstabelecimento");
const lista=document.getElementById("servicos");
const mensagem=document.getElementById("mensagem");
const btnCadastrar=document.getElementById("cadastrar");

function escaparId(valor){return /^[a-z0-9-]+$/.test(valor)}
function mensagemErro(txt){mensagem.textContent=txt;mensagem.className="message error"}
function mensagemOk(txt){mensagem.textContent=txt;mensagem.className="message ok"}

function adicionarServico(nome="",preco=""){
  const row=document.createElement("div"); row.className="service-row";
  row.innerHTML=`<input class="servico-nome" required maxlength="60" placeholder="Ex.: Corte" value="${nome.replaceAll('"','&quot;')}"><input class="servico-preco" required type="number" min="0" step="0.01" placeholder="40" value="${preco}"><button type="button" title="Remover">×</button>`;
  row.querySelector("button").addEventListener("click",()=>row.remove());
  lista.appendChild(row);
}

adicionarServico("Corte",40); adicionarServico("Barba",30); adicionarServico("Corte + Barba",65);
document.getElementById("adicionarServico").addEventListener("click",()=>adicionarServico());
document.getElementById("sair").addEventListener("click",()=>signOut(auth));

onAuthStateChanged(auth,async usuario=>{
  if(!usuario){window.location.href="login.html";return}
  try{
    const snap=await get(ref(db,`administradores/${usuario.uid}`));
    if(snap.val()!==true){bloqueado.classList.remove("hidden");return}
    conteudo.classList.remove("hidden");
  }catch(erro){console.error(erro);mensagemErro("Não foi possível verificar seu acesso administrativo.")}
});

form.addEventListener("submit",async event=>{
  event.preventDefault(); mensagem.textContent="";
  const usuario=auth.currentUser;
  if(!usuario){window.location.href="login.html";return}
  const adminSnap=await get(ref(db,`administradores/${usuario.uid}`));
  if(adminSnap.val()!==true){mensagemErro("Sua conta não possui acesso administrativo.");return}
  const nome=document.getElementById("nome").value.trim();
  const id=document.getElementById("id").value.trim().toLowerCase();
  const cidade=document.getElementById("cidade").value.trim();
  const whatsapp=document.getElementById("whatsapp").value.trim();
  const instagram=document.getElementById("instagram").value.trim();
  const ownerUid=document.getElementById("ownerUid").value.trim();
  if(!escaparId(id)){mensagemErro("O ID deve usar apenas letras minúsculas, números e hífen.");return}
  if(!ownerUid){mensagemErro("Informe o UID do responsável.");return}
  const servicos={};
  for(const row of lista.querySelectorAll(".service-row")){
    const n=row.querySelector(".servico-nome").value.trim();
    const p=Number(row.querySelector(".servico-preco").value);
    if(!n || !Number.isFinite(p)){mensagemErro("Confira os serviços e preços.");return}
    const chave=n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
    servicos[chave]={nome:n,preco:p};
  }
  if(Object.keys(servicos).length===0){mensagemErro("Cadastre pelo menos um serviço.");return}
  btnCadastrar.disabled=true; btnCadastrar.textContent="Criando...";
  try{
    const estabelecimentoRef=ref(db,`barbeiros/${id}`);
    const existente=await get(estabelecimentoRef);
    if(existente.exists()){mensagemErro("Esse ID já existe. Escolha outro.");return}
    const dados={ownerUid,configuracoes:{nome,cidade,whatsapp,instagram},servicos,agendamentos:{},horarios:{},notificacoes:{}};
    await set(estabelecimentoRef, dados);

await set(
  ref(db, `usuarios/${ownerUid}/clienteId`),
  id
);

mensagemOk(`Estabelecimento "${nome}" criado com sucesso.`);
    form.reset(); lista.innerHTML=""; adicionarServico("Corte",40); adicionarServico("Barba",30); adicionarServico("Corte + Barba",65);
  }catch(erro){console.error(erro);mensagemErro("Não foi possível criar. Verifique as Rules do Firebase.")}
  finally{btnCadastrar.disabled=false;btnCadastrar.textContent="Criar estabelecimento"}
});
