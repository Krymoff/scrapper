"""
Moduł scrapujący wydarzenia z różnych źródeł.
Obsługuje parsowanie dat w językach PL i DE.
"""
import requests
from bs4 import BeautifulSoup
import dateparser
from datetime import datetime
from typing import List, Dict, Optional
import re


class EventScraper:
    """Klasa do scrapowania wydarzeń z różnych źródeł."""
    
    def __init__(self):
        """Inicjalizacja scrapera z nagłówkami HTTP."""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def parse_date(self, date_str: str, language: str = 'pl') -> Optional[str]:
        """
        Parsuje datę z tekstu na format YYYY-MM-DD.
        Obsługuje języki PL i DE.
        
        Args:
            date_str: Tekst z datą (np. "12 maja", "1. Mai")
            language: Język ('pl' lub 'de')
        
        Returns:
            Data w formacie YYYY-MM-DD lub None jeśli nie udało się sparsować
        """
        # Ustawiamy język dla dateparser
        settings = {
            'DATE_ORDER': 'DMY' if language == 'pl' else 'DMY',
            'PREFER_DATES_FROM': 'future',
            'RELATIVE_BASE': datetime.now()
        }
        
        # Parsujemy datę
        parsed_date = dateparser.parse(date_str, languages=[language], settings=settings)
        
        if parsed_date:
            return parsed_date.strftime("%Y-%m-%d")
        
        return None
    
    def scrape_smok_slubice(self) -> List[Dict]:
        """
        Scrapuje wydarzenia ze strony https://smok.slubice.pl/wydarzenia/
        
        Returns:
            Lista słowników z wydarzeniami
        """
        url = "https://smok.slubice.pl/wydarzenia/"
        events = []
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # W nowej strukturze Elementor, wydarzenia są w sekcjach
            sections = soup.find_all('section', class_='elementor-section')
            
            for section in sections:
                try:
                    # Tytuł i Link
                    title_elem = section.find('h2', class_='elementor-heading-title')
                    if not title_elem:
                        continue
                        
                    title = title_elem.get_text(strip=True)
                    if not title or title.lower() in ['wydarzenia', 'kalendarz']:
                        continue
                        
                    link_elem = title_elem.find('a')
                    source_url = link_elem['href'] if link_elem else url
                    
                    # Data (może być w elementor-headline lub jet-listing-dynamic-field__content)
                    date_elem = (section.find(class_='elementor-headline') or 
                                 section.find(class_='jet-listing-dynamic-field__content') or
                                 section.find(class_='elementor-icon-list-text'))
                    
                    date_str = date_elem.get_text(strip=True) if date_elem else ""
                    
                    # Debug: jeśli date_str zawiera "Czytaj dalej", to szukamy innego elementu
                    if "czytaj dalej" in date_str.lower():
                        date_str = ""
                    
                    # Parsujemy datę
                    date = self.parse_date(date_str, language='pl')
                    if not date:
                        # Próbujemy znaleźć cokolwiek co wygląda na datę w tej sekcji
                        for text_block in section.find_all(['span', 'p', 'div']):
                            content = text_block.get_text(strip=True)
                            if any(m in content.lower() for m in ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']):
                                date = self.parse_date(content, language='pl')
                                if date:
                                    break
                    
                    if not date:
                        continue  # Pomijamy jeśli nadal brak daty
                    
                    # Lokalizacja (często SMOK Słubice)
                    location = "Słubice"
                    
                    # Opis (pierwszy paragraf w sekcji)
                    desc_elem = section.find('p')
                    description = desc_elem.get_text(strip=True) if desc_elem else ""
                    
                    events.append({
                        'title': title,
                        'date': date,
                        'location': location,
                        'description': description,
                        'source_url': source_url,
                        'language': 'PL'
                    })
                    
                except Exception as e:
                    print(f"Błąd podczas parsowania sekcji wydarzenia: {e}")
                    continue
            
        except requests.RequestException as e:
            print(f"Błąd podczas pobierania strony {url}: {e}")
        except Exception as e:
            print(f"Nieoczekiwany błąd: {e}")
        
        return events
    
    # Przykładowe funkcje dla kolejnych parserów (do rozbudowy)
    
    def scrape_frankfurt_events(self) -> List[Dict]:
        """
        Scrapuje wydarzenia z Frankfurtu (przykład - do implementacji).
        
        Returns:
            Lista słowników z wydarzeniami
        """
        # TODO: Implementacja parsera dla Frankfurtu
        # url = "https://example-frankfurt-events.de"
        events = []
        return events
    
    def scrape_slubice_culture(self) -> List[Dict]:
        """
        Scrapuje wydarzenia kulturalne ze Słubic (przykład - do implementacji).
        
        Returns:
            Lista słowników z wydarzeniami
        """
        # TODO: Implementacja kolejnego parsera
        events = []
        return events
    
    # Można dodać kolejne metody:
    # scrape_frankfurt_culture()
    # scrape_slubice_sports()
    # scrape_frankfurt_sports()
    # itd. (łącznie 10 parserów)
    
    def scrape_all_sources(self) -> List[Dict]:
        """
        Scrapuje wydarzenia ze wszystkich dostępnych źródeł.
        
        Returns:
            Lista wszystkich wydarzeń
        """
        all_events = []
        
        # Główny parser
        all_events.extend(self.scrape_smok_slubice())
        
        # Kolejne parsery (do odkomentowania po implementacji)
        # all_events.extend(self.scrape_frankfurt_events())
        # all_events.extend(self.scrape_slubice_culture())
        # ... itd.
        
        return all_events
