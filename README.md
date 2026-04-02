# 💰 Controle de Finanças — Railway + PostgreSQL

Aplicação web completa para controle de gastos, pronta para deploy no Railway.

---

## 🚀 Deploy no Railway (passo a passo)

### 1. Suba o projeto no GitHub

1. Acesse [github.com](https://github.com) e crie um repositório novo (pode ser privado)
2. Clique em **"Add file" → "Upload files"**
3. Arraste **todos os arquivos** desta pasta:
   - `server.js`
   - `package.json`
   - `README.md`
   - pasta `public/` (com o `index.html` dentro)
4. Clique em **"Commit changes"**

---

### 2. Crie o projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login com sua conta GitHub
2. Clique em **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Selecione o repositório que você criou
5. Aguarde o deploy terminar (~2 minutos)

---

### 3. Adicione o banco PostgreSQL

1. Dentro do projeto no Railway, clique em **"+ New"**
2. Escolha **"Database" → "PostgreSQL"**
3. O Railway cria o banco e **injeta a variável `DATABASE_URL` automaticamente**
4. O servidor vai reiniciar e conectar sozinho — nenhuma configuração extra!

---

### 4. Pegue sua URL pública

No painel do Railway, clique no seu serviço Node.js → aba **"Settings"** → **"Domains"** → clique em **"Generate Domain"**.

Sua URL ficará assim:
```
https://controle-financas-production.up.railway.app
```

Acesse pelo computador, celular ou qualquer dispositivo em qualquer rede! ✅

---

## Estrutura do projeto

```
financas-railway/
├── server.js        ← API REST com PostgreSQL
├── package.json     ← Dependências
├── README.md        ← Este arquivo
└── public/
    └── index.html   ← Frontend completo
```

## API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/transacoes` | Lista transações |
| GET | `/api/transacoes/resumo` | Totais e por categoria |
| POST | `/api/transacoes` | Cria transação |
| PUT | `/api/transacoes/:id` | Atualiza transação |
| DELETE | `/api/transacoes/:id` | Remove transação |
