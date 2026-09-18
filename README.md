# section-intro

La sezione fra l'hero e lo scroll orizzontale della home di **The Cape Studio**.
Un file, nessuna dipendenza — niente GSAP, niente jQuery.

| File | Cosa è | Peso |
|---|---|---|
| `section-intro.js` | entrata, coreografia, uscita e sparizione | ~19 KB |

Sta qui e non nel custom code della pagina perché là lo spazio è finito. Stessa
ragione di [`parallassi-slider`](https://github.com/cash9086/parallassi-slider).

---

## Come si include

Pages → Home → Settings → Custom code → *Before `</body>` tag*, **dopo** il
blocco di Lenis:

```html
<script defer src="https://cdn.jsdelivr.net/gh/cash9086/section-intro@SHA/section-intro.js"></script>
```

Al posto di `SHA` va lo SHA per esteso del commit, **mai `@main` né `@latest`**:
quelli li tiene jsDelivr in cache fino a 7 giorni, e dopo una modifica ti
ritrovi a guardare la versione vecchia chiedendoti perché non cambia niente.

`defer` non è un dettaglio. Gli script differiti girano in ordine dopo il
parsing e **prima** di `DOMContentLoaded`: l'Embed del ponte si sveglia lì, e
trova la sezione già misurata. Senza `defer` l'ordine si rovescia.

---

## Cosa fa, nell'ordine

**L'entrata — la bruciatura.** Il pannello bianco non si apre più a fessura:
arriva in dissolvenza mentre la fotografia dell'hero — ancora ferma sotto, che
è questo script a tenerla — si schiarisce fino a bruciare. Il bianco non copre
la fotografia: è la fotografia che diventa bianca.

**La coreografia.** Una tabella in cima al file, in schermate di scroll,
contate da quando il pannello ha finito di arrivare:

| fase | vh | cosa succede |
|---|---|---|
| `F_INK` | 90 | l'inchiostro riempie la frase, parola dopo parola |
| `F_ATTESA` | 12 | la frase finita si guarda un momento |
| `F_FIRMA` | 26 | la penna scrive |
| `F_PAUSA` | 25 | |
| `F_TESTO` | 25 | la frase svanisce sul posto |
| `F_SOLA` | 15 | la firma resta sola |
| `F_FIRMAVIA` | 25 | la firma svanisce |
| `F_SVILUPPO` | 40 | il pannello si spegne, la foto rientra dalla luce |

**L'uscita — lo sviluppo.** La sezione non se ne va scorrendo: si spegne, e
sotto la fotografia del ponte rientra da `brightness(5)` — la stessa luce
dell'entrata, `USCITA_LUCE` è messo uguale a `BRUCIA`.

**La sparizione.** Appena il rig orizzontale tocca il bordo alto, la sezione
collassa a zero. Risalendo si passa dal ponte direttamente all'hero;
riscendendo non c'è più. Torna solo con un refresh: è uno stato in memoria, non
un cookie.

---

## Le manopole

| Manopola | Default | Cosa fa |
|---|---|---|
| `BRUCIA` | `5` | fin dove schiarisce la foto in entrata |
| `BRUCIA_A` | `0.80` | dove la bruciatura è al massimo |
| `VELO_DA` | `0.45` | dove comincia ad arrivare il pannello bianco |
| `PALE` | `0` | le parole nascono dal nulla; alzalo per un contorno spento |
| `OVERLAP` | `0.4` | quanto una parola parte prima che finisca la precedente |
| `USCITA_LUCE` | `5` | la luce da cui la foto rientra in uscita |
| `SPARISCI_A` | `0` | schermate dentro l'orizzontale prima di sparire |
| `BRUCIATURA` | `true` | `false` → il pannello arriva e basta, senza bruciatura |

---

## Cinque cose che non si deducono leggendo

- **Una scala sola.** Inchiostro, penna e uscita sono misurati tutti in
  schermate dalla stessa origine. Prima ce n'erano due — il progresso rimappato
  della sezione per l'inchiostro, il binario grezzo per la penna — e nessuno le
  teneva allineate: la firma cominciava a scriversi mentre la frase si stava
  ancora dipingendo. Due orologi che non si guardano segnano sempre ore diverse.

- **La firma si disegna qui, non nel ponte.** L'Embed del ponte se l'era presa
  perché questo script la scriveva *a tempo*, e chi scrollava in fretta la
  superava senza vederla. Adesso è a scroll, quindi il furto non serve più — e
  se un giorno il ponte ricominciasse a sostituire i tracciati con dei cloni, qui
  si scriverebbe su nodi orfani e la penna resterebbe ferma.

- **Il filtro della bruciatura va sul contenitore, non sull'immagine.** Dentro
  `.bg-video-wrapper` ci sono la foto e la silhouette scontornata, due ritagli
  dello stesso soggetto: bruciandole separatamente il pixel di bordo prende la
  schiaritura due volte e resta un alone. E poi il marchio dell'hero scrive
  `filter` sull'immagine a ogni fotogramma — sul contenitore i due filtri si
  moltiplicano e nessuno dei due sa dell'altro.

- **Sparendo, si restituisce tutto.** L'hero tenuto fermo con una trasformata,
  la sua fotografia bruciata, quella del ponte pure: roba scritta su elementi
  che restano in pagina. Senza restituirla, la sezione se ne va e lascia l'hero
  inchiodato a metà schermo e sbiancato per sempre.

- **E si ritara il margine del ponte a `-100vh`.** Quel `-160vh` serviva a farlo
  cominciare sotto questa sezione, che non c'è più. A zero nascono due difetti:
  fra la fotografia dell'hero che si sfila e quella del ponte che si accende
  restano cento schermate di bianco, e siccome le due sono la **stessa**
  fotografia sembra che si ripeta; in più il ponte spende 160 schermate a non
  fare niente. A `-100vh` il testimone passa nell'istante esatto in cui l'hero
  comincia a sfilarsi.

- **E la fotografia del ponte si vela finché le lettere volano.** Cominciando
  sopra l'hero, a tutto schermo, si mangerebbe l'ultimo tratto della loro
  salita. Il marchio però dice già da solo quando sta lavorando: mette
  `is-ghost` sul logo della barra, perché in quel momento il logo vero deve
  stare nascosto. Si legge quella classe — niente misure, nessun accordo nuovo
  da tenere in piedi fra i due codici.

- **Si collassa, non si nasconde.** Con `display:none` il rettangolo della
  sezione diventa tutto a zero, e il marchio dell'hero — che guarda proprio
  questa sezione per sapere se è coperto — leggerebbe un bordo alto a 0, cioè
  «sono coperto», per sempre: risalendo in cima le lettere non uscirebbero più
  dal logo. A zero di altezza la sezione resta dov'è, fra l'hero e il ponte, e
  il suo bordo alto continua a rispondere la verità.

---

## La sparizione, e perché non si vede

Togliere ~460 schermate dal documento mentre ci sei dentro sposta in su tutto
quello che viene dopo: senza rimedio la pagina fa un salto enorme.

Il rimedio è misurare di quanto si è spostato il rig — prima e dopo — e
correggere lo scroll dello stesso identico numero. Le due cose stanno nello
stesso blocco sincrono, e il browser disegna una volta sola a fine blocco:
il salto c'è, ma non esiste un fotogramma in cui qualcuno possa vederlo.

La correzione passa da **Lenis**, se c'è. Lenis tiene un suo scroll interno:
scrivendo solo su quello del browser i due si sdoppiano, e la pagina tornerebbe
indietro da sola al fotogramma dopo.

Il muro d'ingresso del rig ferma Lenis per qualche decimo di secondo proprio nel
punto in cui la sezione sparisce. Scrivere sullo scroll mentre lui lo tiene fermo
vuol dire contendersi il volante: si aspetta che molli — `lenis.isStopped` — e il
colpo di rotella successivo riporta lì.

---

## Quello che serve altrove

Nell'head della pagina, nel blocco `/* sezione intro */`:

```css
.section-intro{ --binario:480vh; }
.intro-w{ opacity:0; }          /* le parole nascono dal nulla */
```

Se `--binario` è troppo corto la coreografia non ci sta, e **lo script te lo
dice in console** con il numero esatto di vh che mancano.

Nell'Embed `Code Embed 11` (il marchio dell'hero) **non serve toccare niente**:
è per questo che la sezione si collassa invece di nascondersi.

---

## `prefers-reduced-motion`

Niente bruciatura, niente penna, niente uscita: la frase è già scritta e la
firma già fatta. Lo script si ferma da solo dopo averle messe al loro posto.
