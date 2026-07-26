# ZebraDash

Painel administrativo da Zebra Travel, em Next.js. Consome a API REST do `zebratravelB` (autenticação JWT, apenas utilizadores com role `ADMIN`).

## Desenvolvimento

```bash
npm install
cp .env.local.example .env.local   # ajustar NEXT_PUBLIC_API_URL se necessário
npm run dev
```

Requer o backend (`zebratravelB`) e a base de dados Postgres a correr — ver `docker-compose.yml` na raiz do projecto.

Login de demonstração (seed): `terra.systemltd@gmail.com` / `terrasystem1`.
