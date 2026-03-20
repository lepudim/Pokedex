/**
 * POKÉDEX PRO - VERSÃO COMPLETA E FINAL
 * Inclui: Busca por Nome/Tipo, Evoluções, Variantes, Cores Duplas e Grid Dinâmico.
 */

const containerPrincipal = document.getElementById('pokedex-container');
const inputBusca = document.getElementById('pokemon-search');

// IDs das famílias iniciais que aparecerão ao carregar a página
const familiasIniciais = [1, 4, 7, 92, 133];

// Tabela de cores pastéis para os tipos
const coresTipos = {
    grass: '#defde0',
    fire: '#fdefde',
    water: '#def3fd',
    bug: '#f8d5a3',
    normal: '#f5f5f5',
    poison: '#f0deff',
    electric: '#fcf7de',
    ground: '#f4e7da',
    fairy: '#fceaff',
    fighting: '#e6e0d4',
    psychic: '#f8d5f3',
    rock: '#d5d5d4',
    ghost: '#d7d0ff',
    ice: '#e0f5ff',
    dragon: '#97b3e1',
    dark: '#a9a9a9',
    steel: '#e2e2e2',
    flying: '#e8f1f2'
};

/**
 * 1. BUSCA INTELIGENTE (Nome ou Tipo)
 */
inputBusca.addEventListener('input', (e) => {
    const termoBusca = e.target.value.toLowerCase().trim();
    const todosCarrosseis = document.querySelectorAll('.carrossel');

    todosCarrosseis.forEach(carrossel => {
        const slides = carrossel.querySelectorAll('.slide');
        let encontrou = false;

        slides.forEach(slide => {
            const nomePokemon = slide.querySelector('p').textContent.toLowerCase();
            const tipoPokemon = slide.querySelector('span').textContent.toLowerCase();

            // Verifica se o termo está no nome ou na tag de tipo
            if (nomePokemon.includes(termoBusca) || tipoPokemon.includes(termoBusca)) {
                encontrou = true;
            }
        });

        // Mostra ou esconde o carrossel inteiro
        if (encontrou || termoBusca === "") {
            carrossel.classList.remove('carrossel-escondido');
        } else {
            carrossel.classList.add('carrossel-escondido');
        }
    });
});

/**
 * 2. BUSCA DE DADOS (Evoluções e Variedades)
 */
async function buscarLinhagemCompleta(idEspecie) {
    try {
        const resEspecie = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${idEspecie}/`);
        const dadosEspecie = await resEspecie.json();
        
        const resEvolucao = await fetch(dadosEspecie.evolution_chain.url);
        const dadosEvol = await resEvolucao.json();

        let nomesParaBuscar = [];

        // Função Recursiva para pegar todos os galhos da evolução (Eevee inclusa!)
        function extrairNomes(eloDaCorrente) {
            nomesParaBuscar.push(eloDaCorrente.species.name);
            if (eloDaCorrente.evolves_to.length > 0) {
                eloDaCorrente.evolves_to.forEach(proximoElo => extrairNomes(proximoElo));
            }
        }
        extrairNomes(dadosEvol.chain);

        let listaFinalPokemon = [];
        for (const nome of nomesParaBuscar) {
            const resSpecieInfo = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${nome}`);
            const info = await resSpecieInfo.json();
            
            for (const varItem of info.varieties) {
                listaFinalPokemon.push({
                    nome: varItem.pokemon.name,
                    url: varItem.pokemon.url
                });
            }
        }

        criarEstruturaCarrossel(listaFinalPokemon);

    } catch (error) {
        console.error("Erro ao carregar linhagem:", error);
    }
}

/**
 * 3. CRIAÇÃO DO HTML E CORES DINÂMICAS
 */
function criarEstruturaCarrossel(listaPokemon) {
    const carrosselDiv = document.createElement('div');
    carrosselDiv.classList.add('carrossel');

    const btnPrev = document.createElement('button');
    btnPrev.classList.add('btn-prev');
    btnPrev.innerHTML = '&#10094;';

    const btnNext = document.createElement('button');
    btnNext.classList.add('btn-next');
    btnNext.innerHTML = '&#10095;';

    let slidesArray = [];

    const carregarSlides = async () => {
        for (const p of listaPokemon) {
            const res = await fetch(p.url);
            const dados = await res.json();

            const slide = document.createElement('div');
            slide.classList.add('slide');
            
            // Lógica de Cores (Tipo Único vs Duplo)
            const tipo1 = dados.types[0].type.name;
            const tipo2 = dados.types[1] ? dados.types[1].type.name : null;
            const cor1 = coresTipos[tipo1] || '#ffffff';
            const cor2 = tipo2 ? coresTipos[tipo2] : null;

            if (cor2) {
                slide.style.background = `linear-gradient(45deg, ${cor1} 50%, ${cor2} 50%)`;
            } else {
                slide.style.backgroundColor = cor1;
            }

            const imgUrl = dados.sprites.other['official-artwork'].front_default || dados.sprites.front_default;
            const nomesTipos = tipo2 ? `${tipo1} / ${tipo2}` : tipo1;
            
            slide.innerHTML = `
                <img src="${imgUrl}" alt="${p.nome}">
                <p>${p.nome.replace(/-/g, ' ').toUpperCase()}</p>
                <span>${nomesTipos.toUpperCase()}</span>
            `;
            
            carrosselDiv.appendChild(slide);
            slidesArray.push(slide);
        }
        
        const loader = document.querySelector('.loader');
        if(loader) loader.remove();

        atualizarLayout(slidesArray);
    };

    carregarSlides();

    // Eventos de Navegação (Sincronizados em 0.2s)
    btnNext.addEventListener('click', () => {
        if (slidesArray.length <= 1) return;
        const slideFrente = slidesArray[0];
        slideFrente.classList.add('saindo');

        setTimeout(() => {
            slideFrente.classList.remove('saindo');
            slidesArray.push(slidesArray.shift());
            atualizarLayout(slidesArray);
        }, 200); 
    });

    btnPrev.addEventListener('click', () => {
        if (slidesArray.length <= 1) return;
        slidesArray.unshift(slidesArray.pop());
        atualizarLayout(slidesArray);
    });

    carrosselDiv.appendChild(btnPrev);
    carrosselDiv.appendChild(btnNext);
    containerPrincipal.appendChild(carrosselDiv);
}

/**
 * 4. POSICIONAMENTO VISUAL (Cascata 3D)
 */
function atualizarLayout(slides) {
    slides.forEach((slide, index) => {
        const deslocamento = index * 45;
        const escala = 1 - (index * 0.1);
        const opacidade = index === 0 ? 1 : (1 - (index * 0.3));
        const zIndex = 100 - index;

        slide.style.transform = `translateX(${deslocamento}px) scale(${escala})`;
        slide.style.opacity = opacidade > 0 ? opacidade : 0;
        slide.style.zIndex = zIndex;

        slide.style.visibility = index > 3 ? 'hidden' : 'visible';
    });
}

// Inicializa a página
familiasIniciais.forEach(id => buscarLinhagemCompleta(id));