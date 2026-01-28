// Importar configurações do Firebase
import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '../../js/firebase-config.js';

// Variáveis globais
let categorias = [];
let produtos = [];
let currentUser = null;

// ========== AUTENTICAÇÃO ==========

// Verificar estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('adminPanel').classList.remove('d-none');
        document.getElementById('userEmail').textContent = user.email;
        inicializarAdmin();
    } else {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('adminPanel').classList.add('d-none');
    }
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        await signInWithEmailAndPassword(auth, email, senha);
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = 'Email ou senha incorretos!';
        errorDiv.classList.remove('d-none');
    }
});

// Logout
document.getElementById('btnLogout').addEventListener('click', async () => {
    await signOut(auth);
});

// ========== NAVEGAÇÃO ==========

// Alternar entre seções
document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos
        document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
        
        // Adicionar active no clicado
        link.classList.add('active');
        
        // Esconder todas as seções
        document.querySelectorAll('.secao-content').forEach(s => s.classList.add('d-none'));
        
        // Mostrar seção selecionada
        const section = link.getAttribute('data-section');
        document.getElementById(`secao${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.remove('d-none');
    });
});

// ========== CATEGORIAS ==========

// Carregar categorias
async function carregarCategorias() {
    try {
        const categoriasRef = collection(db, 'categorias');
        const snapshot = await getDocs(categoriasRef);
        
        categorias = [];
        const lista = document.getElementById('listaCategorias');
        const selectCategoria = document.getElementById('produtoCategoria');
        
        lista.innerHTML = '';
        selectCategoria.innerHTML = '<option value="">Selecione...</option>';
        
        snapshot.forEach(doc => {
            const categoria = { id: doc.id, ...doc.data() };
            categorias.push(categoria);
            
            // Card da categoria
            lista.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi ${categoria.icone || 'bi-tag'} display-4 text-warning"></i>
                            <h5 class="mt-3">${categoria.nome}</h5>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-warning me-2" onclick="editarCategoria('${categoria.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="excluirCategoria('${categoria.id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Option no select
            selectCategoria.innerHTML += `<option value="${categoria.nome}">${categoria.nome}</option>`;
        });
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Salvar categoria
document.getElementById('formCategoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('categoriaId').value;
    const nome = document.getElementById('categoriaNome').value;
    const icone = document.getElementById('categoriaIcone').value || 'bi-tag';
    
    try {
        if (id) {
            // Editar
            await updateDoc(doc(db, 'categorias', id), { nome, icone });
            mostrarAlerta('Categoria atualizada com sucesso!', 'success');
        } else {
            // Criar
            await addDoc(collection(db, 'categorias'), { nome, icone });
            mostrarAlerta('Categoria criada com sucesso!', 'success');
        }
        
        document.getElementById('formCategoria').reset();
        document.getElementById('categoriaId').value = '';
        bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
        carregarCategorias();
        
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        mostrarAlerta('Erro ao salvar categoria!', 'danger');
    }
});

// Editar categoria
window.editarCategoria = function(id) {
    const categoria = categorias.find(c => c.id === id);
    if (categoria) {
        document.getElementById('categoriaId').value = categoria.id;
        document.getElementById('categoriaNome').value = categoria.nome;
        document.getElementById('categoriaIcone').value = categoria.icone || '';
        document.getElementById('modalCategoriaTitulo').textContent = 'Editar Categoria';
        
        new bootstrap.Modal(document.getElementById('modalCategoria')).show();
    }
};

// Excluir categoria
window.excluirCategoria = async function(id) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
            await deleteDoc(doc(db, 'categorias', id));
            mostrarAlerta('Categoria excluída com sucesso!', 'success');
            carregarCategorias();
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            mostrarAlerta('Erro ao excluir categoria!', 'danger');
        }
    }
};

// Limpar form ao fechar modal
document.getElementById('modalCategoria').addEventListener('hidden.bs.modal', () => {
    document.getElementById('formCategoria').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('modalCategoriaTitulo').textContent = 'Nova Categoria';
});

// ========== PRODUTOS ==========

// Carregar produtos
async function carregarProdutos() {
    try {
        const produtosRef = collection(db, 'produtos');
        const q = query(produtosRef, orderBy('ordem'));
        const snapshot = await getDocs(q);
        
        produtos = [];
        const lista = document.getElementById('listaProdutos');
        lista.innerHTML = '';
        
        snapshot.forEach(doc => {
            const produto = { id: doc.id, ...doc.data() };
            produtos.push(produto);
            
            lista.innerHTML += `
                <tr>
                    <td><img src="${produto.imagem}" alt="${produto.nome}"></td>
                    <td><strong>${produto.nome}</strong></td>
                    <td>${produto.categoria}</td>
                    <td class="text-success fw-bold">R$ ${produto.preco.toFixed(2)}</td>
                    <td>
                        <span class="badge bg-${produto.ativo ? 'success' : 'danger'}">
                            ${produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-${produto.promocao ? 'warning' : 'secondary'}">
                            ${produto.promocao ? 'Sim' : 'Não'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1" onclick="editarProduto('${produto.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="excluirProduto('${produto.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Salvar produto
document.getElementById('formProduto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('produtoId').value;
    const produto = {
        nome: document.getElementById('produtoNome').value,
        descricao: document.getElementById('produtoDescricao').value,
        categoria: document.getElementById('produtoCategoria').value,
        preco: parseFloat(document.getElementById('produtoPreco').value),
        imagem: document.getElementById('produtoImagem').value,
        ativo: document.getElementById('produtoAtivo').checked,
        promocao: document.getElementById('produtoPromocao').checked,
        ordem: parseInt(document.getElementById('produtoOrdem').value) || 0
    };
    
    try {
        if (id) {
            // Editar
            await updateDoc(doc(db, 'produtos', id), produto);
            mostrarAlerta('Produto atualizado com sucesso!', 'success');
        } else {
            // Criar
            await addDoc(collection(db, 'produtos'), produto);
            mostrarAlerta('Produto criado com sucesso!', 'success');
        }
        
        document.getElementById('formProduto').reset();
        document.getElementById('produtoId').value = '';
        bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
        carregarProdutos();
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        mostrarAlerta('Erro ao salvar produto!', 'danger');
    }
});

// Editar produto
window.editarProduto = function(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('produtoNome').value = produto.nome;
        document.getElementById('produtoDescricao').value = produto.descricao;
        document.getElementById('produtoCategoria').value = produto.categoria;
        document.getElementById('produtoPreco').value = produto.preco;
        document.getElementById('produtoImagem').value = produto.imagem;
        document.getElementById('produtoAtivo').checked = produto.ativo;
        document.getElementById('produtoPromocao').checked = produto.promocao;
        document.getElementById('produtoOrdem').value = produto.ordem || 0;
        document.getElementById('modalProdutoTitulo').textContent = 'Editar Produto';
        
        new bootstrap.Modal(document.getElementById('modalProduto')).show();
    }
};

// Excluir produto
window.excluirProduto = async function(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            await deleteDoc(doc(db, 'produtos', id));
            mostrarAlerta('Produto excluído com sucesso!', 'success');
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            mostrarAlerta('Erro ao excluir produto!', 'danger');
        }
    }
};

// Limpar form ao fechar modal
document.getElementById('modalProduto').addEventListener('hidden.bs.modal', () => {
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoAtivo').checked = true;
    document.getElementById('produtoPromocao').checked = false;
    document.getElementById('modalProdutoTitulo').textContent = 'Novo Produto';
});

// ========== CONFIGURAÇÕES ==========

// Carregar configurações
async function carregarConfiguracoes() {
    try {
        const configDoc = await getDocs(collection(db, 'configuracoes'));
        
        if (!configDoc.empty) {
            const config = configDoc.docs[0].data();
            document.getElementById('configNomeLoja').value = config.nomeLoja || 'Burger House';
            document.getElementById('configTelefone').value = config.telefone || '';
            document.getElementById('configEndereco').value = config.endereco || '';
            document.getElementById('configTaxaEntrega').value = config.taxaEntrega || 5.00;
            document.getElementById('configAberto').checked = config.aberto !== false;
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Salvar configurações
document.getElementById('formConfiguracoes').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
        nomeLoja: document.getElementById('configNomeLoja').value,
        telefone: document.getElementById('configTelefone').value,
        endereco: document.getElementById('configEndereco').value,
        taxaEntrega: parseFloat(document.getElementById('configTaxaEntrega').value),
        aberto: document.getElementById('configAberto').checked
    };
    
    try {
        const configSnapshot = await getDocs(collection(db, 'configuracoes'));
        
        if (configSnapshot.empty) {
            await addDoc(collection(db, 'configuracoes'), config);
        } else {
            const configId = configSnapshot.docs[0].id;
            await updateDoc(doc(db, 'configuracoes', configId), config);
        }
        
        mostrarAlerta('Configurações salvas com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarAlerta('Erro ao salvar configurações!', 'danger');
    }
});

// ========== PEDIDOS ==========

// Carregar pedidos (placeholder - implementar depois se necessário)
async function carregarPedidos() {
    const lista = document.getElementById('listaPedidos');
    lista.innerHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> 
            Os pedidos são feitos via WhatsApp. Verifique suas mensagens!
        </div>
    `;
}

// ========== UTILIDADES ==========

// Mostrar alerta
function mostrarAlerta(mensagem, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}

// Inicializar admin
function inicializarAdmin() {
    carregarCategorias();
    carregarProdutos();
    carregarConfiguracoes();
    carregarPedidos();
}