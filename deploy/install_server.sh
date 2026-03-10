#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/scrapper"
SERVICE_SRC="$APP_DIR/deploy/scrapper.service"
SERVICE_DST="/etc/systemd/system/scrapper.service"
APACHE_SRC="$APP_DIR/deploy/apache.scrapper.conf"
APACHE_DST="/etc/apache2/conf-available/scrapper.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Uruchom jako root: sudo bash deploy/install_server.sh"
  exit 1
fi

apt update
apt install -y python3 python3-pip python3-venv sqlite3 apache2 git curl

if [[ ! -d "$APP_DIR" ]]; then
  echo "Brak katalogu $APP_DIR. Sklonuj repozytorium do /var/www/scrapper i uruchom skrypt ponownie."
  exit 1
fi

cd "$APP_DIR"

python3 -m venv venv
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r requirements.txt

chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

cp "$SERVICE_SRC" "$SERVICE_DST"
systemctl daemon-reload
systemctl enable --now scrapper

cp "$APACHE_SRC" "$APACHE_DST"
a2enmod proxy proxy_http headers rewrite
a2enconf scrapper
apache2ctl configtest
systemctl restart apache2

echo
echo "Instalacja zakonczona."
echo "Aplikacja powinna byc dostepna pod: http://www.euwt.eu/scrapper/"
echo "Jesli domena juz wskazuje na serwer, dodaj SSL:"
echo "sudo apt install -y certbot python3-certbot-apache && sudo certbot --apache -d www.euwt.eu"
