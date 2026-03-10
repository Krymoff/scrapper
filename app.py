"""
Główny plik aplikacji Flask - Kalendarz Wydarzeń Pogranicza.
"""
from flask import Flask, render_template, jsonify, request
from database import Database
from scraper import EventScraper
from datetime import datetime
import dateparser


app = Flask(__name__)
db = Database()
scraper = EventScraper()

def infer_tag(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    rules = [
        ("koncert", ["koncert", "muzyka", "jazz", "metal", "rock", "pop", "dj"]),
        ("przedstawienie", ["teatr", "spektakl", "przedstawienie", "opera", "balet"]),
        ("wystawa", ["wystawa", "galeria", "sztuka", "wernisaż", "expo"]),
        ("film", ["kino", "film", "seans"]),
        ("sport", ["sport", "mecz", "turniej", "bieg", "maraton"]),
        ("warsztaty", ["warsztat", "szkolenie", "kurs"]),
        ("spotkanie", ["spotkanie", "wykład", "prelekcja", "debata", "konferencja"]),
    ]
    for tag, keywords in rules:
        if any(k in text for k in keywords):
            return tag
    return "inne"

# Uzupełnij brakujące tagi w istniejących rekordach
db.backfill_tags(infer_tag)

@app.route('/')
def index():
    """Strona główna z kalendarzem."""
    return render_template('index.html')


@app.route('/api/events')
def get_events():
    """
    API endpoint zwracający przyszłe wydarzenia.
    Obsługuje parametry: language, search, tag
    """
    language = request.args.get('language', None)
    search_query = request.args.get('search', None)
    tag = request.args.get('tag', None)
    if tag == "":
        tag = None
    
    if search_query:
        # Wyszukiwanie po zapytaniu
        events = db.search_events(search_query, language, tag)
    else:
        # Standardowe przyszłe wydarzenia
        events = db.get_events(days_ahead=365, language=language, tag=tag)
    
    # Formatowanie dla FullCalendar
    formatted_events = []
    for event in events:
        formatted_events.append({
            'id': event['id'],
            'title': event['title'],
            'start': event['date'],
            'location': event['location'],
            'description': event['description'],
            'source_url': event['source_url'],
            'language': event['language'],
            'tag': event.get('tag') or 'inne'
        })
    
    return jsonify(formatted_events)


@app.route('/api/random-event')
def get_random_event():
    """
    API endpoint zwracający losowe przyszłe wydarzenie.
    Używane przez funkcję "Zaskocz mnie!"
    """
    event = db.get_random_future_event()
    
    if event:
        return jsonify({
            'id': event['id'],
            'title': event['title'],
            'date': event['date'],
            'location': event['location'],
            'description': event['description'],
            'source_url': event['source_url'],
            'language': event['language'],
            'tag': event.get('tag') or 'inne'
        })
    else:
        return jsonify({'error': 'Brak dostępnych wydarzeń'}), 404


@app.route('/api/scrape', methods=['POST'])
def scrape_events():
    """
    Endpoint do uruchomienia scrapowania wydarzeń.
    Można wywołać przez POST request.
    """
    try:
        events = scraper.scrape_all_sources()
        added_count = 0
        
        for event in events:
            if db.add_event(
                title=event['title'],
                date=event['date'],
                location=event['location'],
                description=event['description'],
                source_url=event['source_url'],
                language=event['language'],
                tag=infer_tag(event.get('title', ''), event.get('description', ''))
            ):
                added_count += 1
        
        return jsonify({
            'success': True,
            'scraped': len(events),
            'added': added_count
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/search')
def search_events():
    """
    Endpoint do wyszukiwania wydarzeń.
    Obsługuje wyszukiwanie po mieście lub dacie.
    """
    query = request.args.get('q', '')
    language = request.args.get('language', None)
    tag = request.args.get('tag', None)
    if tag == "":
        tag = None
    
    if not query:
        return jsonify([])
    
    # Sprawdzamy czy zapytanie wygląda na datę
    # Próbujemy sparsować jako datę (np. "jutro", "12 maja", "1. Mai")
    parsed_date = None
    for lang in ['pl', 'de']:
        parsed = dateparser.parse(query, languages=[lang], settings={
            'PREFER_DATES_FROM': 'future',
            'RELATIVE_BASE': datetime.now()
        })
        if parsed:
            parsed_date = parsed.strftime("%Y-%m-%d")
            break
    
    if parsed_date:
        # Wyszukiwanie po dacie
        events = db.get_events(days_ahead=365, language=language, tag=tag)
        events = [e for e in events if e['date'] == parsed_date]
    else:
        # Wyszukiwanie po tekście (miasto, tytuł, opis)
        events = db.search_events(query, language, tag)
    
    formatted_events = []
    for event in events:
        formatted_events.append({
            'id': event['id'],
            'title': event['title'],
            'start': event['date'],
            'location': event['location'],
            'description': event['description'],
            'source_url': event['source_url'],
            'language': event['language'],
            'tag': event.get('tag') or 'inne'
        })
    
    return jsonify(formatted_events)


if __name__ == '__main__':
    # Uruchomienie aplikacji
    print("Kalendarz Wydarzeń Pogranicza - uruchamianie...")
    print("Aplikacja dostępna pod adresem: http://127.0.0.1:8080")
    app.run(debug=True, host='0.0.0.0', port=8080)
