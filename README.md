# Jardim Encantado — Rua 2

Sistema de gestão da escolinha do FiveM RP, desenvolvido com **React + Vite**, **Firebase Authentication + Firestore**, **Cloudinary** e **Vercel**.

## Funcionalidades da versão inicial

- Login por ID do personagem e senha; solicitação de cadastro e tela de aprovação pendente.
- Dev inicial: Chico D. Wind, ID 194 (criação via script seguro).
- Painel inicial, menu lateral e perfil.
- Matrícula de alunos com múltiplos responsáveis e fotos.
- Lista/grade de alunos, edição e exclusão por modal.
- Calendário mensal de frequência, categorias e registros de presença/ausência.
- Listagem de registros, pesquisa e exclusão por administradores.
- Categorias com nome, cor HEX, paleta de cores e prévia.
- Aprovação de cadastros como monitor, gerenciamento de usuários e senhas via API administrativa.
- Relatórios por período de presenças e registros de monitores.
- Rodapé institucional, responsividade e interface clara.

## 1. Requisitos

- Node.js 20 ou superior.
- Projeto Firebase com Authentication (provedor **E-mail/senha** habilitado) e Firestore.
- Conta Cloudinary.
- Projeto Vercel.

## 2. Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, substitua `cp` por `Copy-Item .env.example .env`.

Preencha no `.env` os valores `VITE_FIREBASE_*` copiados das configurações do aplicativo Web no Firebase Console.

**Importante:** o login utiliza internamente um e-mail técnico derivado do ID, como `194@jardim-encantado.invalid`. O usuário vê apenas ID e senha. **Não configure autenticação por e-mail com envio de recuperação:** esse domínio é fictício. A recuperação de senha é realizada pela administração do sistema.

O Firebase Authentication exige **mínimo de 6 caracteres na senha**, mesmo sem regras de complexidade. Essa limitação não pode ser desativada no Firebase.

## 3. Regras do Firestore

Crie o Firestore e publique o arquivo `firestore.rules` no Firebase Console, ou use:

```bash
npx firebase-tools login
npx firebase-tools use SEU_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

**Nunca** use regras abertas (`allow read, write: if true`) em produção.

As regras impedem que usuários pendentes acessem os dados internos, restringem categorias e alterações de frequência à administração, e impedem que o próprio usuário eleve seu cargo.

## 4. Credencial administrativa

No Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada, baixe o JSON.

Na Vercel, adicione `FIREBASE_SERVICE_ACCOUNT_JSON` com o **conteúdo integral do JSON em uma única variável**, sem publicar o arquivo. Essa variável é utilizada exclusivamente pelas funções serverless em `api/`.

Não coloque o JSON no repositório, em `public/` ou em variáveis `VITE_*`.

## 5. Criar a conta inicial do Dev

Antes de autorizar outros cadastros, crie o usuário principal **Chico D. Wind — ID 194**.

No terminal local, defina a variável `FIREBASE_SERVICE_ACCOUNT_JSON` e execute:

```bash
npm run bootstrap:dev
```

No PowerShell, você pode usar:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw 'C:\caminho\seguro\service-account.json'
npm run bootstrap:dev
Remove-Item Env:FIREBASE_SERVICE_ACCOUNT_JSON
```

O script solicitará uma senha, criará/atualizará a conta Dev e marcará o perfil como aprovado. **Não use o ID como senha inicial.** O script não deve ser executado na Vercel como etapa de build.

## 6. Cloudinary

Configure as variáveis **somente no servidor da Vercel**:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

A API `/api/cloudinary-sign` valida o token Firebase e assina o upload. A chave secreta nunca é enviada ao navegador. O envio de imagens depende dessa API, portanto não funciona no `vite dev` puro: teste imagens na Vercel ou com `vercel dev` após configurar as variáveis.

O upload inicial de foto é tentado após o cadastro; se o serviço de imagem estiver indisponível, a conta é criada mesmo assim e a foto pode ser adicionada posteriormente.

## 7. Deploy na Vercel

1. Envie os arquivos para um repositório privado ou público no GitHub (sem `.env` ou credenciais).
2. Importe o repositório na Vercel como projeto Vite.
3. Build command: `npm run build`; output directory: `dist`.
4. Configure todas as variáveis `VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `CLOUDINARY_*`.
5. Faça o deploy.
6. No Firebase Authentication → Settings → Authorized domains, adicione o domínio `.vercel.app` do projeto e qualquer domínio próprio.
7. Teste login, cadastro, autorização, upload, matrícula e frequência com contas de teste.

As rotas `/api/*` são funções serverless; as demais rotas são encaminhadas ao frontend via `vercel.json`.

## 8. Organização

```text
api/                  Funções serverless protegidas
public/               Logos oficiais
scripts/              Inicialização segura do Dev
src/components/       Layout, modal, campos e confirmações
src/contexts/         Sessão e autenticação
src/pages/            Páginas do sistema
src/services/         Firebase, Firestore, Cloudinary e APIs
src/styles/           Estilos globais responsivos
src/utils/            Funções auxiliares
firestore.rules        Regras de segurança do banco
```

## 9. Pontos para evolução e validação

Esta é uma **versão inicial funcional**, não uma versão auditada para produção. Antes de colocar em uso definitivo, é importante:

- Validar fluxos reais após conectar os serviços e fazer testes de segurança.
- Adicionar índices do Firestore quando solicitados pelo console.
- Criar um mecanismo de unicidade de ID de aluno e reforçar validações de dados e limites de upload.
- Adicionar paginação e consultas agregadas nos relatórios e listas, para economizar leituras do Firestore. As telas iniciais fazem leituras completas em algumas coleções; isso pode não escalar bem no plano gratuito.
- Criar uma edição de frequência diretamente pela página de registros (a edição já está disponível na modal do calendário para administradores).
- Evoluir os controles de data/hora para seletores totalmente personalizados, caso desejado; atualmente possuem CSS próprio, mas o popup nativo pode variar entre navegadores.
- Adicionar contador dinâmico de autorizações pendentes no menu lateral.
- Implementar exclusão/gestão do ciclo de vida das imagens no Cloudinary.

**Não armazene senhas no Firestore.** As senhas ficam exclusivamente no Firebase Authentication.
