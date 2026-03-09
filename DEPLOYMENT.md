# Instrukcja Wdrożenia na VPS (Deployment Guide)

Poniżej znajduje się instrukcja, jak zainstalować i uruchomić aplikację na serwerze Linux (np. Ubuntu/Debian).

## 1. Przygotowanie Serwera
Zaktualizuj system i zainstaluj niezbędne pakiety:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv sqlite3 nginx git -y
```

## 2. Pobranie Kodu
Sklonuj repozytorium lub prześlij pliki do wybranego katalogu (np. `/var/www/scrapper`):
```bash
cd /var/www
git clone <url-twojego-repozytorium> scrapper
cd scrapper
```

## 3. Środowisko Wirtualne i Zależności
Utwórz środowisko wirtualne i zainstaluj pakiety:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # Serwer produkcyjny
```

## 4. Konfiguracja Portu i Produkcji
W wersji produkcyjnej zaleca się wyłączenie trybu Debug i zmianę portu z powrotem na domyślny lub zarządzany przez Gunicorn.

Uruchomienie testowe Gunicorn:
```bash
gunicorn --bind 0.0.0.0:8080 app:app
```

## 5. Automatyzacja Serwera (Systemd)
Aby aplikacja startowała sama i działała w tle, utwórz plik usługi:
`sudo nano /etc/systemd/system/scrapper.service`

Wklej poniższą treść (dostosuj ścieżki):
```ini
[Unit]
Description=Gunicorn instance to serve Scrapper App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/scrapper
Environment="PATH=/var/www/scrapper/venv/bin"
ExecStart=/var/www/scrapper/venv/bin/gunicorn --workers 3 --bind unix:scrapper.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

Uruchom usługę:
```bash
sudo systemctl start scrapper
sudo systemctl enable scrapper
```

## 6. Automatyzacja Scrapera (Cron)
Aby scraper sam pobierał dane np. codziennie o 3:00 rano, dodaj wpis do crontaba:
`crontab -e`

Dodaj linię:
```bash
0 3 * * * curl -X POST http://localhost:8080/api/scrape
```
*(Jeśli używasz gniazda unix (sock) w systemd, musisz odwołać się do adresu Nginx).*

## 7. Reverse Proxy (Nginx) - opcjonalnie
Zaleca się wystawienie aplikacji przez Nginx na porcie 80/443 z certyfikatem SSL (Let's Encrypt).
`sudo nano /etc/nginx/sites-available/scrapper`

```nginx
server {
    listen 80;
    server_name twoja-domena.pl;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/scrapper/scrapper.sock;
    }
}
```
Następnie: `sudo ln -s /etc/nginx/sites-available/scrapper /etc/nginx/sites-enabled` i `sudo systemctl restart nginx`.
