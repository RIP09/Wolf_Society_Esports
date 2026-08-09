/**
 * script.js – Data Layer
 * Fetches data from Supabase, renders UI, and handles CRUD operations.
 */

// ============================================================
// Table names
// ============================================================
const TABLES = {
    roster: 'rosters',
    matches: 'matches',
    news: 'news',
    sponsors: 'sponsors',
    products: 'products',
    scrims: 'scrims',
    financial: 'financial',
    documents: 'documents',
    media_assets: 'media_assets',
    applications: 'applications',
    profiles: 'profiles',
};

// ============================================================
// Utility: Fetch table data
// ============================================================
async function fetchTable(table, orderBy = 'id') {
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: true });
    if (error) console.error(`Error fetching ${table}:`, error);
    return data || [];
}

// ============================================================
// RENDER FUNCTIONS (Public Pages)
// ============================================================

// Roster
async function renderRoster() {
    const roster = await fetchTable(TABLES.roster);
    const container = $('#rosterGrid');
    if (!roster || roster.length === 0) {
        container.html('<p class="text-muted">No roster data available.</p>');
        return;
    }
    let html = '';
    roster.forEach(p => {
        html += `
            <div class="col-6 col-md-4 col-lg-2">
                <div class="roster-card">
                    <div class="avatar">🐺</div>
                    <div class="name">${p.name}</div>
                    <div class="role">${p.role}</div>
                    <div class="stats">KDA ${p.kda} · ${p.wr}% WR</div>
                    <div class="bio">${p.bio || ''}</div>
                    ${p.social_twitter ? `<div class="social-links mt-1"><a href="https://twitter.com/${p.social_twitter}" target="_blank"><i class="fab fa-twitter"></i></a></div>` : ''}
                </div>
            </div>
        `;
    });
    container.html(html);

    const totalKDA = roster.reduce((s, p) => s + p.kda, 0);
    const avgKDA = roster.length > 0 ? (totalKDA / roster.length).toFixed(2) : '—';
    const avgWR = roster.length > 0 ? (roster.reduce((s, p) => s + p.wr, 0) / roster.length).toFixed(1) : '—';
    $('#teamKDA').text(avgKDA);
    $('#teamWR').text(avgWR + '%');
}

// Schedule
async function renderSchedule() {
    const matches = await fetchTable(TABLES.matches);
    const container = $('#scheduleGrid');
    if (!matches || matches.length === 0) {
        container.html('<p class="text-muted">No matches scheduled.</p>');
        return;
    }
    let html = '';
    matches.forEach(m => {
        const isLive = m.status === 'Live' || m.status === 'live';
        html += `
            <div class="glass-card match-item p-3 d-flex flex-wrap align-items-center justify-content-between">
                <div class="teams">
                    <span class="fw-bold text-white">${m.team_a}</span>
                    <span class="vs">vs</span>
                    <span class="fw-bold text-white">${m.team_b}</span>
                    ${m.score_a !== null && m.score_b !== null ? `<span class="score ms-2">${m.score_a} - ${m.score_b}</span>` : ''}
                </div>
                <div class="d-flex align-items-center gap-3">
                    ${isLive ? `<span class="badge-live"><i class="fas fa-circle me-1"></i>LIVE</span>` : `<span class="text-muted small">${m.status || 'Upcoming'}</span>`}
                    <span class="text-muted small">${m.time || ''}</span>
                    ${m.tournament ? `<span class="text-muted small">🏆 ${m.tournament}</span>` : ''}
                </div>
            </div>
        `;
    });
    container.html(html);
}

// News (Carousel + List)
async function renderNews() {
    const news = await fetchTable(TABLES.news, 'published_date');
    const carousel = $('#newsCarousel');
    if (news && news.length > 0) {
        let carouselHtml = '';
        news.slice(0, 4).forEach(item => {
            carouselHtml += `
                <div class="item">
                    <div class="news-card">
                        <div class="news-img"><i class="fas fa-${item.category === 'tournament' ? 'trophy' : item.category === 'roster' ? 'users' : 'newspaper'}"></i></div>
                        <div class="news-body">
                            <span class="tag">${item.category || 'General'}</span>
                            <h5>${item.title}</h5>
                            <p>${item.content ? item.content.substring(0, 120) + '...' : ''}</p>
                            <div class="meta"><span><i class="far fa-calendar-alt"></i> ${item.published_date || ''}</span></div>
                        </div>
                    </div>
                </div>
            `;
        });
        carousel.html(carouselHtml);
        if ($.fn.owlCarousel) {
            carousel.owlCarousel('destroy');
            carousel.owlCarousel({
                loop: true,
                margin: 20,
                nav: true,
                dots: true,
                autoplay: true,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                responsive: { 0: { items: 1 }, 576: { items: 2 }, 992: { items: 3 } },
                navText: ['<i class="fas fa-chevron-left"></i>', '<i class="fas fa-chevron-right"></i>']
            });
        }
    } else {
        carousel.html('<p class="text-muted text-center">No news available.</p>');
    }

    const list = $('#newsList');
    if (news && news.length > 0) {
        let listHtml = '';
        news.slice(0, 3).forEach(item => {
            listHtml += `
                <div class="col-md-4">
                    <div class="glass-card p-3 h-100">
                        <span class="tag">${item.category || 'General'}</span>
                        <h5 class="text-white mt-2">${item.title}</h5>
                        <p class="text-muted small">${item.content ? item.content.substring(0, 100) + '...' : ''}</p>
                        <div class="text-muted small"><i class="far fa-calendar-alt me-1"></i>${item.published_date || ''}</div>
                    </div>
                </div>
            `;
        });
        list.html(listHtml);
    } else {
        list.html('<p class="text-muted">No articles yet.</p>');
    }
}

// Sponsors
async function renderSponsors() {
    const sponsors = await fetchTable(TABLES.sponsors);
    const container = $('#sponsorGrid');
    if (!sponsors || sponsors.length === 0) {
        container.html('<div class="sponsor-item"><i class="fas fa-handshake"></i>Your Brand Here</div>');
        return;
    }
    let html = '';
    sponsors.forEach(s => {
        html += `
            <div class="sponsor-item">
                <i class="fas fa-${s.icon || 'crown'}"></i>
                ${s.name}
                ${s.discount_code ? `<div class="discount">${s.discount_code}</div>` : ''}
                ${s.website ? `<div class="small mt-1"><a href="${s.website}" target="_blank" class="text-primary">Visit</a></div>` : ''}
            </div>
        `;
    });
    container.html(html);
}

// Merch
async function renderMerch() {
    const products = await fetchTable(TABLES.products);
    const container = $('#merchGrid');
    if (!products || products.length === 0) {
        container.html('<div class="col-12 text-center text-muted">No merchandise available yet.</div>');
        return;
    }
    let html = '';
    products.forEach(p => {
        html += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="product-card">
                    <div class="product-img"><i class="fas fa-${p.icon || 'tshirt'}"></i></div>
                    <div class="product-body">
                        <div class="name">${p.name}</div>
                        <p>${p.description || ''}</p>
                        <div class="price">₹${p.price}</div>
                        <button class="btn-neon btn-neon-sm mt-2" onclick="alert('Added to cart!')"><i class="fas fa-shopping-cart me-1"></i>Buy</button>
                    </div>
                </div>
            </div>
        `;
    });
    container.html(html);
}

// ============================================================
// ADMIN RENDERING & CRUD
// ============================================================

let adminData = {};

async function refreshAdminData() {
    const [roster, matches, scrims, financial, documents, media, applications] = await Promise.all([
        fetchTable(TABLES.roster),
        fetchTable(TABLES.matches),
        fetchTable(TABLES.scrims),
        fetchTable(TABLES.financial),
        fetchTable(TABLES.documents),
        fetchTable(TABLES.media_assets),
        fetchTable(TABLES.applications)
    ]);
    adminData = { roster, matches, scrims, financial, documents, media, applications };
    renderAdminRoster(roster);
    renderAdminMatches(matches);
    renderAdminScrims(scrims);
    renderAdminFinancial(financial);
    renderAdminDocuments(documents);
    renderAdminMedia(media);
    renderAdminApplications(applications);
    renderDashboard(roster, matches, financial, applications);
}

// Admin Roster
function renderAdminRoster(roster) {
    const tbody = $('#adminRosterBody');
    if (!roster || roster.length === 0) {
        tbody.html('<tr><td colspan="6" class="text-muted">No players.</td></tr>');
        return;
    }
    let html = '';
    roster.forEach(p => {
        html += `
            <tr>
                <td>${p.name}</td>
                <td>${p.role}</td>
                <td>${p.kda}</td>
                <td>${p.wr}</td>
                <td>${p.bio || ''}</td>
                <td>
                    <div class="admin-actions">
                        <button class="delete-btn" onclick="deleteRoster(${p.id})"><i class="fas fa-trash"></i></button>
                        <button class="edit-btn" onclick="editRoster(${p.id})"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.deleteRoster = async function(id) {
    if (!confirm('Delete this player?')) return;
    const { error } = await supabase.from(TABLES.roster).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
    renderRoster();
};

window.editRoster = async function(id) {
    const { data, error } = await supabase.from(TABLES.roster).select('*').eq('id', id).single();
    if (error) { alert('Error fetching player'); return; }
    const name = prompt('Name:', data.name);
    if (name === null) return;
    const role = prompt('Role:', data.role);
    if (role === null) return;
    const kda = parseFloat(prompt('KDA:', data.kda));
    if (isNaN(kda)) return;
    const wr = parseInt(prompt('WR%:', data.wr));
    if (isNaN(wr)) return;
    const bio = prompt('Bio:', data.bio);
    if (bio === null) return;
    const social = prompt('Twitter @handle:', data.social_twitter || '');
    const { error: updateError } = await supabase
        .from(TABLES.roster)
        .update({ name, role, kda, wr, bio, social_twitter: social })
        .eq('id', id);
    if (updateError) { alert('Error updating: ' + updateError.message); return; }
    refreshAdminData();
    renderRoster();
};

$('#addRosterBtn').on('click', async function() {
    const name = $('#newRosterName').val().trim();
    const role = $('#newRosterRole').val().trim();
    const kda = parseFloat($('#newRosterKda').val());
    const wr = parseInt($('#newRosterWr').val());
    const bio = $('#newRosterBio').val().trim();
    const social = $('#newRosterSocial').val().trim();
    if (!name || !role || isNaN(kda) || isNaN(wr)) {
        alert('Please fill all required fields.');
        return;
    }
    const { error } = await supabase.from(TABLES.roster).insert([{ name, role, kda, wr, bio, social_twitter: social }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newRosterName').val('');
    $('#newRosterRole').val('');
    $('#newRosterKda').val('');
    $('#newRosterWr').val('');
    $('#newRosterBio').val('');
    $('#newRosterSocial').val('');
    refreshAdminData();
    renderRoster();
});

// Admin Matches
function renderAdminMatches(matches) {
    const tbody = $('#adminMatchesBody');
    if (!matches || matches.length === 0) {
        tbody.html('<tr><td colspan="7" class="text-muted">No matches.</td></tr>');
        return;
    }
    let html = '';
    matches.forEach(m => {
        html += `
            <tr>
                <td>${m.team_a}</td>
                <td>${m.team_b}</td>
                <td>${m.score_a !== null ? m.score_a : '-'}</td>
                <td>${m.score_b !== null ? m.score_b : '-'}</td>
                <td>${m.status}</td>
                <td>${m.time}</td>
                <td>
                    <div class="admin-actions">
                        <button class="delete-btn" onclick="deleteMatch(${m.id})"><i class="fas fa-trash"></i></button>
                        <button class="edit-btn" onclick="editMatch(${m.id})"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.deleteMatch = async function(id) {
    if (!confirm('Delete this match?')) return;
    const { error } = await supabase.from(TABLES.matches).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
    renderSchedule();
};

window.editMatch = async function(id) {
    const { data, error } = await supabase.from(TABLES.matches).select('*').eq('id', id).single();
    if (error) { alert('Error fetching match'); return; }
    const team_a = prompt('Team A:', data.team_a);
    if (team_a === null) return;
    const team_b = prompt('Team B:', data.team_b);
    if (team_b === null) return;
    const score_a = parseInt(prompt('Score A:', data.score_a !== null ? data.score_a : ''));
    const score_b = parseInt(prompt('Score B:', data.score_b !== null ? data.score_b : ''));
    const status = prompt('Status:', data.status);
    if (status === null) return;
    const time = prompt('Time:', data.time);
    if (time === null) return;
    const { error: updateError } = await supabase
        .from(TABLES.matches)
        .update({ team_a, team_b, score_a: isNaN(score_a) ? null : score_a, score_b: isNaN(score_b) ? null : score_b,
            status, time })
        .eq('id', id);
    if (updateError) { alert('Error updating: ' + updateError.message); return; }
    refreshAdminData();
    renderSchedule();
};

$('#addMatchBtn').on('click', async function() {
    const team_a = $('#newMatchA').val().trim();
    const team_b = $('#newMatchB').val().trim();
    const score_a = parseInt($('#newMatchScoreA').val()) || null;
    const score_b = parseInt($('#newMatchScoreB').val()) || null;
    const status = $('#newMatchStatus').val().trim() || 'Upcoming';
    const time = $('#newMatchTime').val().trim() || '';
    if (!team_a || !team_b) {
        alert('Please enter both team names.');
        return;
    }
    const { error } = await supabase.from(TABLES.matches).insert([{ team_a, team_b, score_a, score_b, status, time }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newMatchA').val('');
    $('#newMatchB').val('');
    $('#newMatchScoreA').val('');
    $('#newMatchScoreB').val('');
    $('#newMatchStatus').val('');
    $('#newMatchTime').val('');
    refreshAdminData();
    renderSchedule();
});

// Admin Scrims
function renderAdminScrims(scrims) {
    const tbody = $('#adminScrimsBody');
    if (!scrims || scrims.length === 0) {
        tbody.html('<tr><td colspan="6" class="text-muted">No scrims scheduled.</td></tr>');
        return;
    }
    let html = '';
    scrims.forEach(s => {
        html += `
            <tr>
                <td>${s.team}</td>
                <td>${s.opponent}</td>
                <td>${s.date_time}</td>
                <td>${s.duration}h</td>
                <td>${s.status}</td>
                <td>
                    <div class="admin-actions">
                        <button class="delete-btn" onclick="deleteScrim(${s.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.deleteScrim = async function(id) {
    if (!confirm('Delete this scrim?')) return;
    const { error } = await supabase.from(TABLES.scrims).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

$('#addScrimBtn').on('click', async function() {
    const team = $('#newScrimTeam').val().trim();
    const opponent = $('#newScrimOpponent').val().trim();
    const date_time = $('#newScrimDateTime').val();
    const duration = parseInt($('#newScrimDuration').val()) || 1;
    const status = $('#newScrimStatus').val().trim() || 'Scheduled';
    if (!team || !opponent || !date_time) {
        alert('Please fill all required fields.');
        return;
    }
    const { error } = await supabase.from(TABLES.scrims).insert([{ team, opponent, date_time, duration, status }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newScrimTeam').val('');
    $('#newScrimOpponent').val('');
    $('#newScrimDateTime').val('');
    $('#newScrimDuration').val('');
    $('#newScrimStatus').val('');
    refreshAdminData();
});

// Admin Financial
function renderAdminFinancial(financial) {
    const tbody = $('#adminFinancialBody');
    if (!financial || financial.length === 0) {
        tbody.html('<tr><td colspan="7" class="text-muted">No entries.</td></tr>');
        return;
    }
    let html = '';
    let totalIncome = 0,
        totalExpenses = 0;
    financial.forEach(f => {
        const amt = parseFloat(f.amount) || 0;
        if (f.type === 'income') totalIncome += amt;
        else totalExpenses += amt;
        html += `
            <tr>
                <td><span class="badge ${f.type === 'income' ? 'bg-success' : 'bg-danger'}">${f.type}</span></td>
                <td>${f.category}</td>
                <td>₹${amt}</td>
                <td>${f.description || ''}</td>
                <td>${f.date}</td>
                <td>${f.status || 'Pending'}</td>
                <td>
                    <div class="admin-actions">
                        <button class="delete-btn" onclick="deleteFinancial(${f.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
    $('#totalIncome').text('₹' + totalIncome);
    $('#totalExpenses').text('₹' + totalExpenses);
    $('#totalBalance').text('₹' + (totalIncome - totalExpenses));
}

window.deleteFinancial = async function(id) {
    if (!confirm('Delete this entry?')) return;
    const { error } = await supabase.from(TABLES.financial).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

$('#addFinBtn').on('click', async function() {
    const type = $('#newFinType').val();
    const category = $('#newFinCategory').val().trim();
    const amount = parseFloat($('#newFinAmount').val());
    const description = $('#newFinDesc').val().trim();
    const date = $('#newFinDate').val();
    if (!category || isNaN(amount) || !date) {
        alert('Please fill all required fields.');
        return;
    }
    const { error } = await supabase.from(TABLES.financial).insert([{ type, category, amount, description, date,
        status: 'Completed' }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newFinType').val('income');
    $('#newFinCategory').val('');
    $('#newFinAmount').val('');
    $('#newFinDesc').val('');
    $('#newFinDate').val('');
    refreshAdminData();
});

// Admin Documents
function renderAdminDocuments(documents) {
    const tbody = $('#adminDocumentsBody');
    if (!documents || documents.length === 0) {
        tbody.html('<tr><td colspan="4" class="text-muted">No documents.</td></tr>');
        return;
    }
    let html = '';
    documents.forEach(d => {
        html += `
            <tr>
                <td>${d.title}</td>
                <td>${d.type}</td>
                <td>${d.uploaded_at || ''}</td>
                <td>
                    <div class="admin-actions">
                        <a href="${d.file_url}" target="_blank" class="text-primary"><i class="fas fa-eye"></i></a>
                        <button class="delete-btn" onclick="deleteDoc(${d.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.deleteDoc = async function(id) {
    if (!confirm('Delete this document?')) return;
    const { error } = await supabase.from(TABLES.documents).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

$('#addDocBtn').on('click', async function() {
    const title = $('#newDocTitle').val().trim();
    const type = $('#newDocType').val().trim();
    const file_url = $('#newDocUrl').val().trim();
    if (!title || !type || !file_url) {
        alert('Please fill all fields.');
        return;
    }
    const { error } = await supabase.from(TABLES.documents).insert([{ title, type, file_url,
        uploaded_at: new Date().toISOString().split('T')[0] }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newDocTitle').val('');
    $('#newDocType').val('');
    $('#newDocUrl').val('');
    refreshAdminData();
});

// Admin Media
function renderAdminMedia(media) {
    const tbody = $('#adminMediaBody');
    if (!media || media.length === 0) {
        tbody.html('<tr><td colspan="4" class="text-muted">No media assets.</td></tr>');
        return;
    }
    let html = '';
    media.forEach(m => {
        html += `
            <tr>
                <td>${m.title}</td>
                <td>${m.type}</td>
                <td><a href="${m.url}" target="_blank" class="text-primary">View</a></td>
                <td>
                    <div class="admin-actions">
                        <button class="delete-btn" onclick="deleteMediaAsset(${m.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.deleteMediaAsset = async function(id) {
    if (!confirm('Delete this media?')) return;
    const { error } = await supabase.from(TABLES.media_assets).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

$('#addMediaBtn').on('click', async function() {
    const title = $('#newMediaTitle').val().trim();
    const type = $('#newMediaType').val().trim();
    const url = $('#newMediaUrl').val().trim();
    if (!title || !type || !url) {
        alert('Please fill all fields.');
        return;
    }
    const { error } = await supabase.from(TABLES.media_assets).insert([{ title, type, url }]);
    if (error) { alert('Error adding: ' + error.message); return; }
    $('#newMediaTitle').val('');
    $('#newMediaType').val('');
    $('#newMediaUrl').val('');
    refreshAdminData();
});

// Admin Applications
function renderAdminApplications(applications) {
    const tbody = $('#adminApplicationsBody');
    if (!applications || applications.length === 0) {
        tbody.html('<tr><td colspan="7" class="text-muted">No applications.</td></tr>');
        return;
    }
    let html = '';
    applications.forEach(a => {
        html += `
            <tr>
                <td>${a.name}</td>
                <td>${a.role}</td>
                <td>${a.rank}</td>
                <td>${a.discord || ''}</td>
                <td>${a.message ? a.message.substring(0, 50) + '...' : ''}</td>
                <td>${a.status || 'Pending'}</td>
                <td>
                    <div class="admin-actions">
                        <button class="edit-btn" onclick="updateAppStatus(${a.id}, 'Accepted')"><i class="fas fa-check text-success"></i></button>
                        <button class="edit-btn" onclick="updateAppStatus(${a.id}, 'Rejected')"><i class="fas fa-times text-danger"></i></button>
                        <button class="delete-btn" onclick="deleteApp(${a.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.html(html);
}

window.updateAppStatus = async function(id, status) {
    const { error } = await supabase.from(TABLES.applications).update({ status }).eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

window.deleteApp = async function(id) {
    if (!confirm('Delete this application?')) return;
    const { error } = await supabase.from(TABLES.applications).delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    refreshAdminData();
};

// Dashboard
function renderDashboard(roster, matches, financial, applications) {
    $('#dashPlayers').text(roster ? roster.length : 0);
    $('#dashMatches').text(matches ? matches.length : 0);
    let totalRevenue = 0;
    if (financial) {
        financial.forEach(f => {
            if (f.type === 'income') totalRevenue += parseFloat(f.amount) || 0;
        });
    }
    $('#dashRevenue').text('₹' + totalRevenue);
    $('#dashApps').text(applications ? applications.length : 0);
}

// Expose refreshAdminData globally for navigation
window.refreshAdminData = refreshAdminData;
