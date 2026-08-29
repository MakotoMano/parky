# Parky — MVP funcional

Aplicação full-stack para localizar estacionamentos, reservar uma vaga e apresentar um QR Code na entrada. O projeto contém frontend React/TypeScript, API FastAPI/Python e persistência PostgreSQL pronta para nuvem.

## Funcionalidades entregues

- Landing page responsiva e interface de alta fidelidade.
- Busca por endereço, bairro ou nome do estacionamento.
- Estacionamentos persistidos no banco e semeados no primeiro start.
- Reserva com nome, e-mail, placa, data, horário e duração.
- Preço calculado exclusivamente no backend.
- Validação de placa, e-mail, intervalo, horário passado e disponibilidade.
- QR Code SVG real e único para cada reserva.
- Consulta de reservas por e-mail.
- Cancelamento de reservas futuras.
- API documentada automaticamente em `/docs`.
- Health check da API e do banco em `/api/health`.
- Testes automatizados e pipeline de CI.
- Infraestrutura como código para site, API e PostgreSQL gerenciado no Render.

## Arquitetura

```text
React + Vite (frontend)
        │ HTTPS/JSON
        ▼
FastAPI + SQLAlchemy (API)
        │ conexão privada
        ▼
PostgreSQL gerenciado (Render)
```

O SQLite é usado apenas como fallback rápido no desenvolvimento. No deploy, `DATABASE_URL` é injetada pelo PostgreSQL gerenciado e normalizada para o driver `psycopg`.

## Executar localmente

### Opção rápida com SQLite

No terminal 1:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload
```

No terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. A documentação interativa da API fica em `http://localhost:8000/docs`.

### Opção com PostgreSQL local

```powershell
docker compose up --build
```

Esse comando inicia PostgreSQL e API. Depois, inicie o frontend com `npm run dev` na pasta `frontend`.

## Testes

```powershell
cd backend
python -m pytest -q tests

cd ..\frontend
npm run build
```

Validação realizada nesta entrega:

- API: `3 passed`.
- Frontend: TypeScript e bundle Vite concluídos.
- Dependências npm: `0 vulnerabilities`.
- Fluxo visual: desktop e celular, sem erros no console.

## Banco de dados na nuvem

O arquivo `render.yaml` descreve três recursos interligados:

1. `parky-fiap-diogo-web`: site estático React.
2. `parky-fiap-diogo-api`: API FastAPI em container Docker.
3. `parky-fiap-diogo-db`: PostgreSQL gerenciado, acessível pela rede privada do Render.

O banco não fica exposto à internet (`ipAllowList: []`). A API cria o esquema e os dados iniciais automaticamente ao iniciar. O script equivalente também está em `database/schema.sql` para auditoria.

### Publicar no Render

1. Crie um repositório Git apenas com o conteúdo desta pasta `parky` e envie ao GitHub ou GitLab.
2. No painel do Render, selecione **New → Blueprint**.
3. Conecte o repositório. O Render detectará o `render.yaml` na raiz.
4. Revise os três recursos e aplique o Blueprint.
5. Aguarde o health check da API ficar verde e abra a URL do frontend.
6. Se algum nome já estiver em uso, altere os nomes no YAML e também as duas URLs em `FRONTEND_ORIGINS` e `VITE_API_URL` antes de aplicar.

O plano gratuito serve para demonstração acadêmica, mas o PostgreSQL gratuito do Render expira após 30 dias e não possui backup. Para manter o link ativo durante toda a correção, publique próximo à data de entrega ou mude o banco para um plano pago. Consulte a [documentação de Blueprints](https://render.com/docs/infrastructure-as-code) e as [limitações do plano gratuito](https://render.com/docs/free).

> A instância remota só pode ser criada por uma pessoa autenticada na conta do provedor. O código e a infraestrutura estão prontos; aplicar o Blueprint é a etapa que efetivamente cria os recursos na conta.

## Variáveis de ambiente

Use `.env.example` como referência e nunca envie o `.env` real ao GitHub.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | URL completa do SQLite ou PostgreSQL |
| `FRONTEND_ORIGINS` | Origens permitidas pelo CORS, separadas por vírgula |
| `ENVIRONMENT` | `development`, `test` ou `production` |
| `TIMEZONE` | Fuso usado para validar data e horário |
| `VITE_API_URL` | URL pública da API consumida pelo frontend |

## Principais rotas

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/health` | Verifica API e banco |
| `GET` | `/api/estacionamentos` | Lista e filtra estacionamentos |
| `POST` | `/api/reservas` | Cria uma reserva |
| `GET` | `/api/reservas?email=...` | Consulta reservas do cliente |
| `GET` | `/api/reservas/{id}` | Detalha uma reserva |
| `PATCH` | `/api/reservas/{id}/cancelar` | Cancela uma reserva futura |
| `GET` | `/api/reservas/{id}/qrcode.svg` | Entrega o QR Code |

## Estrutura

```text
parky/
├── backend/             # FastAPI, SQLAlchemy e testes
├── database/schema.sql  # esquema PostgreSQL auditável
├── frontend/            # React, TypeScript e CSS responsivo
├── .github/workflows/   # CI do GitHub Actions
├── docker-compose.yml   # PostgreSQL + API local
├── render.yaml          # infraestrutura cloud
└── VALIDACAO_CODIGO_GEMINI.md
```

## Observação sobre o código inicial

A análise detalhada do trecho sugerido pelo Gemini está em `VALIDACAO_CODIGO_GEMINI.md`. Ele representava um bom esboço conceitual, mas não estava pronto para produção: aceitava preço vindo do cliente, usava CORS aberto e credenciais falsas como padrão, não tratava indisponibilidade, não validava os dados e não provisionava infraestrutura.

