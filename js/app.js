// Importar configurações do Firebase
import { db, collection, getDocs, query, where, orderBy } from './firebase-config.js';

// Variável global do carrinho
let carrinho = [];

// Função para carregar categorias do Firebase
async function carregarCategorias() {
    try {
        const categoriasRef = collection(db, 'categorias');
        const snapshot = await getDocs(categoriasRef);
        
        const filtroContainer = document.getElementById('filtroCategoria');
        
        // Adicionar botões de categoria
        snapshot.forEach(doc => {
            const categoria = doc.data();
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-outline-dark';
            btn.setAttribute('data-categoria', categoria.nome);
            btn.textContent = categoria.nome;
            
            // Filtrar ao clicar
            btn.addEventListener('click', () => {
                document.querySelectorAll('#filtroCategoria button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filtrarProdutos(categoria.nome);
            });
            
            filtroContainer.appendChild(btn);
        });
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Função para carregar produtos do Firebase
async function carregarProdutos() {
    try {
        const produtosRef = collection(db, 'produtos');
        const q = query(produtosRef, where('ativo', '==', true), orderBy('ordem'));
        const snapshot = await getDocs(q);
        
        const container = document.getElementById('produtosContainer');
        container.innerHTML = '';
        
        // Se não houver produtos, mostrar mensagem
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <p class="mt-3 text-muted">Nenhum produto disponível no momento.</p>
                </div>
            `;
            return;
        }
        
        // Criar card para cada produto
        snapshot.forEach(doc => {
            const produto = { id: doc.id, ...doc.data() };
            const card = criarCardProduto(produto);
            container.innerHTML += card;
        });
        
        // Adicionar eventos aos botões de adicionar ao carrinho
        document.querySelectorAll('.btn-adicionar').forEach(btn => {
            btn.addEventListener('click', () => {
                const produtoId = btn.getAttribute('data-id');
                const produtoNome = btn.getAttribute('data-nome');
                const produtoPreco = parseFloat(btn.getAttribute('data-preco'));
                const produtoImg = btn.getAttribute('data-img');
                
                adicionarAoCarrinho({ id: produtoId, nome: produtoNome, preco: produtoPreco, img: produtoImg });
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Função para criar HTML do card de produto
function criarCardProduto(produto) {
    const precoFormatado = produto.preco.toFixed(2).replace('.', ',');
    const imgUrl = produto.imagem || 'https://via.placeholder.com/300x250?text=Sem+Imagem';
    
    return `
        <div class="col-md-6 col-lg-4 produto-item" data-categoria="${produto.categoria}">
            <div class="card shadow-sm h-100">
                ${produto.promocao ? '<span class="badge bg-danger badge-promocao">PROMOÇÃO</span>' : ''}
                <img src="${imgUrl}" class="card-img-top" alt="${produto.nome}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold">${produto.nome}</h5>
                    <p class="card-text text-muted small">${produto.descricao}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="h4 text-success mb-0">R$ ${precoFormatado}</span>
                        </div>
                        <button class="btn btn-warning w-100 btn-adicionar" 
                                data-id="${produto.id}"
                                data-nome="${produto.nome}"
                                data-preco="${produto.preco}"
                                data-img="${imgUrl}">
                            <i class="bi bi-cart-plus"></i> Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função para carregar promoções
async function carregarPromocoes() {
    try {
        const produtosRef = collection(db, 'produtos');
        const q = query(produtosRef, where('promocao', '==', true), where('ativo', '==', true));
        const snapshot = await getDocs(q);
        
        const container = document.getElementById('promocoesContainer');
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Nenhuma promoção no momento.</p></div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const produto = { id: doc.id, ...doc.data() };
            const card = criarCardProduto(produto);
            container.innerHTML += card;
        });
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.btn-adicionar').forEach(btn => {
            btn.addEventListener('click', () => {
                const produtoId = btn.getAttribute('data-id');
                const produtoNome = btn.getAttribute('data-nome');
                const produtoPreco = parseFloat(btn.getAttribute('data-preco'));
                const produtoImg = btn.getAttribute('data-img');
                
                adicionarAoCarrinho({ id: produtoId, nome: produtoNome, preco: produtoPreco, img: produtoImg });
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar promoções:', error);
    }
}

// Função para filtrar produtos por categoria
function filtrarProdutos(categoria) {
    const produtos = document.querySelectorAll('.produto-item');
    
    produtos.forEach(produto => {
        if (categoria === 'todos' || produto.getAttribute('data-categoria') === categoria) {
            produto.style.display = 'block';
        } else {
            produto.style.display = 'none';
        }
    });
}

// Função para adicionar produto ao carrinho
function adicionarAoCarrinho(produto) {
    // Verificar se produto já está no carrinho
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    
    atualizarCarrinho();
    
    // Mostrar feedback visual
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show bg-success text-white" role="alert">
            <div class="toast-body">
                <i class="bi bi-check-circle"></i> ${produto.nome} adicionado ao carrinho!
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Função para atualizar carrinho
function atualizarCarrinho() {
    const carrinhoItens = document.getElementById('carrinhoItens');
    const carrinhoCount = document.getElementById('carrinhoCount');
    const carrinhoTotal = document.getElementById('carrinhoTotal');
    
    // Atualizar contador
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    carrinhoCount.textContent = totalItens;
    
    // Calcular total
    const total = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    carrinhoTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    // Mostrar itens
    if (carrinho.length === 0) {
        carrinhoItens.innerHTML = '<p class="text-center text-muted">Seu carrinho está vazio.</p>';
        return;
    }
    
    carrinhoItens.innerHTML = carrinho.map(item => `
        <div class="carrinho-item">
            <div class="row align-items-center">
                <div class="col-3">
                    <img src="${item.img}" class="img-fluid rounded" alt="${item.nome}">
                </div>
                <div class="col-5">
                    <h6 class="mb-1">${item.nome}</h6>
                    <p class="mb-0 text-success">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="col-4 text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="alterarQuantidade('${item.id}', -1)">-</button>
                        <button class="btn btn-outline-secondary disabled">${item.quantidade}</button>
                        <button class="btn btn-outline-secondary" onclick="alterarQuantidade('${item.id}', 1)">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger mt-2" onclick="removerDoCarrinho('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Função para alterar quantidade
window.alterarQuantidade = function(produtoId, delta) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            removerDoCarrinho(produtoId);
        } else {
            atualizarCarrinho();
        }
    }
};

// Função para remover do carrinho
window.removerDoCarrinho = function(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
};

// Função para finalizar pedido (WhatsApp)
document.getElementById('finalizarPedido').addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Criar mensagem para WhatsApp
    let mensagem = '*Novo Pedido - Burger House*\n\n';
    carrinho.forEach(item => {
        mensagem += `${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
    });
    
    const total = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    mensagem += `\n*Total: R$ ${total.toFixed(2)}*`;
    
    // Número do WhatsApp (altere para o número da loja)
    const numeroWhatsApp = '5511987654321'; // ALTERE AQUI
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
});

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
    carregarProdutos();
    carregarPromocoes();
});