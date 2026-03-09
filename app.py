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


@app.route('/')
def index():
    """Strona główna z kalendarzem."""
    return render_template('index.html')


@app.route('/api/events')
def get_events():
    """
    API endpoint zwracający wydarzenia na najbliższe 7 dni.
    Obsługuje parametry: language, search
    """
    language = request.args.get('language', None)
    search_query = request.args.get('search', None)
    
    if search_query:
        # Wyszukiwanie po zapytaniu
        events = db.search_events(search_query, language)
    else:
        # Standardowe wydarzenia na 7 dni
        events = db.get_events(days_ahead=7, language=language)
    
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
            'language': event['language']
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
            'language': event['language']
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
                language=event['language']
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
        events = db.get_events(days_ahead=365, language=language)
        events = [e for e in events if e['date'] == parsed_date]
    else:
        # Wyszukiwanie po tekście (miasto, tytuł, opis)
        events = db.search_events(query, language)
    
    formatted_events = []
    for event in events:
        formatted_events.append({
            'id': event['id'],
            'title': event['title'],
            'start': event['date'],
            'location': event['location'],
            'description': event['description'],
            'source_url': event['source_url'],
            'language': event['language']
        })
    
    return jsonify(formatted_events)


if __name__ == '__main__':
    # Uruchomienie aplikacji
    print("Kalendarz Wydarzeń Pogranicza - uruchamianie...")
    print("Aplikacja dostępna pod adresem: http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
