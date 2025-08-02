# Budget Smart Cycle - Controle Financeiro Pessoal

Uma aplicação web moderna para gerenciamento de controle de gastos pessoais, desenvolvida com React, TypeScript e Supabase.

## 🚀 Funcionalidades

### 📊 Dashboard Principal

- **Visão Geral Financeira**: Saldo disponível e total guardado
- **Ciclos Mensais**: Controle de gastos por período mensal
- **Dia Ideal do Cartão**: Configuração personalizada para controle de cartão de crédito

### 💰 Gerenciamento de Transações

- **Rendas Extras**: Registro de ganhos adicionais
- **Gastos Fixos**: Despesas recorrentes mensais
- **Compras Parceladas**: Controle de pagamentos em prestações
- **Gastos Avulsos**: Despesas pontuais e variáveis

### 🔄 Categorias de Gerenciamento

- **Rendas**: Gestão de entradas de dinheiro
- **Parceladas**: Controle de compras em prestações
- **Recorrentes**: Despesas que se repetem mensalmente
- **Fixos**: Gastos obrigatórios mensais

### ⚙️ Recursos Avançados

- **Autenticação**: Sistema de login seguro
- **Ciclos Mensais**: Reinício automático de controle financeiro
- **Histórico**: Visualização de transações anteriores
- **Edição**: Modificação de transações existentes
- **Exclusão**: Remoção de registros desnecessários

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📦 Instalação e Execução

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou bun

### Passos para Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd budget-smart-cycle

# 2. Instale as dependências
npm install
# ou
bun install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local com suas credenciais do Supabase

# 4. Execute o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

A aplicação estará disponível em `http://localhost:8080`

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run build:dev    # Gera build de desenvolvimento
npm run preview      # Visualiza o build de produção
npm run lint         # Executa o linter
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
├── pages/           # Páginas da aplicação
│   ├── Index.tsx           # Dashboard principal
│   ├── Auth.tsx            # Autenticação
│   ├── Income.tsx          # Gestão de rendas
│   ├── InstalmentPurchases.tsx  # Compras parceladas
│   ├── RecurringPurchases.tsx   # Gastos recorrentes
│   ├── FixedExpenses.tsx        # Gastos fixos
│   └── NotFound.tsx             # Página 404
├── hooks/           # Custom hooks
├── lib/             # Utilitários e configurações
├── integrations/    # Integrações externas (Supabase)
└── config/          # Configurações da aplicação
```

## 🗄️ Banco de Dados

A aplicação utiliza Supabase como backend, com as seguintes tabelas principais:

- **profiles**: Perfis dos usuários
- **transactions**: Transações financeiras
- **auth.users**: Autenticação de usuários

## 🎨 Interface

- **Design Responsivo**: Funciona em desktop e mobile
- **Tema Moderno**: Interface limpa e intuitiva
- **Feedback Visual**: Notificações e alertas informativos
- **Navegação Intuitiva**: Menu de categorias organizado

## 🔐 Autenticação

Sistema de autenticação seguro via Supabase Auth, permitindo:

- Registro de novos usuários
- Login com email e senha
- Logout seguro
- Proteção de rotas

## 📱 Responsividade

A aplicação é totalmente responsiva e otimizada para:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🚀 Deploy

### Via Lovable

1. Acesse o [projeto no Lovable](https://lovable.dev/projects/30d690d7-df66-45d1-bdd8-24e0aafd296a)
2. Clique em Share → Publish

### Via Vercel/Netlify

```bash
npm run build
# Faça upload da pasta dist/ para sua plataforma de deploy
```

---

**Desenvolvido com ❤️ usando React, TypeScript e Supabase**

## 🚀 Desenvolvido com Lovable

Este projeto foi desenvolvido com a ajuda do [Lovable](https://lovable.dev), uma plataforma que facilita o desenvolvimento de aplicações web modernas através de IA generativa.

**URL do Projeto**: https://lovable.dev/projects/30d690d7-df66-45d1-bdd8-24e0aafd296a

### Como Editar o Código

**Via Lovable**

- Acesse o [projeto no Lovable](https://lovable.dev/projects/30d690d7-df66-45d1-bdd8-24e0aafd296a)
- Faça suas alterações através de prompts
- As mudanças são automaticamente commitadas no repositório

**Via IDE Local**

- Clone o repositório
- Faça suas alterações localmente
- Push das mudanças será refletido no Lovable

**Via GitHub**

- Edite arquivos diretamente no GitHub
- As mudanças serão sincronizadas com o Lovable

**Via GitHub Codespaces**

- Use o ambiente de desenvolvimento integrado do GitHub
- Edite, teste e faça commit das mudanças
