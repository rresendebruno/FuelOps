const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { Pool }   = require('pg');
const { createClient } = require('redis');
const axios      = require('axios');
const rateLimit  = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fuelops_dev_secret';

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true }));

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const db = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'fuelops',
  user:     process.env.DB_USER     || 'fuelops',
  password: process.env.DB_PASS     || 'fuelops_secret',
});

// ─── REDIS ────────────────────────────────────────────────────────────────────
let redisClient = null;
async function getRedis() {
  if (redisClient) return redisClient;
  try {
    redisClient = createClient({
      socket: { host: process.env.REDIS_HOST || 'redis', port: parseInt(process.env.REDIS_PORT || '6379') }
    });
    redisClient.on('error', e => console.error('[Redis]', e.message));
    await redisClient.connect();
    console.log('[Redis] conectado');
  } catch (e) {
    console.warn('[Redis] indisponível, rodando sem cache:', e.message);
    redisClient = null;
  }
  return redisClient;
}

// ─── DB INIT ─────────────────────────────────────────────────────────────────
async function initDB() {
  console.log('[DB] aguardando PostgreSQL...');
  for (let i = 0; i < 30; i++) {
    try { await db.query('SELECT 1'); break; }
    catch { await new Promise(r => setTimeout(r, 2000)); }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      username   VARCHAR(100) UNIQUE NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(50)  NOT NULL DEFAULT 'gerente',
      active     BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS postos (
      id                 SERIAL PRIMARY KEY,
      nome_fantasia      VARCHAR(255) NOT NULL,
      razao_social       VARCHAR(255),
      cnpj               VARCHAR(20),
      endereco           TEXT,
      cidade             VARCHAR(100),
      estado             VARCHAR(2),
      telefone           VARCHAR(20),
      responsavel        VARCHAR(255),
      whatsapp_group_id  VARCHAR(255),
      limite_operacional DECIMAL(15,2),
      active             BOOLEAN DEFAULT true,
      created_at         TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS distribuidoras (
      id               SERIAL PRIMARY KEY,
      nome             VARCHAR(255) NOT NULL,
      cnpj             VARCHAR(20),
      telefone         VARCHAR(20),
      email            VARCHAR(255),
      chave_pix        VARCHAR(255),
      banco            VARCHAR(100),
      agencia          VARCHAR(20),
      conta            VARCHAR(30),
      saldo_antecipado DECIMAL(15,2) DEFAULT 0,
      active           BOOLEAN DEFAULT true,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS motoristas (
      id               SERIAL PRIMARY KEY,
      nome             VARCHAR(255) NOT NULL,
      cpf              VARCHAR(14),
      telefone         VARCHAR(20),
      whatsapp_number  VARCHAR(20),
      placa_caminhao   VARCHAR(10),
      transportadora   VARCHAR(255),
      active           BOOLEAN DEFAULT true,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS combustiveis (
      id         SERIAL PRIMARY KEY,
      nome       VARCHAR(100) NOT NULL,
      tipo       VARCHAR(50),
      sigla      VARCHAR(20),
      unidade    VARCHAR(10) DEFAULT 'L',
      active     BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bases (
      id               SERIAL PRIMARY KEY,
      nome             VARCHAR(255) NOT NULL,
      distribuidora_id INTEGER REFERENCES distribuidoras(id),
      cidade           VARCHAR(100),
      estado           VARCHAR(2),
      endereco         TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cargas (
      id               SERIAL PRIMARY KEY,
      combustivel      VARCHAR(100),
      posto            VARCHAR(255),
      distribuidora    VARCHAR(255),
      motorista        VARCHAR(255),
      quantidade       DECIMAL(15,3),
      valor_litro      DECIMAL(10,4) DEFAULT 0,
      valor_total      DECIMAL(15,2) DEFAULT 0,
      forma_pagamento  VARCHAR(50),
      status           VARCHAR(80) DEFAULT 'Planejamento',
      status_financeiro VARCHAR(20) DEFAULT 'pendente',
      data_prevista    DATE,
      vencimento       DATE,
      observacoes      TEXT,
      comprovante_url  VARCHAR(500),
      created_by       INTEGER REFERENCES users(id),
      created_at       TIMESTAMP DEFAULT NOW(),
      updated_at       TIMESTAMP DEFAULT NOW(),
      deleted_at       TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carga_historico (
      id          SERIAL PRIMARY KEY,
      carga_id    INTEGER REFERENCES cargas(id),
      status_de   VARCHAR(80),
      status_para VARCHAR(80),
      changed_by  INTEGER REFERENCES users(id),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS whatsapp_log (
      id         SERIAL PRIMARY KEY,
      carga_id   INTEGER REFERENCES cargas(id),
      tipo       VARCHAR(50),
      destino    VARCHAR(255),
      mensagem   TEXT,
      status     VARCHAR(20) DEFAULT 'pendente',
      tentativas INTEGER DEFAULT 0,
      erro_msg   TEXT,
      sent_at    TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id),
      action     VARCHAR(100),
      entity     VARCHAR(100),
      entity_id  INTEGER,
      ip         VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('[DB] tabelas OK');
  await seedDB();
}

async function seedDB() {
  const { rows } = await db.query("SELECT id FROM users WHERE username='admin' LIMIT 1");
  if (rows.length > 0) return;

  const hash = async pw => bcrypt.hash(pw, 10);
  await db.query(`
    INSERT INTO users (name, username, email, password, role) VALUES
    ($1,$2,$3,$4,'admin'),
    ($5,$6,$7,$8,'gerente'),
    ($9,$10,$11,$12,'cotacao'),
    ($13,$14,$15,$16,'pagador')
  `, [
    'Admin Sistema',  'admin',   'admin@fuelops.com',   await hash('admin123'),
    'Carlos Gerente', 'gerente', 'gerente@fuelops.com', await hash('gerente123'),
    'Ana Cotação',    'cotacao', 'cotacao@fuelops.com', await hash('cotacao123'),
    'Paulo Pagador',  'pagador', 'pagador@fuelops.com', await hash('pagador123'),
  ]);

  await db.query(`
    INSERT INTO combustiveis (nome, tipo, sigla) VALUES
    ('Diesel S10','diesel','DS10'),
    ('Diesel S500','diesel','DS500'),
    ('Gasolina Comum','gasolina','GC'),
    ('Gasolina Aditivada','gasolina','GA'),
    ('Etanol','etanol','ETH')
  `);

  await db.query(`
    INSERT INTO postos (nome_fantasia, cnpj, cidade, estado, responsavel, whatsapp_group_id) VALUES
    ('Posto Alpha','12.345.678/0001-90','Goiânia','GO','Maria Alpha','120363XXXXXX@g.us'),
    ('Posto Beta', '23.456.789/0001-01','Aparecida de Goiânia','GO','José Beta','120363YYYYYY@g.us'),
    ('Posto Gama', '34.567.890/0001-12','Anápolis','GO','Ana Gama','120363ZZZZZZ@g.us'),
    ('Posto Delta','45.678.901/0001-23','Rio Verde','GO','Carlos Delta','120363WWWWWW@g.us')
  `);

  await db.query(`
    INSERT INTO distribuidoras (nome, cnpj, chave_pix, saldo_antecipado) VALUES
    ('Petrobras Dist.','33.000.167/0001-01','pix@petrobras.com.br',450000),
    ('Ipiranga',       '33.337.122/0001-77','pix@ipiranga.com.br', 120000),
    ('Raízen',         '33.453.598/0001-23','pix@raizen.com.br',   280000),
    ('Ale Combustíveis','11.152.208/0001-60','pix@ale.com.br',      75000)
  `);

  await db.query(`
    INSERT INTO motoristas (nome, whatsapp_number, placa_caminhao) VALUES
    ('João Silva',  '5562999010001','ABC-1234'),
    ('Pedro Costa', '5562999010002','DEF-5678'),
    ('Lucas Alves', '5562999010003','GHI-9012'),
    ('Rafael Mota', '5562999010004','JKL-3456'),
    ('Marcos Lima', '5562999010005','MNO-7890')
  `);

  const uid = (await db.query("SELECT id FROM users WHERE username='admin'")).rows[0].id;
  await db.query(`
    INSERT INTO cargas (combustivel,posto,distribuidora,motorista,quantidade,valor_litro,valor_total,forma_pagamento,status,status_financeiro,data_prevista,vencimento,created_by) VALUES
    ('Diesel S10',        'Posto Alpha','Petrobras Dist.','João Silva', 30000,6.45,193500,'PIX',          'Planejamento',        'pendente','2026-05-14','2026-05-14',$1),
    ('Gasolina Comum',    'Posto Beta', 'Ipiranga',       'Pedro Costa',20000,5.89,117800,'Boleto',        'Cotação',             'pendente','2026-05-15','2026-05-16',$1),
    ('Diesel S500',       'Posto Gama', 'Raízen',         'Lucas Alves',15000,6.10,91500, 'Antecipado',    'Negociação Fechada',  'pago',   '2026-05-13','2026-05-13',$1),
    ('Etanol',            'Posto Delta','Ale Combustíveis','Rafael Mota',10000,4.20,42000, 'Transferência', 'Aguardando Pagamento','pendente','2026-05-12','2026-05-12',$1),
    ('Diesel S10',        'Posto Alpha','Petrobras Dist.','João Silva', 25000,6.48,162000,'PIX',           'Pago',                'pago',   '2026-05-10','2026-05-10',$1),
    ('Gasolina Aditivada','Posto Beta', 'Ipiranga',       'Pedro Costa',8000, 6.20,49600, 'PIX',           'Carga Programada',    'pendente','2026-05-14','2026-05-14',$1),
    ('Diesel S10',        'Posto Gama', 'Raízen',         'Lucas Alves',35000,6.42,224700,'Boleto',        'Finalizado',          'pago',   '2026-05-08','2026-05-09',$1)
  `, [uid]);

  await db.query(`
    INSERT INTO whatsapp_log (carga_id,tipo,destino,mensagem,status,sent_at) VALUES
    (6,'grupo_posto','Posto Alpha - WhatsApp',
     '🚛 Nova carga programada\n\nPosto: POSTO ALPHA\nCombustível: Gasolina Aditivada\nQuantidade: 8.000 litros\nMotorista: Pedro Costa\nDistribuidora: Ipiranga\nPrevisão: 14/05/2026 08:00',
     'enviado', NOW()),
    (6,'motorista','Pedro Costa - +5562999010002',
     '🚛 Nova viagem atribuída\n\nDestino: Posto Beta\nCombustível: Gasolina Aditivada\nQuantidade: 8.000 litros\nBase: Goiânia Base\nPrevisão: 14/05/2026 10:00',
     'erro', NOW())
  `);

  console.log('[DB] seed OK');
}

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token necessário' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Sem permissão' });
  next();
};

const audit = async (userId, action, entity, entityId, ip) => {
  try { await db.query('INSERT INTO audit_log (user_id,action,entity,entity_id,ip) VALUES ($1,$2,$3,$4,$5)', [userId, action, entity, entityId, ip]); }
  catch {}
};

// ─── WHATSAPP SERVICE ─────────────────────────────────────────────────────────
async function sendWhatsApp(cargaId, tipo, destino, mensagem) {
  const { rows: [log] } = await db.query(
    'INSERT INTO whatsapp_log (carga_id,tipo,destino,mensagem,status) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [cargaId, tipo, destino, mensagem, 'pendente']
  );

  (async () => {
    const maxTries = 3;
    for (let t = 1; t <= maxTries; t++) {
      try {
        const url      = process.env.EVOLUTION_API_URL;
        const token    = process.env.EVOLUTION_API_TOKEN;
        const instance = process.env.EVOLUTION_API_INSTANCE;

        if (!url || !token || !instance || url.includes('sua-evolution')) {
          console.log(`[WhatsApp DEMO] Para: ${destino}\n${mensagem}`);
          await db.query('UPDATE whatsapp_log SET status=$1,sent_at=NOW(),tentativas=$2 WHERE id=$3', ['enviado', t, log.id]);
          return;
        }

        await axios.post(`${url}/message/sendText/${instance}`, {
          number: destino,
          textMessage: { text: mensagem },
        }, {
          headers: { apikey: token, 'Content-Type': 'application/json' },
          timeout: 15000,
        });

        await db.query('UPDATE whatsapp_log SET status=$1,sent_at=NOW(),tentativas=$2 WHERE id=$3', ['enviado', t, log.id]);
        console.log(`[WhatsApp] enviado para ${destino}`);
        return;
      } catch (e) {
        console.error(`[WhatsApp] tentativa ${t} falhou:`, e.message);
        await db.query('UPDATE whatsapp_log SET tentativas=$1,erro_msg=$2 WHERE id=$3', [t, e.message, log.id]);
        if (t === maxTries) await db.query('UPDATE whatsapp_log SET status=$1 WHERE id=$2', ['erro', log.id]);
        else await new Promise(r => setTimeout(r, t * 5000));
      }
    }
  })();
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── AUTH ──
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE username=$1 AND active=true', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    audit(user.id, 'LOGIN', 'users', user.id, req.ip);
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USERS ──
app.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const { rows } = await db.query('SELECT id,name,username,email,role,active,created_at FROM users ORDER BY name');
  res.json(rows);
});

app.post('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (name,username,email,password,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,username,role',
      [name, username, email, hash, role]
    );
    audit(req.user.id, 'CREATE_USER', 'users', rows[0].id, req.ip);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, role, active } = req.body;
    await db.query('UPDATE users SET name=COALESCE($1,name),role=COALESCE($2,role),active=COALESCE($3,active) WHERE id=$4', [name, role, active, req.params.id]);
    audit(req.user.id, 'UPDATE_USER', 'users', req.params.id, req.ip);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── POSTOS ──
app.get('/postos', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM postos WHERE active=true ORDER BY nome_fantasia');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/postos', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nome_fantasia, razao_social, cnpj, cidade, estado, telefone, responsavel, whatsapp_group_id, limite_operacional } = req.body;
    if (!nome_fantasia) return res.status(400).json({ error: 'Nome é obrigatório' });
    const { rows } = await db.query(
      'INSERT INTO postos (nome_fantasia,razao_social,cnpj,cidade,estado,telefone,responsavel,whatsapp_group_id,limite_operacional) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [nome_fantasia, razao_social||'', cnpj||'', cidade||'', estado||'', telefone||'', responsavel||'', whatsapp_group_id||'', parseFloat(limite_operacional)||0]
    );
    audit(req.user.id, 'CREATE_POSTO', 'postos', rows[0].id, req.ip);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/postos/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['nome_fantasia','razao_social','cnpj','cidade','estado','telefone','responsavel','whatsapp_group_id','limite_operacional','active'];
    const body = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(body).length) return res.json({ ok: true });
    const sets = Object.keys(body).map((k, i) => `${k}=$${i + 2}`).join(',');
    await db.query(`UPDATE postos SET ${sets} WHERE id=$1`, [req.params.id, ...Object.values(body)]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── DISTRIBUIDORAS ──
app.get('/distribuidoras', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM distribuidoras WHERE active=true ORDER BY nome');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/distribuidoras', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, chave_pix, banco, agencia, conta, saldo_antecipado } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const saldo = parseFloat(saldo_antecipado) || 0;
    const { rows } = await db.query(
      'INSERT INTO distribuidoras (nome,cnpj,telefone,email,chave_pix,banco,agencia,conta,saldo_antecipado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [nome, cnpj||'', telefone||'', email||'', chave_pix||'', banco||'', agencia||'', conta||'', saldo]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/distribuidoras/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nome, saldo_antecipado, active } = req.body;
    const sets = [];
    const vals = [req.params.id];
    if (nome             !== undefined) { vals.push(nome);                              sets.push(`nome=$${vals.length}`); }
    if (saldo_antecipado !== undefined) { vals.push(parseFloat(saldo_antecipado) || 0); sets.push(`saldo_antecipado=$${vals.length}`); }
    if (active           !== undefined) { vals.push(active);                            sets.push(`active=$${vals.length}`); }
    if (!sets.length) return res.json({ ok: true });
    await db.query(`UPDATE distribuidoras SET ${sets.join(',')} WHERE id=$1`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── MOTORISTAS ──
app.get('/motoristas', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM motoristas WHERE active=true ORDER BY nome');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/motoristas', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nome, cpf, telefone, whatsapp_number, placa_caminhao, transportadora } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const { rows } = await db.query(
      'INSERT INTO motoristas (nome,cpf,telefone,whatsapp_number,placa_caminhao,transportadora) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nome, cpf||'', telefone||'', whatsapp_number||'', placa_caminhao||'', transportadora||'']
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── COMBUSTÍVEIS ──
app.get('/combustiveis', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM combustiveis WHERE active=true ORDER BY nome');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CARGAS ──
app.get('/cargas', authMiddleware, async (req, res) => {
  try {
    const { status, posto, distribuidora, de, ate } = req.query;
    let q = 'SELECT * FROM cargas WHERE deleted_at IS NULL';
    const vals = [];
    if (status)        { vals.push(status);        q += ` AND status=$${vals.length}`; }
    if (posto)         { vals.push(posto);          q += ` AND posto=$${vals.length}`; }
    if (distribuidora) { vals.push(distribuidora);  q += ` AND distribuidora=$${vals.length}`; }
    if (de)            { vals.push(de);             q += ` AND data_prevista>=$${vals.length}`; }
    if (ate)           { vals.push(ate);            q += ` AND data_prevista<=$${vals.length}`; }
    q += ' ORDER BY created_at DESC';
    const { rows } = await db.query(q, vals);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/cargas', authMiddleware, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const { combustivel, posto, distribuidora, motorista, quantidade, valor_litro, forma_pagamento, data_prevista, vencimento, observacoes } = req.body;
    const valor_total = (parseFloat(quantidade) || 0) * (parseFloat(valor_litro) || 0);
    const { rows } = await db.query(
      `INSERT INTO cargas (combustivel,posto,distribuidora,motorista,quantidade,valor_litro,valor_total,forma_pagamento,data_prevista,vencimento,observacoes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [combustivel, posto, distribuidora||null, motorista||null, quantidade, parseFloat(valor_litro)||0, valor_total, forma_pagamento||null, data_prevista||null, vencimento||null, observacoes||null, req.user.id]
    );
    audit(req.user.id, 'CREATE_CARGA', 'cargas', rows[0].id, req.ip);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/cargas/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM cargas WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrada' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/cargas/:id', authMiddleware, async (req, res) => {
  try {
    const allowed = ['combustivel','posto','distribuidora','motorista','quantidade','valor_litro','valor_total','forma_pagamento','data_prevista','vencimento','observacoes','status_financeiro'];
    const body = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(body).length) return res.json({ ok: true });

    // Recalcula valor_total se ambos os campos vieram
    if (body.quantidade !== undefined && body.valor_litro !== undefined)
      body.valor_total = (parseFloat(body.quantidade) || 0) * (parseFloat(body.valor_litro) || 0);

    // Sanitiza numéricos para não mandar NaN ao Postgres
    if (body.quantidade   !== undefined) body.quantidade   = parseFloat(body.quantidade)   || 0;
    if (body.valor_litro  !== undefined) body.valor_litro  = parseFloat(body.valor_litro)  || 0;
    if (body.valor_total  !== undefined) body.valor_total  = parseFloat(body.valor_total)  || 0;

    body.updated_at = new Date();
    const sets = Object.keys(body).map((k, i) => `${k}=$${i + 2}`).join(',');
    await db.query(`UPDATE cargas SET ${sets} WHERE id=$1`, [req.params.id, ...Object.values(body)]);
    audit(req.user.id, 'UPDATE_CARGA', 'cargas', req.params.id, req.ip);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Mover status Kanban
app.patch('/cargas/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['Planejamento','Cotação','Negociação Fechada','Aguardando Pagamento','Pago','Carga Programada','Finalizado'];
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Status inválido' });

    const { rows: [carga] } = await db.query('SELECT * FROM cargas WHERE id=$1', [req.params.id]);
    if (!carga) return res.status(404).json({ error: 'Não encontrada' });

    await db.query('UPDATE cargas SET status=$1,updated_at=NOW() WHERE id=$2', [status, req.params.id]);
    await db.query('INSERT INTO carga_historico (carga_id,status_de,status_para,changed_by) VALUES ($1,$2,$3,$4)',
      [req.params.id, carga.status, status, req.user.id]);

    if (status === 'Carga Programada') {
      const { rows: [posto] } = await db.query('SELECT * FROM postos WHERE nome_fantasia=$1', [carga.posto]);
      const grupoId = posto?.whatsapp_group_id || carga.posto;
      const data = carga.data_prevista ? new Date(carga.data_prevista).toLocaleDateString('pt-BR') : '—';
      const msgGrupo = `🚛 *Nova carga programada*\n\nPosto: ${carga.posto.toUpperCase()}\nCombustível: ${carga.combustivel}\nQuantidade: ${Number(carga.quantidade).toLocaleString('pt-BR')} litros\nMotorista: ${carga.motorista}\nDistribuidora: ${carga.distribuidora}\nPrevisão: ${data} 08:00`;
      sendWhatsApp(req.params.id, 'grupo_posto', grupoId, msgGrupo);

      const { rows: [mot] } = await db.query('SELECT * FROM motoristas WHERE nome=$1', [carga.motorista]);
      if (mot?.whatsapp_number) {
        const msgMot = `🚛 *Nova viagem atribuída*\n\nDestino: ${carga.posto}\nCombustível: ${carga.combustivel}\nQuantidade: ${Number(carga.quantidade).toLocaleString('pt-BR')} litros\nPrevisão: ${data} 08:00`;
        sendWhatsApp(req.params.id, 'motorista', mot.whatsapp_number, msgMot);
      }
    }

    audit(req.user.id, 'MOVE_KANBAN', 'cargas', req.params.id, req.ip);
    res.json({ ok: true, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/cargas/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE cargas SET deleted_at=NOW() WHERE id=$1', [req.params.id]);
    audit(req.user.id, 'DELETE_CARGA', 'cargas', req.params.id, req.ip);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/cargas/:id/historico', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT h.*,u.name as user_name FROM carga_historico h LEFT JOIN users u ON u.id=h.changed_by WHERE h.carga_id=$1 ORDER BY h.created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DASHBOARD ──
app.get('/dashboard/geral', authMiddleware, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const [vol, val, pend, pg, porComb, porPosto, porDist, porStatus] = await Promise.all([
      db.query('SELECT SUM(quantidade) AS total FROM cargas WHERE deleted_at IS NULL'),
      db.query('SELECT SUM(valor_total) AS total FROM cargas WHERE deleted_at IS NULL'),
      db.query("SELECT SUM(valor_total) AS total FROM cargas WHERE status_financeiro='pendente' AND deleted_at IS NULL"),
      db.query("SELECT SUM(valor_total) AS total FROM cargas WHERE status_financeiro='pago' AND deleted_at IS NULL"),
      db.query('SELECT combustivel, SUM(quantidade) AS volume, SUM(valor_total) AS valor FROM cargas WHERE deleted_at IS NULL GROUP BY combustivel ORDER BY volume DESC'),
      db.query('SELECT posto, SUM(quantidade) AS volume, SUM(valor_total) AS valor FROM cargas WHERE deleted_at IS NULL GROUP BY posto ORDER BY volume DESC'),
      db.query('SELECT distribuidora, SUM(quantidade) AS volume, SUM(valor_total) AS valor FROM cargas WHERE deleted_at IS NULL GROUP BY distribuidora ORDER BY volume DESC'),
      db.query('SELECT status, COUNT(*) AS count FROM cargas WHERE deleted_at IS NULL GROUP BY status'),
    ]);
    res.json({
      volume_total:      parseFloat(vol.rows[0]?.total   || 0),
      valor_total:       parseFloat(val.rows[0]?.total   || 0),
      pendente:          parseFloat(pend.rows[0]?.total  || 0),
      pago:              parseFloat(pg.rows[0]?.total    || 0),
      por_combustivel:   porComb.rows,
      por_posto:         porPosto.rows,
      por_distribuidora: porDist.rows,
      por_status:        porStatus.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── WHATSAPP LOG ──
app.get('/whatsapp/log', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM whatsapp_log ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/whatsapp/reenviar/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { rows: [log] } = await db.query('SELECT * FROM whatsapp_log WHERE id=$1', [req.params.id]);
    if (!log) return res.status(404).json({ error: 'Log não encontrado' });
    await db.query('UPDATE whatsapp_log SET status=$1,tentativas=0,erro_msg=NULL WHERE id=$2', ['pendente', req.params.id]);
    sendWhatsApp(log.carga_id, log.tipo, log.destino, log.mensagem);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AUDIT ──
app.get('/audit', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT a.*,u.name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 500'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RELATÓRIOS ──
app.get('/relatorios/cargas', authMiddleware, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const { de, ate, posto, distribuidora, combustivel } = req.query;
    let q = 'SELECT * FROM cargas WHERE deleted_at IS NULL';
    const vals = [];
    if (de)           { vals.push(de);           q += ` AND data_prevista>=$${vals.length}`; }
    if (ate)          { vals.push(ate);           q += ` AND data_prevista<=$${vals.length}`; }
    if (posto)        { vals.push(posto);         q += ` AND posto=$${vals.length}`; }
    if (distribuidora){ vals.push(distribuidora); q += ` AND distribuidora=$${vals.length}`; }
    if (combustivel)  { vals.push(combustivel);   q += ` AND combustivel=$${vals.length}`; }
    q += ' ORDER BY data_prevista DESC';
    const { rows } = await db.query(q, vals);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/relatorios/pagamentos', authMiddleware, requireRole('admin', 'gerente', 'pagador'), async (req, res) => {
  try {
    const { de, ate, status_financeiro } = req.query;
    let q = "SELECT * FROM cargas WHERE deleted_at IS NULL AND status NOT IN ('Planejamento','Cotação')";
    const vals = [];
    if (de)               { vals.push(de);               q += ` AND vencimento>=$${vals.length}`; }
    if (ate)              { vals.push(ate);               q += ` AND vencimento<=$${vals.length}`; }
    if (status_financeiro){ vals.push(status_financeiro); q += ` AND status_financeiro=$${vals.length}`; }
    q += ' ORDER BY vencimento ASC';
    const { rows } = await db.query(q, vals);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/relatorios/saldo-antecipado', authMiddleware, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT nome, saldo_antecipado FROM distribuidoras WHERE active=true ORDER BY nome');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ────────────────────────────────────────────────────────────────────
(async () => {
  await initDB();
  await getRedis();
  app.listen(PORT, () => console.log(`[FuelOps API] rodando na porta ${PORT}`));
})();
