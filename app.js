/**
 * app.js – Core Application Logic
 * Supabase client, authentication, navigation, and global state.
 */

// ============================================================
// Supabase Configuration
// ============================================================
const SUPABASE_URL = 'https://tdfkebgapncswtvbtaqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentUserRole = null;
let currentPage = 'home';

// ============================================================
// Page References (jQuery selectors)
// ============================================================
const pages = {
    home: $('#page-home'),
    roster: $('#page-roster'),
    schedule: $('#page-schedule'),
    bracket: $('#page-bracket'),
    news: $('#page-news'),
    sponsors: $('#page-sponsors'),
    merch: $('#page-merch'),
    community: $('#page-community'),
    about: $('#page-about'),
    tryouts: $('#page-tryouts'),
    dashboard: $('#page-dashboard'),
    'admin-roster': $('#page-admin-roster'),
    'admin-matches': $('#page-admin-matches'),
    'admin-scrims': $('#page-admin-scrims'),
    'admin-financial': $('#page-admin-financial'),
    'admin-documents': $('#page-admin-documents'),
    'admin-media': $('#page-admin-media'),
    'admin-applications': $('#page-admin-applications'),
};

// ============================================================
// Authentication Functions
// ============================================================
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', currentUser.id)
            .single();
        if (profile) {
            currentUserRole = profile.role || 'player';
            $('#userName').text(profile.full_name || currentUser.email.split('@')[0]);
            $('#userAvatar').text((profile.full_name || currentUser.email)[0].toUpperCase());
        } else {
            currentUserRole = 'player';
            $('#userName').text(currentUser.email.split('@')[0]);
            $('#userAvatar').text(currentUser.email[0].toUpperCase());
        }
        showLoggedInUI();
    } else {
        showLoggedOutUI();
    }
    updateAdminNav();
}

function showLoggedInUI() {
    $('#authNavItem').hide();
    $('#userNavItem').show();
    $('#adminNavItem').show();
}

function showLoggedOutUI() {
    $('#authNavItem').show();
    $('#userNavItem').hide();
    $('#adminNavItem').hide();
    const adminPages = ['dashboard', 'admin-roster', 'admin-matches', 'admin-scrims',
        'admin-financial', 'admin-documents', 'admin-media', 'admin-applications'
    ];
    if (adminPages.includes(currentPage)) {
        navigateTo('home');
    }
}

function updateAdminNav() {
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'manager';
    $('#adminNavItem').toggle(isAdmin && currentUser !== null);
    const adminPages = ['dashboard', 'admin-roster', 'admin-matches', 'admin-scrims',
        'admin-financial', 'admin-documents', 'admin-media', 'admin-applications'
    ];
    if (adminPages.includes(currentPage) && !isAdmin) {
        navigateTo('home');
    }
}

// ============================================================
// Auth Modal
// ============================================================
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
let isLoginMode = true;

window.openAuthModal = function() {
    isLoginMode = true;
    $('#authModalTitle').html('<i class="fas fa-sign-in-alt me-2"></i>Login');
    $('#authSubmitBtn').text('Login');
    $('#authToggleText').text("Don't have an account?");
    $('#authToggleLink').text('Register');
    $('#registerFields').hide();
    $('#loginFields').show();
    $('#authError').addClass('d-none');
    authModal.show();
};

$('#authToggleLink').on('click', function(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        $('#authModalTitle').html('<i class="fas fa-sign-in-alt me-2"></i>Login');
        $('#authSubmitBtn').text('Login');
        $('#authToggleText').text("Don't have an account?");
        $('#authToggleLink').text('Register');
        $('#registerFields').hide();
        $('#loginFields').show();
    } else {
        $('#authModalTitle').html('<i class="fas fa-user-plus me-2"></i>Register');
        $('#authSubmitBtn').text('Register');
        $('#authToggleText').text("Already have an account?");
        $('#authToggleLink').text('Login');
        $('#registerFields').show();
        $('#loginFields').show();
    }
    $('#authError').addClass('d-none');
});

$('#authForm').on('submit', async function(e) {
    e.preventDefault();
    const email = $('#authEmail').val().trim();
    const password = $('#authPassword').val().trim();
    const fullName = $('#authFullName').val().trim();
    const role = $('#authRole').val();

    $('#authError').addClass('d-none');

    try {
        if (isLoginMode) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            authModal.hide();
            await checkAuth();
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName, role: role } }
            });
            if (error) throw error;
            if (data.user) {
                await supabase.from('profiles').insert([{
                    id: data.user.id,
                    full_name: fullName,
                    role: role,
                    email: email
                }]);
            }
            authModal.hide();
            alert('Registration successful! Please check your email to confirm.');
            await checkAuth();
        }
    } catch (err) {
        $('#authError').text(err.message).removeClass('d-none');
    }
});

window.logoutUser = async function() {
    await supabase.auth.signOut();
    currentUser = null;
    currentUserRole = null;
    showLoggedOutUI();
    updateAdminNav();
    navigateTo('home');
};

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentUserRole = null;
        showLoggedOutUI();
        updateAdminNav();
    }
});

// ============================================================
// Navigation (no hash)
// ============================================================
function navigateTo(pageId) {
    // Hide all pages
    Object.keys(pages).forEach(key => pages[key].removeClass('active'));
    // Show target
    if (pages[pageId]) {
        pages[pageId].addClass('active');
        currentPage = pageId;
    }

    // Update nav links (top nav)
    $('.navbar-nav .nav-link').removeClass('active');
    $(`.navbar-nav .nav-link[data-page="${pageId}"]`).addClass('active');

    // If admin page, check permissions and refresh data
    const adminPages = ['dashboard', 'admin-roster', 'admin-matches', 'admin-scrims',
        'admin-financial', 'admin-documents', 'admin-media', 'admin-applications'
    ];
    if (adminPages.includes(pageId)) {
        const isAdmin = currentUserRole === 'admin' || currentUserRole === 'manager';
        if (!isAdmin) {
            navigateTo('home');
            return;
        }
        if (typeof refreshAdminData === 'function') refreshAdminData();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.navigateTo = navigateTo;

// Intercept nav link clicks (data-page)
$(document).on('click', '.navbar-nav .nav-link[data-page]', function(e) {
    e.preventDefault();
    const pageId = $(this).data('page');
    const adminPages = ['dashboard', 'admin-roster', 'admin-matches', 'admin-scrims',
        'admin-financial', 'admin-documents', 'admin-media', 'admin-applications'
    ];
    if (adminPages.includes(pageId) && !currentUser) {
        openAuthModal();
        return;
    }
    navigateTo(pageId);
});

// Intercept dropdown items with data-page
$(document).on('click', '.dropdown-item[data-page]', function(e) {
    e.preventDefault();
    const pageId = $(this).data('page');
    const adminPages = ['dashboard', 'admin-roster', 'admin-matches', 'admin-scrims',
        'admin-financial', 'admin-documents', 'admin-media', 'admin-applications'
    ];
    if (adminPages.includes(pageId) && !currentUser) {
        openAuthModal();
        return;
    }
    navigateTo(pageId);
    // Close dropdown
    $('.dropdown-menu').removeClass('show');
});
