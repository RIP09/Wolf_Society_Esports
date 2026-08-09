/**
 * main.js – Application Entry Point
 * Initializes the app, sets up event listeners, and starts live updates.
 */

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
    await checkAuth();
    await Promise.all([
        renderRoster(),
        renderSchedule(),
        renderNews(),
        renderSponsors(),
        renderMerch()
    ]);
    if (currentUser && (currentUserRole === 'admin' || currentUserRole === 'manager')) {
        await refreshAdminData();
    }
    console.log('🐺 Wolf Society Esports — Complete Platform loaded.');
    console.log('📦 Connected to Supabase.');
}

// Start the app
init();

// ============================================================
// LIVE UPDATES (Intervals)
// ============================================================

// Live match simulation
setInterval(function() {
    var wolf = 3 + Math.floor(Math.random() * 2);
    var phx = 1 + Math.floor(Math.random() * 2);
    $('#liveScoreWolf').text(wolf);
    $('#liveScorePhx').text(phx);
    var total = wolf + phx;
    var progress = total > 0 ? (wolf / total) * 100 : 75;
    $('#liveProgress').css('width', Math.min(progress, 100) + '%');
    var gold = (2 + Math.random() * 2).toFixed(1);
    $('#liveGold').text('+' + gold + 'k');
    $('#liveObj').text(Math.floor(2 + Math.random() * 4) + '/5');
}, 5000);

// Oracle updates
setInterval(function() {
    var wolf = 60 + Math.floor(Math.random() * 30);
    var phx = 100 - wolf;
    $('#oracleWolf').text(wolf + '%');
    $('#oraclePhx').text(phx + '%');
    $('#oracleWolfBar').css('width', wolf + '%');
    $('#oraclePhxBar').css('width', phx + '%');
}, 8000);

// ============================================================
// OTHER EVENT BINDINGS
// ============================================================

// Tryout form submission
$('#tryoutForm').on('submit', async function(e) {
    e.preventDefault();
    const name = $('#tryoutName').val().trim();
    const role = $('#tryoutRole').val();
    const rank = $('#tryoutRank').val().trim();
    const discord = $('#tryoutDiscord').val().trim();
    const message = $('#tryoutMessage').val().trim();
    if (!name || !rank) {
        alert('Please fill in all required fields.');
        return;
    }
    const { error } = await supabase.from('applications').insert([{ name, role, rank, discord, message, status: 'Pending' }]);
    if (error) {
        alert('Error submitting: ' + error.message);
        return;
    }
    $('#tryoutFeedback').removeClass('d-none').text('✅ Application received! We\'ll be in touch.');
    this.reset();
    setTimeout(() => $('#tryoutFeedback').addClass('d-none'), 4000);
});

// Parallax effect
$(window).on('scroll', function() {
    var scrollPos = $(window).scrollTop();
    $('#parallaxBg').css('transform', 'translateY(' + scrollPos * 0.15 + 'px)');
});

// Re-run admin data refresh when switching to admin pages via dropdown
$(document).on('click', '.dropdown-item[data-page*="admin"]', function() {
    setTimeout(refreshAdminData, 300);
});
