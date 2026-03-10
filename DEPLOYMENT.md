# Instrukcja wdrozenia na VPS

Docelowy adres tej aplikacji to:

```text
https://www.euwt.eu/scrapper/
```

Repo zawiera gotowe pliki:

- `deploy/scrapper.service`
- `deploy/nginx.scrapper.conf`
- `deploy/install_server.sh`

## Najprostsza sciezka

Jesli repo jest juz na serwerze w `/var/www/scrapper`, wystarczy:

```bash
cd /var/www/scrapper
sudo bash deploy/install_server.sh
```

To zrobi:

- instalacje pakietow systemowych
- utworzenie `venv`
- instalacje zaleznosci Pythona
- konfiguracje `systemd`
- konfiguracje `nginx`
- wlaczenie uslug

Po tym aplikacja powinna odpowiadac pod:

```text
http://www.euwt.eu/scrapper/
```

Jesli DNS juz wskazuje na ten serwer, dodaj SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.euwt.eu
```

## Co musisz zrobic recznie

1. Upewnic sie, ze domena `www.euwt.eu` wskazuje na ten serwer.
2. Wgrac repo do `/var/www/scrapper`.
3. Uruchomic:

```bash
sudo bash /var/www/scrapper/deploy/install_server.sh
```

4. Opcjonalnie wystawic HTTPS przez certbot.

## Aktualizacja po zmianach w repo

Po kolejnym `git pull` na serwerze:

```bash
cd /var/www/scrapper
sudo bash deploy/install_server.sh
sudo systemctl restart scrapper
```

## Automatyczne pobieranie wydarzen

Jesli chcesz codziennie odswiezac baze:

```bash
crontab -e
```

Dodaj:

```bash
0 3 * * * curl -X POST https://www.euwt.eu/scrapper/api/scrape
```

Jesli SSL nie jest jeszcze aktywne, tymczasowo uzyj:

```bash
0 3 * * * curl -X POST http://127.0.0.1/scrapper/api/scrape
```

## Diagnostyka

```bash
sudo systemctl status scrapper
sudo journalctl -u scrapper -n 100 --no-pager
sudo nginx -t
sudo systemctl status nginx
curl -I http://127.0.0.1/scrapper/
```

## Uwagi

- Aplikacja jest przygotowana do pracy za reverse proxy pod prefiksem `/scrapper`.
- Na produkcji nie uruchamiaj jej przez `python app.py`.
- Ruch powinien isc przez `nginx -> gunicorn -> Flask`.
