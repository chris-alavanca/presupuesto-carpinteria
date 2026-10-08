# Presupuestador para un taller de carpintería a medida

Demo: web app that prices custom joinery (shelving, wardrobes, kitchen units, tables, doors) from its dimensions, material and finish, with a live dimensioned drawing of the piece.

**Live demo:** https://presupuesto-carpinteria.vercel.app

## What it does

- Live front-elevation drawing with dimension lines that redraws as you type
- Price breakdown: board material with 15 % waste, finish, hardware, workshop labour, on-site fitting, margin and tax
- IGIC (Canary Islands) or IVA, editable hourly rate and margin
- Save quotes per client, change their status (draft, sent, accepted, rejected), reopen and edit
- Print or save a clean PDF of the quote
- Responsive, dark mode, keyboard accessible

Sample data is stored in the browser (localStorage). No backend.

## Stack

React 18, Vite, plain CSS. Deployed on Vercel.

```
npm install
npm run dev
```

Built by Chris Martin as a portfolio demo. The workshop and clients are fictional.
