// Importamos o banco de dados e ferramentas do nosso config
import { db, collection, getDocs } from './firebase-config.js';

// Elemento onde os produtos vão aparecer
const listaProdutos = document.getElementById('lista-produtos');

// Função para carregar produtos
async function carregarProdutos() {
    if (!listaProdutos) return; // Se não estiver na página certa, para

    try {
        listaProdutos.innerHTML = '<div class="col-12 text-center"><p>Carregando cardápio...</p></div>';
        
        // Busca a coleção 'produtos' no banco
        const querySnapshot = await getDocs(collection(db, "produtos"));
        
        listaProdutos.innerHTML = ''; // Limpa o loading

        if (querySnapshot.empty) {
            listaProdutos.innerHTML = '<div class="col-12 text-center"><p>Nenhum produto cadastrado ainda.</p></div>';
            return;
        }

        // Para cada produto encontrado...
        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            // Cria o HTML do produto
            const html = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        ${produto.imagem ? `<img src="${produto.imagem}" class="card-img-top" alt="${produto.nome}" style="height: 200px; object-fit: cover;">` : ''}
                        <div class="card-body">
                            <h5 class="card-title">${produto.nome}</h5>
                            <p class="card-text text-muted">${produto.descricao || ''}</p>
                            <p class="card-text fw-bold text-success">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            `;
            listaProdutos.innerHTML += html;
        });

    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        listaProdutos.innerHTML = '<div class="col-12 text-center text-danger"><p>Erro ao carregar produtos.</p></div>';
    }
}

// Carrega ao iniciar
document.addEventListener('DOMContentLoaded', carregarProdutos);