# ZerTo-web — Sledování potravin v lednici

Mobilní webová aplikace pro evidenci potravin v lednici s upozorněními na blížící se expiraci.

## Spuštění

```bash
# Instalace závislostí
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Vygenerování VAPID klíčů (jednorázově, pro push notifikace)
cd server && npm run generate-vapid && cd ..

# Spuštění (server + client současně)
npm run dev
```

Aplikace poběží na `http://localhost:5173` (frontend) a `http://localhost:3001` (API).

## Funkce

- Přidávání, editace a mazání potravin
- Automatické předvyplnění data vložení
- Barevné označení podle blížící se expirace
- Push notifikace s konfigurovatelným počtem dní dopředu
- Denní kontrola expirací (9:00)
- Data ukládána do JSON souborů

## Tech stack

- React 18 + Vite + TypeScript (frontend)
- Express + TypeScript (backend)
- Web Push API + Service Worker (notifikace)
