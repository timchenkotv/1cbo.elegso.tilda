# 1cbo.elegso.ru

Полная статическая копия сайта `1cbo.elegso.ru`, подготовленная для независимой работы без Tilda.

Production: `https://1cbo.elegso.ru/`.

- Содержимое сайта: `www/`
- Скрипт полного зеркалирования: `scripts/mirror-site.mjs`
- Финализация и отключение отправки форм: `scripts/finalize-site.mjs`
- Аудит локальных ресурсов и SEO: `scripts/audit-site.mjs`
- Конфигурация nginx и Git deployment hook: `ops/`

Формы визуально сохранены, но их отправка намеренно отключена до подключения нового обработчика.

Production-страницы содержат уникальные title и description, canonical, Open Graph, Twitter Cards, JSON-LD, русскую локаль и семантический H1. `robots.txt` разрешает индексацию, а `sitemap.xml` перечисляет пять публичных маршрутов.
