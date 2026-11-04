# 📚 Sistema de Gerenciamento de Livros — CRUD + Open Library API

Projeto acadêmico desenvolvido para a disciplina de **Desenvolvimento Web III** do curso de **Desenvolvimento de Software Multiplataforma (DSM)** — FATEC Diadema.

A aplicação é um gerenciador de acervo bibliográfico para pequenas bibliotecas e controle pessoal de leitura. Desenvolvida em **Node.js nativo (sem frameworks)** com persistência em **SQLite3** e integração com a API externa **Open Library**.

---

## 🚀 Funcionalidades

- **CRUD Completo de Livros:** Cadastro, listagem, atualização e exclusão com solicitação prévia de confirmação.
- **Identificação Visual de Status:** Distinção por selos (badges) coloridos para `Quero Ler`, `Lendo` e `Concluído`.
- **Integrador Open Library API:** Ao digitar um título na tela de cadastro, o sistema consulta a API pública [Open Library](https://openlibrary.org/dev/docs/api/search) e autopreenche título, autor, ano de publicação, ISBN e URL da imagem da capa.
- **Fallback para Cadastro Manual:** Caso a API externa esteja indisponível ou o livro não seja encontrado, o sistema permite o preenchimento manual completo.
- **Validação de ISBN Único:** Garantia de integridade contra duplicidade de ISBNs informados.
- **Pesquisa Local:** Filtro dinâmico por Título, Autor ou ISBN no banco de dados local.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (Servidor HTTP nativo com Módulos ES6)
- **Banco de Dados:** SQLite3
- **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox e CSS Grid) e JavaScript (ES6+ / Fetch API)
- **API Externa:** [Open Library Search API](https://openlibrary.org/dev/docs/api/search)

---

## 📡 Endpoints da API REST

A API responde exclusivamente em formato `JSON` com os códigos de status HTTP correspondentes (200, 201, 400, 404, 405, 409, 500).

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/livros` | Lista todos os livros ou aceita busca via query string `?q=termo` |
| `GET` | `/api/livros/:id` | Retorna as informações detalhadas de um livro específico |
| `POST` | `/api/livros` | Cadastra um novo livro |
| `PUT` | `/api/livros/:id` | Atualiza os dados do livro correspondente ao ID |
| `DELETE` | `/api/livros/:id` | Exclui permanentemente um livro pelo ID |

---

## 🗄️ Modelo de Dados (Tabela `livros`)

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Chave primária |
| `titulo` | TEXT | NOT NULL | Título da obra |
| `autor` | TEXT | NOT NULL | Nome do autor/escritor |
| `isbn` | TEXT | UNIQUE | Código ISBN (se informado, deve ser único) |
| `ano_publicacao` | INTEGER | NOT NULL | Ano de lançamento |
| `genero` | TEXT | NOT NULL | Gênero literário |
| `status` | TEXT | CHECK(`QUERO_LER`, `LENDO`, `CONCLUIDO`) | Situação de leitura |
| `capa_url` | TEXT | - | Link direto da imagem da capa |
| `criado_em` | TEXT | DEFAULT CURRENT_TIMESTAMP | Data de inclusão no banco |

---

## 📦 Como Instalar e Executar

### Pré-requisitos
- Node.js instalado (versão 18 ou superior).

### Passo a passo

1. **Clone este repositório:**
   ```bash
   git clone [https://github.com/Helder-Virissio/FATEC-D.S.M-Desenvolvimento-Web-III-Projeto-7.git](https://github.com/Helder-Virissio/FATEC-D.S.M-Desenvolvimento-Web-III-Projeto-7.git)
   cd FATEC-D.S.M-Desenvolvimento-Web-III-Projeto-7

2. **Instale as dependências:**

   ```Bash
   npm install
   
3. **Inicie o servidor:**

   ```Bash
      npm start
4. **Acesse a aplicação:**

   ```Bash
   Abra o seu navegador e acesse: http://localhost:5000

👨‍💻 Autor
Desenvolvido por Helder Virissio Araujo

Estudante do 3º Semestre de Desenvolvimento de Software Multiplataforma — FATEC Diadema.
