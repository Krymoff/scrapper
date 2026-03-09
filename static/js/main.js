/**
 * Główny plik JavaScript dla Kalendarza Wydarzeń Pogranicza
 */

let calendar;
let currentLanguage = '';
let currentSearch = '';

// Inicjalizacja kalendarza po załadowaniu strony
document.addEventListener('DOMContentLoaded', function () {
    initCalendar();
    setupEventListeners();
    loadEvents();
});

/**
 * Inicjalizuje kalendarz FullCalendar
 */
function initCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridWeek', // Widok tygodniowy (7 dni)
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridWeek,dayGridMonth'
        },
        locale: 'pl',
        firstDay: 1, // Poniedziałek jako pierwszy dzień
        events: [],
        eventClick: function (info) {
            showEventDetails(info.event);
        },
        eventDisplay: 'block',
        height: 'auto'
    });

    calendar.render();
}

/**
 * Ustawia nasłuchiwacze zdarzeń dla przycisków i filtrów
 */
function setupEventListeners() {
    // Przycisk wyszukiwania
    document.getElementById('searchBtn').addEventListener('click', function () {
        performSearch();
    });

    // Enter w polu wyszukiwania
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Przycisk wyczyść
    document.getElementById('clearBtn').addEventListener('click', function () {
        document.getElementById('searchInput').value = '';
        currentSearch = '';
        loadEvents();
    });

    // Przycisk "Pobierz nowe wydarzenia"
    document.getElementById('scrapeBtn').addEventListener('click', function () {
        const btn = this;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '🔄 Pobieranie...';

        fetch('/api/scrape', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Pomyślnie pobrano ${data.scraped} wydarzeń (${data.added} nowych).`);
                    loadEvents();
                } else {
                    alert('Błąd podczas pobierania wydarzeń: ' + (data.error || 'Nieznany błąd'));
                }
            })
            .catch(error => {
                console.error('Błąd scrapowania:', error);
                alert('Błąd połączenia z serwerem.');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
    });

    // Przycisk "Zaskocz mnie!"
    document.getElementById('surpriseBtn').addEventListener('click', function () {
        showRandomEvent();
    });

    // Filtry języka
    document.querySelectorAll('input[name="languageFilter"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            currentLanguage = this.value;
            loadEvents();
        });
    });
}

/**
 * Ładuje wydarzenia z API
 */
function loadEvents() {
    let url = '/api/events?';

    if (currentLanguage) {
        url += `language=${currentLanguage}&`;
    }

    if (currentSearch) {
        url += `search=${encodeURIComponent(currentSearch)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            calendar.removeAllEvents();
            if (Array.isArray(data)) {
                data.forEach(event => calendar.addEvent(event));
            }
        })
        .catch(error => {
            console.error('Błąd podczas ładowania wydarzeń:', error);
            alert('Nie udało się załadować wydarzeń. Spróbuj ponownie.');
        });
}

/**
 * Wykonuje wyszukiwanie wydarzeń
 */
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        currentSearch = '';
        loadEvents();
        return;
    }

    currentSearch = query;

    // Używamy endpointu wyszukiwania
    let url = `/api/search?q=${encodeURIComponent(query)}`;

    if (currentLanguage) {
        url += `&language=${currentLanguage}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            calendar.removeAllEvents();
            if (Array.isArray(data)) {
                data.forEach(event => calendar.addEvent(event));
            }

            if (data.length === 0) {
                alert('Nie znaleziono wydarzeń dla podanego zapytania.');
            }
        })
        .catch(error => {
            console.error('Błąd podczas wyszukiwania:', error);
            alert('Nie udało się wyszukać wydarzeń.');
        });
}

/**
 * Pokazuje losowe wydarzenie w modalu
 */
function showRandomEvent() {
    const modal = new bootstrap.Modal(document.getElementById('surpriseModal'));
    const modalBody = document.getElementById('surpriseModalBody');
    const eventLink = document.getElementById('eventLink');

    modalBody.innerHTML = '<p>Ładowanie wydarzenia...</p>';
    modal.show();

    fetch('/api/random-event')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                modalBody.innerHTML = `<p class="text-danger">${data.error}</p>`;
                eventLink.style.display = 'none';
                return;
            }

            // Formatowanie daty
            const date = new Date(data.date);
            const formattedDate = date.toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            modalBody.innerHTML = `
                <div class="event-detail">
                    <h4>${data.title}</h4>
                    <p><strong>📅 Data:</strong> ${formattedDate}</p>
                    <p><strong>📍 Lokalizacja:</strong> ${data.location || 'Nie podano'}</p>
                    <p><strong>🌐 Język:</strong> ${data.language}</p>
                    ${data.description ? `<p><strong>📝 Opis:</strong> ${data.description}</p>` : ''}
                </div>
            `;

            eventLink.href = data.source_url;
            eventLink.style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Błąd podczas pobierania losowego wydarzenia:', error);
            modalBody.innerHTML = '<p class="text-danger">Nie udało się pobrać wydarzenia. Spróbuj ponownie.</p>';
            eventLink.style.display = 'none';
        });
}

/**
 * Pokazuje szczegóły wydarzenia po kliknięciu w kalendarzu
 */
function showEventDetails(event) {
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const modalTitle = document.getElementById('eventModalTitle');
    const modalBody = document.getElementById('eventModalBody');
    const eventDetailLink = document.getElementById('eventDetailLink');

    const eventData = event.extendedProps;
    const date = new Date(event.start);
    const formattedDate = date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    modalTitle.textContent = event.title;

    modalBody.innerHTML = `
        <div class="event-detail">
            <p><strong>📅 Data:</strong> ${formattedDate}</p>
            <p><strong>📍 Lokalizacja:</strong> ${eventData.location || 'Nie podano'}</p>
            <p><strong>🌐 Język:</strong> ${eventData.language || 'PL'}</p>
            ${eventData.description ? `<p><strong>📝 Opis:</strong> ${eventData.description}</p>` : ''}
        </div>
    `;

    eventDetailLink.href = eventData.source_url || '#';
    modal.show();
}
