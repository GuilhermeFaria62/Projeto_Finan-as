const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Banco de dados ────────────────────────────────────────────
// Railway injeta DATABASE_URL automaticamente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id         SERIAL PRIMARY KEY,
      descricao  TEXT        NOT NULL,
      valor      NUMERIC     NOT NULL,
      categoria  TEXT        NOT NULL,
      tipo       TEXT        NOT NULL CHECK (tipo IN ('income','expense')),
      data       TEXT        NOT NULL,
      criado_em  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ Banco de dados pronto');
}

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas API ─────────────────────────────────────────────────

// GET /api/transacoes
app.get('/api/transacoes', async (req, res) => {
  try {
    const { tipo, categoria, limit = 200, offset = 0 } = req.query;
    const conditions = ['1=1'];
    const values     = [];

    if (tipo)      { values.push(tipo);      conditions.push(`tipo = $${values.length}`); }
    if (categoria) { values.push(categoria); conditions.push(`categoria = $${values.length}`); }

    values.push(Number(limit));  const limitIdx  = values.length;
    values.push(Number(offset)); const offsetIdx = values.length;

    const sql = `
      SELECT * FROM transacoes
      WHERE ${conditions.join(' AND ')}
      ORDER BY id DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows }  = await pool.query(sql, values);
    const { rows: countRows } = await pool.query('SELECT COUNT(*) AS total FROM transacoes');
    res.json({ data: rows, total: Number(countRows[0].total) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transacoes/resumo
app.get('/api/transacoes/resumo', async (req, res) => {
  try {
    const { rows: [totais] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo='income'  THEN valor ELSE 0 END), 0) AS receitas,
        COALESCE(SUM(CASE WHEN tipo='expense' THEN valor ELSE 0 END), 0) AS despesas,
        COUNT(*) AS total_lancamentos
      FROM transacoes
    `);

    const { rows: porCategoria } = await pool.query(`
      SELECT categoria,
             SUM(valor)  AS total,
             COUNT(*)    AS quantidade
      FROM transacoes
      WHERE tipo = 'expense'
      GROUP BY categoria
      ORDER BY total DESC
    `);

    res.json({
      receitas:          Number(totais.receitas),
      despesas:          Number(totais.despesas),
      saldo:             Number(totais.receitas) - Number(totais.despesas),
      total_lancamentos: Number(totais.total_lancamentos),
      por_categoria:     porCategoria.map(r => ({ ...r, total: Number(r.total) }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transacoes
app.post('/api/transacoes', async (req, res) => {
  try {
    const { descricao, valor, categoria, tipo, data } = req.body;

    if (!descricao || !valor || !categoria || !tipo || !data)
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    if (!['income', 'expense'].includes(tipo))
      return res.status(400).json({ error: 'Tipo inválido.' });
    if (isNaN(valor) || Number(valor) <= 0)
      return res.status(400).json({ error: 'Valor deve ser um número positivo.' });

    const { rows: [nova] } = await pool.query(
      `INSERT INTO transacoes (descricao, valor, categoria, tipo, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [descricao, Number(valor), categoria, tipo, data]
    );
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transacoes/:id
app.put('/api/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, categoria, tipo, data } = req.body;

    const { rowCount } = await pool.query('SELECT id FROM transacoes WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Transação não encontrada.' });

    const { rows: [atualizada] } = await pool.query(
      `UPDATE transacoes
       SET descricao=$1, valor=$2, categoria=$3, tipo=$4, data=$5
       WHERE id=$6 RETURNING *`,
      [descricao, Number(valor), categoria, tipo, data, id]
    );
    res.json(atualizada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transacoes/:id
app.delete('/api/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM transacoes WHERE id = $1', [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Transação não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback → index.html
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// ── Start ─────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  }))
  .catch(err => {
    console.error('Erro ao conectar no banco:', err.message);
    process.exit(1);
  });
