# ⚡ Časovni bloki

Semafor časovnih blokov omrežnine za Slovenijo. Preprosta vizualizacija časovnih blokov glede na dan in uro.

🔗 **[casovni-bloki.ozbot.si](https://casovni-bloki.ozbot.si)**

## 📋 O projektu

Aplikacija prikazuje časovne bloke omrežnine za porabo električne energije v Sloveniji. Uporabniki lahko:

- 🕐 Preverijo trenutni časovni blok
- 📅 Izberejo poljuben datum in uro
- 📊 Vidijo grafični prikaz vseh 24 blokov v dnevu
- 💰 Najdejo najcenejši blok (najvišja številka)
- 🎯 Načrtujejo porabo električne energije

## 🛠️ Tehnologije

- [SvelteKit](https://kit.svelte.dev/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) - UI komponente
- [LayerChart](https://layerchart.com/) - Vizualizacija podatkov
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting

## 🚀 Razvoj

Klonirajte repozitorij in namestite odvisnosti:

```sh
git clone https://github.com/zanozbot/casovni-bloki.git
cd casovni-bloki
bun install
```

Zaženite razvojni strežnik:

```sh
bun run dev
```

Aplikacija bo dostopna na `http://localhost:5173`.

## 🏗️ Build

Ustvarite produkcijsko verzijo:

```sh
bun run build
```

Predogled produkcijske verzije:

```sh
bun run preview
```

## 📦 Deployment

Aplikacija je konfigurirana za Cloudflare Pages:

```sh
bun run deploy
```

## 📄 Licenca

MIT

## 👤 Avtor

**zanozbot** - [ozbot.si](https://ozbot.si)

---

Made with ❤️ in Slovenia
