# 🚀 Como Testar SEM Conectar ao Banco PostgreSQL

## Opção 1: Usar SQLite Local (Recomendado para dev)

### 1. Instalar driver SQLite do Prisma

```bash
yarn add -D @prisma/client
```

### 2. Atualizar o schema.prisma

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Configurar .env para testar

```bash
# Arquivo de banco local (será criado automaticamente)
DATABASE_URL="file:./dev.db"
```

### 4. Rodar migração inicial

```bash
yarn prisma migrate dev --name init
```

### 5. Usar API

```bash
# Terminal 1: Iniciar servidor
yarn start:dev

# Terminal 2: Testar endpoints
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@teste.com",
    "password": "password123",
    "name": "Dr. João Silva",
    "role": "DOCTOR"
  }'
```

---

## Opção 2: Usar SQLite Em Memória (Testes rápidos)

### 1. Atualizar .env.test

```bash
DATABASE_URL="file::memory:"
```

### 2. Rodar testes E2E

```bash
yarn test:e2e
```

---

## Opção 3: Mock do PrismaService (Testes Unitários)

### Criar arquivo de mock

```typescript
// test/prisma.mock.ts
export const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};
```

### Usar em testes

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve criar usuário', async () => {
    const user = { id: '1', email: 'test@test.com', ... };
    jest.spyOn(prisma.user, 'create').mockResolvedValue(user);

    const result = await service.create({...});
    expect(result).toEqual(user);
  });
});
```

---

## Testes com Postman/Insomnia

### 1. Instale Insomnia ou Postman

### 2. Importe a coleção abaixo ou crie manualmente

### Endpoints Disponíveis:

```
POST http://localhost:3000/users
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123",
  "name": "Test User",
  "role": "PATIENT"
}
```

```
GET http://localhost:3000/users?skip=0&take=10
```

```
GET http://localhost:3000/users/:id
```

```
PATCH http://localhost:3000/users/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

```
DELETE http://localhost:3000/users/:id
```

---

## Quick Start (Mais rápido)

```bash
# 1. Instalar SQLite (opcional, Prisma já vem com suporte)
yarn add sqlite3

# 2. Atualizar prisma/schema.prisma para SQLite
# (já está configurado para PostgreSQL, mude se quiser)

# 3. Criar e rodar migration (cria banco vazio)
yarn prisma migrate dev --name init

# 4. Iniciar servidor
yarn start:dev

# 5. Testar (em outro terminal)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"t@t.com","password":"pass123word","name":"Test"}'
```

---

## Checklist de Teste

- [ ] Criar usuário com dados válidos ✅
- [ ] Falhar com email inválido ✅
- [ ] Falhar com senha curta ✅
- [ ] Listar usuários (paginado) ✅
- [ ] Buscar por ID ✅
- [ ] Buscar por email ✅
- [ ] Atualizar usuário ✅
- [ ] Deletar usuário ✅
- [ ] Falhar com email duplicado ✅

---

## Modo Recomendado

1. **Desenvolvimento**: SQLite local (`dev.db`)
2. **Testes**: SQLite em memória ou mock
3. **Produção**: PostgreSQL

Isso te permite testar tudo localmente sem dependências externas! 🎯
