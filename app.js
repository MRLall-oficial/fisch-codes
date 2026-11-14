const cfg = window.FISCH_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.startsWith("COLE_AQUI") && !cfg.SUPABASE_ANON_KEY.startsWith("COLE_AQUI");
const list = document.getElementById("codeList");
let allCodes = [], filter = "all";

function showEmpty(message) {
  list.replaceChildren();
  const box = document.createElement("div");
  box.className = "empty"; box.textContent = message; list.appendChild(box);
}
function render() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const visible = allCodes.filter(c =>
    (filter === "all" || c.status === filter) && c.code.toLowerCase().includes(q)
  );
  list.replaceChildren();
  if (!visible.length) return showEmpty("Nenhum código encontrado.");
  visible.forEach(c => {
    const card = document.createElement("article"); card.className = "code-card";
    const top = document.createElement("div"); top.className = "card-top";
    const name = document.createElement("strong"); name.className = "code-name"; name.textContent = c.code;
    const tag = document.createElement("span"); tag.className = "tag " + c.status;
    tag.textContent = c.status === "active" ? "ATIVO" : "EXPIRADO";
    top.append(name, tag);
    const reward = document.createElement("p"); reward.className = "reward";
    reward.textContent = c.reward || "Recompensa não informada";
    const copy = document.createElement("button"); copy.className = "copy";
    copy.textContent = "Copiar código";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(c.code); copy.textContent = "✓ Copiado!"; }
      catch { copy.textContent = "Falha ao copiar"; }
      setTimeout(() => copy.textContent = "Copiar código", 1500);
    });
    card.append(top, reward, copy); list.appendChild(card);
  });
}
async function loadCodes() {
  if (!configured) return showEmpty("Configure a URL e a chave pública do Supabase no arquivo config.js.");
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const { data, error } = await client.from("codes").select("*").order("created_at", {ascending:false});
  if (error) return showEmpty("Não foi possível carregar os códigos. Confira a configuração do Supabase.");
  allCodes = data || [];
  document.getElementById("activeCount").textContent = allCodes.filter(c => c.status === "active").length;
  document.getElementById("expiredCount").textContent = allCodes.filter(c => c.status === "expired").length;
  document.getElementById("totalCount").textContent = allCodes.length;
  const latest = allCodes.reduce((max,c) => c.updated_at > max ? c.updated_at : max, "");
  document.getElementById("updatedAt").textContent = latest
    ? "Atualizado em " + new Date(latest).toLocaleString("pt-BR")
    : "Nenhum código cadastrado";
  render();
}
document.getElementById("search").addEventListener("input", render);
document.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); filter = b.dataset.filter; render();
}));
loadCodes();