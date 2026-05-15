import { useState } from "react";

const USERS = {
  admin:   { password: "admin123",   role: "admin",   name: "Admin Sistema" },
  gerente: { password: "gerente123", role: "gerente", name: "Carlos Gerente" },
  cotacao: { password: "cotacao123", role: "cotacao", name: "Ana Cotação" },
  pagador: { password: "pagador123", role: "pagador", name: "Paulo Pagador" },
};
const ROLE_LABELS = { admin:"Administrador", gerente:"Gerencial", cotacao:"Cotação", pagador:"Pagador" };

// "Carga Programada" e "Finalizado" removidos do Kanban
const KANBAN_COLS = ["Planejamento","Cotação","Negociação Fechada","Aguardando Pagamento","Pago"];
const COL_COLORS  = {
  "Planejamento":"#60a5fa","Cotação":"#a78bfa",
  "Negociação Fechada":"#f59e0b","Aguardando Pagamento":"#f97316","Pago":"#10b981",
  "Finalizado":"#64748b",
};
const COMBUSTIVEIS = ["Diesel S10","Diesel S500","Gasolina Comum","Gasolina Aditivada","Etanol"];
const FORMAS_PAG   = ["PIX","Boleto","Antecipado","Transferência"];
const ESTADOS_BR   = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const POSTOS_INIT = [
  { id:1, nome:"Posto Alpha", razao:"Alpha Combustíveis Ltda", cnpj:"12.345.678/0001-90", cidade:"Goiânia",              estado:"GO", telefone:"(62) 3333-1111", responsavel:"Maria Alpha", whatsapp:"5562991110001", ativo:true  },
  { id:2, nome:"Posto Beta",  razao:"Beta Energia Ltda",       cnpj:"23.456.789/0001-01", cidade:"Aparecida de Goiânia", estado:"GO", telefone:"(62) 3333-2222", responsavel:"José Beta",   whatsapp:"5562991110002", ativo:true  },
  { id:3, nome:"Posto Gama",  razao:"Gama Distribuidora Ltda", cnpj:"34.567.890/0001-12", cidade:"Anápolis",             estado:"GO", telefone:"(62) 3333-3333", responsavel:"Ana Gama",    whatsapp:"5562991110003", ativo:true  },
  { id:4, nome:"Posto Delta", razao:"Delta Petro Ltda",        cnpj:"45.678.901/0001-23", cidade:"Rio Verde",            estado:"GO", telefone:"(64) 3333-4444", responsavel:"Carlos Delta", whatsapp:"5562991110004", ativo:false },
];
const DIST_INIT = [
  { id:1, nome:"Petrobras Dist.", cnpj:"33.000.167/0001-01", telefone:"(11)3333-0001", email:"comercial@petrobras.com.br", pix:"pix@petrobras.com.br", banco:"Bradesco", agencia:"0001", conta:"123456-7", saldo:450000, ativo:true },
  { id:2, nome:"Ipiranga",        cnpj:"33.337.122/0001-77", telefone:"(11)3333-0002", email:"comercial@ipiranga.com.br",  pix:"pix@ipiranga.com.br",  banco:"Itaú",     agencia:"0002", conta:"234567-8", saldo:120000, ativo:true },
  { id:3, nome:"Raízen",          cnpj:"33.453.598/0001-23", telefone:"(11)3333-0003", email:"comercial@raizen.com.br",    pix:"pix@raizen.com.br",    banco:"Caixa",    agencia:"0003", conta:"345678-9", saldo:280000, ativo:true },
  { id:4, nome:"Ale Combustíveis",cnpj:"11.152.208/0001-60", telefone:"(11)3333-0004", email:"comercial@ale.com.br",       pix:"pix@ale.com.br",       banco:"BB",       agencia:"0004", conta:"456789-0", saldo:75000,  ativo:true },
];
const MOTORISTAS_INIT = [
  { id:1, nome:"João Silva",  cpf:"111.111.111-11", telefone:"(62)99901-0001", whatsapp:"5562999010001", placa:"ABC-1234", transportadora:"Trans Alpha", ativo:true },
  { id:2, nome:"Pedro Costa", cpf:"222.222.222-22", telefone:"(62)99901-0002", whatsapp:"5562999010002", placa:"DEF-5678", transportadora:"Trans Beta",  ativo:true },
  { id:3, nome:"Lucas Alves", cpf:"333.333.333-33", telefone:"(62)99901-0003", whatsapp:"5562999010003", placa:"GHI-9012", transportadora:"Trans Gama",  ativo:true },
  { id:4, nome:"Rafael Mota", cpf:"444.444.444-44", telefone:"(62)99901-0004", whatsapp:"5562999010004", placa:"JKL-3456", transportadora:"Trans Delta", ativo:true },
  { id:5, nome:"Marcos Lima", cpf:"555.555.555-55", telefone:"(62)99901-0005", whatsapp:"5562999010005", placa:"MNO-7890", transportadora:"Trans Lima",  ativo:true },
];
const CARGAS_INIT = [
  { id:1, combustivel:"Diesel S10",         quantidade:30000, posto:"Posto Alpha", distribuidora:"",               motorista:"",            valorLitro:0,    valorTotal:0,      formaPagamento:"",              status:"Planejamento",         data:"2026-05-14", vencimento:"",          obs:"",          financeiro:"pendente" },
  { id:2, combustivel:"Gasolina Comum",     quantidade:20000, posto:"Posto Beta",  distribuidora:"",               motorista:"",            valorLitro:0,    valorTotal:0,      formaPagamento:"",              status:"Cotação",              data:"2026-05-15", vencimento:"",          obs:"",          financeiro:"pendente" },
  { id:3, combustivel:"Diesel S500",        quantidade:15000, posto:"Posto Gama",  distribuidora:"Raízen",         motorista:"Lucas Alves", valorLitro:6.10, valorTotal:91500,  formaPagamento:"Antecipado",    status:"Negociação Fechada",   data:"2026-05-13", vencimento:"2026-05-13",obs:"Urgente",   financeiro:"pago"    },
  { id:4, combustivel:"Etanol",             quantidade:10000, posto:"Posto Delta", distribuidora:"Ale Combustíveis",motorista:"Rafael Mota",valorLitro:4.20, valorTotal:42000,  formaPagamento:"Transferência", status:"Aguardando Pagamento", data:"2026-05-12", vencimento:"2026-05-12",obs:"",          financeiro:"pendente" },
  { id:5, combustivel:"Diesel S10",         quantidade:25000, posto:"Posto Alpha", distribuidora:"Petrobras Dist.",motorista:"João Silva",  valorLitro:6.48, valorTotal:162000, formaPagamento:"PIX",           status:"Pago",                 data:"2026-05-10", vencimento:"2026-05-10",obs:"",          financeiro:"pago"    },
  { id:6, combustivel:"Diesel S10",         quantidade:35000, posto:"Posto Gama",  distribuidora:"Raízen",         motorista:"Lucas Alves", valorLitro:6.42, valorTotal:224700, formaPagamento:"Boleto",         status:"Finalizado",           data:"2026-05-08", vencimento:"2026-05-09",obs:"Entregue OK",financeiro:"pago"    },
];
const WPP_LOG_INIT = [
  { id:1, tipo:"grupo_posto", destino:"Posto Alpha - WhatsApp",        mensagem:"🚛 Carga Paga\n\nPosto: POSTO ALPHA\nCombustível: Diesel S10\nQuantidade: 25.000 litros\nMotorista: João Silva",            status:"enviado", ts:"2026-05-10 09:15" },
  { id:2, tipo:"motorista",   destino:"João Silva +5562999010001",      mensagem:"🚛 Nova viagem atribuída\n\nDestino: Posto Alpha\nCombustível: Diesel S10\nQuantidade: 25.000 litros",                     status:"enviado", ts:"2026-05-10 09:16" },
  { id:3, tipo:"motorista",   destino:"Pedro Costa +5562999010002",     mensagem:"🚛 Nova viagem atribuída\n\nDestino: Posto Beta\nCombustível: Gasolina Comum\nQuantidade: 20.000 litros",                  status:"erro",    ts:"2026-05-12 10:02" },
];

const fmt  = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtN = v => new Intl.NumberFormat("pt-BR").format(v||0);

function useTheme(isDark) {
  return {
    bg:     isDark?"#0f1117":"#f4f6fa",
    surface:isDark?"#1a1d27":"#ffffff",
    surf2:  isDark?"#22263a":"#f0f4ff",
    border: isDark?"#2e3348":"#e2e8f0",
    text:   isDark?"#e8eaf0":"#1a202c",
    muted:  isDark?"#7b82a0":"#64748b",
    accent: "#3b82f6",
    isDark,
  };
}

function inp(s,extra={}) {
  return { width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${s.border}`,background:s.isDark?"#0f1117":"#f8fafc",color:s.text,fontSize:14,boxSizing:"border-box",outline:"none",...extra };
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,      setUser]      = useState(null);
  const [page,      setPage]      = useState("dashboard");
  const [cargas,    setCargas]    = useState(CARGAS_INIT);
  const [postos,    setPostos]    = useState(POSTOS_INIT);
  const [dists,     setDists]     = useState(DIST_INIT);
  const [motoristas,setMotoristas]= useState(MOTORISTAS_INIT);
  const [wppLog,    setWppLog]    = useState(WPP_LOG_INIT);
  const [dark,      setDark]      = useState(true);
  const [toast,     setToast]     = useState(null);
  const [modal,     setModal]     = useState(null);
  const [dragCard,  setDragCard]  = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const [sidebar,   setSidebar]   = useState(true);
  const [loginForm, setLoginForm] = useState({u:"",p:""});
  const [loginErr,  setLoginErr]  = useState("");
  const [filterComb,setFilterComb]= useState("all");

  const s = useTheme(dark);

  const toast$ = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const login = () => {
    const u = USERS[loginForm.u];
    if (u && u.password===loginForm.p) {
      setUser({username:loginForm.u,...u});
      setLoginErr("");
      setPage(u.role==="cotacao"?"cotacao":u.role==="pagador"?"pagamentos":"dashboard");
    } else setLoginErr("Usuário ou senha incorretos.");
  };

  const moveCarga = (id, toStatus) => {
    setCargas(c=>c.map(x=>x.id===id?{...x,status:toStatus}:x));
    toast$(`Movido para ${toStatus}`);
    if (toStatus==="Pago") {
      const carga = cargas.find(x=>x.id===id);
      if (carga) {
        const log = { id:Date.now(), tipo:"grupo_posto", destino:`${carga.posto} - WhatsApp`,
          mensagem:`🚛 *Carga Paga — Programar Entrega*\n\nPosto: ${carga.posto.toUpperCase()}\nCombustível: ${carga.combustivel}\nQuantidade: ${fmtN(carga.quantidade)} litros\nMotorista: ${carga.motorista||"A definir"}\nDistribuidora: ${carga.distribuidora||"A definir"}`,
          status:"enviado", ts:new Date().toLocaleString("pt-BR") };
        setWppLog(l=>[log,...l]);
      }
    }
  };

  const updateCarga = (id,fields) => setCargas(c=>c.map(x=>x.id===id?{...x,...fields}:x));

  const addCarga = (form) => {
    setCargas(c=>[...c,{ ...form, id:Date.now(), quantidade:parseFloat(form.quantidade),
      valorLitro:0, valorTotal:0, distribuidora:"", motorista:"", formaPagamento:"", vencimento:"",
      status:"Planejamento", financeiro:"pendente" }]);
    setModal(null);
    toast$("Carga criada com sucesso!");
  };

  if (!user) return <Login s={s} form={loginForm} setForm={setLoginForm} err={loginErr} onLogin={login} />;

  const NAV = [
    {id:"dashboard",     label:"Dashboard",     icon:"ti-dashboard",      roles:["admin","gerente"]},
    {id:"kanban",        label:"Kanban",         icon:"ti-layout-kanban",  roles:["admin","gerente","cotacao"]},
    {id:"cotacao",       label:"Cotação",        icon:"ti-currency-dollar",roles:["admin","cotacao"]},
    {id:"pagamentos",    label:"Pagamentos",     icon:"ti-receipt",        roles:["admin","pagador"]},
    {id:"postos",        label:"Postos",         icon:"ti-building-store", roles:["admin"]},
    {id:"distribuidoras",label:"Distribuidoras", icon:"ti-truck",          roles:["admin"]},
    {id:"motoristas",    label:"Motoristas",     icon:"ti-user",           roles:["admin"]},
    {id:"whatsapp",      label:"WhatsApp",       icon:"ti-brand-whatsapp", roles:["admin"]},
    {id:"relatorios",    label:"Relatórios",     icon:"ti-file-analytics", roles:["admin","gerente"]},
  ].filter(n=>n.roles.includes(user.role));

  // Kanban nunca mostra Finalizado
  const filtCargas = cargas.filter(c=>
    c.status!=="Finalizado" &&
    (filterComb==="all"||c.combustivel===filterComb)
  );

  return (
    <div style={{display:"flex",height:"100vh",background:s.bg,color:s.text,fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:sidebar?220:60,background:s.surface,borderRight:`1px solid ${s.border}`,display:"flex",flexDirection:"column",transition:"width 0.2s",flexShrink:0,overflow:"hidden"}}>
        <div onClick={()=>setSidebar(!sidebar)} style={{padding:"16px 12px",borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:8,background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="ti ti-flame" style={{color:"#fff",fontSize:18}}/>
          </div>
          {sidebar&&<span style={{fontWeight:700,fontSize:15,whiteSpace:"nowrap"}}>FuelOps</span>}
        </div>
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:page===n.id?(s.isDark?"#1e3a5f":"#dbeafe"):"transparent",color:page===n.id?s.accent:s.muted,fontWeight:page===n.id?600:400,fontSize:14,marginBottom:2,whiteSpace:"nowrap"}}>
              <i className={`ti ${n.icon}`} style={{fontSize:18,flexShrink:0}}/>
              {sidebar&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:`1px solid ${s.border}`}}>
          <button onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:s.muted,fontSize:14}}>
            <i className={`ti ${dark?"ti-sun":"ti-moon"}`} style={{fontSize:18}}/>
            {sidebar&&<span>{dark?"Modo Claro":"Modo Escuro"}</span>}
          </button>
          <button onClick={()=>setUser(null)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:"#ef4444",fontSize:14}}>
            <i className="ti ti-logout" style={{fontSize:18}}/>
            {sidebar&&<span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:56,background:s.surface,borderBottom:`1px solid ${s.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:16,flexShrink:0}}>
          <span style={{flex:1,fontWeight:600,fontSize:16}}>{NAV.find(n=>n.id===page)?.label||"FuelOps"}</span>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:8,background:s.surf2,border:`1px solid ${s.border}`}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{user.name[0]}</div>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{user.name}</div>
              <div style={{fontSize:11,color:s.muted}}>{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
        </header>

        <div style={{flex:1,overflow:"auto",padding:20}}>
          {page==="dashboard"     &&<Dashboard     s={s} cargas={cargas} distribuidoras={dists}/>}
          {page==="kanban"        &&<Kanban        s={s} cargas={filtCargas} filterComb={filterComb} setFilterComb={setFilterComb} moveCarga={moveCarga} user={user} onNew={()=>setModal({type:"newCarga"})} onCard={c=>setModal({type:"card",data:c})} dragCard={dragCard} setDragCard={setDragCard} dragOver={dragOver} setDragOver={setDragOver} postos={postos}/>}
          {page==="cotacao"       &&<Cotacao       s={s} cargas={cargas} setCargas={setCargas} toast$={toast$} distribuidoras={dists} motoristas={motoristas}/>}
          {page==="pagamentos"    &&<Pagamentos    s={s} cargas={cargas} updateCarga={updateCarga} toast$={toast$}/>}
          {page==="postos"        &&<Postos        s={s} postos={postos} setPostos={setPostos} toast$={toast$} modal={modal} setModal={setModal}/>}
          {page==="distribuidoras"&&<Distribuidoras s={s} dists={dists} setDists={setDists} toast$={toast$} modal={modal} setModal={setModal}/>}
          {page==="motoristas"    &&<Motoristas    s={s} motoristas={motoristas} setMotoristas={setMotoristas} toast$={toast$} modal={modal} setModal={setModal}/>}
          {page==="whatsapp"      &&<WhatsApp      s={s} wppLog={wppLog}/>}
          {page==="relatorios"    &&<Relatorios    s={s} cargas={cargas} postos={postos} dists={dists}/>}
        </div>
      </div>

      {/* Modais kanban */}
      {modal&&(modal.type==="newCarga"||modal.type==="card")&&(
        <Overlay onClose={()=>setModal(null)}>
          {modal.type==="newCarga"&&<NewCargaModal  s={s} postos={postos} onSave={addCarga}  onClose={()=>setModal(null)}/>}
          {modal.type==="card"   &&<CardDetail      s={s} carga={modal.data} onClose={()=>setModal(null)} moveCarga={moveCarga} user={user} updateCarga={updateCarga}/>}
        </Overlay>
      )}

      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,background:toast.type==="success"?"#10b981":"#ef4444",color:"#fff",padding:"12px 20px",borderRadius:10,fontWeight:600,fontSize:14,zIndex:2000,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Overlay({children,onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"var(--surface,#1a1d27)",borderRadius:16,width:540,maxHeight:"88vh",overflow:"auto",padding:28,boxSizing:"border-box"}}>
        {children}
      </div>
    </div>
  );
}

function Stat({s,icon,label,value,color}) {
  return (
    <div style={{background:s.surf2,borderRadius:12,border:`1px solid ${s.border}`,padding:"16px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:36,height:36,borderRadius:8,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <i className={`ti ${icon}`} style={{color,fontSize:20}}/>
        </div>
        <span style={{fontSize:13,color:s.muted}}>{label}</span>
      </div>
      <div style={{fontSize:22,fontWeight:700}}>{value}</div>
    </div>
  );
}

function Field({s,label,children}) {
  return (
    <div>
      <label style={{fontSize:12,color:s.muted,display:"block",marginBottom:5,fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}

// Modal genérico de cadastro (Postos, Distribuidoras, Motoristas)
function CadastroModal({s,title,fields,initial,onSave,onClose}) {
  const [f,setF] = useState({...initial});
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:s.surface,borderRadius:16,border:`1px solid ${s.border}`,width:560,maxHeight:"88vh",overflow:"auto",padding:28,boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontSize:18,fontWeight:700,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:s.muted,cursor:"pointer",fontSize:24,lineHeight:1}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {fields.map(field=>(
            <div key={field.key} style={field.full?{gridColumn:"1/-1"}:{}}>
              <Field s={s} label={field.label}>
                {field.type==="select"
                  ?<select value={f[field.key]??""} onChange={e=>setF(x=>({...x,[field.key]:e.target.value}))} style={inp(s)}>
                     {(field.opts||[]).map(o=>{
                       const v=o?.value??o; const l=o?.label??o;
                       return <option key={v} value={v}>{l}</option>;
                     })}
                   </select>
                  :field.type==="toggle"
                  ?<div style={{display:"flex",gap:8,marginTop:4}}>
                     {[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(opt=>(
                       <button key={opt.l} onClick={()=>setF(x=>({...x,[field.key]:opt.v}))}
                         style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${f[field.key]===opt.v?(opt.v?"#10b981":"#ef4444"):s.border}`,background:f[field.key]===opt.v?(opt.v?"#10b98122":"#ef444422"):"transparent",color:f[field.key]===opt.v?(opt.v?"#10b981":"#ef4444"):s.muted,cursor:"pointer",fontWeight:600,fontSize:13}}>
                         {opt.l}
                       </button>
                     ))}
                   </div>
                  :<input type={field.type||"text"} value={f[field.key]??""} onChange={e=>setF(x=>({...x,[field.key]:e.target.value}))} placeholder={field.placeholder||""} style={inp(s)}/>}
              </Field>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,background:"transparent",color:s.muted,border:`1px solid ${s.border}`,cursor:"pointer",fontWeight:600}}>Cancelar</button>
          <button onClick={()=>onSave(f)} style={{padding:"9px 20px",borderRadius:8,background:s.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:600}}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({s,form,setForm,err,onLogin}) {
  return (
    <div style={{minHeight:"100vh",background:s.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:420,background:s.surface,borderRadius:20,border:`1px solid ${s.border}`,padding:40}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:14,background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <i className="ti ti-flame" style={{color:"#fff",fontSize:28}}/>
          </div>
          <h1 style={{fontSize:24,fontWeight:700}}>FuelOps</h1>
          <p style={{color:s.muted,fontSize:14,marginTop:6}}>Gestão de Combustíveis</p>
        </div>
        <Field s={s} label="Usuário">
          <input value={form.u} onChange={e=>setForm(f=>({...f,u:e.target.value}))} placeholder="admin / gerente / cotacao / pagador" style={inp(s)} onKeyDown={e=>e.key==="Enter"&&onLogin()}/>
        </Field>
        <div style={{marginTop:14,marginBottom:20}}>
          <Field s={s} label="Senha">
            <input type="password" value={form.p} onChange={e=>setForm(f=>({...f,p:e.target.value}))} placeholder="••••••••" style={inp(s)} onKeyDown={e=>e.key==="Enter"&&onLogin()}/>
          </Field>
        </div>
        {err&&<div style={{color:"#ef4444",fontSize:13,marginBottom:12}}>{err}</div>}
        <button onClick={onLogin} style={{width:"100%",padding:"12px",borderRadius:10,background:s.accent,color:"#fff",border:"none",fontWeight:700,fontSize:15,cursor:"pointer"}}>Entrar</button>
        <div style={{marginTop:20,padding:14,background:s.isDark?"#1a2035":"#f0f4ff",borderRadius:10}}>
          <p style={{fontSize:12,color:s.muted,margin:"0 0 6px",fontWeight:600}}>Contas de demonstração:</p>
          {Object.entries(USERS).map(([u,d])=>(
            <p key={u} style={{fontSize:12,color:s.muted,margin:"3px 0"}}><strong style={{color:s.text}}>{u}</strong> / {d.password} — {ROLE_LABELS[d.role]}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({s,cargas,distribuidoras}) {
  const totalVol=cargas.reduce((a,c)=>a+c.quantidade,0);
  const totalVal=cargas.reduce((a,c)=>a+c.valorTotal,0);
  const pendente=cargas.filter(c=>c.financeiro==="pendente").reduce((a,c)=>a+c.valorTotal,0);
  const pago    =cargas.filter(c=>c.financeiro==="pago").reduce((a,c)=>a+c.valorTotal,0);
  const clrs    =["#3b82f6","#10b981","#f59e0b","#ef4444","#a78bfa"];

  const porComb=[...KANBAN_COLS,"Finalizado"].reduce((acc,_)=>acc,
    COMBUSTIVEIS.map(cb=>({nome:cb,volume:cargas.filter(c=>c.combustivel===cb).reduce((a,c)=>a+c.quantidade,0)})).filter(c=>c.volume>0)
  );
  const porStatus=[...KANBAN_COLS,"Finalizado"].map(col=>({col,count:cargas.filter(c=>c.status===col).length}));

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:20}}>Visão Geral</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat s={s} icon="ti-droplet"         label="Volume Total" value={`${fmtN(totalVol)} L`} color="#3b82f6"/>
        <Stat s={s} icon="ti-currency-dollar" label="Valor Total"  value={fmt(totalVal)}          color="#10b981"/>
        <Stat s={s} icon="ti-clock"           label="Pendente"     value={fmt(pendente)}           color="#f59e0b"/>
        <Stat s={s} icon="ti-check"           label="Pago"         value={fmt(pago)}               color="#10b981"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Volume por Combustível</h3>
          {porComb.map((c,i)=>{
            const pct=totalVol?Math.round(c.volume/totalVol*100):0;
            return (
              <div key={c.nome} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13}}>{c.nome}</span>
                  <span style={{fontSize:13,color:s.muted}}>{fmtN(c.volume)} L ({pct}%)</span>
                </div>
                <div style={{height:6,borderRadius:3,background:s.isDark?"#2e3348":"#e2e8f0"}}>
                  <div style={{height:"100%",borderRadius:3,background:clrs[i%clrs.length],width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Cargas por Status</h3>
          {porStatus.filter(x=>x.count>0).map(x=>(
            <div key={x.col} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${s.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:COL_COLORS[x.col]||"#64748b"}}/>
                <span style={{fontSize:13}}>{x.col}</span>
              </div>
              <span style={{fontSize:13,fontWeight:600,color:s.muted}}>{x.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Saldo Antecipado — Distribuidoras</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {distribuidoras.filter(d=>d.ativo).map(d=>(
            <div key={d.id} style={{background:s.surf2,borderRadius:10,border:`1px solid ${s.border}`,padding:14}}>
              <div style={{fontSize:12,color:s.muted,marginBottom:4}}>{d.nome}</div>
              <div style={{fontSize:18,fontWeight:700,color:d.saldo>100000?"#10b981":"#f59e0b"}}>{fmt(d.saldo)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function Kanban({s,cargas,filterComb,setFilterComb,moveCarga,user,onNew,onCard,dragCard,setDragCard,dragOver,setDragOver}) {
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0,flex:1}}>Quadro Kanban</h2>
        <select value={filterComb} onChange={e=>setFilterComb(e.target.value)} style={inp(s,{width:"auto"})}>
          <option value="all">Todos combustíveis</option>
          {COMBUSTIVEIS.map(c=><option key={c}>{c}</option>)}
        </select>
        {(user.role==="admin"||user.role==="gerente")&&(
          <button onClick={onNew} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:8,background:s.accent,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer"}}>
            <i className="ti ti-plus"/> Nova Carga
          </button>
        )}
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:12}}>
        {KANBAN_COLS.map(col=>{
          const colCargas=cargas.filter(c=>c.status===col);
          const over=dragOver===col;
          return (
            <div key={col}
              onDragOver={e=>{e.preventDefault();setDragOver(col);}}
              onDrop={()=>{if(dragCard&&dragCard.status!==col)moveCarga(dragCard.id,col);setDragCard(null);setDragOver(null);}}
              style={{minWidth:240,maxWidth:260,background:over?(s.isDark?"#1e3a5f":"#dbeafe"):s.surf2,borderRadius:12,border:`1px solid ${over?s.accent:s.border}`,padding:12,flexShrink:0,transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:COL_COLORS[col]}}/>
                <span style={{fontSize:13,fontWeight:600}}>{col}</span>
                <span style={{marginLeft:"auto",fontSize:12,background:s.surface,color:s.muted,padding:"2px 8px",borderRadius:999,border:`1px solid ${s.border}`}}>{colCargas.length}</span>
              </div>
              {colCargas.map(carga=>(
                <KCard key={carga.id} s={s} carga={carga} onDragStart={()=>setDragCard(carga)} onClick={()=>onCard(carga)}/>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KCard({s,carga,onDragStart,onClick}) {
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      style={{background:s.surface,borderRadius:10,border:`1px solid ${s.border}`,padding:12,cursor:"pointer",marginBottom:8,transition:"border-color 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#3b82f6"}
      onMouseLeave={e=>e.currentTarget.style.borderColor=s.border}>
      <div style={{fontSize:12,fontWeight:700,color:"#3b82f6",marginBottom:4}}>{carga.combustivel}</div>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{carga.posto}</div>
      <div style={{fontSize:12,color:s.muted,marginBottom:2}}>{fmtN(carga.quantidade)} L</div>
      {carga.distribuidora&&<div style={{fontSize:12,color:s.muted,marginBottom:2}}>{carga.distribuidora}</div>}
      {carga.motorista&&<div style={{fontSize:12,color:s.muted,marginBottom:4}}>{carga.motorista}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        {carga.valorTotal>0
          ?<span style={{fontSize:13,fontWeight:700,color:"#10b981"}}>{fmt(carga.valorTotal)}</span>
          :<span style={{fontSize:12,color:s.muted,fontStyle:"italic"}}>Aguard. cotação</span>}
        {carga.formaPagamento&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:carga.formaPagamento==="PIX"?"#0ea5e922":"#f59e0b22",color:carga.formaPagamento==="PIX"?"#0ea5e9":"#f59e0b"}}>{carga.formaPagamento}</span>}
      </div>
      {carga.obs&&<div style={{fontSize:11,color:s.muted,marginTop:6,fontStyle:"italic"}}>💬 {carga.obs}</div>}
    </div>
  );
}

// ─── NOVA CARGA — gerente/admin preenche apenas: posto, combustível, quantidade, obs ───
function NewCargaModal({s,postos,onSave,onClose}) {
  const [f,setF]=useState({combustivel:"Diesel S10",posto:"",quantidade:"",data:"",obs:""});
  const valid=f.combustivel&&f.posto&&f.quantidade&&parseFloat(f.quantidade)>0;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{fontSize:18,fontWeight:700,margin:0}}>Nova Carga</h3>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:s.muted,cursor:"pointer",fontSize:24,lineHeight:1}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field s={s} label="Combustível *">
          <select value={f.combustivel} onChange={e=>setF(x=>({...x,combustivel:e.target.value}))} style={inp(s)}>
            {COMBUSTIVEIS.map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field s={s} label="Posto *">
          <select value={f.posto} onChange={e=>setF(x=>({...x,posto:e.target.value}))} style={inp(s)}>
            <option value="">Selecione o posto...</option>
            {postos.filter(p=>p.ativo).map(p=><option key={p.id}>{p.nome}</option>)}
          </select>
        </Field>
        <Field s={s} label="Quantidade (litros) *">
          <input type="number" min="1" value={f.quantidade} onChange={e=>setF(x=>({...x,quantidade:e.target.value}))} placeholder="Ex: 30000" style={inp(s)}/>
        </Field>
        <Field s={s} label="Data prevista">
          <input type="date" value={f.data} onChange={e=>setF(x=>({...x,data:e.target.value}))} style={inp(s)}/>
        </Field>
        <Field s={s} label="Observações">
          <textarea value={f.obs} onChange={e=>setF(x=>({...x,obs:e.target.value}))} rows={3} placeholder="Informações adicionais..." style={{...inp(s),resize:"vertical"}}/>
        </Field>
      </div>
      <div style={{background:s.isDark?"#0f2212":"#f0fff4",border:"1px solid #10b98133",borderRadius:8,padding:12,marginTop:16,fontSize:13,color:s.muted}}>
        ℹ️ Motorista, valor por litro, distribuidora e vencimento serão preenchidos pela equipe de <strong style={{color:s.text}}>Cotação</strong>.
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,background:"transparent",color:s.muted,border:`1px solid ${s.border}`,cursor:"pointer",fontWeight:600}}>Cancelar</button>
        <button onClick={()=>valid&&onSave(f)} style={{padding:"9px 20px",borderRadius:8,background:valid?s.accent:"#374151",color:"#fff",border:"none",cursor:valid?"pointer":"not-allowed",fontWeight:600,opacity:valid?1:0.6}}>Criar Carga</button>
      </div>
    </div>
  );
}

// ─── CARD DETALHE ─────────────────────────────────────────────────────────────
function CardDetail({s,carga,onClose,moveCarga,user,updateCarga}) {
  const nextMap={"Planejamento":"Cotação","Cotação":"Negociação Fechada","Negociação Fechada":"Aguardando Pagamento","Aguardando Pagamento":"Pago","Pago":"Finalizado"};
  const next=nextMap[carga.status];
  const Row=({l,v,bold})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${s.border}`}}>
      <span style={{fontSize:13,color:s.muted}}>{l}</span>
      <span style={{fontSize:13,color:bold?"#10b981":s.text,fontWeight:bold?700:400}}>{v||"—"}</span>
    </div>
  );
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h3 style={{fontSize:18,fontWeight:700,margin:0}}>{carga.combustivel}</h3>
          <div style={{fontSize:13,color:s.muted,marginTop:4}}>{carga.posto}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:600,background:(COL_COLORS[carga.status]||"#64748b")+"22",color:COL_COLORS[carga.status]||"#64748b"}}>{carga.status}</span>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:s.muted,cursor:"pointer",fontSize:24,lineHeight:1}}>×</button>
        </div>
      </div>
      <Row l="Quantidade"          v={`${fmtN(carga.quantidade)} litros`}/>
      <Row l="Distribuidora"       v={carga.distribuidora}/>
      <Row l="Motorista"           v={carga.motorista}/>
      <Row l="Valor por Litro"     v={carga.valorLitro?`R$ ${Number(carga.valorLitro).toFixed(2)}`:null}/>
      <Row l="Valor Total"         v={carga.valorTotal?fmt(carga.valorTotal):null} bold={!!carga.valorTotal}/>
      <Row l="Forma de Pagamento"  v={carga.formaPagamento}/>
      <Row l="Data Prevista"       v={carga.data}/>
      <Row l="Vencimento"          v={carga.vencimento}/>
      <Row l="Status Financeiro"   v={carga.financeiro?.charAt(0).toUpperCase()+carga.financeiro?.slice(1)}/>
      {carga.obs&&<Row l="Observações" v={carga.obs}/>}
      {next&&(user.role==="admin"||user.role==="gerente"||user.role==="cotacao")&&(
        <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>{moveCarga(carga.id,next);onClose();}} style={{padding:"9px 20px",borderRadius:8,background:s.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:600}}>
            Mover → {next}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── COTAÇÃO ──────────────────────────────────────────────────────────────────
function Cotacao({s,cargas,setCargas,toast$,distribuidoras,motoristas}) {
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({});
  const clrs=["#3b82f6","#10b981","#f59e0b","#ef4444","#a78bfa"];
  const pendentes=cargas.filter(c=>c.status==="Planejamento"||c.status==="Cotação");

  const consolidado=COMBUSTIVEIS.map(cb=>({
    cb, vol:pendentes.filter(c=>c.combustivel===cb).reduce((a,c)=>a+c.quantidade,0)
  })).filter(c=>c.vol>0);

  const startEdit=c=>{
    setEditId(c.id);
    setForm({valorLitro:c.valorLitro||"",distribuidora:c.distribuidora||"",motorista:c.motorista||"",formaPagamento:c.formaPagamento||"PIX",vencimento:c.vencimento||""});
  };

  const save=carga=>{
    const vl=parseFloat(form.valorLitro);
    if(!vl||vl<=0) return toast$("Informe o valor por litro","error");
    if(!form.distribuidora) return toast$("Selecione a distribuidora","error");
    if(!form.motorista) return toast$("Selecione o motorista","error");
    setCargas(prev=>prev.map(c=>c.id===carga.id?{...c,valorLitro:vl,valorTotal:vl*c.quantidade,distribuidora:form.distribuidora,motorista:form.motorista,formaPagamento:form.formaPagamento,vencimento:form.vencimento,status:"Negociação Fechada"}:c));
    setEditId(null);
    toast$("Cotação salva! Carga em Negociação Fechada.");
  };

  const sel=(extra={})=>({...inp(s),padding:"4px 8px",fontSize:13,...extra});

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>Cotação Consolidada</h2>
      <p style={{color:s.muted,fontSize:14,marginBottom:20}}>Volumes aguardando cotação — agrupados por combustível</p>

      {consolidado.length===0
        ?<div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:40,textAlign:"center",color:s.muted}}>✅ Nenhuma carga aguardando cotação.</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
           {consolidado.map((c,i)=>(
             <div key={c.cb} style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:18}}>
               <div style={{fontSize:12,color:s.muted,marginBottom:4}}>{c.cb}</div>
               <div style={{fontSize:24,fontWeight:700,color:clrs[i%clrs.length]}}>{fmtN(c.vol)} <span style={{fontSize:14,color:s.muted}}>litros</span></div>
             </div>
           ))}
         </div>}

      <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,fontSize:15,fontWeight:600}}>Preencher Cotação</div>
        {pendentes.length===0
          ?<div style={{padding:40,textAlign:"center",color:s.muted}}>Nenhuma carga pendente.</div>
          :<div style={{overflowX:"auto"}}>
             <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
               <thead>
                 <tr style={{background:s.surf2}}>
                   {["Combustível","Posto","Volume","Vlr/L","Total","Distribuidora","Motorista","Pagamento","Vencimento","Ação"].map(h=>(
                     <th key={h} style={{padding:"10px 14px",textAlign:"left",color:s.muted,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {pendentes.map(c=>(
                   <tr key={c.id} style={{borderTop:`1px solid ${s.border}`}}>
                     <td style={{padding:"10px 14px",color:"#3b82f6",fontWeight:600}}>{c.combustivel}</td>
                     <td style={{padding:"10px 14px"}}>{c.posto}</td>
                     <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>{fmtN(c.quantidade)} L</td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<input type="number" step="0.01" value={form.valorLitro} onChange={e=>setForm(f=>({...f,valorLitro:e.target.value}))} style={sel({width:75})}/>
                         :<span style={{color:c.valorLitro?s.text:s.muted}}>{c.valorLitro?`R$ ${Number(c.valorLitro).toFixed(2)}`:"—"}</span>}
                     </td>
                     <td style={{padding:"10px 14px",color:"#10b981",fontWeight:700}}>
                       {editId===c.id&&form.valorLitro?fmt(parseFloat(form.valorLitro)*c.quantidade):(c.valorTotal?fmt(c.valorTotal):"—")}
                     </td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<select value={form.distribuidora} onChange={e=>setForm(f=>({...f,distribuidora:e.target.value}))} style={sel()}>
                            <option value="">Selecionar...</option>
                            {distribuidoras.filter(d=>d.ativo).map(d=><option key={d.id}>{d.nome}</option>)}
                          </select>
                         :<span style={{color:c.distribuidora?s.text:s.muted}}>{c.distribuidora||"—"}</span>}
                     </td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<select value={form.motorista} onChange={e=>setForm(f=>({...f,motorista:e.target.value}))} style={sel()}>
                            <option value="">Selecionar...</option>
                            {motoristas.filter(m=>m.ativo).map(m=><option key={m.id}>{m.nome}</option>)}
                          </select>
                         :<span style={{color:c.motorista?s.text:s.muted}}>{c.motorista||"—"}</span>}
                     </td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<select value={form.formaPagamento} onChange={e=>setForm(f=>({...f,formaPagamento:e.target.value}))} style={sel()}>
                            {FORMAS_PAG.map(p=><option key={p}>{p}</option>)}
                          </select>
                         :<span style={{color:c.formaPagamento?s.text:s.muted}}>{c.formaPagamento||"—"}</span>}
                     </td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<input type="date" value={form.vencimento} onChange={e=>setForm(f=>({...f,vencimento:e.target.value}))} style={sel({width:130})}/>
                         :<span style={{color:c.vencimento?s.text:s.muted}}>{c.vencimento||"—"}</span>}
                     </td>
                     <td style={{padding:"10px 14px"}}>
                       {editId===c.id
                         ?<div style={{display:"flex",gap:6}}>
                            <button onClick={()=>save(c)} style={{padding:"4px 12px",borderRadius:6,background:"#10b981",color:"#fff",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>Salvar</button>
                            <button onClick={()=>setEditId(null)} style={{padding:"4px 8px",borderRadius:6,background:"transparent",color:s.muted,border:`1px solid ${s.border}`,cursor:"pointer",fontSize:12}}>✕</button>
                          </div>
                         :<button onClick={()=>startEdit(c)} style={{padding:"4px 12px",borderRadius:6,background:s.accent,color:"#fff",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>Cotar</button>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>}
      </div>
    </div>
  );
}

// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
function Pagamentos({s,cargas,updateCarga,toast$}) {
  const lista=cargas.filter(c=>c.status!=="Planejamento"&&c.status!=="Cotação");
  const sc=st=>({pago:"#10b981",pendente:"#f59e0b",recusado:"#ef4444"}[st]||"#64748b");
  const sl=st=>({pago:"Pago",pendente:"Pendente",recusado:"Recusado"}[st]||st);
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:20}}>Controle de Pagamentos</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
        {["pago","pendente","recusado"].map(st=>{
          const v=lista.filter(c=>c.financeiro===st).reduce((a,c)=>a+c.valorTotal,0);
          return (
            <div key={st} style={{background:s.surface,borderRadius:12,border:`1px solid ${s.border}`,padding:18}}>
              <div style={{fontSize:12,color:s.muted,marginBottom:4}}>{sl(st)}</div>
              <div style={{fontSize:22,fontWeight:700,color:sc(st)}}>{fmt(v)}</div>
              <div style={{fontSize:12,color:s.muted,marginTop:4}}>{lista.filter(c=>c.financeiro===st).length} carga(s)</div>
            </div>
          );
        })}
      </div>
      <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:s.surf2}}>
                {["Combustível","Posto","Distribuidora","Valor","Vencimento","Pagamento","Status","Ações"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",color:s.muted,fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(c=>(
                <tr key={c.id} style={{borderTop:`1px solid ${s.border}`}}>
                  <td style={{padding:"10px 14px",color:"#3b82f6",fontWeight:600}}>{c.combustivel}</td>
                  <td style={{padding:"10px 14px"}}>{c.posto}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{c.distribuidora||"—"}</td>
                  <td style={{padding:"10px 14px",fontWeight:700,color:"#10b981"}}>{c.valorTotal?fmt(c.valorTotal):"—"}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{c.vencimento||"—"}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{c.formaPagamento||"—"}</td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{padding:"3px 10px",borderRadius:999,fontSize:12,fontWeight:600,background:sc(c.financeiro)+"22",color:sc(c.financeiro)}}>{sl(c.financeiro)}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:6}}>
                      {c.financeiro!=="pago"     &&<button onClick={()=>{updateCarga(c.id,{financeiro:"pago"});toast$("Marcado como pago!");}}          style={{padding:"3px 10px",borderRadius:6,background:"#10b981",color:"#fff",border:"none",cursor:"pointer",fontSize:12}}>Pago</button>}
                      {c.financeiro!=="pendente"  &&<button onClick={()=>{updateCarga(c.id,{financeiro:"pendente"});toast$("Marcado como pendente.");}}   style={{padding:"3px 10px",borderRadius:6,background:"#f59e0b",color:"#fff",border:"none",cursor:"pointer",fontSize:12}}>Pendente</button>}
                      {c.financeiro!=="recusado"  &&<button onClick={()=>{updateCarga(c.id,{financeiro:"recusado"});toast$("Recusado.","error");}}        style={{padding:"3px 10px",borderRadius:6,background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",fontSize:12}}>Recusar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── POSTOS ───────────────────────────────────────────────────────────────────
const POSTO_FIELDS=[
  {key:"nome",       label:"Nome do Posto *",    placeholder:"Ex: Posto Alpha"},
  {key:"razao",      label:"Razão Social",        placeholder:"Razão Social Ltda"},
  {key:"cnpj",       label:"CNPJ",               placeholder:"00.000.000/0001-00"},
  {key:"responsavel",label:"Responsável",         placeholder:"Nome do responsável"},
  {key:"telefone",   label:"Telefone",            placeholder:"(62) 3333-0000"},
  {key:"whatsapp",   label:"WhatsApp / Grupo ID", placeholder:"5562991110001"},
  {key:"cidade",     label:"Cidade",              placeholder:"Goiânia"},
  {key:"estado",     label:"Estado",type:"select",opts:[""].concat(ESTADOS_BR)},
  {key:"ativo",      label:"Status", type:"toggle"},
];

function Postos({s,postos,setPostos,toast$,modal,setModal}) {
  const openNew  =()=>setModal({type:"postoModal",data:null});
  const openEdit =p =>setModal({type:"postoModal",data:{...p}});

  const handleSave=f=>{
    if(!f.nome?.trim()) return toast$("Nome é obrigatório","error");
    if(modal.data){
      setPostos(prev=>prev.map(p=>p.id===modal.data.id?{...p,...f}:p));
      toast$("Posto atualizado!");
    } else {
      setPostos(prev=>[...prev,{...f,id:Date.now(),ativo:f.ativo??true}]);
      toast$("Posto criado!");
    }
    setModal(null);
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0,flex:1}}>Postos</h2>
        <button onClick={openNew} style={{padding:"8px 16px",borderRadius:8,background:s.accent,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer"}}>+ Novo Posto</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {postos.map(p=>(
          <div key={p.id} style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20,opacity:p.ativo?1:0.7}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{p.nome}</div>
                <div style={{fontSize:12,color:s.muted}}>{p.razao}</div>
                <div style={{fontSize:12,color:s.muted}}>{p.cnpj}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:999,background:p.ativo?"#10b98122":"#ef444422",color:p.ativo?"#10b981":"#ef4444",fontWeight:600}}>{p.ativo?"Ativo":"Inativo"}</span>
                <button onClick={()=>openEdit(p)} style={{padding:"5px 12px",borderRadius:6,background:s.surf2,color:s.text,border:`1px solid ${s.border}`,cursor:"pointer",fontSize:12,fontWeight:500}}>✏️ Editar</button>
              </div>
            </div>
            <div style={{fontSize:13,color:s.muted,display:"flex",flexDirection:"column",gap:4}}>
              <span>📍 {p.cidade}, {p.estado}</span>
              <span>👤 {p.responsavel}</span>
              <span>📞 {p.telefone}</span>
              <span>💬 {p.whatsapp}</span>
            </div>
          </div>
        ))}
      </div>
      {modal?.type==="postoModal"&&(
        <CadastroModal s={s} title={modal.data?"Editar Posto":"Novo Posto"} fields={POSTO_FIELDS} initial={modal.data||{ativo:true}} onSave={handleSave} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

// ─── DISTRIBUIDORAS ───────────────────────────────────────────────────────────
const DIST_FIELDS=[
  {key:"nome",    label:"Nome *",           placeholder:"Nome da distribuidora"},
  {key:"cnpj",    label:"CNPJ",             placeholder:"00.000.000/0001-00"},
  {key:"telefone",label:"Telefone",         placeholder:"(11) 3333-0000"},
  {key:"email",   label:"E-mail",           placeholder:"comercial@dist.com.br"},
  {key:"pix",     label:"Chave PIX",        placeholder:"pix@dist.com.br"},
  {key:"banco",   label:"Banco",            placeholder:"Bradesco"},
  {key:"agencia", label:"Agência",          placeholder:"0001"},
  {key:"conta",   label:"Conta",            placeholder:"123456-7"},
  {key:"saldo",   label:"Saldo Antecipado", type:"number", placeholder:"0"},
  {key:"ativo",   label:"Status",           type:"toggle"},
];

function Distribuidoras({s,dists,setDists,toast$,modal,setModal}) {
  const openNew  =()=>setModal({type:"distModal",data:null});
  const openEdit =d =>setModal({type:"distModal",data:{...d}});

  const handleSave=f=>{
    if(!f.nome?.trim()) return toast$("Nome é obrigatório","error");
    if(modal.data){
      setDists(prev=>prev.map(d=>d.id===modal.data.id?{...d,...f,saldo:parseFloat(f.saldo||0)}:d));
      toast$("Distribuidora atualizada!");
    } else {
      setDists(prev=>[...prev,{...f,id:Date.now(),saldo:parseFloat(f.saldo||0),ativo:f.ativo??true}]);
      toast$("Distribuidora criada!");
    }
    setModal(null);
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0,flex:1}}>Distribuidoras</h2>
        <button onClick={openNew} style={{padding:"8px 16px",borderRadius:8,background:s.accent,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer"}}>+ Nova Distribuidora</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {dists.map(d=>(
          <div key={d.id} style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20,opacity:d.ativo?1:0.7}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{d.nome}</div>
                <div style={{fontSize:12,color:s.muted}}>{d.cnpj}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:999,background:d.ativo?"#10b98122":"#ef444422",color:d.ativo?"#10b981":"#ef4444",fontWeight:600}}>{d.ativo?"Ativo":"Inativo"}</span>
                <button onClick={()=>openEdit(d)} style={{padding:"5px 12px",borderRadius:6,background:s.surf2,color:s.text,border:`1px solid ${s.border}`,cursor:"pointer",fontSize:12,fontWeight:500}}>✏️ Editar</button>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${s.border}`,borderBottom:`1px solid ${s.border}`,marginBottom:8}}>
              <span style={{fontSize:13,color:s.muted}}>Saldo Antecipado</span>
              <span style={{fontSize:18,fontWeight:700,color:d.saldo>100000?"#10b981":"#f59e0b"}}>{fmt(d.saldo)}</span>
            </div>
            <div style={{fontSize:13,color:s.muted,display:"flex",flexDirection:"column",gap:3}}>
              <span>📧 {d.email}</span>
              <span>🔑 PIX: {d.pix}</span>
              <span>🏦 {d.banco} · Ag {d.agencia} · CC {d.conta}</span>
            </div>
          </div>
        ))}
      </div>
      {modal?.type==="distModal"&&(
        <CadastroModal s={s} title={modal.data?"Editar Distribuidora":"Nova Distribuidora"} fields={DIST_FIELDS} initial={modal.data||{ativo:true}} onSave={handleSave} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

// ─── MOTORISTAS ───────────────────────────────────────────────────────────────
const MOT_FIELDS=[
  {key:"nome",          label:"Nome Completo *",   placeholder:"João Silva"},
  {key:"cpf",           label:"CPF",               placeholder:"000.000.000-00"},
  {key:"telefone",      label:"Telefone",           placeholder:"(62) 9 9000-0000"},
  {key:"whatsapp",      label:"WhatsApp",           placeholder:"5562990000000"},
  {key:"placa",         label:"Placa do Caminhão",  placeholder:"ABC-1234"},
  {key:"transportadora",label:"Transportadora",     placeholder:"Trans Alpha Ltda"},
  {key:"ativo",         label:"Status",             type:"toggle"},
];

function Motoristas({s,motoristas,setMotoristas,toast$,modal,setModal}) {
  const openNew  =()=>setModal({type:"motModal",data:null});
  const openEdit =m =>setModal({type:"motModal",data:{...m}});

  const handleSave=f=>{
    if(!f.nome?.trim()) return toast$("Nome é obrigatório","error");
    if(modal.data){
      setMotoristas(prev=>prev.map(m=>m.id===modal.data.id?{...m,...f}:m));
      toast$("Motorista atualizado!");
    } else {
      setMotoristas(prev=>[...prev,{...f,id:Date.now(),ativo:f.ativo??true}]);
      toast$("Motorista criado!");
    }
    setModal(null);
  };

  const toggleAtivo=m=>{
    setMotoristas(prev=>prev.map(x=>x.id===m.id?{...x,ativo:!x.ativo}:x));
    toast$(m.ativo?"Motorista desativado.":"Motorista reativado!");
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0,flex:1}}>Motoristas</h2>
        <button onClick={openNew} style={{padding:"8px 16px",borderRadius:8,background:s.accent,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer"}}>+ Novo Motorista</button>
      </div>
      <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:s.surf2}}>
                {["Nome","CPF","Telefone","WhatsApp","Placa","Transportadora","Status","Ações"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",color:s.muted,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {motoristas.map(m=>(
                <tr key={m.id} style={{borderTop:`1px solid ${s.border}`,opacity:m.ativo?1:0.55}}>
                  <td style={{padding:"10px 14px",fontWeight:600}}>{m.nome}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{m.cpf}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{m.telefone}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{m.whatsapp}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{m.placa}</td>
                  <td style={{padding:"10px 14px",color:s.muted}}>{m.transportadora}</td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{padding:"3px 10px",borderRadius:999,fontSize:12,fontWeight:600,background:m.ativo?"#10b98122":"#ef444422",color:m.ativo?"#10b981":"#ef4444"}}>{m.ativo?"Ativo":"Inativo"}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(m)} style={{padding:"3px 10px",borderRadius:6,background:s.surf2,color:s.text,border:`1px solid ${s.border}`,cursor:"pointer",fontSize:12}}>✏️ Editar</button>
                      <button onClick={()=>toggleAtivo(m)} style={{padding:"3px 10px",borderRadius:6,background:m.ativo?"#ef444422":"#10b98122",color:m.ativo?"#ef4444":"#10b981",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>
                        {m.ativo?"Desativar":"Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal?.type==="motModal"&&(
        <CadastroModal s={s} title={modal.data?"Editar Motorista":"Novo Motorista"} fields={MOT_FIELDS} initial={modal.data||{ativo:true}} onSave={handleSave} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────
function WhatsApp({s,wppLog}) {
  const sc=st=>st==="enviado"?"#10b981":"#ef4444";
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>Log WhatsApp</h2>
      <p style={{color:s.muted,fontSize:14,marginBottom:20}}>Mensagens automáticas via Evolution API</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
        <Stat s={s} icon="ti-brand-whatsapp" label="Enviados" value={wppLog.filter(l=>l.status==="enviado").length} color="#10b981"/>
        <Stat s={s} icon="ti-alert-circle"   label="Erros"   value={wppLog.filter(l=>l.status==="erro").length}    color="#ef4444"/>
        <Stat s={s} icon="ti-send"           label="Total"   value={wppLog.length}                                  color="#3b82f6"/>
      </div>
      {wppLog.map(log=>(
        <div key={log.id} style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,padding:20,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,padding:"3px 10px",borderRadius:999,background:log.tipo==="grupo_posto"?"#3b82f622":"#a78bfa22",color:log.tipo==="grupo_posto"?"#3b82f6":"#a78bfa",fontWeight:600}}>{log.tipo==="grupo_posto"?"Grupo Posto":"Motorista"}</span>
              <span style={{fontSize:13}}>{log.destino}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <span style={{fontSize:11,padding:"3px 10px",borderRadius:999,background:sc(log.status)+"22",color:sc(log.status),fontWeight:600}}>{log.status==="enviado"?"✓ Enviado":"✗ Erro"}</span>
              <span style={{fontSize:11,color:s.muted}}>{log.ts}</span>
            </div>
          </div>
          <pre style={{fontSize:12,color:s.muted,background:s.surf2,padding:12,borderRadius:8,margin:0,whiteSpace:"pre-wrap",fontFamily:"monospace"}}>{log.mensagem}</pre>
        </div>
      ))}
    </div>
  );
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
function Relatorios({s,cargas,postos,dists}) {
  const porPosto=postos.map(p=>({
    nome:p.nome,
    vol:cargas.filter(c=>c.posto===p.nome).reduce((a,c)=>a+c.quantidade,0),
    val:cargas.filter(c=>c.posto===p.nome).reduce((a,c)=>a+c.valorTotal,0),
  })).filter(p=>p.vol>0);
  const porDist=dists.map(d=>({
    nome:d.nome,
    vol:cargas.filter(c=>c.distribuidora===d.nome).reduce((a,c)=>a+c.quantidade,0),
    val:cargas.filter(c=>c.distribuidora===d.nome).reduce((a,c)=>a+c.valorTotal,0),
  })).filter(d=>d.vol>0);

  const Tbl=({titulo,cols,rows})=>(
    <div style={{background:s.surface,borderRadius:14,border:`1px solid ${s.border}`,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${s.border}`,fontSize:15,fontWeight:600}}>{titulo}</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:s.surf2}}>{cols.map(c=><th key={c} style={{padding:"8px 14px",textAlign:"left",color:s.muted,fontWeight:600,whiteSpace:"nowrap"}}>{c}</th>)}</tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0,flex:1}}>Relatórios</h2>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"7px 14px",borderRadius:8,background:s.surface,color:s.text,border:`1px solid ${s.border}`,fontWeight:600,fontSize:13,cursor:"pointer"}}>📄 PDF</button>
          <button style={{padding:"7px 14px",borderRadius:8,background:s.accent,color:"#fff",border:"none",fontWeight:600,fontSize:13,cursor:"pointer"}}>📊 Excel</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Tbl titulo="Por Posto" cols={["Posto","Volume","Valor"]} rows={porPosto.map(p=>(
          <tr key={p.nome} style={{borderTop:`1px solid ${s.border}`}}>
            <td style={{padding:"8px 14px"}}>{p.nome}</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{fmtN(p.vol)} L</td>
            <td style={{padding:"8px 14px",color:"#10b981",fontWeight:700}}>{fmt(p.val)}</td>
          </tr>
        ))}/>
        <Tbl titulo="Por Distribuidora" cols={["Distribuidora","Volume","Valor"]} rows={porDist.map(d=>(
          <tr key={d.nome} style={{borderTop:`1px solid ${s.border}`}}>
            <td style={{padding:"8px 14px"}}>{d.nome}</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{fmtN(d.vol)} L</td>
            <td style={{padding:"8px 14px",color:"#10b981",fontWeight:700}}>{fmt(d.val)}</td>
          </tr>
        ))}/>
      </div>
      <Tbl titulo="Histórico Completo" cols={["Data","Combustível","Posto","Distribuidora","Motorista","Volume","Vlr/L","Total","Pagamento","Status","Financeiro"]}
        rows={cargas.map(c=>(
          <tr key={c.id} style={{borderTop:`1px solid ${s.border}`}}>
            <td style={{padding:"8px 14px",color:s.muted,whiteSpace:"nowrap"}}>{c.data||"—"}</td>
            <td style={{padding:"8px 14px",color:"#3b82f6",fontWeight:600}}>{c.combustivel}</td>
            <td style={{padding:"8px 14px"}}>{c.posto}</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{c.distribuidora||"—"}</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{c.motorista||"—"}</td>
            <td style={{padding:"8px 14px",color:s.muted,whiteSpace:"nowrap"}}>{fmtN(c.quantidade)} L</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{c.valorLitro?`R$ ${Number(c.valorLitro).toFixed(2)}`:"—"}</td>
            <td style={{padding:"8px 14px",color:"#10b981",fontWeight:700}}>{c.valorTotal?fmt(c.valorTotal):"—"}</td>
            <td style={{padding:"8px 14px",color:s.muted}}>{c.formaPagamento||"—"}</td>
            <td style={{padding:"8px 14px"}}>
              <span style={{padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600,background:(COL_COLORS[c.status]||"#64748b")+"22",color:COL_COLORS[c.status]||"#64748b"}}>{c.status}</span>
            </td>
            <td style={{padding:"8px 14px"}}>
              <span style={{padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600,background:({pago:"#10b98122",pendente:"#f59e0b22",recusado:"#ef444422"})[c.financeiro]||"#64748b22",color:({pago:"#10b981",pendente:"#f59e0b",recusado:"#ef4444"})[c.financeiro]||"#64748b"}}>{c.financeiro}</span>
            </td>
          </tr>
        ))}
      />
    </div>
  );
}
