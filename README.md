# Intercâmbio de Livros — front-end

SPA em React para consultar livros, gerenciar a própria estante e acompanhar propostas de troca.

## Requisitos

- Node.js 24
- npm 11
- API disponível em `http://localhost:8080/intercambio-livros`

## Executar

```bash
npm install
npm run dev
```

Sem um `.env`, o cliente usa `/api` e o Vite encaminha as chamadas para a API local. Para apontar a aplicação a outro endereço, copie `.env.example` para `.env` e ajuste `VITE_API_BASE_URL`.

## Qualidade

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

## Dependência atual da API

As telas **Meus livros** e **Propor troca** exibem um estado de indisponibilidade enquanto `GET /api/livros/me` não estiver implementado. Nenhum livro fictício é usado como substituição.
