# Copenhagen Preview – hjemmeside

Statisk hjemmeside til Copenhagen Preview 2027. Sitet hostes på Cloudflare Pages, filerne ligger på GitHub, og indholdet redigeres i Pages CMS.

## Sådan hænger det sammen

| Hvad | Hvor |
|---|---|
| Sider og design | `index.html`, `program.html`, `billetter.html`, `om.html`, `styles.css`, `site.js` |
| Indhold (redigeres i Pages CMS) | `content/*.json` |
| Billeder | `billeder/` (Pages CMS uploader hertil) |
| Opsætning af Pages CMS | `.pages.yml` |

Når nogen gemmer i Pages CMS, bliver ændringen gemt i GitHub. Cloudflare opdaterer sitet automatisk efter et minut eller to.

## Opsætning (én gang)

### 1. GitHub
1. Opret en gratis konto på github.com, eller brug en eksisterende.
2. Opret et nyt repository, fx `copenhagen-preview`. Det må gerne være privat.
3. Upload alle filerne fra denne mappe med **Add file → Upload files**.
   Husk den skjulte fil `.pages.yml`. På Mac kan skjulte filer vises i Finder med Cmd+Shift+punktum.
   Hvis den mangler, så opret den med **Add file → Create new file**, kald den `.pages.yml` og indsæt indholdet.

### 2. Cloudflare Pages
1. Opret en gratis konto på cloudflare.com.
2. Gå til **Workers & Pages → Create → Pages → Connect to Git**, og vælg jeres repository.
3. Lad **Build command** være tom, og sæt **Build output directory** til `/`. Sitet skal ikke bygges.
4. Tryk **Save and Deploy**. Sitet får en adresse som `copenhagen-preview.pages.dev`.
5. Eget domæne: gå til projektet → **Custom domains** → tilføj fx `copenhagenpreview.dk`, og følg vejledningen.

### 3. Pages CMS
1. Gå til app.pagescms.org, og log ind med GitHub.
2. Giv Pages CMS adgang til repositoriet, når I bliver spurgt.
3. Vælg repositoriet. I menuen til venstre står Nyheder, Speakers & sessions, Program, Billetter osv.
4. Kollegaer, der skal kunne redigere, skal have adgang til repositoriet på GitHub (Settings → Collaborators).

## Gode råd til redigering

- **Nyheder:** den øverste nyhed vises stort på forsiden. Træk nyhederne for at ændre rækkefølgen.
- **Speakers & sessions:** personerne under en session vises i sessionens popup og kan klikkes for at se deres bio.
- **Popupperne** er bygget til at kunne ses uden scroll. Hold den længere tekst på to korte afsnit og bioer på to-tre linjer pr. afsnit.
- **Billeder:** upload gerne billeder, der er højst ca. 1600 px brede. Brug "fokuspunkt" (fx `50% 25%`) til at styre, hvor billedet beskæres.
- **Rød kursiv i overskriften:** skriv ordet i "Ord i overskriften med rød kursiv" under Indstillinger.

## Afprøv lokalt

Siderne henter indhold fra `content/`, så de skal åbnes via en lille webserver og ikke ved at dobbeltklikke på filerne:

```
python3 -m http.server 8000
```

Åbn derefter http://localhost:8000.
