/**
 * Główny plik JavaScript dla Kalendarza Wydarzeń Pogranicza
 * Autentyczna integracja projektu ze Stitcha z prawdziwymi danymi ze scrapera.
 */

let currentLanguage = '';
let currentSearch = '';
let currentTag = '';
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    loadEvents();
});

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupEventListeners() {
    // Wyszukiwanie
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Filtry językowe (przyciski) - obsługujemy jak toggle
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                });
                this.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
                this.classList.add('bg-primary', 'text-white');

                currentLanguage = this.dataset.lang || '';
                loadEvents();
            });
        });
    }

    // Przycisk "Pobierz nowe"
    document.getElementById('scrapeBtn').addEventListener('click', function () {
        const btn = this;
        const orgHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span><span>Pobieranie...</span>';

        fetch('/api/scrape', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(`Pobrano ${data.scraped} wydarzeń (${data.added} nowych).`);
                    loadEvents();
                } else {
                    alert('Błąd pobierania: ' + (data.error || 'Nieznany błąd'));
                }
            })
            .catch(err => {
                console.error(err);
                alert('Błąd połączenia z serwerem.');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = orgHTML;
            });
    });

    // Zaskocz mnie
    document.getElementById('surpriseBtn').addEventListener('click', showRandomEvent);
}

/**
 * Pobiera wydarzenia i czyści stare
 */
function loadEvents() {
    let url = '/api/events?';
    if (currentLanguage) url += `language=${currentLanguage}&`;
    if (currentSearch) url += `search=${encodeURIComponent(currentSearch)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const allEvents = data.map(ensureTag);
            clearEventCards();
            renderTagList(allEvents);
            const filtered = applyTagFilter(allEvents);
            const sorted = sortEvents(filtered);
            updateEventsCount(sorted.length);
            renderEmptyStateIfNeeded(sorted);
            sorted.forEach(renderEventTile);
        })
        .catch(err => console.error(err));
}

function clearEventCards() {
    const list = document.getElementById('eventsList');
    if (list) list.innerHTML = '';
}

/**
 * Renderuje kafelek dla jednego wydarzenia
 */
function renderEventTile(event) {
    const list = document.getElementById('eventsList');
    if (!list) return;

    const dateStrSafe = event.start.includes(' ') ? event.start.replace(' ', 'T') : event.start + 'T00:00:00';
    const eventDate = new Date(dateStrSafe);
    const hasTime = event.start.includes(' ');
    const dateStr = eventDate.toLocaleDateString('pl-PL', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: hasTime ? '2-digit' : undefined,
        minute: hasTime ? '2-digit' : undefined
    });

    const tag = event.tag || 'inne';
    const tagColor = getTagColor(tag);

    const tile = document.createElement('div');
    tile.className = 'event-tile min-h-[220px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm cursor-pointer';
    tile.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-${tagColor}-600 dark:text-${tagColor}-400 bg-${tagColor}-50 dark:bg-${tagColor}-900/30 px-2.5 py-1 rounded-full">${tag}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">${event.language}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">${event.title}</h3>
        <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">schedule</span>
                <span>${dateStr}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">location_on</span>
                <span>${event.location || 'Nie podano lokalizacji'}</span>
            </div>
        </div>
    `;

    tile.addEventListener('click', () => showEventModal(event));
    list.appendChild(tile);
}

function performSearch() {
    currentSearch = document.getElementById('searchInput').value.trim();
    loadEvents();
}

/** Modale */
function showEventModal(event) {
    document.getElementById('eventModalTitle').textContent = event.title;
    const body = document.getElementById('eventModalBody');
    const dateStrSafe = event.start.includes(' ') ? event.start.replace(' ', 'T') : event.start + 'T00:00:00';
    const dateStr = new Date(dateStrSafe).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const tag = event.tag || 'inne';

    body.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">sell</span>
                <span class="font-medium">Tag: ${tag}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">calendar_today</span>
                <span class="font-medium">${dateStr}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">location_on</span>
                <span>${event.location || 'Nie podano'}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">language</span>
                <span>Język: ${event.language}</span>
            </div>
            ${event.description ? `<p class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm leading-relaxed">${event.description}</p>` : ''}
        </div>
    `;

    document.getElementById('eventDetailLink').href = event.source_url || '#';
    openModal('eventModal');
}

function showRandomEvent() {
    const body = document.getElementById('surpriseModalBody');
    const link = document.getElementById('eventLink');
    body.innerHTML = '<div class="flex justify-center p-8"><span class="material-symbols-outlined animate-spin text-primary text-4xl">sync</span></div>';
    openModal('surpriseModal');

    fetch('/api/random-event')
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                body.innerHTML = `<p class="text-center py-8 text-red-500">${data.error}</p>`;
                link.classList.add('hidden');
                return;
            }
    const dateStrSafe = data.date.includes(' ') ? data.date.replace(' ', 'T') : data.date + 'T00:00:00';
    const dateStr = new Date(dateStrSafe).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            body.innerHTML = `
                <div class="space-y-4">
                    <h4 class="text-lg font-bold text-primary">${data.title}</h4>
                    <p class="text-sm"><strong>Data:</strong> ${dateStr}<br><strong>Miejsce:</strong> ${data.location || 'Brak'}<br><strong>Język:</strong> ${data.language}<br><strong>Tag:</strong> ${data.tag || 'inne'}</p>
                    ${data.description ? `<p class="text-sm italic mt-2 text-slate-500">"${data.description.substring(0, 100)}..."</p>` : ''}
                </div>
            `;
            link.href = data.source_url;
            link.classList.remove('hidden');
        })
        .catch(err => body.innerHTML = '<p class="text-red-500">Błąd połączenia.</p>');
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function ensureTag(event) {
    if (!event.tag) event.tag = 'inne';
    return event;
}

function getTagColor(tag) {
    const map = {
        'koncert': 'purple',
        'przedstawienie': 'rose',
        'wystawa': 'amber',
        'film': 'blue',
        'sport': 'emerald',
        'warsztaty': 'teal',
        'spotkanie': 'indigo',
        'inne': 'slate'
    };
    return map[tag] || 'slate';
}

function renderTagList(events) {
    const tagList = document.getElementById('tagList');
    if (!tagList) return;
    const tags = new Set();
    events.forEach(e => tags.add((e.tag || 'inne').toLowerCase()));

    const sorted = Array.from(tags).sort((a, b) => a.localeCompare(b));
    tagList.innerHTML = '';
    const allBtn = buildTagButton('', 'Wszystkie');
    tagList.appendChild(allBtn);

    if (sorted.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'text-sm text-slate-400';
        empty.textContent = 'Brak tagów';
        tagList.appendChild(empty);
        return;
    }
    sorted.forEach(tag => {
        const chip = buildTagButton(tag, tag);
        tagList.appendChild(chip);
    });
}

function buildTagButton(tagValue, label) {
    const isActive = (tagValue || '') === (currentTag || '');
    const color = tagValue ? getTagColor(tagValue) : 'slate';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.tag = tagValue;
    btn.className = `whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border transition-colors ${
        isActive
            ? `bg-${color}-600 text-white border-${color}-600`
            : `bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 border-${color}-200/60 dark:border-${color}-800/60 hover:border-${color}-400`
    }`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
        currentTag = (currentTag || '') === (tagValue || '') ? '' : (tagValue || '');
        loadEvents();
    });
    return btn;
}

function sortEvents(events) {
    return [...events].sort((a, b) => {
        const aTime = parseEventDate(a.start);
        const bTime = parseEventDate(b.start);
        return aTime - bTime;
    });
}

function applyTagFilter(events) {
    if (!currentTag) return events;
    return events.filter((event) => (event.tag || 'inne').toLowerCase() === currentTag.toLowerCase());
}

function parseEventDate(dateStr) {
    const safe = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr + 'T00:00:00';
    const time = new Date(safe).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function updateEventsCount(count) {
    const countNode = document.getElementById('eventsCount');
    if (!countNode) return;
    countNode.textContent = `${count} zapisanych wydarzen`;
}

function renderEmptyStateIfNeeded(events) {
    if (events.length > 0) return;
    const list = document.getElementById('eventsList');
    if (!list) return;

    const empty = document.createElement('div');
    empty.className = 'w-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400';
    empty.innerHTML = `
        <div class="flex flex-col items-center gap-2">
            <span class="material-symbols-outlined text-3xl text-slate-400">event_busy</span>
            <p>Brak wydarzen dla aktualnych filtrow.</p>
        </div>
    `;
    list.appendChild(empty);
}
