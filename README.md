# eSIM SOS MCP server

[English](#english) · [Русский](#русский)

## English

An [MCP](https://modelcontextprotocol.io) server for [eSIM SOS](https://esimsos.net), a travel eSIM shop. It lets Claude, ChatGPT, Cursor and other AI agents find a data plan for a trip, compare prices with other providers and create an order. **The human always pays**: the server returns a payment link, it never accepts card details and the AI never pays by itself.

Two ways to connect:

- **Remote (recommended):** `https://esimsos.net/api/mcp` (Streamable HTTP, no sign-in).
- **Local:** the `esimsos-mcp` package (stdio), installed straight from GitHub with `npx -y github:uziame/esimsos-mcp` (npm release coming soon). It is a thin proxy to the remote endpoint and needs no keys.

### Tools

| Tool | What it does |
|---|---|
| `search_destinations(query)` | Find a country by English or Russian name or ISO code |
| `list_plans(country, min_gb?, days?)` | Plans with final prices in RUB (one price for every payment method) |
| `compare_prices(country, gb)` | Prices of several providers from the open [esimdar.com dataset](https://esimdar.com/data/) (CC BY 4.0). esimdar.com is run by eSIM SOS; eSIM SOS is listed as an ordinary row |
| `create_order(plan_id, email, payment_method?)` | Creates an unpaid order, returns `order_id` and `payment_url` for the user |
| `order_status(order_id, email)` | Payment and delivery status (only when the email matches the order) |
| `install_instructions(order_id, email)` | After payment: order page with the QR code and steps for iPhone and Android |

Payment methods: `sbp` (Russian fast payments), `card` (Russian bank card), `card_foreign` (Visa/Mastercard issued abroad), `crypto_usdt`, `crypto_ton`.

### Example prompts

- "I'm flying to Turkey for two weeks. Find an eSIM with at least 10 GB."
- "Compare 5 GB eSIM prices for Georgia."
- "Order the 10 GB / 30 days plan for Turkey, my email is anna@example.com."
- "Has my order cmg... been paid? Email anna@example.com."
- "How do I install the eSIM on my iPhone?"

### Connect

**Claude.ai, Claude Desktop, Cowork (remote).** Settings → Connectors → Add → Add custom connector → URL `https://esimsos.net/api/mcp` → Add. No authentication is needed. Docs: [Get started with custom connectors](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp), [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers).

**Claude Desktop (local, npm).** Settings → Developer → Edit Config, then add to `claude_desktop_config.json` (macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`) and restart Claude. Requires [Node.js](https://nodejs.org) 18+. Docs: [Connect to local MCP servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

```json
{
  "mcpServers": {
    "esimsos": {
      "command": "npx",
      "args": ["-y", "github:uziame/esimsos-mcp"]
    }
  }
}
```

**Cursor.** Add to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project). Docs: [Cursor MCP](https://cursor.com/docs/context/mcp).

```json
{
  "mcpServers": {
    "esimsos": { "url": "https://esimsos.net/api/mcp" }
  }
}
```

Or the local package: `{ "mcpServers": { "esimsos": { "command": "npx", "args": ["-y", "github:uziame/esimsos-mcp"] } } }`.

**ChatGPT.** Plugins → **+** → Add custom MCP server → enter a name and the URL `https://esimsos.net/api/mcp`, authentication: none → confirm the warning → Create as a plugin. Then start a new chat and pick the plugin with `@`. Availability depends on your plan and workspace policy. Docs: [Connect and test your plugin](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt).

**Any other client:** use the remote URL with Streamable HTTP, or run `npx -y github:uziame/esimsos-mcp` over stdio. To debug: `npx @modelcontextprotocol/inspector`.

### Privacy and limits

- The email is used only for the order and the eSIM QR code. No reminders or marketing emails are sent to it.
- `order_status` and `install_instructions` answer only when both `order_id` and email match.
- Rate limits apply per email, per order and per IP.
- Orders created through MCP are counted with `utm_source=mcp`.
- `ESIMSOS_MCP_URL` overrides the endpoint for the npm package (for testing).

Support: Telegram [@esimsos_bot](https://t.me/esimsos_bot), support@esimsos.ru. License: MIT.

---

## Русский

[MCP](https://modelcontextprotocol.io)-сервер магазина [eSIM SOS](https://esimsos.net) (eSIM для путешествий). С ним Claude, ChatGPT, Cursor и другие ИИ-агенты подбирают тариф под поездку, сравнивают цены с другими магазинами и оформляют заказ. **Платит всегда человек**: сервер возвращает ссылку на оплату, данных карты не принимает, сама нейросеть не платит.

Два способа подключения:

- **Удалённо (рекомендуем):** `https://esimsos.net/api/mcp` (Streamable HTTP, без входа).
- **Локально:** пакет `esimsos-mcp` (stdio), ставится прямо с GitHub: `npx -y github:uziame/esimsos-mcp` (в npm выйдет позже). Тонкий посредник к удалённому адресу, ключи не нужны.

### Инструменты

| Инструмент | Что делает |
|---|---|
| `search_destinations(query)` | Находит страну по названию на русском или английском или по коду ISO |
| `list_plans(country, min_gb?, days?)` | Тарифы с итоговой ценой в рублях (одна цена для всех способов оплаты) |
| `compare_prices(country, gb)` | Цены нескольких магазинов из открытого набора [esimdar.com](https://esimdar.com/data/) (CC BY 4.0). esimdar.com делает eSIM SOS, eSIM SOS в нём — обычная строка |
| `create_order(plan_id, email, payment_method?)` | Создаёт неоплаченный заказ, возвращает `order_id` и `payment_url` для человека |
| `order_status(order_id, email)` | Статус оплаты и выдачи (только если почта совпадает с заказом) |
| `install_instructions(order_id, email)` | После оплаты: страница заказа с QR и шаги для iPhone и Android |

Способы оплаты: `sbp` (СБП), `card` (карта российского банка), `card_foreign` (зарубежная Visa/Mastercard), `crypto_usdt`, `crypto_ton`.

### Примеры запросов

- «Лечу в Турцию на две недели, подбери eSIM от 10 ГБ».
- «Сравни цены на eSIM 5 ГБ для Грузии».
- «Оформи тариф 10 ГБ на 30 дней для Турции, почта anna@example.com».
- «Оплачен ли мой заказ cmg...? Почта anna@example.com».
- «Как поставить eSIM на iPhone?»

### Подключение

**Claude.ai, Claude Desktop, Cowork (удалённо).** Настройки → Коннекторы → Добавить → Добавить свой коннектор → адрес `https://esimsos.net/api/mcp` → Добавить. Вход не нужен. Документация: [Get started with custom connectors](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp), [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers).

**Claude Desktop (локально, npm).** Настройки → Developer → Edit Config, добавьте в `claude_desktop_config.json` (macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`) и перезапустите Claude. Нужен [Node.js](https://nodejs.org) 18+. Документация: [Connect to local MCP servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

```json
{
  "mcpServers": {
    "esimsos": {
      "command": "npx",
      "args": ["-y", "github:uziame/esimsos-mcp"]
    }
  }
}
```

**Cursor.** Добавьте в `~/.cursor/mcp.json` (для всех проектов) или `.cursor/mcp.json` (для одного). Документация: [Cursor MCP](https://cursor.com/docs/context/mcp).

```json
{
  "mcpServers": {
    "esimsos": { "url": "https://esimsos.net/api/mcp" }
  }
}
```

Или локальный пакет: `{ "mcpServers": { "esimsos": { "command": "npx", "args": ["-y", "github:uziame/esimsos-mcp"] } } }`.

**ChatGPT.** Plugins → **+** → Add custom MCP server → название и адрес `https://esimsos.net/api/mcp`, аутентификация не нужна → подтвердите предупреждение → Create as a plugin. Затем новый чат и выбор плагина через `@`. Доступность зависит от тарифа и правил рабочего пространства. Документация: [Connect and test your plugin](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt).

**Другие клиенты:** удалённый адрес по Streamable HTTP или `npx -y github:uziame/esimsos-mcp` по stdio. Для отладки: `npx @modelcontextprotocol/inspector`.

### Данные и ограничения

- Почта нужна только для заказа и QR-кода eSIM. Напоминаний и рассылок на неё не приходит.
- `order_status` и `install_instructions` отвечают, только если совпали и `order_id`, и почта.
- Есть лимиты запросов по почте, по номеру заказа и по IP.
- Заказы через MCP учитываются с меткой `utm_source=mcp`.
- `ESIMSOS_MCP_URL` меняет адрес для npm-пакета (для проверки).

Поддержка: Telegram [@esimsos_bot](https://t.me/esimsos_bot), support@esimsos.ru. Лицензия MIT.
