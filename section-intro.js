/* =========================================================================
   section-intro.js — The Cape Studio, la sezione fra l'hero e l'orizzontale
   -------------------------------------------------------------------------
   La fotografia dell'hero si brucia fino al bianco; sul bianco una frase si
   riempie d'inchiostro e una firma la sottoscrive; poi frase e firma
   svaniscono una dopo l'altra e la fotografia si sviluppa di nuovo, rientrando
   dalla stessa luce da cui era uscita. Andata e ritorno per la stessa porta.

   Entrati nell'orizzontale la sezione se ne va dal documento: risalendo si
   passa dal ponte direttamente all'hero, e riscendendo non c'e' piu'. Torna
   solo con un refresh.

   COME SI INCLUDE
   ---------------
   Nel footer della Home, DOPO il blocco di Lenis:

     <script defer src="https://cdn.jsdelivr.net/gh/cash9086/section-intro@SHA/section-intro.js"></script>

   Al posto di SHA va lo SHA per esteso del commit, mai @main ne' @latest:
   quelli jsDelivr li tiene in cache fino a 7 giorni.

   `defer` e' obbligatorio, e basta: gli script differiti girano in ordine dopo
   il parsing e PRIMA di DOMContentLoaded, quindi l'Embed del ponte — che si
   sveglia li' — trova la sezione gia' misurata.

   IL MARKUP CHE SI ASPETTA
   ------------------------
     .section-intro          la sezione         | se manca, esce zitto
       .intro-stick          il pannello sticky
         .intro-quote        il blocco centrato
           .intro-q          la frase
           .intro-sign       la firma (SVG con i tracciati .sign-s)

   Fuori, tre elementi che tocca ma non possiede — e a cui restituisce tutto
   quando sparisce:
     .s-main .c-sticky       l'hero, tenuto fermo mentre il pannello arriva
     .bg-video-wrapper       la fotografia dell'hero, che brucia
     .cape-bridge-photo      la fotografia del ponte, che si sviluppa
     .cape-bridge            il ponte, a cui azzera il margine sparendo
     .cape-hs-wrap           l'orizzontale, che decide quando sparire

   DOVE SI METTE MANO
   ------------------
   Tutto nelle prime ottanta righe: la tabella delle fasi e le manopole.
   Sotto c'e' solo meccanica.
   ========================================================================= */

(function(){
  var TRACK     = '.section-intro';
  var QUOTE     = '.intro-q';
  var SIGN      = '.intro-sign .sign-s';
  var OVERLAP   = 0.4;
  var PAD       = 1;
  var REVERSE   = [];
  var SOSTA     = 0.80;
  var MAX_HOLD  = 0.80;

  /* Le parole nascono dal NULLA, non da un contorno grigio: a zero non c'e'
     niente sul bianco finche' l'inchiostro non le raggiunge. */
  var PALE      = 0;

  /* ——— la coreografia, in schermate di scroll ——————————————————————
     Una riga per fase, contate da quando il pannello ha finito di aprirsi.

     Sono schermate vere, non frazioni di un progresso: e' UNA SCALA SOLA per
     tutto — inchiostro, penna e uscita. Prima ce n'erano due, il progresso
     rimappato della intro per l'inchiostro e il binario grezzo per la penna,
     e nessuno le teneva allineate: e' per questo che la firma cominciava a
     scriversi mentre la frase si stava ancora dipingendo. Due orologi che
     non si guardano segnano sempre ore diverse.

     Sposta un numero e tutto quello che viene dopo slitta insieme. */
  var F_INK      = 90;  /* l'inchiostro riempie la frase                     */
  var F_ATTESA   = 12;  /* la frase finita si guarda un momento              */
  var F_FIRMA    = 26;  /* la penna scrive                                   */
  var F_PAUSA    = 25;  /* si guarda il tutto                                */
  var F_TESTO    = 25;  /* la frase svanisce                                 */
  var F_SOLA     = 15;  /* la firma resta sola                               */
  var F_FIRMAVIA = 25;  /* la firma svanisce                                 */

  /* Lo sviluppo non sta nella tabella: si ancora alla FINE del pannello, cioe'
     occupa le ultime schermate in cui e' ancora incollato. Deve cadere li' e
     non altrove, perche' e' l'unico tratto in cui sotto c'e' gia' accesa la
     fotografia del ponte — prima non c'e' niente da scoprire. */
  var F_SVILUPPO = 40;  /* il pannello se ne va e la foto rientra dalla luce  */
  var USCITA_LUCE = 5;  /* la luce da cui rientra: la stessa dell'entrata     */

  /* ——— si vede una volta sola ——————————————————————————————————————
     Arrivati dentro l'orizzontale, questa sezione se ne va dal documento:
     risalendo si passa dal ponte direttamente all'hero, e riscendendo non
     c'e' piu'. Torna solo con un refresh — e' uno stato in memoria, non un
     cookie: la pagina ricaricata e' una pagina nuova.

     Quante schermate dentro l'orizzontale aspettare: zero, cioe' appena il
     rig tocca il bordo alto. Il muro d'ingresso del rig ferma lo scroll
     proprio li' per qualche decimo di secondo, e scrivere sullo scroll
     mentre lui lo tiene fermo li fa litigare — per questo sotto si aspetta
     che abbia mollato la presa, invece di tenersi un margine a caso. */
  var SPARISCI_A = 0;

  /* Sparita la sezione, il ponte va ritarato. Due numeri, legati fra loro.

     SOVRAP: di quanto il ponte sale sopra l'hero. L'hero, nelle sue ultime
     100 schermate, si sfila — e sotto non c'e' piu' niente: il ponte deve
     salire almeno di tanto, o si vede il bianco.

     FERMO: quante schermate la fotografia resta piena prima di ritirarsi.
     Il ritiro occupa sempre l'ultimo schermo prima dell'orizzontale, quindi
     l'altezza del ponte viene FERMO + 100.

     FERMO sembrava non poter scendere sotto SOVRAP — il ritiro non puo'
     cominciare finche' l'hero non ha finito di sfilarsi, o da sotto la
     fotografia che si stringe se ne rivede la coda. Ma la coda si puo'
     spegnere: sotto la fotografia del ponte l'hero non serve a niente, e
     l'uno e' la copia dell'altra. Spento lui, il pavimento non c'e' piu' e
     FERMO diventa una pausa, non un obbligo. */
  var PONTE_SOVRAP = 100;
  var PONTE_FERMO  = 25;

  /* Di quanto l'hero si riaccende in anticipo rispetto allo spegnersi della
     fotografia del ponte. Serve a non lasciare mai un fotogramma con nessuno
     dei due acceso — vedi velaOra(). */
  var VELO_MARGINE = 15;
  var BRUCIATURA = true;  /* false: il pannello arriva e basta, senza
                             bruciatura. E' la via di fuga se non convince. */

  /* Le tre manopole dell'entrata. Sono misurate sull'arrivo del pannello,
     che dura un pieno schermo di scroll: 0 = il pannello e' ancora tutto
     sotto, 1 = e' arrivato.

     La bruciatura comincia subito e finisce prima del bianco: e' questo
     scarto che la fa leggere come una bruciatura e non come una dissolvenza
     al bianco. Se le fai finire insieme, l'occhio vede solo un fade. */
  var BRUCIA    = 5;      /* fin dove schiarisce la fotografia            */
  var BRUCIA_A  = 0.80;   /* dove la bruciatura e' al massimo             */
  var VELO_DA   = 0.45;   /* dove comincia ad arrivare il pannello bianco */

  var FADE      = 400;


  var track = document.querySelector(TRACK);
  if(!track) return;

  var quote   = track.querySelector(QUOTE);
  var strokes = [].slice.call(track.querySelectorAll(SIGN));

  var reduced = false;
  try{ reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  var words = [];
  if(quote){
    var src = quote.textContent.trim().split(/\s+/);
    quote.textContent = '';
    src.forEach(function(w, i){
      var s = document.createElement('span');
      s.className = 'intro-w';
      s.textContent = w;
      quote.appendChild(s);
      words.push(s);
      if(i < src.length - 1) quote.appendChild(document.createTextNode(' '));
    });
  }

  var lens = strokes.map(function(p, i){
    var L = 0;
    try{ L = p.getTotalLength(); }catch(e){}
    p.style.strokeDasharray  = L + PAD;
    p.style.strokeDashoffset = (L + PAD) * (REVERSE.indexOf(i) >= 0 ? -1 : 1);
    return L;
  });

  if(reduced){
    words.forEach(function(w){ w.style.opacity = '1'; });
    strokes.forEach(function(p){ p.style.strokeDashoffset = 0; });
    return;
  }

  var fotoPonte = document.querySelector('.cape-bridge-photo');
  var hs        = document.querySelector('.cape-hs-wrap');
  var ponte     = document.querySelector('.cape-bridge');
  var logo      = document.querySelector('.header-cape .cape-logo');

  var firmaBox = track.querySelector('.intro-sign');
  var stick = track.querySelector('.intro-stick');
  var hero  = document.querySelector('.s-main .c-sticky') || document.querySelector('.c-sticky');
  var bordo = document.querySelector('.bg-video-border-wrapper');

  /* Il filtro va sul CONTENITORE della fotografia, non sulla fotografia.
     Due motivi, tutti e due importanti:

     1. dentro .bg-video-wrapper ci sono la foto e la silhouette scontornata,
        che sono due ritagli dello stesso soggetto. Bruciandole separatamente
        il pixel di bordo del ritaglio prende la schiaritura due volte e resta
        un alone lungo tutto il perimetro. Un contenitore, una passata sola.

     2. il marchio dell'hero scrive filter sull'IMMAGINE a ogni fotogramma
        (e' cosi' che la fa schiarire mentre scende). Scrivendo anche noi li'
        ci si ruberebbe il campo a vicenda. Sul contenitore i due filtri si
        moltiplicano e nessuno dei due sa dell'altro. */
  var fondale = document.querySelector('.s-main .bg-video-wrapper')
             || document.querySelector('.bg-video-wrapper');
  var briUlt  = -1;

  var yRil = null, hyFermo = 0, pieno = 0, speso = 0;
  var apertaOra = false, ipApertura = null;
  var contenuti = stick ? [].slice.call(stick.children) : [];
  if(BRUCIATURA) contenuti.forEach(function(el){ el.style.opacity = '0'; });

  function dolce(t){ return t * t * (3 - 2 * t); }
  function cl01(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }

  var RISERVA = MAX_HOLD * window.innerHeight;
  track.style.height = (track.offsetHeight + RISERVA) + 'px';

  function trattieni(){
    if(!stick) return;
    var y = window.scrollY, vh = window.innerHeight, top = track.offsetTop;

    if(yRil === null){
      var naturale = top - vh;
      var tetto    = MAX_HOLD * vh;
      var tenuto   = y - naturale;
      var pronto   = true;

      if(bordo){
        var cs = getComputedStyle(bordo);
        var bw = Math.max(parseFloat(cs.borderTopWidth)  || 0,
                          parseFloat(cs.borderLeftWidth) || 0);
        pronto = (bw <= 1.5);
      }
      if(pronto && !pieno) pieno = y;

      var rilascia = (pieno && y >= pieno + SOSTA * vh) || (tenuto >= tetto);
      if(rilascia){
        yRil  = Math.min(y, naturale + tetto);
        speso = Math.max(0, Math.min(yRil - naturale, tetto));
      }
    }

    var eff = (yRil === null) ? vh : Math.min(vh, Math.max(0, vh - (y - yRil)));
    var off = Math.max(0, eff - Math.max(0, top - y));

    if(BRUCIATURA){
      /* ap: quanto il pannello e' arrivato. 0 = ancora tutto sotto, 1 =
         incollato in cima. E' lo stesso numero di prima, calcolato allo
         stesso modo: cambia solo cosa ci facciamo. */
      var sotto  = Math.max(0, top - y);
      var posato = off + sotto;
      var ap     = 1 - Math.min(1, Math.max(0, posato / vh));

      stick.style.transform = '';
      stick.style.clipPath  = '';

      /* Il pannello non si apre piu': e' gia' grande quanto lo schermo e
         arriva in dissolvenza, in ritardo sulla bruciatura. A opacita' zero
         e' comunque incollato sopra l'hero, quindi si tolgono gli eventi:
         se no si clicca su un foglio bianco che non si vede. */
      var velo = dolce(cl01((ap - VELO_DA) / Math.max(0.0001, 1 - VELO_DA)));
      stick.style.opacity      = velo.toFixed(3);
      stick.style.pointerEvents = velo < 0.02 ? 'none' : '';

      /* La bruciatura. Il pannello deve trovare una fotografia gia' quasi
         bianca: e' per questo che BRUCIA_A sta prima di 1. */
      if(fondale){
        var bri = 1 + (BRUCIA - 1) * dolce(cl01(ap / Math.max(0.0001, BRUCIA_A)));
        if(Math.abs(bri - briUlt) > 0.002){
          briUlt = bri;
          fondale.style.filter = bri <= 1.002 ? '' : 'brightness(' + bri.toFixed(3) + ')';
        }
      }

      var aperta = (ap >= 0.999);
      /* Lo zero di tutta la coreografia: il pannello ha finito di arrivare.
         Si segna una volta sola, sul binario grezzo, e da li' si contano le
         schermate della tabella. */
      if(aperta && ipApertura === null){ ipApertura = ipOra(); controllaSpazio(); }
      if(aperta !== apertaOra){
        apertaOra = aperta;
        contenuti.forEach(function(el){
          el.style.transition = 'opacity ' + FADE + 'ms ease';
          el.style.opacity    = aperta ? '1' : '0';
        });
      }
    } else {
      stick.style.transform = off > 0.5 ? 'translate3d(0,' + off.toFixed(1) + 'px,0)' : '';
    }


    if(hero){
      if(eff > 0) hyFermo = Math.max(0, y - top);
      hero.style.transform = hyFermo > 0.5 ? 'translate3d(0,' + hyFermo.toFixed(1) + 'px,0)' : '';
    }
  }

  /* ── la scala ──────────────────────────────────────────────────────────
     Il binario grezzo: quante schermate si e' scesi dentro la sezione. Da qui
     esce tutto, e non c'e' nessun secondo metro con cui sbagliare. */
  function binario(){ return track.offsetHeight - window.innerHeight; }

  function ipOra(){
    var b = binario();
    return b > 0 ? (-track.getBoundingClientRect().top / b) : 0;
  }

  /* Schermate passate da quando il pannello si e' aperto. Negativo prima. */
  function scOra(){
    if(ipApertura === null) return -1;
    var b = binario();
    if(b <= 0) return -1;
    return (ipOra() - ipApertura) * b / window.innerHeight * 100;
  }

  var TAB = {}, TOT = 0;
  [['ink',F_INK], ['attesa',F_ATTESA], ['firma',F_FIRMA], ['pausa',F_PAUSA],
   ['testo',F_TESTO], ['sola',F_SOLA], ['firmavia',F_FIRMAVIA]
  ].forEach(function(f){ TAB[f[0]] = { da:TOT, len:f[1] }; TOT += f[1]; });

  function fase(id, sc){
    var f = TAB[id];
    return cl01((sc - f.da) / Math.max(0.0001, f.len));
  }

  /* La sezione deve essere abbastanza lunga da contenere la tabella piu' lo
     sviluppo. Se non lo e', le ultime fasi si accavallano e la firma sparisce
     mentre il pannello se ne sta gia' andando: meglio dirlo qui che lasciarlo
     scoprire scrollando. */
  function controllaSpazio(){
    var b = binario(), vh = window.innerHeight;
    if(ipApertura === null || b <= 0) return;
    var resta = (1 - ipApertura) * b / vh * 100;
    var serve = TOT + F_SVILUPPO;
    if(resta < serve){
      console.warn('[intro] la coreografia vuole ' + serve + 'vh dopo l\'apertura del ' +
        'pannello, ma nella sezione ne restano ' + Math.round(resta) + '. Alza --binario ' +
        'su .section-intro di almeno ' + Math.ceil(serve - resta) + 'vh, oppure accorcia ' +
        'la tabella in cima a questo script.');
    }
  }

  /* ── i pennelli ──────────────────────────────────────────────────────── */
  var N = words.length;
  var slot = N ? 1 / (N - (N - 1) * OVERLAP) : 1;

  function ink(t){
    for(var i = 0; i < N; i++){
      var w = cl01((t - i * slot * (1 - OVERLAP)) / slot);
      w = dolce(w);
      words[i].style.opacity = (PALE + (1 - PALE) * w).toFixed(3);
    }
  }

  /* La penna, a scroll e non a tempo. Ogni tratto prende una fetta della fase
     proporzionale alla propria lunghezza: cosi' la mano va alla stessa
     velocita' su un tratto lungo e su uno corto, che e' come scrive una mano
     vera. A tempo, chi scrollava in fretta la superava senza vederla. */
  var LTOT = lens.reduce(function(a, b){ return a + b; }, 0) || 1;

  function penna(t){
    var speso = 0;
    for(var i = 0; i < strokes.length; i++){
      if(!(lens[i] > 0)) continue;
      var q = lens[i] / LTOT;
      var s = cl01((t - speso) / q);
      speso += q;
      var e = 1 - Math.pow(1 - s, 1.35);
      var off = (lens[i] + PAD) - lens[i] * e;
      strokes[i].style.strokeDashoffset =
        (REVERSE.indexOf(i) >= 0 ? -off : off).toFixed(2);
    }
  }

  /* ── la scena ────────────────────────────────────────────────────────── */
  function scena(){
    var sc = scOra();
    if(sc < 0) return;          /* il pannello non e' ancora arrivato */

    ink(fase('ink', sc));
    penna(fase('firma', sc));

    /* Frase e firma svaniscono ognuna per conto suo. Si scrive sull'opacita'
       delle due SCATOLE: dentro, l'inchiostro continua a lavorare sulle parole
       e la penna sui tracciati, senza sapere che sopra di loro qualcosa sta
       svanendo. Nessuno si contende niente. */
    if(quote)    quote.style.opacity    = (1 - fase('testo',    sc)).toFixed(3);
    if(firmaBox) firmaBox.style.opacity = (1 - fase('firmavia', sc)).toFixed(3);

    /* Lo sviluppo, ancorato alla fine del pannello. La sezione non se ne va
       scorrendo: si spegne, e sotto la fotografia rientra dalla stessa luce da
       cui era uscita in entrata. Andata e ritorno per la stessa porta. */
    var resta = (1 - ipOra()) * binario() / window.innerHeight * 100;
    var sv = dolce(1 - cl01(resta / Math.max(1, F_SVILUPPO)));

    if(stick) stick.style.opacity = (1 - sv).toFixed(3);
    if(fotoPonte){
      /* sv va da 0 a 1 mentre il pannello si spegne. Il pannello segue sv
         (1 - sv: da opaco a trasparente), la LUCE va al contrario: comincia
         a USCITA_LUCE — la fotografia e' ancora bruciata come alla fine
         dell'entrata — e rientra a 1 mentre il bianco se ne va.

         Avevo scritto * sv invece di * (1 - sv): la fotografia si illuminava
         invece di disilluminarsi, e siccome dopo la fine resta inchiodata a
         sv = 1, restava bruciata per sempre. */
      var br = 1 + (USCITA_LUCE - 1) * (1 - sv);
      fotoPonte.style.filter = br <= 1.002 ? '' : 'brightness(' + br.toFixed(3) + ')';
    }
  }

  /* ── la sparizione ─────────────────────────────────────────────────────
     Togliere 460 schermate dal documento mentre ci sei dentro sposta in su
     tutto quello che viene dopo: senza rimedio, la pagina fa un salto enorme.

     Il rimedio e' misurare di quanto si e' spostato il rig — prima e dopo —
     e correggere lo scroll dello stesso identico numero. Le due cose stanno
     nello stesso blocco sincrono, e il browser disegna una volta sola a fine
     blocco: quindi non esiste un fotogramma in cui la pagina e' spostata.
     Il salto c'e', ma nessuno lo vede.

     La correzione passa da Lenis, se c'e': lui tiene un suo scroll interno,
     e scrivendo solo su quello del browser i due si sdoppiano — la pagina
     tornerebbe indietro da sola al fotogramma dopo. */
  var sparita = false;

  function svanisci(){
    if(sparita || !hs || !track.offsetHeight) return;

    /* Il muro d'ingresso del rig ferma Lenis per qualche decimo di secondo
       proprio in questo punto. Scrivere sullo scroll adesso vorrebbe dire
       contendersi il volante con lui: si aspetta che molli, e il prossimo
       colpo di rotella ci riporta qui. */
    if(window.lenis && window.lenis.isStopped) return;

    sparita = true;

    /* Quello che questa sezione aveva scritto ALTROVE va restituito, o resta
       appeso per sempre: l'hero tenuto fermo a meta' schermo, la sua
       fotografia bruciata, quella del ponte pure. */
    if(hero){ hero.style.transform = ''; hero.style.visibility = ''; }
    if(fondale)   fondale.style.filter = '';
    if(fotoPonte) fotoPonte.style.filter = '';

    var prima = hs.getBoundingClientRect().top;

    /* Si COLLASSA, non si nasconde.

       Con display:none il rettangolo della sezione diventa tutto a zero, e
       il marchio dell'hero — che guarda proprio questa sezione per sapere se
       e' coperto — leggerebbe un bordo alto a 0, cioe' "sono coperto",
       per sempre. Risultato: risalendo in cima le lettere non uscirebbero
       piu' dal logo.

       A zero di altezza la sezione resta dov'e', fra l'hero e il ponte: il
       suo bordo alto continua a rispondere la verita' — sotto di te quando
       sei sull'hero, sopra di te quando sei piu' giu' — e il marchio
       funziona senza sapere che qui e' successo qualcosa. */
    track.style.height    = '0px';
    track.style.marginTop = '0px';
    track.style.overflow  = 'hidden';

    /* E il margine del ponte va ritarato. Quel -160vh serviva a farlo
       cominciare sotto la intro, che non c'e' piu'.

       A ZERO il ponte si appoggia dopo l'hero — e li' nascono i due difetti
       che si vedono nel video: fra la fotografia dell'hero che si sfila e
       quella del ponte che si accende restano cento schermate di bianco, e
       siccome le due sono la STESSA fotografia sembra che si ripeta. In piu'
       il ponte, lungo 260 schermate, ne spende 160 a non fare niente.

       Alzandolo sopra l'hero la sua fotografia raccoglie il testimone dove
       l'altra lo lascia, senza bianco in mezzo e senza doppioni. E anche
       l'altezza va ritarata: quella di partenza, 260 schermate, ne lasciava
       160 di fotografia ferma. */
    if(ponte){
      ponte.style.marginTop = (-PONTE_SOVRAP) + 'vh';
      ponte.style.height    = (PONTE_FERMO + 100) + 'vh';
    }

    var dopo  = hs.getBoundingClientRect().top;
    var delta = dopo - prima;

    if(delta){
      var meta = (window.scrollY || window.pageYOffset) + delta;
      if(window.lenis && window.lenis.scrollTo){
        window.lenis.scrollTo(meta, { immediate:true, force:true });
      } else {
        window.scrollTo(0, meta);
      }
    }

    velaOra();
  }

  /* Il ponte adesso comincia sopra l'hero, e la sua fotografia e' a tutto
     schermo: senza un velo si mangerebbe l'ultimo tratto della salita delle
     lettere. Il marchio pero' dice gia' da solo quando sta lavorando — mette
     `is-ghost` sul logo della barra mentre le lettere sono in volo, perche'
     in quel momento il logo vero deve stare nascosto. Si legge quello: una
     classe, niente misure, e nessun accordo nuovo da tenere in piedi fra i
     due codici. */
  var veloFoto = null, veloHero = null, veloAtteso = false;

  function velaOra(){
    veloAtteso = false;

    var vola = !!(logo && logo.classList.contains('is-ghost'));

    /* Finche' le lettere volano, la fotografia del ponte sta nascosta. */
    if(fotoPonte){
      var f = vola ? 'hidden' : '';
      if(f !== veloFoto){ veloFoto = f; fotoPonte.style.visibility = f; }
    }

    /* E quando invece e' lei a coprire, si spegne l'hero: sotto non serve a
       niente — e' la stessa identica fotografia — e lasciandolo acceso, da
       sotto quella che si stringe se ne rivedrebbe la coda mentre si sfila.

       Il margine non e' prudenza: al confine ci sono TRE codici che decidono
       nello stesso fotogramma — il ponte accende e spegne la sua fotografia,
       il marchio mette e toglie is-ghost, questo spegne e riaccende l'hero —
       e l'ordine fra loro non e' garantito. Senza margine capita il
       fotogramma in cui la fotografia e' gia' spenta e l'hero non e' ancora
       riacceso: e' quello il lampo bianco che si vedeva risalendo.

       Con il margine, l'hero si riaccende un pezzo PRIMA che la fotografia si
       spenga. Per un tratto si sovrappongono — ma sono la stessa immagine,
       quindi non si vede niente. Meglio una sovrapposizione che un buco:
       nella prima non c'e' niente da vedere, nel secondo c'e' il bianco.

       visibility e non display: il rettangolo resta, e il marchio della barra
       continua a misurarlo come ha sempre fatto. */
    if(hero && ponte){
      var m = VELO_MARGINE / 100 * window.innerHeight;
      var r = ponte.getBoundingClientRect();
      var accesa = !!(fotoPonte && fotoPonte.classList.contains('is-on'));
      var copre  = !vola && accesa && r.top <= -m && r.bottom > m;
      var h = copre ? 'hidden' : '';
      if(h !== veloHero){ veloHero = h; hero.style.visibility = h; }
    }
  }

  /* Un giro per fotogramma, e si scrive solo quando il valore cambia.

     Prima si scriveva a ogni evento di scroll — che con Lenis vuol dire a
     ogni fotogramma — e non era il conto a costare: era la scrittura.
     Toccare visibility su .c-sticky invalida lo stile di tutto quello che ha
     dentro (fotografia, cornice, silhouette, le tredici lettere del marchio),
     e rifarlo sessanta volte al secondo per riscrivere lo stesso identico
     valore e' esattamente il genere di lavoro che fa singhiozzare lo scroll. */
  function velaPonte(){
    if(veloAtteso) return;
    veloAtteso = true;
    requestAnimationFrame(velaOra);
  }

  /* Il controllo costa un rettangolo per scrollata, e quello della sparizione
     smette del tutto dopo la prima volta. Non usa il ciclo della sezione
     apposta: quello si spegne quando la sezione esce dallo schermo, cioe'
     molto prima di qui. */
  if(hs){
    var guardaAtteso = false;

    function guarda(){
      guardaAtteso = false;
      if(sparita){ velaOra(); return; }
      if(hs.getBoundingClientRect().top > -SPARISCI_A / 100 * window.innerHeight) return;
      svanisci();
    }

    /* Un giro per fotogramma anche qui. Gli eventi di scroll arrivano piu'
       spesso dei fotogrammi, e ognuno costava una misura del layout. */
    addEventListener('scroll', function(){
      if(guardaAtteso) return;
      guardaAtteso = true;
      requestAnimationFrame(guarda);
    }, { passive:true });
  }

  /* Diagnostica. In console: capeIntro(). Dice a che punto e' la tenuta e a
     che punto e' la coreografia, cosi' quando qualcosa non torna si guardano
     i numeri veri invece di dedurli. */
  window.capeIntro = function(){
    var vh = window.innerHeight, y = window.scrollY;
    var top = track.offsetTop, b = track.offsetHeight - vh;
    var sc = scOra(), f = 'prima';
    if(sc >= 0) for(var k in TAB) if(sc >= TAB[k].da) f = k;
    return {
      vh: vh,
      y: Math.round(y),
      sezione: { top:Math.round(top), alta:Math.round(track.offsetHeight),
                 binario:Math.round(b), inScreen:+(b/vh).toFixed(2) },
      tenuta: {
        riserva:   Math.round(RISERVA),
        naturale:  Math.round(top - vh),
        corniceOk: !!pieno,
        pieno:     pieno ? Math.round(pieno) : null,
        rilasciata: yRil !== null,
        yRil:      yRil === null ? null : Math.round(yRil),
        spesa:     Math.round(speso),
        heroSpinto: Math.round(hyFermo),
        heroOra:   hero ? (hero.style.transform || '(niente)') : '(manca .c-sticky)'
      },
      coreografia: {
        aperta:     apertaOra,
        ipApertura: ipApertura === null ? null : +ipApertura.toFixed(3),
        sc:         Math.round(sc),
        fase:       f,
        serve:      TOT + F_SVILUPPO
      },
      sparita: sparita
    };
  };

  var visible = false, running = false;

  function frame(){
    if(!visible){ running = false; return; }
    /* Sezione sparita: niente da misurare e niente da scrivere. Senza questa
       guardia trattieni() lavorerebbe su rettangoli tutti a zero e
       ributterebbe addosso all'hero una trasformata e un filtro. */
    if(!track.offsetHeight){ running = false; return; }
    trattieni();
    scena();
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(function(es){
    visible = es[0].isIntersecting;
    if(visible && !running){ running = true; requestAnimationFrame(frame); }
  }, { rootMargin:'20% 0px' }).observe(track);
})();
