const API = 'http://localhost:3001/api';
const token = () => localStorage.getItem('token');
const me = () => localStorage.getItem('username');

// ── Gradients for post backgrounds ──────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#fd7043,#ff8a65)',
  'linear-gradient(135deg,#26c6da,#00acc1)',
];

function getGradient(id) { return GRADIENTS[id % GRADIENTS.length]; }

// ── Avatar colors ────────────────────────────────────────────────────────────
const AV_COLORS = ['#833ab4','#fd1d1d','#fcb045','#405de6','#5851db','#833ab4','#c13584','#e1306c','#f77737','#0095f6'];
function avatarColor(str) {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % AV_COLORS.length;
  return AV_COLORS[Math.abs(h)];
}

function initials(u) { return u.slice(0,2).toUpperCase(); }

function timeAgo(d) {
  const s = (Date.now() - new Date(d + 'Z')) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm';
  if (s < 86400) return Math.floor(s/3600) + 'h';
  return Math.floor(s/86400) + 'd';
}

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

// ── Auth ─────────────────────────────────────────────────────────────────────
function requireAuth() { if (!token()) location.href = 'index.html'; }
function logout() { localStorage.clear(); location.href = 'index.html'; }

async function api(path, opts = {}) {
  const r = await fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token()}`, ...(opts.headers||{}) } });
  if (r.status === 401) { logout(); return; }
  return r.json();
}

// ── Post Card (Instagram style) ──────────────────────────────────────────────
function renderPost(p) {
  const isOwn = p.username === me();
  const av = initials(p.username);
  const avColor = avatarColor(p.username);
  const bg = getGradient(p.id);
  return `
  <div class="post-card" id="post-${p.id}">
    <div class="post-header">
      <div class="post-avatar" style="background:${bg}">
        <div style="width:38px;height:38px;border-radius:50%;background:${avColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff">${av}</div>
      </div>
      <div class="post-header-info">
        <a class="uname" href="profile.html?user=${p.username}">@${p.username}</a>
        <div class="ptime">${timeAgo(p.created_at)}</div>
      </div>
      ${isOwn ? `<button class="post-more" onclick="deletePost(${p.id})" title="Delete">···</button>` : ''}
    </div>

    <!-- Post "image" area using gradient + text -->
    <div class="post-media" style="background:${bg};min-height:${p.content.length > 100 ? 260 : 200}px">
      ${escHtml(p.content)}
    </div>

    <!-- Actions -->
    <div class="post-actions">
      <button class="act-btn ${p.liked_by_me ? 'liked' : ''}" id="lbtn-${p.id}" onclick="toggleLike(${p.id})">
        ${p.liked_by_me ? '❤️' : '🤍'}
      </button>
      <button class="act-btn" onclick="toggleComments(${p.id})">💬</button>
      <button class="act-btn" onclick="sharePost(${p.id})" title="Share">✈️</button>
      <button class="act-btn bookmark-btn" title="Save">🔖</button>
    </div>

    <div class="post-likes" id="likes-${p.id}">
      ${p.likes_count} ${p.likes_count === 1 ? 'like' : 'likes'}
    </div>

    <div class="post-caption">
      <a class="cap-user" href="profile.html?user=${p.username}">@${p.username}</a>
      ${p.content.length > 120 ? escHtml(p.content.slice(0,120)) + '…' : ''}
    </div>

    ${p.comments_count > 0 ? `<div class="view-comments" onclick="toggleComments(${p.id})">View all ${p.comments_count} comment${p.comments_count>1?'s':''}</div>` : ''}

    <!-- Comments section (hidden by default) -->
    <div id="comments-${p.id}" style="display:none">
      <div class="comments-section" id="clist-${p.id}"></div>
    </div>

    <!-- Comment Input -->
    <div class="comment-box">
      <div class="com-av" style="background:${avatarColor(me())}">${initials(me())}</div>
      <input id="cinput-${p.id}" type="text" placeholder="Add a comment…" />
      <button class="post-btn" onclick="addComment(${p.id})">Post</button>
    </div>
  </div>`;
}

// ── Stories Bar ──────────────────────────────────────────────────────────────
async function loadStories() {
  const el = document.getElementById('stories-bar');
  if (!el) return;
  const users = await api('/users');
  const myColor = avatarColor(me());
  let html = `
    <div class="story-item" onclick="location.href='profile.html?user=${me()}'">
      <div class="story-ring">
        <div class="story-ring-inner">
          <div class="story-avatar" style="background:${myColor}">${initials(me())}</div>
        </div>
      </div>
      <div class="story-name">Your story</div>
    </div>`;
  (users || []).forEach(u => {
    html += `
    <div class="story-item" onclick="location.href='profile.html?user=${u.username}'">
      <div class="story-ring">
        <div class="story-ring-inner">
          <div class="story-avatar" style="background:${avatarColor(u.username)}">${initials(u.username)}</div>
        </div>
      </div>
      <div class="story-name">${u.username}</div>
    </div>`;
  });
  el.innerHTML = html;
}

// ── Create Avatar in navbar ──────────────────────────────────────────────────
function setCreateAvatar() {
  const el = document.getElementById('create-avatar');
  if (!el) return;
  el.style.background = avatarColor(me());
  el.textContent = initials(me());
}

// ── Right Panel ──────────────────────────────────────────────────────────────
async function loadRightPanel() {
  const miniEl = document.getElementById('rp-mini');
  const sugEl = document.getElementById('suggestions');
  if (!miniEl) return;

  const color = avatarColor(me());
  miniEl.innerHTML = `
    <div class="rp-avatar" style="background:${color}">${initials(me())}</div>
    <div class="rp-info">
      <a class="rp-name" href="profile.html?user=${me()}">@${me()}</a>
      <div class="rp-sub">Your profile</div>
    </div>
    <span class="rp-switch" onclick="logout()">Switch</span>`;

  const users = await api('/users');
  if (!sugEl) return;
  if (!users?.length) { sugEl.innerHTML = '<p class="muted" style="font-size:13px">No suggestions yet.</p>'; return; }
  sugEl.innerHTML = users.map(u => `
    <div class="suggest-item">
      <div class="sug-avatar" style="background:${avatarColor(u.username)}">${initials(u.username)}</div>
      <div class="sug-info">
        <a class="sug-name" href="profile.html?user=${u.username}">@${u.username}</a>
        <span class="sug-sub">${u.followers_count} followers</span>
      </div>
      <button class="sug-follow ${u.is_following ? 'unfollow' : ''}" id="sfbtn-${u.username}" onclick="toggleFollow('${u.username}')">
        ${u.is_following ? 'Following' : 'Follow'}
      </button>
    </div>`).join('');
}

// ── Feed Page ────────────────────────────────────────────────────────────────
async function initFeedPage() {
  setCreateAvatar();

  const ta = document.getElementById('post-content');
  ta?.addEventListener('input', () => {
    const l = ta.value.length;
    if (l > 280) ta.value = ta.value.slice(0,280);
    document.getElementById('char-ct').textContent = `${ta.value.length}/280`;
  });

  await Promise.all([loadFeed(), loadStories(), loadRightPanel()]);
}

async function loadFeed() {
  const posts = await api('/feed');
  const el = document.getElementById('feed');
  if (!posts?.length) {
    el.innerHTML = `<div style="text-align:center;padding:60px 0;color:#8e8e8e;font-size:14px">No posts yet. Start sharing!</div>`;
    return;
  }
  el.innerHTML = posts.map(renderPost).join('');
}

async function createPost() {
  const ta = document.getElementById('post-content');
  const content = ta.value.trim();
  if (!content) return;
  const btn = document.getElementById('post-btn');
  btn.disabled = true; btn.textContent = 'Sharing…';
  const post = await api('/posts', { method:'POST', body: JSON.stringify({ content }) });
  if (post?.id) {
    ta.value = '';
    document.getElementById('char-ct').textContent = '0/280';
    const feed = document.getElementById('feed');
    const dummy = document.createElement('div');
    dummy.innerHTML = renderPost(post);
    feed.insertBefore(dummy.firstElementChild, feed.firstChild);
  }
  btn.disabled = false; btn.textContent = 'Share';
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  await api(`/posts/${id}`, { method:'DELETE' });
  document.getElementById(`post-${id}`)?.remove();
}

function focusCreate(e) {
  e.preventDefault();
  const ta = document.getElementById('post-content');
  ta?.focus();
  ta?.scrollIntoView({ behavior:'smooth', block:'center' });
}

// ── Like ─────────────────────────────────────────────────────────────────────
async function toggleLike(postId) {
  const d = await api(`/posts/${postId}/like`, { method:'POST' });
  const btn = document.getElementById(`lbtn-${postId}`);
  const lel = document.getElementById(`likes-${postId}`);
  const cur = parseInt(lel.textContent);
  if (d?.liked) {
    btn.innerHTML = '❤️'; btn.classList.add('liked');
    lel.textContent = `${cur + 1} ${cur + 1 === 1 ? 'like' : 'likes'}`;
  } else {
    btn.innerHTML = '🤍'; btn.classList.remove('liked');
    lel.textContent = `${Math.max(0, cur - 1)} ${cur - 1 === 1 ? 'like' : 'likes'}`;
  }
}

// ── Comments ─────────────────────────────────────────────────────────────────
async function toggleComments(postId) {
  const sec = document.getElementById(`comments-${postId}`);
  if (sec.style.display === 'none') {
    sec.style.display = 'block';
    const comments = await api(`/posts/${postId}/comments`);
    const list = document.getElementById(`clist-${postId}`);
    list.innerHTML = comments?.length
      ? comments.map(c => `
          <div class="comment-item">
            <div class="com-av" style="background:${avatarColor(c.username)}">${initials(c.username)}</div>
            <div>
              <span class="com-user">@${c.username}</span>
              <span>${escHtml(c.content)}</span>
              <span class="com-time">${timeAgo(c.created_at)}</span>
            </div>
          </div>`).join('')
      : '<div style="padding:8px 0;color:#8e8e8e;font-size:13px">No comments yet.</div>';
    document.getElementById(`cinput-${postId}`)?.addEventListener('keydown', e => { if (e.key === 'Enter') addComment(postId); });
  } else {
    sec.style.display = 'none';
  }
}

async function addComment(postId) {
  const input = document.getElementById(`cinput-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  const c = await api(`/posts/${postId}/comments`, { method:'POST', body: JSON.stringify({ content }) });
  if (c?.id) {
    input.value = '';
    const sec = document.getElementById(`comments-${postId}`);
    const list = document.getElementById(`clist-${postId}`);
    if (sec.style.display === 'none') { sec.style.display = 'block'; list.innerHTML = ''; }
    list.insertAdjacentHTML('beforeend', `
      <div class="comment-item">
        <div class="com-av" style="background:${avatarColor(c.username)}">${initials(c.username)}</div>
        <div><span class="com-user">@${c.username}</span><span>${escHtml(c.content)}</span><span class="com-time">just now</span></div>
      </div>`);
    const vc = document.querySelector(`#post-${postId} .view-comments`);
    if (vc) { const n = parseInt(vc.textContent) + 1; vc.textContent = `View all ${n} comments`; }
  }
}

// ── Follow ────────────────────────────────────────────────────────────────────
async function toggleFollow(username, isProfilePage = false) {
  const d = await api(`/users/${username}/follow`, { method:'POST' });
  if (!d) return;
  const sb = document.getElementById(`sfbtn-${username}`);
  if (sb) { sb.textContent = d.following ? 'Following' : 'Follow'; sb.classList.toggle('unfollow', d.following); }
  if (isProfilePage) {
    const pb = document.getElementById('pfbtn');
    if (pb) { pb.textContent = d.following ? 'Unfollow' : 'Follow'; pb.className = d.following ? 'btn-unfollow-lg' : 'btn-follow-lg'; }
    const sf = document.getElementById('s-followers');
    if (sf) sf.textContent = parseInt(sf.textContent) + (d.following ? 1 : -1);
  }
}

// ── Profile Page ──────────────────────────────────────────────────────────────
async function initProfilePage() {
  const username = new URLSearchParams(location.search).get('user') || me();
  document.title = `Wavely — @${username}`;
  const [user, posts] = await Promise.all([api(`/users/${username}`), api(`/users/${username}/posts`)]);
  if (!user) return;

  const color = avatarColor(username);
  document.getElementById('p-avatar').style.background = color;
  document.getElementById('p-avatar').textContent = initials(username);
  document.getElementById('p-username').textContent = username;
  document.getElementById('p-bio').textContent = user.bio || '';
  document.getElementById('s-posts').textContent = user.posts_count;
  document.getElementById('s-followers').textContent = user.followers_count;
  document.getElementById('s-following').textContent = user.following_count;

  const actions = document.getElementById('p-actions');
  if (username === me()) {
    actions.innerHTML = `<button class="btn-edit-lg" onclick="document.getElementById('bio-edit-box').style.display='block'">Edit Profile</button>`;
    document.getElementById('bio-edit-box').querySelector('textarea').value = user.bio || '';
  } else {
    actions.innerHTML = `<button class="${user.is_following ? 'btn-unfollow-lg' : 'btn-follow-lg'}" id="pfbtn" onclick="toggleFollow('${username}', true)">${user.is_following ? 'Unfollow' : 'Follow'}</button>`;
  }

  // Grid
  const grid = document.getElementById('profile-grid');
  if (!posts?.length) {
    grid.innerHTML = `<div class="empty-grid"><div style="font-size:48px;margin-bottom:12px">📷</div><div style="font-size:20px;font-weight:600;margin-bottom:8px">No Posts Yet</div><div>When you share photos, they will appear on your profile.</div></div>`;
    return;
  }
  grid.innerHTML = posts.map(p => `
    <div class="grid-post" onclick="location.href='feed.html'">
      <div class="grid-post-inner" style="background:${getGradient(p.id)}">
        ${escHtml(p.content.slice(0, 80))}${p.content.length > 80 ? '…' : ''}
      </div>
      <div class="grid-post-overlay">
        <span>❤️ ${p.likes_count}</span>
        <span>💬 ${p.comments_count}</span>
      </div>
    </div>`).join('');
}

async function saveBio() {
  const bio = document.getElementById('bio-input').value;
  await api('/profile', { method:'PATCH', body: JSON.stringify({ bio }) });
  document.getElementById('p-bio').textContent = bio;
  document.getElementById('bio-edit-box').style.display = 'none';
}

// ── Share & Toast ─────────────────────────────────────────────────────────────
function sharePost(id) {
  const url = `${window.location.origin}/feed.html#post-${id}`;
  if (navigator.share) {
    navigator.share({
      title: 'Wavely Post',
      text: 'Check out this post on Wavely!',
      url: url
    }).catch(err => {
      copyToClipboard(url);
    });
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link copied to clipboard!');
  }).catch(err => {
    showToast('Failed to copy link.');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}
