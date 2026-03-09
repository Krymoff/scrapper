# Kalendarz Wydarzeń Pogranicza - Słubice/Frankfurt

Aplikacja full-stackowa do scrapowania i wyświetlania wydarzeń z regionu pogranicza polsko-niemieckiego.

## Wymagania

- Python 3.8+
- pip (menedżer pakietów Python)

## Instalacja

1. Zainstaluj zależności:
```bash
pip install -r requirements.txt
```

## Uruchomienie

1. Uruchom aplikację:
```bash
python app.py
```

2. Otwórz przeglądarkę i przejdź do:
```
http://127.0.0.1:5000
```

## Scrapowanie wydarzeń

Aby zaktualizować bazę danych wydarzeń, możesz:

1. Użyć endpointu API (POST request):
```bash
curl -X POST http://127.0.0.1:5000/api/scrape
```

2. Lub dodać automatyczne scrapowanie w `app.py` przy starcie aplikacji.

## Funkcjonalności

- ✅ Scrapowanie wydarzeń ze strony SMOK Słubice
- ✅ Przechowywanie w bazie SQLite
- ✅ Kalendarz z widokiem 7 dni (FullCalendar.js)
- ✅ Wyszukiwanie po mieście lub dacie
- ✅ Przycisk "Zaskocz mnie!" z losowym wydarzeniem
- ✅ Obsługa języków PL/DE
- ✅ Architektura gotowa na rozbudowę o kolejne parsery

## Struktura projektu

```
scrapper/
├── app.py                 # Główna aplikacja Flask
├── scraper.py            # Moduł scrapujący
├── database.py           # Obsługa bazy danych
├── requirements.txt      # Zależności
├── events.db            # Baza danych SQLite (tworzona automatycznie)
├── templates/
│   └── index.html        # Szablon HTML
└── static/
    ├── css/
    │   └── style.css     # Style CSS
    └── js/
        └── main.js       # JavaScript
```

## Rozbudowa o kolejne parsery

Aby dodać kolejne źródła wydarzeń:

1. Dodaj nową metodę w `scraper.py` (np. `scrape_frankfurt_events()`)
2. Wywołaj ją w metodzie `scrape_all_sources()`
3. Dostosuj selektory CSS/HTML do struktury nowej strony

## Uwagi

- Selektory CSS w `scraper.py` mogą wymagać dostosowania do rzeczywistej struktury strony SMOK Słubice
- Aplikacja używa `dateparser` do parsowania dat w językach PL i DE
- Baza danych automatycznie zapobiega duplikatom wydarzeń
