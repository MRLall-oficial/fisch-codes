const cfg = window.FISCH_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.startsWith("COLE_AQUI") && !cfg.SUPABASE_ANON_KEY.startsWith("COLE_AQUI");
const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginMessage = document.getElementById("loginMessage");
const formMessage = document.getElementById("formMessage");
let db = null;

function message(el, text, error=false) { el.textContent = text; el.className = "message " + (error ? "error" : ""); }
function resetForm() {
  document.getElementById("codeForm").reset();
  document.getElementById("codeId").value = "";
  document.getElementById("formTitle").textContent = "Adicionar código";
  document.getElementById("cancelEdit").hidden = true;
  message(formMessage, "");
}
function showDashboard(show) { loginPanel.hidden = show; dashboard.hidden = !show; }

async function refreshAdminList() {
  const box = document.getElementById("adminCodeList"); box.replaceChildren();
  const {data,error} = await db.from("codes").select("*").order("created_at",{ascending:false});
  if (error) { box.textContent = "Erro ao carregar códigos."; return; }
  if (!data.length) { box.textContent = "Ainda não há códigos cadastrados."; return; }
  data.forEach(c => {
    const row = document.createElement("div"); row.className = "admin-row";
    const info = document.createElement("div");
    const name = document.createElement("strong"); name.textContent = c.code;
    const sub = document.createElement("small"); sub.textContent = (c.status === "active" ? "Ativo" : "Expirado") + " · " + (c.reward || "Sem recompensa");
    info.append(name,sub);
    const actions = document.createElement("div"); actions.className = "row-actions";
    const edit = document.createElement("button"); edit.className = "secondary"; edit.textContent = "Editar";
    edit.addEventListener("click", () => {
      document.getElementById("codeId").value = c.id;
      document.getElementById("code").value = c.code;
      document.getElementById("reward").value = c.reward || "";
      document.getElementById("status").value = c.status;
      document.getElementById("formTitle").textContent = "Editar código";
      document.getElementById("cancelEdit").hidden = false;
      window.scrollTo({top:0,behavior:"smooth"});
    });
    const del = document.createElement("button"); del.className = "danger"; del.textContent = "Excluir";
    del.addEventListener("click", async () => {
      if (!confirm(`Excluir o código ${c.code}?`)) return;
      const {error} = await db.from("codes").delete().eq("id",c.id);
      if (error) alert("Não foi possível excluir. Confira as permissões do banco.");
      else refreshAdminList();
    });
    actions.append(edit,del); row.append(info,actions); box.append(row);
  });
}
async function checkSession() {
  if (!configured) { message(loginMessage, "Primeiro configure config.js com os dados do Supabase.", true); return; }
  db = window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const {data} = await db.auth.getSession();
  showDashboard(!!data.session);
  if (data.session) refreshAdminList();
}
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!configured) return message(loginMessage,"Configure o Supabase primeiro.",true);
  if (!db) db = window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const {error} = await db.auth.signInWithPassword({
    email:document.getElementById("email").value,
    password:document.getElementById("password").value
  });
  if (error) return message(loginMessage,"Login não realizado. Confira e-mail e senha.",true);
  message(loginMessage,"Login realizado!");
  showDashboard(true); refreshAdminList();
});
document.getElementById("logout").addEventListener("click", async () => {
  await db.auth.signOut(); showDashboard(false);
});
document.getElementById("cancelEdit").addEventListener("click",resetForm);
document.getElementById("codeForm").addEventListener("submit",async e => {
  e.preventDefault();
  const id = document.getElementById("codeId").value;
  const payload = {
    code:document.getElementById("code").value.trim(),
    reward:document.getElementById("reward").value.trim(),
    status:document.getElementById("status").value,
    updated_at:new Date().toISOString()
  };
  if (!payload.code) return message(formMessage,"Digite um código.",true);
  const result = id ? await db.from("codes").update(payload).eq("id",id)
                    : await db.from("codes").insert(payload);
  if (result.error) return message(formMessage,"Erro ao salvar. Confira se o código já existe e as permissões.",true);
  message(formMessage,"Código salvo!");
  resetForm(); refreshAdminList();
});
checkSession();