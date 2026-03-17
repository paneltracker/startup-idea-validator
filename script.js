// ═══════════════════════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════════════════════
const SUPABASE_URL = 'https://acilerrmbmfgxcgjxekh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaWxlcnJtYm1mZ3hjZ2p4ZWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTUxNDgsImV4cCI6MjA4OTI5MTE0OH0.Je5GF1NSPj4ci7M3NMYCZeRSZg-aT5z0m83UKxOe1Pg';

// Initialize the Supabase client
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let ideas = [];
let currentUser = null;
let currentAuthMode = 'login'; // 'login' or 'signup'

// ═══════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════
const ideaGrid        = document.getElementById('idea-grid');
const ideaForm        = document.getElementById('idea-form');
const modalOverlay    = document.getElementById('modal-overlay');
const addIdeaBtn      = document.getElementById('add-idea-btn');
const closeModal1     = document.getElementById('close-modal');
const closeModal2     = document.getElementById('close-modal-x');
const themeToggle     = document.getElementById('theme-toggle');
const descField       = document.getElementById('idea-description');
const descCount       = document.getElementById('desc-count');

// Auth DOM
const authSection     = document.getElementById('auth-section');
const userSection     = document.getElementById('user-section');
const userEmailSpan   = document.getElementById('user-email');
const loginBtn        = document.getElementById('login-btn');
const signupBtn       = document.getElementById('signup-btn');
const logoutBtn       = document.getElementById('logout-btn');
const authModal       = document.getElementById('auth-modal-overlay');
const closeAuthModal  = document.getElementById('close-auth-modal');
const authForm        = document.getElementById('auth-form');
const authSwitchLink  = document.getElementById('auth-switch-link');
const authTitle       = document.getElementById('auth-modal-title');
const authSubtitle    = document.getElementById('auth-modal-subtitle');
const authSubmitBtn   = document.getElementById('auth-submit-btn');

// ═══════════════════════════════════════════════
// AUTH LOGIC
// ═══════════════════════════════════════════════
async function checkUser() {
    const { data: { user } } = await db.auth.getUser();
    currentUser = user;
    updateAuthUI();
}

function updateAuthUI() {
    const landingView = document.getElementById('landing-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (currentUser) {
        landingView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        userEmailSpan.textContent = currentUser.email;
        fetchIdeas();
        // Force refresh icons
        lucide.createIcons();
    } else {
        landingView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
    }
}

// Landing Page Triggers
document.querySelectorAll('.login-trigger').forEach(btn => {
    btn.addEventListener('click', () => openAuthModal('login'));
});
document.querySelectorAll('.signup-trigger').forEach(btn => {
    btn.addEventListener('click', () => openAuthModal('signup'));
});

function openAuthModal(mode = 'login') {
    currentAuthMode = mode;
    authTitle.textContent = mode === 'login' ? 'Log In' : 'Sign Up';
    authSubtitle.textContent = mode === 'login' ? 'Welcome back! Please enter your details.' : 'Create an account to start validating ideas.';
    authSubmitBtn.textContent = mode === 'login' ? 'Log In' : 'Sign Up';
    document.getElementById('auth-switch-text').innerHTML = mode === 'login' 
        ? `Don't have an account? <a href="#" id="auth-switch-link">Sign Up</a>`
        : `Already have an account? <a href="#" id="auth-switch-link">Log In</a>`;
    
    // Re-attach listeners to the new dynamic link
    document.getElementById('auth-switch-link').addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(currentAuthMode === 'login' ? 'signup' : 'login');
    });

    authModal.classList.remove('hidden');
}

loginBtn.addEventListener('click', () => openAuthModal('login'));
signupBtn.addEventListener('click', () => openAuthModal('signup'));
closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));
logoutBtn.addEventListener('click', async () => {
    await db.auth.signOut();
    currentUser = null;
    updateAuthUI();
    showToast('Logged out successfully', 'info');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    let result;
    if (currentAuthMode === 'signup') {
        result = await db.auth.signUp({ email, password });
    } else {
        result = await db.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
        showToast(result.error.message, 'warning');
    } else {
        currentUser = result.data.user;
        authModal.classList.add('hidden');
        updateAuthUI();
        showToast(currentAuthMode === 'login' ? 'Welcome back!' : 'Account created!', 'success');
        fetchIdeas();
    }
});

// ═══════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

// ═══════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'check-circle', info: 'info', warning: 'alert-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" style="width:18px;height:18px;flex-shrink:0;"></i><span>${message}</span>`;
    container.appendChild(toast);
    refreshIcons();
    setTimeout(() => {
        toast.style.transition = '300ms ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════
function applyTheme() {
    const isDark = localStorage.getItem('dark-mode') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    const icon = themeToggle.querySelector('i');
    if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    refreshIcons();
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', !isDark);
    applyTheme();
});

applyTheme();

// ═══════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════
function openModal()  { modalOverlay.classList.remove('hidden'); }
function closeModalFn() { modalOverlay.classList.add('hidden'); ideaForm.reset(); descCount.textContent = '0'; }

addIdeaBtn.addEventListener('click', openModal);
closeModal1.addEventListener('click', closeModalFn);
closeModal2.addEventListener('click', closeModalFn);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModalFn(); });

// Character count
descField.addEventListener('input', () => { descCount.textContent = descField.value.length; });

// ═══════════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════════
const DIFF_LABELS = ['Easy', 'Moderate', 'Hard', 'Very Hard', 'Expert'];
const DIFF_COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c2d12'];

function createCard(idea) {
    const card = document.createElement('div');
    card.className = 'idea-card fade-in';
    const diffIdx = idea.difficulty - 1;
    card.innerHTML = `
        <div class="card-header">
            <span class="category-tag">${idea.category}</span>
            <div class="header-right">
                <span class="difficulty-badge" style="color:${DIFF_COLORS[diffIdx]}">
                    <i data-lucide="signal" style="width:14px;height:14px;"></i>
                    ${DIFF_LABELS[diffIdx]}
                </span>
                <button class="delete-btn" onclick="deleteIdea('${idea.id}')" title="Delete Idea">
                    <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                </button>
            </div>
        </div>
        <h3 class="card-title">${idea.title}</h3>
        <p class="card-desc">${idea.description}</p>
        <div class="card-footer">
            <span class="potential-tag ${idea.potential.toLowerCase().replace(' ', '-')}">${idea.potential} Potential</span>
            <button class="upvote-btn" onclick="upvoteIdea('${idea.id}', ${idea.votes || 0})">
                <i data-lucide="chevron-up" style="width:16px;height:16px;"></i>
                ${idea.votes || 0}
            </button>
        </div>
    `;
    return card;
}

// ═══════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════
async function fetchIdeas() {
    const { data, error } = await db
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        showToast('Error fetching ideas: ' + error.message, 'warning');
        return;
    }
    ideas = data || [];
    render();
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════
function render(list = ideas) {
    ideaGrid.innerHTML = '';
    if (list.length === 0) {
        ideaGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i data-lucide="lightbulb" style="width:28px;height:28px;"></i></div>
                <h3>No ideas yet</h3>
                <p>Submit your first startup idea and start validating concepts.</p>
                <button class="btn-primary" onclick="openModal()">
                    <i data-lucide="plus" style="width:16px;height:16px;"></i> New Idea
                </button>
            </div>`;
    } else {
        list.forEach(idea => ideaGrid.appendChild(createCard(idea)));
    }
    refreshIcons();
    updateStats();
}

// ═══════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════
function updateStats() {
    const panel = document.getElementById('stats-panel');
    if (!ideas.length) {
        panel.innerHTML = `<div class="stat-card"><span class="stat-label">Total Ideas</span><span class="stat-value">0</span></div>`;
        return;
    }
    const total = ideas.length;
    const avg   = (ideas.reduce((s, i) => s + i.difficulty, 0) / total).toFixed(1);
    const cats  = ideas.map(i => i.category);
    const mode  = [...new Set(cats)].sort((a, b) => cats.filter(c => c===b).length - cats.filter(c => c===a).length)[0];

    panel.innerHTML = `
        <div class="stat-card"><span class="stat-label">Total Ideas</span><span class="stat-value">${total}</span></div>
        <div class="stat-card"><span class="stat-label">Top Category</span><span class="stat-value">${mode}</span></div>
        <div class="stat-card"><span class="stat-label">Avg Difficulty</span><span class="stat-value">${avg}/5</span></div>
    `;
}

// ═══════════════════════════════════════════════
// SUBMIT
// ═══════════════════════════════════════════════
ideaForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('idea-title').value.trim();
    if (!title) return showToast('Title cannot be empty.', 'warning');
    
    if (!currentUser) return showToast('Please log in to submit an idea.', 'warning');

    const newIdea = {
        title,
        category:    document.getElementById('idea-category').value,
        problem:     document.getElementById('idea-problem').value,
        description: document.getElementById('idea-description').value,
        difficulty:  parseInt(document.getElementById('idea-difficulty').value),
        potential:   document.getElementById('idea-potential').value,
        votes: 0,
        user_id: currentUser.id
    };

    const { error } = await db.from('ideas').insert([newIdea]);

    if (error) {
        if (error.code === '23505') {
            showToast('An idea with this title already exists.', 'warning');
        } else {
            showToast('Error submitting idea: ' + error.message, 'warning');
        }
        return;
    }

    showToast('Idea submitted successfully!', 'success');
    closeModalFn();
    fetchIdeas();
});

// ═══════════════════════════════════════════════
// UPVOTE
// ═══════════════════════════════════════════════
async function upvoteIdea(id, currentVotes) {
    const { error } = await db
        .from('ideas')
        .update({ votes: currentVotes + 1 })
        .eq('id', id);

    if (error) {
        showToast('Error updating vote: ' + error.message, 'warning');
    } else {
        showToast('Vote registered!', 'info');
        fetchIdeas();
    }
}

// ═══════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════
async function deleteIdea(id) {
    if (confirm('Are you sure you want to delete this idea?')) {
        const { error } = await supabase
            .from('ideas')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Error deleting idea: ' + error.message, 'warning');
        } else {
            showToast('Idea deleted successfully.', 'success');
            fetchIdeas();
        }
    }
}

// ═══════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════
function applyFilters() {
    const q    = document.getElementById('search-input').value.toLowerCase();
    const cat  = document.getElementById('category-filter').value;
    const diff = document.getElementById('difficulty-filter').value;
    const pot  = document.getElementById('potential-filter').value;

    render(ideas.filter(i =>
        (i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) &&
        (cat  === 'all' || i.category === cat) &&
        (diff === 'all' || i.difficulty.toString() === diff) &&
        (pot  === 'all' || i.potential === pot)
    ));
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('category-filter').addEventListener('change', applyFilters);
document.getElementById('difficulty-filter').addEventListener('change', applyFilters);
document.getElementById('potential-filter').addEventListener('change', applyFilters);

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
checkUser();
