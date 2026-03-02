const API = 'https://blog-platform-api-te6g.onrender.com/api';


let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;
let currentSearch = '';
let allTags = [];
let currentTagFilter = '';

function debugTags() {
    console.group('=== TAG DEBUG ===');
    console.log('allTags global variable:', allTags);
    console.log('Tag checkboxes in DOM:');
    const checkboxes = document.querySelectorAll('.tag-checkbox-input');
    console.log(`  Total: ${checkboxes.length}`);
    checkboxes.forEach((cb, i) => {
        console.log(`  [${i}] value="${cb.value}" checked=${cb.checked}`);
    });
    console.log('Tag container:', document.getElementById('tagCheckboxes'));
    console.groupEnd();
}

function debugForm() {
    console.group('=== FORM DEBUG ===');
    console.log('Title:', document.getElementById('inputTitle')?.value);
    console.log('Desc:', document.getElementById('inputDesc')?.value);
    console.log('Selected tags:', [...document.querySelectorAll('.tag-checkbox-input:checked')].map(cb => cb.value));
    console.groupEnd();
}

window.debugTags = debugTags;
window.debugForm = debugForm;
console.log('Debug helpers added: call debugTags() and debugForm() from console');


document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOMContentLoaded ===');
    console.log('Initializing application...');

    checkApiHealth();
    loadTags();
    loadPosts();

    console.log('Initial page setup complete');

    // Title character counter
    const titleInput = document.getElementById('inputTitle');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            document.getElementById('titleCount').textContent = `${titleInput.value.length} / 200`;
        });
    }

    // Tag preview live update
    const tagNameInput = document.getElementById('tagName');
    const tagColorInput = document.getElementById('tagColor');
    if (tagNameInput) {
        tagNameInput.addEventListener('input', updateTagPreview);
        tagColorInput.addEventListener('input', updateTagPreview);
    }

    // Drag & drop on drop zone
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
        dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const dt = new DataTransfer();
                dt.items.add(file);
                document.getElementById('inputImage').files = dt.files;
                previewImage(document.getElementById('inputImage'));
            }
        });
    }
});


// API HEALTH CHECK
async function checkApiHealth() {
    try {
        const res = await fetch(`${API}/health`);
        const data = await res.json();
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        if (data.success) {
            dot.classList.add('online');
            text.textContent = 'API Online';
        } else {
            throw new Error();
        }
    } catch {
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        dot.classList.add('offline');
        text.textContent = 'API Offline';
    }
}

// TAB SWITCHING
function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));

    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`nav-${tab}`).classList.add('active');

    if (tab === 'tags') loadTagsList();
}


// Load & display posts, applying current search/filter/sortstate 
async function loadPosts(page = 1) {
    currentPage = page;
    const search = currentSearch.trim();

    showSkeleton(true);
    document.getElementById('postsGrid').innerHTML = '';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('pagination').innerHTML = '';

    try {
        let url;

        if (search) {
            const params = new URLSearchParams({ keyword: search, page, limit: getLimitValue() });
            url = `${API}/posts/search?${params}`;
        } else {
            const sortBy = document.getElementById('sortBy').value;
            const order = document.getElementById('order').value;
            const status = document.getElementById('filterStatus').value;
            // Use currentTagFilter state (set by filterByTagName) OR the select value
            const tagName = currentTagFilter || document.getElementById('filterTag').value;
            const limit = getLimitValue();

            const params = new URLSearchParams({ page, limit, sortBy, order });
            if (status) params.set('status', status);
            if (tagName) params.set('tags', tagName);

            url = `${API}/posts?${params}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        showSkeleton(false);

        if (!data.success && !data.data) {
            showToast('Failed to load posts', 'error');
            return;
        }

        totalPages = data.totalPages || 1;

        const statsText = document.getElementById('statsText');
        statsText.textContent = `${data.total ?? data.data.length} post${data.total !== 1 ? 's' : ''} found`;

        if (!data.data || data.data.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        renderPosts(data.data);
        renderPagination(data.page || page, totalPages);

    } catch {
        showSkeleton(false);
        showToast('Could not connect to API', 'error');
    }
}

function getLimitValue() {
    return parseInt(document.getElementById('limitSelect').value) || 6;
}

/** Render an array of posts into the grid */
function renderPosts(posts) {
    const grid = document.getElementById('postsGrid');
    grid.innerHTML = '';

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.onclick = () => openPostModal(post);

        const tagsHtml = (post.tags && post.tags.length)
            ? post.tags.map(t => {
                const color = t.color || '#6366f1';
                const bg = hexToRgba(color, 0.15);
                const border = hexToRgba(color, 0.3);
                return `<span class="tag-badge" style="background:${bg};color:${color};border-color:${border}" onclick="filterByTagName(event,'${t.name}')">#${t.name}</span>`;
            }).join('')
            : '<span style="font-size:12px;color:var(--text-3)">No tags</span>';

        const initials = (post.author || 'A').charAt(0).toUpperCase();
        const dateStr = formatDate(post.createdAt);
        const statusClass = post.status || 'published';

        card.innerHTML = `
      ${post.image
                ? `<img class="post-card-img" src="${post.image}" alt="${escHtml(post.title)}" onerror="this.style.display='none'" />`
                : `<div class="post-card-img-placeholder"></div>`
            }
      <div class="post-card-body">
        <div class="post-card-meta">
          <span class="post-status-badge ${statusClass}">${statusClass}</span>
          <span class="post-date">${dateStr}</span>
        </div>
        <h3 class="post-card-title">${escHtml(post.title)}</h3>
        <p class="post-card-desc">${escHtml(post.desc)}</p>
        <div class="post-card-author">
          <div class="author-avatar">${initials}</div>
          <span>${escHtml(post.author || 'Anonymous')}</span>
        </div>
        <div class="post-card-tags">${tagsHtml}</div>
      </div>
      <div class="post-card-footer">
        <button class="btn-card-action" onclick="event.stopPropagation(); openPostModal(${JSON.stringify(post).replace(/"/g, '&quot;')})">View</button>
        <button class="btn-card-action danger" onclick="event.stopPropagation(); confirmDelete('${post._id}')">Delete</button>
      </div>
    `;

        grid.appendChild(card);
    });
}

/** Render pagination controls */
function renderPagination(page, total) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    if (total <= 1) return;

    const prevBtn = makePageBtn('‹', page === 1, () => loadPosts(page - 1));
    container.appendChild(prevBtn);

    for (let i = 1; i <= total; i++) {
        const btn = makePageBtn(i, false, () => loadPosts(i));
        if (i === page) btn.classList.add('active');
        container.appendChild(btn);
    }

    const nextBtn = makePageBtn('›', page === total, () => loadPosts(page + 1));
    container.appendChild(nextBtn);
}

function makePageBtn(label, disabled, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    return btn;
}



function onSearchInput(value) {
    document.getElementById('clearSearch').style.display = value ? 'flex' : 'none';
    clearTimeout(searchTimeout);
    currentSearch = value;
    searchTimeout = setTimeout(() => loadPosts(1), 400);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    currentSearch = '';
    loadPosts(1);
}


// TAG FILTER FROM CARD
function filterByTagName(event, tagName) {
    event.stopPropagation();

    // Store the active tag filter in state
    currentTagFilter = tagName;

    const filterSelect = document.getElementById('filterTag');
    const matchingOption = Array.from(filterSelect.options).find(
        opt => opt.value.toLowerCase() === tagName.toLowerCase()
    );
    if (matchingOption) {
        filterSelect.value = matchingOption.value;
    }

    const banner = document.getElementById('activeTagBanner');
    banner.style.display = 'flex';
    banner.innerHTML = `
    <span>Filtering by tag:</span>
    <strong style="color:var(--accent)">#${tagName}</strong>
    <button class="btn btn-ghost btn-sm" onclick="clearTagFilter()">Clear</button>
  `;

    loadPosts(1);
}

function clearTagFilter() {
    currentTagFilter = '';
    document.getElementById('filterTag').value = '';
    document.getElementById('activeTagBanner').style.display = 'none';
    loadPosts(1);
}

function resetFilters() {
    currentTagFilter = '';
    document.getElementById('sortBy').value = 'createdAt';
    document.getElementById('order').value = 'desc';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterTag').value = '';
    document.getElementById('limitSelect').value = '6';
    document.getElementById('activeTagBanner').style.display = 'none';
    clearSearch();
}

//create post
async function submitPost(event) {
    event.preventDefault();

    const title = document.getElementById('inputTitle').value.trim();
    const desc = document.getElementById('inputDesc').value.trim();
    const author = document.getElementById('inputAuthor').value.trim();
    const status = document.getElementById('inputStatus').value;
    const imageFile = document.getElementById('inputImage').files[0];

    if (!title || !desc) {
        showToast('Title and description are required', 'error');
        return;
    }

    console.group('=== SUBMIT POST - DEBUG INFO ===');

    // Debug: Log all available checkboxes
    const allCheckboxes = [...document.querySelectorAll('.tag-checkbox-input')];
    console.log('Total checkboxes found:', allCheckboxes.length);

    allCheckboxes.forEach((cb, idx) => {
        console.log(`  [${idx}] id="${cb.id}" value="${cb.value}" checked=${cb.checked}`);
    });

    // Collect selected tags
    const selectedTags = allCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    console.log('Selected tags array:', selectedTags);
    console.log('Tags as string:', selectedTags.join(','));

    const formData = new FormData();
    formData.append('title', title);
    formData.append('desc', desc);
    formData.append('author', author || 'Anonymous');
    formData.append('status', status);
    // Always append tags field, even if empty
    formData.append('tags', selectedTags.join(','));
    if (imageFile) formData.append('image', imageFile);

    console.log('FormData fields:');
    console.log('  title:', title);
    console.log('  desc:', desc);
    console.log('  author:', author || 'Anonymous');
    console.log('  status:', status);
    console.log('  tags:', selectedTags.join(','));
    console.log('  image:', imageFile ? imageFile.name : 'none');

    console.groupEnd();

    setSubmitLoading(true);

    try {
        const res = await fetch(`${API}/posts`, { method: 'POST', body: formData });
        const data = await res.json();

        console.log('Response from server:', data);

        if (res.ok && data.success) {
            showToast('Post published successfully!', 'success');
            resetForm();
            switchTab('posts');
            loadPosts(1);
        } else {
            showToast(data.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error — check if server is running', 'error');
    } finally {
        setSubmitLoading(false);
    }
}

function setSubmitLoading(loading) {
    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('submitSpinner');
    spinner.style.display = loading ? 'block' : 'none';
    btn.disabled = loading;
    btn.textContent = loading ? '' : 'Publish Post';
    if (loading) btn.prepend(spinner);
}

function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('titleCount').textContent = '0 / 200';
    clearImage();
    // Uncheck all tag checkboxes
    document.querySelectorAll('.tag-checkbox-label').forEach(l => l.classList.remove('checked'));
    document.querySelectorAll('.tag-checkbox-input').forEach(cb => cb.checked = false);
}

//image preview
function previewImage(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('imagePreview');
        const inner = document.getElementById('dropZoneInner');
        preview.src = e.target.result;
        preview.style.display = 'block';
        inner.style.display = 'none';
        document.getElementById('clearImageBtn').style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    document.getElementById('inputImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('dropZoneInner').style.display = 'block';
    document.getElementById('clearImageBtn').style.display = 'none';
}

//delete post
async function confirmDelete(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await deletePost(id);
}

async function deletePost(id) {
    try {
        const res = await fetch(`${API}/posts/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Post deleted', 'success');
            closeModalBtn();
            loadPosts(currentPage);
        } else {
            showToast(data.message || 'Failed to delete post', 'error');
        }
    } catch {
        showToast('Network error', 'error');
    }
}
//delete post model
function openPostModal(post) {
    const content = document.getElementById('modalContent');
    const tagsHtml = (post.tags && post.tags.length)
        ? post.tags.map(t => {
            const color = t.color || '#6366f1';
            return `<span class="tag-badge" style="background:${hexToRgba(color, 0.15)};color:${color};border-color:${hexToRgba(color, 0.3)}">#${t.name}</span>`;
        }).join('')
        : '<span style="font-size:13px;color:var(--text-3)">No tags</span>';

    const initials = (post.author || 'A').charAt(0).toUpperCase();

    content.innerHTML = `
    ${post.image ? `<img class="modal-img" src="${post.image}" alt="${escHtml(post.title)}" onerror="this.remove()" />` : ''}
    <div class="modal-body">
      <div class="modal-status-row">
        <span class="post-status-badge ${post.status || 'published'}">${post.status || 'published'}</span>
        <span class="post-date">${formatDate(post.createdAt)}</span>
      </div>
      <h2 class="modal-title">${escHtml(post.title)}</h2>
      <div class="modal-author">
        <div class="author-avatar">${initials}</div>
        <span>${escHtml(post.author || 'Anonymous')}</span>
      </div>
      <p class="modal-desc">${escHtml(post.desc)}</p>
      <div class="modal-tags">${tagsHtml}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModalBtn()">Close</button>
        <button class="btn btn-outline danger-btn" onclick="confirmDelete('${post._id}')">Delete Post</button>
      </div>
    </div>
  `;

    document.getElementById('postModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    if (event.target === document.getElementById('postModal')) closeModalBtn();
}

function closeModalBtn() {
    document.getElementById('postModal').style.display = 'none';
    document.body.style.overflow = '';
}

//tags
async function loadTags() {
    try {
        console.log('=== LOAD TAGS ===');
        console.log('Fetching from:', `${API}/tags`);

        const res = await fetch(`${API}/tags`);
        const data = await res.json();

        console.log('API Response:', data);

        if (!data.success) {
            console.warn('Tags API returned success=false');
            return;
        }

        allTags = data.data || [];
        console.log('Total tags loaded:', allTags.length);
        allTags.forEach((tag, idx) => {
            console.log(`  [${idx}] name="${tag.name}" color="${tag.color}" id="${tag._id}"`);
        });

        // Populate filter dropdown
        const filterTag = document.getElementById('filterTag');

        if (filterTag) {
            filterTag.innerHTML = '<option value="">All Tags</option>';
            allTags.forEach(tag => {
                const opt = document.createElement('option');
                opt.value = tag.name;
                opt.textContent = `#${tag.name}`;
                filterTag.appendChild(opt);
            });
            console.log('Filter dropdown populated with', allTags.length, 'options');
        }

        // Populate tag checkboxes in create form
        console.log('Rendering tag checkboxes...');
        renderTagCheckboxes();
        console.log('=== LOAD TAGS COMPLETE ===');

    } catch (error) {
        console.error('loadTags error:', error);
    }
}

function renderTagCheckboxes() {
    const container = document.getElementById('tagCheckboxes');
    console.log('renderTagCheckboxes() - container found:', !!container);
    console.log('renderTagCheckboxes() - allTags.length:', allTags.length);

    if (!container) {
        console.warn('tagCheckboxes container not found!');
        return;
    }

    container.innerHTML = '';

    if (!allTags.length) {
        console.log('No tags available');
        container.innerHTML = '<span style="font-size:13px;color:var(--text-3)">No tags yet — create some in the Tags tab</span>';
        return;
    }

    allTags.forEach((tag, index) => {
        const color = tag.color || '#6366f1';
        const label = document.createElement('label');
        label.className = 'tag-checkbox-label';

        const checkboxId = `tag-cb-${index}`;
        label.innerHTML = `
      <input type="checkbox" id="${checkboxId}" class="tag-checkbox-input" name="tags" value="${tag.name}" />
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
      #${tag.name}
    `;
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
            label.classList.toggle('checked', cb.checked);
            console.log(`Tag checkbox changed: ${tag.name}=${cb.checked}`);
        });
        container.appendChild(label);

        console.log(`Tag checkbox created: id=${checkboxId}, value=${tag.name}`);
    });

    console.log('renderTagCheckboxes() complete - created', allTags.length, 'checkboxes');
}

/** Render the full tags list in Tags tab */
async function loadTagsList() {
    await loadTags();

    const container = document.getElementById('tagsListContainer');
    const countBadge = document.getElementById('tagCountBadge');

    if (!container) return;

    countBadge.textContent = allTags.length;

    if (!allTags.length) {
        container.innerHTML = '<p style="color:var(--text-3);font-size:14px;text-align:center;padding:24px 0">No tags created yet</p>';
        return;
    }

    container.innerHTML = allTags.map(tag => `
    <div class="tag-list-item">
      <div class="tag-list-left">
        <div class="tag-color-dot" style="background:${tag.color || '#6366f1'}"></div>
        <div>
          <div class="tag-list-name">#${tag.name}</div>
          <div class="tag-list-date">${formatDate(tag.createdAt)}</div>
        </div>
      </div>
      <button class="tag-delete-btn" onclick="deleteTag('${tag._id}', '${tag.name}')" title="Delete tag">✕</button>
    </div>
  `).join('');
}

/** Create a new tag */
async function submitTag(event) {
    event.preventDefault();

    const name = document.getElementById('tagName').value.trim();
    const color = document.getElementById('tagColor').value;

    if (!name) {
        showToast('Tag name is required', 'error');
        return;
    }

    const btn = document.getElementById('createTagBtn');
    btn.disabled = true;
    btn.textContent = 'Creating…';

    try {
        const res = await fetch(`${API}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast(`Tag "#${data.data.name}" created!`, 'success');
            document.getElementById('tagForm').reset();
            document.getElementById('tagColor').value = '#6366f1';
            updateTagPreview();
            await loadTagsList();
        } else {
            showToast(data.message || 'Failed to create tag', 'error');
        }
    } catch {
        showToast('Network error', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Tag';
    }
}

/** Delete a tag */
async function deleteTag(id, name) {
    if (!confirm(`Delete tag "#${name}"? Posts using it won't be affected.`)) return;

    try {
        const res = await fetch(`${API}/tags/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast(`Tag "#${name}" deleted`, 'success');
            await loadTagsList();
            loadTags(); // Refresh dropdowns
        } else {
            showToast(data.message || 'Failed to delete tag', 'error');
        }
    } catch {
        showToast('Network error', 'error');
    }
}

/** Update tag preview chip in the create-tag form */
function updateTagPreview() {
    const name = document.getElementById('tagName')?.value.trim() || 'tagname';
    const color = document.getElementById('tagColor')?.value || '#6366f1';
    const preview = document.getElementById('tagPreview');
    if (!preview) return;

    preview.textContent = `#${name || 'tagname'}`;
    preview.style.background = hexToRgba(color, 0.15);
    preview.style.color = color;
    preview.style.borderColor = hexToRgba(color, 0.35);
}

function setColor(hex) {
    document.getElementById('tagColor').value = hex;
    updateTagPreview();
}


function showSkeleton(visible) {
    document.getElementById('skeleton').style.display = visible ? 'grid' : 'none';
}

//toast notification
let toastTimer = null;

function showToast(message, type = 'info') {
    const toast = document.getElementById('globalToast');
    toast.textContent = message;
    toast.className = `global-toast ${type} show`;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = `global-toast ${type}`;
    }, 3500);
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Format ISO date string to readable format */
function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

/** Convert hex color to rgba string */
function hexToRgba(hex, alpha = 1) {
    if (!hex || hex.length < 4) return `rgba(99,102,241,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}