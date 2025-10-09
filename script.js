// =========================
// ⚙️ CONFIGURATION
// =========================

const TOTAL_POKEMON = 1280;
const PAGE_SIZE = 12;

// =========================
// 🔗 CONNECT HTML ELEMENTS
// =========================

const gridEl = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');
const paginationEl = document.getElementById('pagination');

const modalEl = document.getElementById('pokemonModal');
const closeModalBtn = document.getElementById('closeModal');
const modalSpriteEl = document.getElementById('modalSprite');
const modalNameEl = document.getElementById('modalName');
const modalTypesEl = document.getElementById('modalTypes');
const modalStatsEl = document.getElementById('modalStats');

const prevModalBtn = document.getElementById('prevPokemon');
const nextModalBtn = document.getElementById('nextPokemon');

let currentPage = 1;
let allPokemons = [];
let currentPokemonIndex = 0;

// 🌙 Day / Night Mode
const themeToggle = document.getElementById('themeToggle');

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'night') {
  document.body.classList.add('night');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('night');
  const isNight = document.body.classList.contains('night');
  themeToggle.textContent = isNight ? '☀️' : '🌙';
  localStorage.setItem('theme', isNight ? 'night' : 'day');
});

//  Random Pokémon
const randomBtn = document.getElementById('randomBtn');
randomBtn.addEventListener('click', async () => {
  const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
  const info = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
  openModal(info);
});

// =========================
// 🎨 COLORS BY TYPE
// =========================
const typeColors = {
  normal:'#A8A77A', fire:'#EE8130', water:'#6390F0', electric:'#F7D02C', grass:'#7AC74C',
  ice:'#96D9D6', fighting:'#C22E28', poison:'#A33EA1', ground:'#E2BF65', flying:'#A98FF3',
  psychic:'#F95587', bug:'#A6B91A', rock:'#B6A136', ghost:'#735797', dragon:'#6F35FC',
  dark:'#705746', steel:'#B7B7CE', fairy:'#D685AD'
};

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// =========================
//  Pick Pokémon Image (SAFE)
// =========================
const pickAnimated = info => {
  // ANIMATED SPRITE FIRST
  const animated = info?.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;

  // ELSE - STEADY
  const artwork = info?.sprites?.other?.['official-artwork']?.front_default;
  const front = info?.sprites?.front_default;

  return animated || artwork || front || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"; // DEFAULT - PIKACHU
};

// =========================
//  CREATE CARD
// =========================
function renderCard(info) {
  const type1 = info.types[0].type.name;
  const bgColor = typeColors[type1] || '#ddd';

  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.style.background = `${bgColor}88`;

  const name = document.createElement('h3');
  name.className = 'poke-name';
  name.textContent = cap(info.name);

  const wrap = document.createElement('div');
  wrap.className = 'poke-wrap';

  const ring = document.createElement('div');
  ring.className = 'poke-ring';

  const img = document.createElement('img');
  img.src = pickAnimated(info);
  img.alt = info.name;

  wrap.append(ring, img);
  card.append(name, wrap);

  //  Favorites
  const favBtn = document.createElement('button');
  favBtn.className = 'favorite-btn';
  favBtn.textContent = '♡';

  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.includes(info.id)) {
    favBtn.classList.add('active');
    favBtn.textContent = '❤';
  }

  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.includes(info.id)) {
      favorites = favorites.filter(f => f !== info.id);
      favBtn.classList.remove('active');
      favBtn.textContent = '♡';
    } else {
      favorites.push(info.id);
      favBtn.classList.add('active');
      favBtn.textContent = '❤';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  });

  card.append(favBtn);

  card.addEventListener('click', () => openModal(info));

  return card;
}

// =========================
//  PAGINATION
// =========================
function renderPagination(totalPages) {
  paginationEl.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-arrow';
  prevBtn.textContent = '◀';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => loadPage(currentPage - 1));
  paginationEl.appendChild(prevBtn);

  const createPageBtn = (num) => {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = num;
    if (num === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => loadPage(num));
    paginationEl.appendChild(btn);
  };

  createPageBtn(1);
  if (currentPage > 5) paginationEl.append('...');

  let start = Math.max(2, currentPage - 3);
  let end = Math.min(totalPages - 1, currentPage + 3);

  if (currentPage <= 4) end = Math.min(8, totalPages - 1);
  if (currentPage >= totalPages - 3) start = Math.max(totalPages - 7, 2);

  for (let i = start; i <= end; i++) createPageBtn(i);

  if (currentPage < totalPages - 4) paginationEl.append('...');
  if (totalPages > 1) createPageBtn(totalPages);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-arrow';
  nextBtn.textContent = '▶';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => loadPage(currentPage + 1));
  paginationEl.appendChild(nextBtn);
}

// =========================
//  LOAD POKÉMON BY PAGE
// =========================
async function loadPage(page=1) {
  currentPage = page;
  const offset = (page - 1) * PAGE_SIZE;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${PAGE_SIZE}`);
  const data = await res.json();

  gridEl.innerHTML = '';
  allPokemons = [];

  for (const poke of data.results) {
    const info = await (await fetch(poke.url)).json();
    allPokemons.push(info);
    gridEl.appendChild(renderCard(info));
  }

  const totalPages = Math.ceil(TOTAL_POKEMON / PAGE_SIZE);
  renderPagination(totalPages);
}

// =========================
//  EVOLUTION CHAIN (SAFE)
// =========================
async function loadEvolutionChain(info) {
  const evoContainer = document.getElementById('evolutionChain');
  evoContainer.innerHTML = `<p style="color:#444;">Loading...</p>`;

  try {
    const speciesRes = await fetch(info.species.url);
    const speciesData = await speciesRes.json();

    if (!speciesData.evolution_chain?.url) {
      evoContainer.innerHTML = `<p style="color:#888;">No evolution data available</p>`;
      return;
    }

    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    evoContainer.innerHTML = '';
    const chain = [];
    let evo = evoData.chain;

    while (evo) {
      chain.push(evo.species.name);
      evo = evo.evolves_to?.[0];
    }

    if (chain.length === 0) {
      evoContainer.innerHTML = `<p style="color:#888;">No evolution data available</p>`;
      return;
    }

    for (let i = 0; i < chain.length; i++) {
      const name = chain[i];
      const evoInfo = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)).json();

      const evoDiv = document.createElement('div');
      evoDiv.className = 'evo-item';
      evoDiv.innerHTML = `
        <img src="${pickAnimated(evoInfo)}" alt="${name}" title="${cap(name)}">
        <span>${cap(name)}</span>
      `;
      evoDiv.addEventListener('click', () => openModal(evoInfo));
      evoContainer.appendChild(evoDiv);

      if (i < chain.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'evo-arrow';
        arrow.textContent = '➡︎';
        evoContainer.appendChild(arrow);
      }
    }
  } catch (err) {
    console.error('Error loading evolution chain:', err);
    evoContainer.innerHTML = `<p style="color:#888;">No evolution data available</p>`;
  }
}


// =========================
//  OPEN MODAL
// =========================
async function openModal(info) {
  playCry(info.id);
  modalEl.classList.remove('hidden', 'hide');
  modalEl.classList.add('show');
  modalNameEl.textContent = `${cap(info.name)} #${info.id}`;
  modalSpriteEl.src = pickAnimated(info);

  currentPokemonIndex = allPokemons.findIndex(p => p.id === info.id);

  const type1 = info.types[0].type.name;
  const bgColor = typeColors[type1] || '#d6ecff';
  document.querySelector('.modal-content').style.background =
    `linear-gradient(to bottom, ${bgColor} 40%, #ffffff)`;

  // Types
  modalTypesEl.innerHTML = '';
  info.types.forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = typeColors[t.type.name];
    chip.textContent = t.type.name;
    modalTypesEl.appendChild(chip);
  });

  //  Pokédex Entry
const pokeEntryEl = document.getElementById('pokedexEntry');
pokeEntryEl.innerHTML = '';

  try {
    const res = await fetch(info.species.url);
    const data = await res.json();

    const entry = data.flavor_text_entries.find(e => e.language.name === 'en');
    const genus = data.genera.find(g => g.language.name === 'en');

  // CATEGORY
    if (genus) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'pokentry-category';
      categoryDiv.textContent = genus.genus;
      pokeEntryEl.appendChild(categoryDiv);
    }

    // DESCRIPTION
    const entryDiv = document.createElement('div');
    entryDiv.className = 'pokentry';
    entryDiv.textContent = entry
      ? entry.flavor_text.replace(/\f/g, ' ')
      : 'No Pokédex entry found.';
    pokeEntryEl.appendChild(entryDiv);

  } catch (err) {
    console.error('Error loading Pokédex entry:', err);
    pokeEntryEl.textContent = 'Error loading Pokédex entry 😢';
  }


  // STATS
  modalStatsEl.innerHTML = '';
  info.stats.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <div class="stat-name">${s.stat.name}</div>
      <div class="stat-bar">
        <span style="width:${Math.min(s.base_stat,180)/180*100}%;
        background:${statColor(s.base_stat)};"></span>
      </div>
      <div>${s.base_stat}</div>`;
    modalStatsEl.appendChild(row);
  });

  // EVO CHAIN
  await loadEvolutionChain(info);
}


// =========================
//  CLOSE MODAL & ARROWS
// =========================
closeModalBtn.addEventListener('click', () => {
  modalEl.classList.add('hidden');
});

document.addEventListener('click', (e) => {
  if (e.target === modalEl) {
    modalEl.classList.add('hidden');
  }
});


prevModalBtn.addEventListener('click', () => {
  if (currentPokemonIndex > 0) {
    openModal(allPokemons[currentPokemonIndex - 1]);
  }
});

nextModalBtn.addEventListener('click', () => {
  if (currentPokemonIndex < allPokemons.length - 1) {
    openModal(allPokemons[currentPokemonIndex + 1]);
  }
});

window.addEventListener('keydown', (e) => {
  if (modalEl.classList.contains('hidden')) return;
  if (e.key === 'Escape') modalEl.classList.add('hidden');
  if (e.key === 'ArrowLeft' && currentPokemonIndex > 0)
    openModal(allPokemons[currentPokemonIndex - 1]);
  if (e.key === 'ArrowRight' && currentPokemonIndex < allPokemons.length - 1)
    openModal(allPokemons[currentPokemonIndex + 1]);
});

function statColor(v) {
  if (v < 41) return 'red';
  if (v < 61) return 'orange';
  if (v < 80) return 'yellow';
  if (v < 116) return 'limegreen';
  return 'dodgerblue';
}

function playCry(id) {
  const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`);
  audio.play().catch(() => {});
}

// =========================
//  SEARCH
// =========================
searchBtn.addEventListener('click', () => doSearch(searchInput.value));
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    doSearch(searchInput.value);
  }
});
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  loadPage(1);
});

async function doSearch(q) {
  const query = q.trim().toLowerCase();
  if (!query) return loadPage(1);

  gridEl.innerHTML = `<p style="color:#fff; font-weight:800;">Searching...</p>`;
  paginationEl.innerHTML = '';

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMON}`);
    const data = await res.json();
    const matched = data.results.filter(poke => poke.name.includes(query));

    if (!matched.length) {
      gridEl.innerHTML = `<p style="color:#fff; font-weight:800;">No Pokémon found 😢</p>`;
      return;
    }

    gridEl.innerHTML = '';
    allPokemons = [];

    for (const poke of matched) {
      const info = await (await fetch(poke.url)).json();
      allPokemons.push(info);
      gridEl.appendChild(renderCard(info));
    }
  } catch {
    gridEl.innerHTML = `<p style="color:#fff; font-weight:800;">Error loading Pokémon 😢</p>`;
  }
}

// =========================
//  HAMBURGER MENU
// =========================
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const menuFavorites = document.getElementById('menuFavorites');
const menuQuiz = document.getElementById('menuQuiz');

menuToggle.addEventListener('click', () => {
  if (sideMenu.classList.contains('open')) {
    // CLOSE IF OPEN
    sideMenu.classList.remove('open');
  } else {
    // OPEN IF CLOSE
    sideMenu.classList.add('open');
    sideMenu.classList.remove('hidden');
  }
});

closeMenu.addEventListener('click', () => {
  sideMenu.classList.remove('open');
});
document.addEventListener('click', (e) => {
  if (sideMenu.classList.contains('open') && !sideMenu.contains(e.target) && e.target !== menuToggle) {
    sideMenu.classList.remove('open');
  }
});

menuFavorites.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  loadFavorites();
});
menuQuiz.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  startQuizGame();
});

// =========================
//  LOAD FAVORITES
// =========================
function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.length === 0) {
    alert("You have no favorite Pokémon yet!");
    return;
  }

  gridEl.innerHTML = '';
  paginationEl.innerHTML = '';
  allPokemons = [];

  favorites.forEach(async (id) => {
    const info = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
    allPokemons.push(info);
    gridEl.appendChild(renderCard(info));
  });
}

// =========================
//  QUIZ GAME - Who's That Pokémon? 
// =========================
function startQuizGame() {
  // (GEN 1–4)
  const MIN_ID = 1;
  const MAX_ID = 493;

  document.getElementById("listView").classList.add("hidden");
  document.getElementById("quizView").classList.remove("hidden");
  document.querySelector('.search-bar').style.display = 'none';

  
  const quizImage = document.getElementById("quizImage");
  const quizOptions = document.getElementById("quizOptions");
  const quizResult = document.getElementById("quizResult");
  const quizScoreEl = document.getElementById("quizScore");
  const quizHighScoreEl = document.getElementById("quizHighScore");
  const nextQuizBtn = document.getElementById("nextQuiz");
  const backBtn = document.getElementById("backToMain");

  let score = 0;
  let highScore = parseInt(localStorage.getItem("quizHighScore") || "0");
  let loading = false; // DOUBLE CLICK

  quizHighScoreEl.textContent = `🏆 Highest Score: ${highScore}`;
  quizScoreEl.textContent = `Score: ${score}`;

  // NEW QUESTION RENDER
  async function newQuiz() {
    if (loading) return; // DOUBLE LOADING
    loading = true;

    quizResult.textContent = "Loading...";
    quizResult.className = "quiz-result";
    quizImage.style.filter = "brightness(0)";
    quizOptions.innerHTML = "";

    try {
      // RNDM POKEMON
      const id = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
      const info = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
      const correct = info.name;

      // REVEAL
      quizImage.src = pickAnimated(info);
      quizImage.alt = correct;
      quizImage.classList.remove("reveal");

      // ANSWERS
      const options = new Set([correct]);
      while (options.size < 4) {
        const rand = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
        const poke = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${rand}`)).json();
        options.add(poke.name);
      }

      const optionList = Array.from(options).sort(() => Math.random() - 0.5);
      quizOptions.innerHTML = "";

      // BUTTONS
      optionList.forEach(name => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = name;

        btn.addEventListener("click", () => {
          playCry(info.id); 
          if (quizImage.classList.contains("reveal")) return; // DOUBLE CLICK
          quizImage.classList.add("reveal");
          quizImage.style.filter = "brightness(1)";

          if (name === correct) {
            quizResult.textContent = "✅ Correct!";
            quizResult.className = "quiz-result correct";
            score++;
            if (score > highScore) {
              highScore = score;
              localStorage.setItem("quizHighScore", highScore);
            }
          } else {
            quizResult.textContent = `❌ Wrong! It was ${correct.charAt(0).toUpperCase() + correct.slice(1)}`;
            quizResult.className = "quiz-result wrong";
            score = 0;
          }

          quizScoreEl.textContent = `Score: ${score}`;
          quizHighScoreEl.textContent = `🏆 Highest Score: ${highScore}`;
        });

        quizOptions.appendChild(btn);
      });

      quizResult.textContent = "";
    } catch (err) {
      console.error("Quiz loading error:", err);
      quizResult.textContent = "Error loading Pokémon 😢";
    }

    loading = false;
  }

  // NEXT BTN
  nextQuizBtn.onclick = newQuiz;

  // HOME BTN
  backBtn.onclick = () => {
    document.getElementById("quizView").classList.add("hidden");
    document.getElementById("listView").classList.remove("hidden");

    // REVEAL SEARCHBAR
    document.querySelector('.search-bar').style.display = 'flex';
    document.querySelector('.pokedex-title').style.display = 'inline-block';
  };


  // FIRST GAME
  newQuiz();
}

// =========================
//  MEWTWO
// =========================
const menuBuilder = document.getElementById("menuBuilder");
menuBuilder.addEventListener("click", () => {
  sideMenu.classList.remove("open");
  startBuilderGame();
});

function startBuilderGame() {
  const MIN_ID = 1;
  const MAX_ID = 493; // Gen 1–4
  const totalNeeded = 6;
  playCry(150);
  
  const mewtwoGif = document.getElementById("mewtwoGif");
  const mewtwoContainer = document.querySelector(".mewtwo-anim");
  const builderView = document.getElementById("builderView");
  const listView = document.getElementById("listView");
  const quizView = document.getElementById("quizView");
  const builderPokemon = document.getElementById("builderPokemon");
  const builderOptions = document.getElementById("builderOptions");
  const builderStatus = document.getElementById("builderStatus");
  const builderProgress = document.getElementById("builderProgress");
  const builderResult = document.getElementById("builderResult");
  const builderRestart = document.getElementById("builderRestart");
  const backBtn = document.getElementById("backToMainFromBuilder");

  mewtwoContainer.style.display = "flex";
  mewtwoGif.style.display = "block";
  mewtwoGif.src =
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/150.gif";

  // ANIMATE
  mewtwoGif.classList.remove("win", "lose");
  mewtwoGif.classList.add("idle");

  // SEARCH BAR HIDE
  document.querySelector(".search-bar").style.display = "none";

  // RESET STATS
  let round = 0;
  let chosenStats = [];
  let isChoosing = false;

  // HIDE EVERYTHING
  listView.classList.add("hidden");
  quizView.classList.add("hidden");
  builderView.classList.remove("hidden");

  // OPENING
  builderResult.classList.add("hidden");
  builderProgress.textContent = "Round: 1 / 6";
  builderStatus.textContent = "Choose one stat to keep!";

  // --------------------------
  // MAIN FUNCTION
  // --------------------------
  async function nextPokemon() {
    if (round >= totalNeeded) return showResult();

    builderStatus.textContent = "Choose one stat to keep!";
    builderResult.classList.add("hidden");

    // פוקימון רנדומלי
    const id = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
    const info = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();

    // CLEAN ANIMATE APPEAR
    builderPokemon.style.opacity = 0;
    builderPokemon.classList.remove("appear", "chosen");
    void builderPokemon.offsetWidth; 

    setTimeout(() => {
      builderPokemon.src = pickAnimated(info);
    }, 150);

    builderPokemon.onload = () => {
      builderPokemon.style.opacity = 1;
      builderPokemon.classList.add("appear");
    };

    // BTTNS
    builderOptions.innerHTML = "";
    const stats = info.stats.map(s => ({
      name: s.stat.name,
      value: s.base_stat,
    }));

    stats.forEach(s => {
      const btn = document.createElement("button");
      btn.textContent = s.name;

      btn.onclick = () => {
        if (isChoosing) return;
        isChoosing = true;

        // FLASH CHOICE
        builderPokemon.classList.remove("chosen");
        void builderPokemon.offsetWidth; // RESET
        builderPokemon.classList.add("chosen");

        chosenStats.push(s.value);
        round++;

        builderProgress.textContent = `Round: ${round} / ${totalNeeded}`;
        builderStatus.textContent = `${s.name.toUpperCase()} chosen (${s.value})`;

        setTimeout(() => {
          isChoosing = false;
          nextPokemon();
        }, 700);
      };

      builderOptions.appendChild(btn);
    });
  }

  // --------------------------
  // REVEAL SCORE
  // --------------------------
  function showResult() {
    const total = chosenStats.reduce((a, b) => a + b, 0);
    builderOptions.innerHTML = "";
    builderStatus.textContent = "Your Pokémon is complete!";
    builderResult.classList.remove("hidden");
    builderResult.textContent = `Your Total: ${total} | Mewtwo: 680 ${
      total > 680 ? "✅ You Won!" : "❌ You Lost!"
    }`;
    playCry(150);
    // ANIMATE MEWTWO
    mewtwoGif.classList.remove("win", "lose", "idle");
    void mewtwoGif.offsetWidth; // ANIMATE RESET

    if (total > 680) {
      // WIN
      mewtwoGif.classList.add("lose");
    } else {
      // LOSE
      mewtwoGif.classList.add("win");
    }
  }

  // --------------------------
  // CONTROL BTTNS
  // --------------------------
  builderRestart.onclick = () => {
    startBuilderGame();
  };

  backBtn.onclick = () => {
    builderView.classList.add("hidden");
    listView.classList.remove("hidden");
    document.querySelector(".search-bar").style.display = "flex";
  };

  // NEW ROUND
  nextPokemon();
}





// =========================
// 🚀 INIT
// =========================
loadPage(1);
