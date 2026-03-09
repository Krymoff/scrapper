# Dokumentacja Projektu: Kalendarz Wydarzeń Pogranicza (Scrapper)

## 📋 Opis Projektu
Aplikacja służy do automatycznego pobierania (scrapowania) ofert i wydarzeń z wybranych stron internetowych (np. Słubice, Frankfurt nad Odrą) i prezentowania ich w formie interaktywnego kalendarza. Docelowo oferty te mają być wykorzystywane w serwisie Bildungsportal.

## 🚀 Instalacja i Uruchomienie

### Wymagania
*   Python 3.13+
*   System macOS (zoptymalizowane pod ten system)

### Kroki instalacji
1.  Upewnij się, że masz aktywne środowisko wirtualne (zalecane).
2.  Zainstaluj wymagane biblioteki:
    ```bash
    pip install -r requirements.txt
    ```

### Uruchomienie aplikacji
1.  Uruchom serwer Flask:
    ```bash
    python3 app.py
    ```
2.  Otwórz przeglądarkę pod adresem:
    **[http://127.0.0.1:8080](http://127.0.0.1:8080)**
    *(Uwaga: Port 8080 został wybrany, aby uniknąć konfliktów z usługą AirPlay w macOS).*

## 🛠 Architektura Systemu

### Pliki Projektu
*   `app.py`: Główny plik serwera Flask. Obsługuje routing API oraz serwowanie strony WWW.
*   `scraper.py`: Logika pobierania danych. Wykorzystuje `BeautifulSoup4` do parsowania HTML oraz `dateparser` do interpretacji dat w różnych językach.
*   `database.py`: Obsługa bazy danych SQLite (`events.db`). Przechowuje wydarzenia i zapobiega duplikatom.
*   `requirements.txt`: Lista zależności (pakiety Python).
*   `static/`: Pliki CSS oraz JavaScript (`main.js`).
*   `templates/`: Szablony HTML (`index.html`).

### Baza danych (`events.db`)
Aplikacja korzysta z lekkiej bazy SQLite. Wydarzenia są unikalne na podstawie kombinacji: "Tytuł + Data + Link źródłowy".

## 🔄 Mechanizm Scrapowania

### Jak to działa?
Scraper działa obecnie w trybie **na żądanie (on-demand)**.
1. Użytkownik klika przycisk **"🔄 Pobierz nowe wydarzenia"** w interfejsie.
2. Aplikacja łączy się ze stronami źródłowymi (obecnie zaimplementowano pełne wsparcie dla `smok.slubice.pl`).
3. Kod analizuje strukturę strony (opartą na Elementorze) i wyciąga:
    *   Tytuł wydarzenia
    *   Datę i godzinę (z automatycznym tłumaczeniem miesięcy typu "marca" -> "03")
    *   Opis oraz link do oryginału.
4. Dane są zapisywane w bazie, a kalendarz odświeża się bez przeładowania strony.

## ⚠️ Znane błędy i Rozwiązania
*   **Adres 5000 zajęty**: macOS używa portu 5000 dla "AirPlay Receiver". Aplikacja została domyślnie przeniesiona na port **8080**.
*   **Problem z lxml**: Starsze wersje biblioteki `lxml` nie kompilowały się na Pythonie 3.13. Wymagana wersja to `>= 5.3.1`.

## 📈 Plany Rozwoju
*   Dodanie kolejnych źródeł z Frankfurtu nad Odrą (np. frankfurt-oder.de).
*   Automatyzacja scrapowania (uruchamianie w tle co X godzin).
*   Możliwość filtrowania po kategoriach (sport, kultura, edukacja).
