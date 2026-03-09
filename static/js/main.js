/**
 * Główny plik JavaScript dla Kalendarza Wydarzeń Pogranicza
 * Autentyczna integracja projektu ze Stitcha z prawdziwymi danymi ze scrapera.
 */

let currentLanguage = '';
let currentSearch = '';
let currentDate = new Date(); // Środek aktualnego widoku tygodnia

document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    renderCalendar();
});

/**
 * Renderuje szkielet kalendarza i ładuje wydarzenia
 */
function renderCalendar() {
    renderHeaders();
    renderTimeColumn();
    loadEvents();
}

/**
 * Ustawia nasłuchiwacze zdarzeń
 */
function setupEventListeners() {
    // Wyszukiwanie
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Nawigacja datami (Chevron Left/Right i Dziś)
    document.getElementById('prevBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    });
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    // Filtry (przyciski) - obsługujemy jak toggle lub zwykłe filtrowanie
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

    // Dodanie akcji dla starych przycisków, np. "Koncerty" - dla spójności UI (wizualne wciśnięcie, bez backendowej logiki językowej)
    const allCatBtns = document.querySelectorAll('#filtersContainer button:not(.filter-btn)');
    allCatBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Wyczyść wyszukiwarkę itp. w ramach 'demo' integracji
            document.getElementById('searchInput').value = this.innerText;
            performSearch();
        });
    });

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
 * Renderuje nagłówki dni (Pon - Ndz)
 */
function renderHeaders() {
    const headerRow = document.getElementById('calendarHeader');
    const startOfWeek = getStartOfWeek(currentDate);

    // Zostaw pusty narożnik
    const timePlaceholder = headerRow.firstElementChild;
    headerRow.innerHTML = '';
    headerRow.appendChild(timePlaceholder);

    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const isToday = dayDate.getTime() === today.getTime();
        const isSunday = i === 6;

        const dayDiv = document.createElement('div');
        dayDiv.className = `p-4 text-center border-l border-slate-100 dark:border-slate-700/50 ${isToday ? 'bg-primary/5' : ''}`;

        dayDiv.innerHTML = `
            <p class="text-xs font-bold ${isToday ? 'text-primary' : (isSunday ? 'text-red-400' : 'text-slate-400 dark:text-slate-500')} uppercase tracking-widest">${days[i]}</p>
            <p class="text-xl font-bold ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}">${dayDate.getDate()}</p>
            ${isToday ? '<div class="mt-1 w-1.5 h-1.5 bg-primary rounded-full mx-auto"></div>' : ''}
        `;
        headerRow.appendChild(dayDiv);
    }

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Format Month
    const months = ['Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca', 'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia'];
    const sMonth = months[startOfWeek.getMonth()];
    const eMonth = months[endOfWeek.getMonth()];

    let rangeText = '';
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        rangeText = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${sMonth} ${startOfWeek.getFullYear()}`;
    } else {
        rangeText = `${startOfWeek.getDate()} ${sMonth} - ${endOfWeek.getDate()} ${eMonth} ${startOfWeek.getFullYear()}`;
    }
    document.getElementById('currentDateRange').textContent = rangeText;
}

/**
 * Renderuje kolumnę czasu
 */
function renderTimeColumn() {
    const timeColumn = document.getElementById('timeColumn');
    timeColumn.innerHTML = '';
    for (let h = 8; h <= 20; h += 2) {
        const hourDiv = document.createElement('div');
        hourDiv.className = 'h-24 p-2 text-right';
        hourDiv.innerHTML = `<span class="text-xs font-medium text-slate-400 dark:text-slate-500">${h.toString().padStart(2, '0')}:00</span>`;
        timeColumn.appendChild(hourDiv);
    }
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
            clearEventCards();
            data.forEach(renderEventCard);
        })
        .catch(err => console.error(err));
}

function clearEventCards() {
    document.querySelectorAll('.event-card-container').forEach(c => c.remove());
}

/**
 * Renderuje kartę dla jednego wydarzenia bazując na koordynatach siatki Stitch
 */
function renderEventCard(event) {
    const dateStr = event.start.includes(' ') ? event.start.replace(' ', 'T') : event.start + 'T00:00:00';
    const eventDate = new Date(dateStr);
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    if (eventDate < startOfWeek || eventDate >= endOfWeek) return;

    const dayIndex = (eventDate.getDay() + 6) % 7;
    const column = document.querySelector(`.day-column.day-${dayIndex}`);
    if (!column) return;

    // Przeliczenie top: 8:00 to 0px, jedna godzina = 48px
    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    const top = Math.max(0, (hour - 8) * 48 + (minutes / 60) * 48);

    // Kategoryzacja kolorów - jak w legendzie ze stitch (Edukacja=niebieski, Sztuka=pomarańczowy, Muzyka=fioletowy)
    let colorClass = 'blue';
    const titleLower = event.title.toLowerCase();

    if (titleLower.includes('koncert') || titleLower.includes('muzyka') || titleLower.includes('metal') || titleLower.includes('jazz')) {
        colorClass = 'purple';
    } else if (titleLower.includes('wystawa') || titleLower.includes('sztuka') || titleLower.includes('galeria') || titleLower.includes('pro arte')) {
        colorClass = 'amber';
    }

    const cardContainer = document.createElement('div');
    cardContainer.className = 'absolute inset-x-1 z-10 event-card-container';
    cardContainer.style.top = `${top}px`;
    cardContainer.style.height = '60px'; // Domyślnie 60px wysokości

    // Dokładnie te same klasy co u Stitcha
    cardContainer.innerHTML = `
        <div class="h-full bg-${colorClass}-50 dark:bg-${colorClass}-900/30 border-l-4 border-${colorClass}-500 rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
            <p class="text-[10px] font-bold text-${colorClass}-600 dark:text-${colorClass}-400 uppercase">${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}</p>
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors" title="${event.title}">${event.title}</h3>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${event.location || 'Nie podano lokalizacji'}</p>
        </div>
    `;

    cardContainer.addEventListener('click', () => showEventModal(event));
    column.appendChild(cardContainer);
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

    body.innerHTML = `
        <div class="space-y-3">
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
                    <p class="text-sm"><strong>Data:</strong> ${dateStr}<br><strong>Miejsce:</strong> ${data.location || 'Brak'}<br><strong>Język:</strong> ${data.language}</p>
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

function getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}
