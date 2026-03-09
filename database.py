"""
Moduł obsługi bazy danych SQLite dla wydarzeń.
"""
import sqlite3
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class Database:
    """Klasa do zarządzania bazą danych wydarzeń."""
    
    def __init__(self, db_path: str = "events.db"):
        """
        Inicjalizacja połączenia z bazą danych.
        
        Args:
            db_path: Ścieżka do pliku bazy danych SQLite
        """
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Tworzy tabelę events jeśli nie istnieje."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                location TEXT,
                description TEXT,
                source_url TEXT NOT NULL,
                language TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(title, date, source_url)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_event(self, title: str, date: str, location: str, 
                  description: str, source_url: str, language: str) -> bool:
        """
        Dodaje wydarzenie do bazy danych.
        
        Args:
            title: Tytuł wydarzenia
            date: Data w formacie YYYY-MM-DD
            location: Lokalizacja wydarzenia
            description: Opis wydarzenia
            source_url: URL źródła wydarzenia
            language: Język (PL/DE)
        
        Returns:
            True jeśli dodano, False jeśli już istnieje
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO events (title, date, location, description, source_url, language)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (title, date, location, description, source_url, language))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            # Wydarzenie już istnieje
            return False
        finally:
            conn.close()
    
    def get_events(self, days_ahead: int = 7, language: Optional[str] = None) -> List[Dict]:
        """
        Pobiera wydarzenia na najbliższe dni.
        
        Args:
            days_ahead: Liczba dni do przodu (domyślnie 7)
            language: Filtr języka (PL/DE) lub None dla wszystkich
        
        Returns:
            Lista słowników z wydarzeniami
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        
        if language:
            cursor.execute("""
                SELECT * FROM events 
                WHERE date >= ? AND date <= ? AND language = ?
                ORDER BY date ASC
            """, (today, end_date, language))
        else:
            cursor.execute("""
                SELECT * FROM events 
                WHERE date >= ? AND date <= ?
                ORDER BY date ASC
            """, (today, end_date))
        
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return events
    
    def search_events(self, query: str, language: Optional[str] = None) -> List[Dict]:
        """
        Wyszukuje wydarzenia po lokalizacji lub dacie.
        
        Args:
            query: Tekst do wyszukania (miasto lub data)
            language: Filtr języka (PL/DE) lub None
        
        Returns:
            Lista słowników z wydarzeniami
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        search_pattern = f"%{query}%"
        
        if language:
            cursor.execute("""
                SELECT * FROM events 
                WHERE (location LIKE ? OR title LIKE ? OR description LIKE ?)
                AND date >= ? AND language = ?
                ORDER BY date ASC
            """, (search_pattern, search_pattern, search_pattern, today, language))
        else:
            cursor.execute("""
                SELECT * FROM events 
                WHERE (location LIKE ? OR title LIKE ? OR description LIKE ?)
                AND date >= ?
                ORDER BY date ASC
            """, (search_pattern, search_pattern, search_pattern, today))
        
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return events
    
    def get_random_future_event(self) -> Optional[Dict]:
        """
        Pobiera losowe przyszłe wydarzenie.
        
        Returns:
            Słownik z wydarzeniem lub None jeśli brak
        """
        import random
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        cursor.execute("""
            SELECT * FROM events 
            WHERE date >= ?
            ORDER BY RANDOM()
            LIMIT 1
        """, (today,))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def clear_old_events(self, days_old: int = 30):
        """
        Usuwa stare wydarzenia (opcjonalne, do czyszczenia bazy).
        
        Args:
            days_old: Usuwa wydarzenia starsze niż X dni
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days_old)).strftime("%Y-%m-%d")
        
        cursor.execute("DELETE FROM events WHERE date < ?", (cutoff_date,))
        conn.commit()
        conn.close()
