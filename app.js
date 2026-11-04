import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

function getRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => body += chunk.toString());
        request.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        request.on('error', reject);
    });
}

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(data));
}

function serveStaticFile(response, file) {
    fs.readFile(file, (err, data) => {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('404 - Página não encontrada');
        }
        const ext = path.extname(file).toLowerCase();
        response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        response.end(data);
    });
}

function validarLivro(data) {
    if (!data.titulo || !data.autor || !data.ano_publicacao || !data.genero || !data.status) {
        return 'Preencha todos os campos obrigatórios (Título, Autor, Ano, Gênero e Status).';
    }

    if (!['QUERO_LER', 'LENDO', 'CONCLUIDO'].includes(data.status)) {
        return 'Status inválido. Escolha entre: QUERO_LER, LENDO ou CONCLUIDO.';
    }

    const ano = Number(data.ano_publicacao);
    if (isNaN(ano) || ano < 0 || ano > new Date().getFullYear() + 1) {
        return 'Ano de publicação inválido.';
    }

    return null;
}

async function callback(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const method = request.method;

    try {
        // RegEx para rotas do tipo /api/livros ou /api/livros/:id
        const routeMatch = pathname.match(/^\/api\/livros(?:\/(\d+))?$/);

        if (routeMatch) {
            // Se houver ID no path (/api/livros/5), pega do match. Senão, verifica se veio em query param (?id=5)
            const id = routeMatch[1] || url.searchParams.get('id');
            const q = url.searchParams.get('q');

            // GET /api/livros ou /api/livros/:id
            if (method === 'GET') {
                if (id) {
                    db.get('SELECT * FROM livros WHERE id = ?', [id], (err, row) => {
                        if (err) return sendJson(response, 500, { error: err.message });
                        if (!row) return sendJson(response, 404, { error: 'Livro não encontrado.' });
                        sendJson(response, 200, row);
                    });
                    return;
                }

                let sql = 'SELECT * FROM livros WHERE 1 = 1';
                const params = [];

                if (q) {
                    sql += ' AND (titulo LIKE ? OR autor LIKE ? OR isbn LIKE ?)';
                    const termo = `%${q}%`;
                    params.push(termo, termo, termo);
                }

                sql += ' ORDER BY titulo ASC';

                db.all(sql, params, (err, rows) => {
                    if (err) return sendJson(response, 500, { error: err.message });
                    sendJson(response, 200, rows);
                });
                return;
            }

            // POST /api/livros
            if (method === 'POST') {
                const data = await getRequestBody(request);
                const erroValidacao = validarLivro(data);

                if (erroValidacao) {
                    return sendJson(response, 400, { error: erroValidacao });
                }

                const isbnValue = data.isbn && data.isbn.trim() !== '' ? data.isbn.trim() : null;

                const sql = `
                    INSERT INTO livros (titulo, autor, isbn, ano_publicacao, genero, status, capa_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                const params = [
                    data.titulo.trim(),
                    data.autor.trim(),
                    isbnValue,
                    Number(data.ano_publicacao),
                    data.genero.trim(),
                    data.status,
                    data.capa_url ? data.capa_url.trim() : null
                ];

                db.run(sql, params, function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            return sendJson(response, 409, { error: 'O ISBN informado já está cadastrado em outro livro.' });
                        }
                        return sendJson(response, 500, { error: err.message });
                    }
                    sendJson(response, 201, { id: this.lastID, message: 'Livro cadastrado com sucesso!' });
                });
                return;
            }

            // PUT /api/livros/:id
            if (method === 'PUT') {
                if (!id) {
                    return sendJson(response, 400, { error: 'Informe o ID do livro para atualização.' });
                }

                const data = await getRequestBody(request);
                const erroValidacao = validarLivro(data);

                if (erroValidacao) {
                    return sendJson(response, 400, { error: erroValidacao });
                }

                const isbnValue = data.isbn && data.isbn.trim() !== '' ? data.isbn.trim() : null;

                const sql = `
                    UPDATE livros
                    SET titulo = ?, autor = ?, isbn = ?, ano_publicacao = ?, genero = ?, status = ?, capa_url = ?
                    WHERE id = ?
                `;

                const params = [
                    data.titulo.trim(),
                    data.autor.trim(),
                    isbnValue,
                    Number(data.ano_publicacao),
                    data.genero.trim(),
                    data.status,
                    data.capa_url ? data.capa_url.trim() : null,
                    id
                ];

                db.run(sql, params, function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            return sendJson(response, 409, { error: 'O ISBN informado já pertence a outro livro.' });
                        }
                        return sendJson(response, 500, { error: err.message });
                    }
                    if (this.changes === 0) {
                        return sendJson(response, 404, { error: 'Livro não encontrado para atualização.' });
                    }
                    sendJson(response, 200, { message: 'Livro atualizado com sucesso!' });
                });
                return;
            }

            // DELETE /api/livros/:id
            if (method === 'DELETE') {
                if (!id) {
                    return sendJson(response, 400, { error: 'Informe o ID do livro para exclusão.' });
                }

                db.run('DELETE FROM livros WHERE id = ?', [id], function (err) {
                    if (err) return sendJson(response, 500, { error: err.message });
                    if (this.changes === 0) {
                        return sendJson(response, 404, { error: 'Livro não encontrado para exclusão.' });
                    }
                    sendJson(response, 200, { message: 'Livro excluído com sucesso!' });
                });
                return;
            }

            return sendJson(response, 405, { error: 'Método HTTP não permitido nesta rota.' });
        }

        // ============================================================
        // ARQUIVOS ESTÁTICOS & ROTAS INEXISTENTES
        // ============================================================
        const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const file = path.resolve(publicDir, relativePath);

        if (!file.startsWith(path.resolve(publicDir))) {
            response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('403 - Acesso proibido');
        }

        fs.stat(file, (err, stats) => {
            if (err || !stats.isFile()) {
                response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return response.end('404 - Rota ou arquivo não encontrado.');
            }
            serveStaticFile(response, file);
        });

    } catch (error) {
        sendJson(response, 500, { error: 'Erro interno do servidor.', details: error.message });
    }
}

const server = http.createServer(callback);
const PORT = 5000;

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/`);
});