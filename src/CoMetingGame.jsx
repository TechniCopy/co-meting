// ─────────────────────────────────────────────────────────────────────────────
// MICROGAME: DE CO-METING (cluster 2.4, leerdoel 4)
// Meetwaarde bij CO-meting beoordelen: grenswaarden opstellingsruimte,
// uitvoering CO-meting, rookgasmeting en buiten bedrijf stellen.
//
// Missie 1  Lees en beoordeel de meter
//   R1  De grenswaarden      → metingen sorteren: in orde / onderzoeken / ingrijpen
//   R2  Ruimte of rookgas?   → eerst de juiste grens kiezen, dan beoordelen
// Missie 2  Handel juist
//   R3  Buiten bedrijf       → handelingen in de juiste volgorde slepen
//   R4  Wie meld je?         → de vier meldplicht-partijen aanwijzen
//   R5  De vrijgave (kaal)   → scenario's beoordelen zonder hulp
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gauge, AlertTriangle, CheckCircle, Tag, Users, ClipboardList, Power,
  Wrench, ShieldCheck, XCircle,
} from "lucide-react";
import {
  C, useGameJuice, DragProvider, Draggable, DropTarget, DragCard, ProgressBar,
  GameButton, FeedbackPopup, IntroScreen, MCControle, EndScreen, StepBanner,
  RondeIntro, UitlegItem, UitlegStrook,
} from "./shared.jsx";

// Maximale score, opgebouwd uit:
// R1 detector-opdracht 5 + sorteren 7×5=35 · R2 grens kiezen + beoordelen 6×(5+5)=60
// R3 volgorde 5×5=25 · R4 partijen 4×5 + scenario 5 = 25 · R5 scenario's 5×5=25
// 5 MC-controles ×10=50
const MAX_SCORE = 225;

// ─── APP-KOPPELING (postMessage-contract voor de lesstof-app) ───

const GAME_ID = "co-meting";

function meldVoortgang(payload) {
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: "microgame:progress", game: GAME_ID, ...payload },
      "*",
    );
  }
}

// ─── SVG: PERSOONLIJKE CO-DETECTOR (ruimtemeting, oranje kastje op de borst) ───

function CoMelderSVG({ ppm, w = 118 }) {
  return (
    <svg viewBox="0 0 120 172" width={w} role="img" aria-label={`Persoonlijke CO-detector: ${ppm} ppm`}>
      <rect x="10" y="6" width="100" height="160" rx="24" fill="#E8791E" stroke={C.brownText} strokeWidth="2.5" />
      {/* alarm-leds */}
      <circle cx="24" cy="20" r="4" fill="#C0392B" stroke={C.brownText} strokeWidth="1" />
      <circle cx="96" cy="20" r="4" fill="#C0392B" stroke={C.brownText} strokeWidth="1" />
      {/* display */}
      <rect x="28" y="26" width="64" height="36" rx="4" fill="#DCE8C6" stroke={C.brownText} strokeWidth="2" />
      <text x="60" y="51" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.brownText}>
        {ppm}
        <tspan fontSize="8" fontWeight="700" dx="2">ppm</tspan>
      </text>
      {/* band met type-aanduiding */}
      <rect x="24" y="70" width="72" height="14" rx="7" fill={C.brownText} />
      <text x="60" y="80" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#F5EFE4" letterSpacing="0.5">CO-DETECTOR</text>
      {/* sensor */}
      <circle cx="60" cy="113" r="21" fill="#C9660F" stroke={C.brownText} strokeWidth="2" />
      <circle cx="60" cy="113" r="11" fill="#E8791E" stroke={C.brownText} strokeWidth="1.5" />
      {/* CO-badge */}
      <rect x="36" y="144" width="48" height="14" rx="7" fill={C.red} stroke={C.brownText} strokeWidth="1.5" />
      <text x="60" y="154.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="white">CO</text>
    </svg>
  );
}

// ─── SVG: ROOKGASANALYSEMETER (rookgasmeting, blauwe meter met sonde) ───

function RookgasMeterSVG({ ppm, w = 235 }) {
  return (
    <svg viewBox="0 0 235 152" width={w} role="img" aria-label={`Rookgasanalysemeter: ${ppm} ppm CO in het rookgas`}>
      {/* rookgasafvoer met meetpunt */}
      <rect x="6" y="10" width="88" height="18" rx="4" fill={C.beigeMid} stroke={C.brownText} strokeWidth="2" />
      <text x="50" y="42" textAnchor="middle" fontSize="7.5" fontStyle="italic" fill={C.brown}>rookgasafvoer</text>
      {/* sonde in het meetpunt */}
      <line x1="52" y1="28" x2="52" y2="12" stroke="#8E9AA3" strokeWidth="4" />
      <rect x="42" y="46" width="20" height="34" rx="5" fill="#2F6E9E" stroke={C.brownText} strokeWidth="2" transform="rotate(180 52 63)" />
      <line x1="52" y1="28" x2="52" y2="48" stroke="#8E9AA3" strokeWidth="4" />
      {/* kabel van sonde naar meter */}
      <path d="M 52 80 C 52 118, 100 130, 132 112" fill="none" stroke={C.brownText} strokeWidth="3" strokeLinecap="round" />
      {/* meterbehuizing */}
      <rect x="130" y="8" width="86" height="136" rx="14" fill="#2F6E9E" stroke={C.brownText} strokeWidth="2.5" />
      <rect x="140" y="20" width="66" height="70" rx="5" fill="#EAF3F8" stroke={C.brownText} strokeWidth="2" />
      <text x="147" y="34" fontSize="9" fontWeight="700" fill={C.brown}>CO</text>
      <text x="199" y="34" textAnchor="end" fontSize="7" fontStyle="italic" fill={C.brown}>rookgas</text>
      <text x="173" y="66" textAnchor="middle" fontSize="21" fontWeight="800" fill={C.brownText}>{ppm}</text>
      <text x="173" y="81" textAnchor="middle" fontSize="9" fontWeight="700" fill={C.brown}>ppm</text>
      <circle cx="173" cy="114" r="13" fill="#255A83" stroke={C.brownText} strokeWidth="2" />
      <circle cx="173" cy="114" r="5.5" fill="#EAF3F8" />
    </svg>
  );
}

// ─── MC-VRAGENPOOLS ───
// Basis: de 5 examenvragen van leerdoel 4 uit de dataset, aangevuld met
// zelfgeschreven varianten met verse getallen.

const POOL_R1 = [
  {
    // dataset leerdoel 4, vraag 1
    question: "Na onderhoud aan een cv-toestel in een appartement (gestapelde bouw) voer je volgens BRL 6000-25 een CO-meting uit in de opstellingsruimte. Welke maximale CO-concentratie geldt hierbij?",
    options: ["10 ppm", "25 ppm", "50 ppm"],
    correct: 1,
    feedbackCorrect: "GOED! In gestapelde bouw is de CO-meting in de opstellingsruimte na onderhoud verplicht. De gemeten concentratie mag daarbij niet hoger zijn dan 25 ppm.",
    feedbackWrong: "Bij de verplichte meting na onderhoud in gestapelde bouw geldt een grens van 25 ppm.",
    hint: "Gestapelde bouw heeft bij deze verplichte meting een eigen grenswaarde, net iets hoger dan de algemene wettelijke grens in de ruimte.",
    bron: "Kleintje Gas, §8.6.5 (CO-meting in opstellingsruimte in gestapelde bouw)",
    les: "Gestapelde bouw na onderhoud: verplichte CO-meting met een grens van 25 ppm",
  },
  {
    // dataset leerdoel 4, vraag 2
    question: "Bij het betreden van een opstellingsruimte meet je 30 ppm CO terwijl het toestel in bedrijf is. Wat is de juiste handelwijze?",
    options: [
      "Geen actie nodig: pas boven 50 ppm is er sprake van een overschrijding.",
      "Je hangt een CO-melder op in de opstellingsruimte en laat het toestel in bedrijf.",
      "Je stelt het toestel buiten bedrijf, onderzoekt de oorzaak en meldt de overschrijding aan bewoner, eigenaar, bevoegd gezag en certificerende instelling.",
    ],
    correct: 2,
    feedbackCorrect: "GOED! 30 ppm is een overschrijding van de wettelijke grens van 20 ppm: toestel buiten bedrijf, oorzaak onderzoeken en melden.",
    feedbackWrong: "Boven de 20 ppm in de ruimte handel je altijd: buiten bedrijf stellen, onderzoeken en melden. Een CO-melder ophangen is geen oplossing.",
    hint: "De wettelijke grens voor de ruimtemeting ligt bij 20 ppm. Wat hoort er bij een overschrijding?",
    bron: "Toetsmatrijs/proefexamens BvV CO (grenswaarde ruimte boven 20 ppm) en Kleintje Gas §1.1.2",
    les: "Boven 20 ppm in de ruimte: buiten bedrijf, onderzoeken en melden",
  },
  {
    // dataset leerdoel 4, vraag 5
    question: "Tijdens een langdurige klus in een stookruimte meet je in de ruimte voortdurend circa 40 ppm CO. Mag je hier volgens de Arbowetgeving blijven doorwerken?",
    options: [
      "Ja, want de piekwaarde van 50 ppm wordt niet overschreden.",
      "Ja, mits je een raam openzet en elke twee uur pauze neemt in de buitenlucht.",
      "Nee, want de maximale concentratie voor langdurige blootstelling is 25 ppm; 40 ppm mag alleen als korte piek van hooguit een kwartier.",
    ],
    correct: 2,
    feedbackCorrect: "GOED! Voor je eigen blootstelling geldt maximaal 25 ppm gemiddeld over 8 uur, met een piek van 50 ppm gedurende hooguit een kwartier. Constant 40 ppm betekent: werk staken.",
    feedbackWrong: "De Arbo-grens voor langdurig werk is 25 ppm gemiddeld over 8 uur. 40 ppm mag alleen als korte piek van hooguit een kwartier (tot 50 ppm).",
    hint: "Er zijn twee Arbo-grenzen: de waarde voor langdurig werk en de korte piekwaarde. Welke geldt bij een langdurige klus?",
    bron: "Kleintje Gas, h.9 (tip: Arbo 25 ppm over 8 uur, piek 50 ppm hooguit 15 minuten)",
    les: "Arbo: 25 ppm gemiddeld over 8 uur, piek 50 ppm hooguit een kwartier",
  },
  {
    // eigen variant met verse getallen
    question: "Bij een ruimtemeting in een eengezinswoning geeft je meter 15 ppm CO aan. Het toestel is in bedrijf. Wat doe je?",
    options: [
      "Niets: de waarde ligt onder de wettelijke grens van 20 ppm, dus de situatie is in orde.",
      "Je onderzoekt de oorzaak: CO hoort niet in een opstellingsruimte, ook niet onder de grenswaarde.",
      "Je stelt het toestel direct buiten bedrijf en meldt de overschrijding aan het bevoegd gezag.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! 0 ppm is de normale waarde. Elke duidelijk verhoogde waarde vraagt om onderzoek naar de oorzaak, ook als de wettelijke grens nog niet is overschreden.",
    feedbackWrong: "Onder de 20 ppm is er geen meldplicht, maar 15 ppm is geen normale waarde: CO hoort niet in een opstellingsruimte. Onderzoek de oorzaak.",
    hint: "De grens van 20 ppm is niet overschreden. Maar is 15 ppm een normale waarde in een opstellingsruimte?",
    bron: "Lesstof BvV CO verlenging, cluster 2.4 (beoordeling ruimtemeting)",
    les: "Elke duidelijk verhoogde waarde vraagt om onderzoek, ook onder de 20 ppm",
  },
  {
    // eigen vraag over de uitvoering van de ruimtemeting
    question: "Hoe voer je een CO-ruimtemeting in een opstellingsruimte uit?",
    options: [
      "Met je gekalibreerde persoonlijke CO-detector op borsthoogte, terwijl het toestel in bedrijf is; je meet bij het toestel en de rookgasafvoer.",
      "Met de sonde van de rookgasanalysemeter in het meetpunt van de rookgasafvoer.",
      "Met een CO-melder die je op de vloer naast het toestel legt, terwijl het toestel uit staat.",
    ],
    correct: 0,
    feedbackCorrect: "GOED! De ruimtemeting doe je met je persoonlijke, gekalibreerde CO-detector op borsthoogte, met het toestel in bedrijf. De sonde in het meetpunt hoort bij de rookgasmeting, niet bij de ruimtemeting.",
    feedbackWrong: "De sonde in het meetpunt is de rookgasmeting. De ruimtemeting doe je met je persoonlijke detector op borsthoogte, met het toestel in bedrijf.",
    hint: "Denk aan het verschil tussen meten in de ruimte en meten in het rookgas, en waar je je detector draagt.",
    bron: "Kleintje Gas, h.8 en lesstof cluster 2.4 (uitvoering ruimtemeting)",
    les: "Ruimtemeting: persoonlijke detector op borsthoogte, toestel in bedrijf",
  },
];

const POOL_R2 = [
  {
    // dataset leerdoel 4, vraag 4
    question: "Bij de rookgasanalyse van een gesloten toestel (type C) meet je 250 ppm CO. De fabrikant stelt geen eis aan de maximale CO-waarde. Hoe beoordeel je deze meetwaarde?",
    options: [
      "De waarde overschrijdt de maximale 200 ppm; het toestel moet direct buiten bedrijf.",
      "De waarde valt binnen de maximaal toegestane 400 ppm voor een gesloten toestel.",
      "De waarde valt binnen de maximaal toegestane 500 ppm voor een gesloten toestel.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! Zonder fabrikantseis geldt voor een gesloten toestel (type C) de tabelwaarde van maximaal 400 ppm in het verbrandingsgas. 250 ppm valt daarbinnen.",
    feedbackWrong: "Zonder fabrikantseis geldt voor type C de tabelwaarde van 400 ppm. De 200 ppm hoort bij type B.",
    hint: "Kijk goed naar het toesteltype: welke tabelwaarde hoort bij een gesloten toestel?",
    bron: "Kleintje Gas, §8.6.7, tabel 8.5 (max. CO in verbrandingsgas: type C 400 ppm)",
    les: "Zonder fabrikantseis geldt voor een gesloten toestel (type C) maximaal 400 ppm in het rookgas",
  },
  {
    // eigen variant met verse getallen
    question: "Bij een open toestel met rookgasafvoer (type B) meet je 230 ppm CO in het rookgas. De fabrikant stelt geen eis. Hoe beoordeel je dit?",
    options: [
      "Boven de maximale 200 ppm voor type B: het toestel vraagt om afstellen of nader onderzoek.",
      "Binnen de grens, want voor elk toestel geldt 400 ppm.",
      "Binnen de grens, want voor type B geldt 300 ppm.",
    ],
    correct: 0,
    feedbackCorrect: "GOED! Voor een open, afvoergebonden toestel (type B) geldt zonder fabrikantseis maximaal 200 ppm. 230 ppm is dus te hoog: afstellen of nader onderzoek.",
    feedbackWrong: "De tabel kent per toesteltype een eigen grens: type A 50 ppm, type B 200 ppm, type C 400 ppm. 230 ppm bij type B is een overschrijding.",
    hint: "Elk toesteltype heeft zijn eigen tabelwaarde. Welke hoort bij type B?",
    bron: "Kleintje Gas, §8.6.7, tabel 8.5 (max. CO in verbrandingsgas: type B 200 ppm)",
    les: "Type B heeft zonder fabrikantseis een grens van 200 ppm in het rookgas",
  },
  {
    // eigen variant: fabrikantseis gaat voor
    question: "De fabrikant van een gesloten toestel eist maximaal 100 ppm CO in het rookgas. Je meet 160 ppm. Wat is je oordeel?",
    options: [
      "In orde, want de tabelwaarde voor een gesloten toestel is 400 ppm.",
      "De fabrikantseis gaat voor: 160 ppm is een overschrijding.",
      "In orde, zolang de ruimtemeting maar 0 ppm aangeeft.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! De eis van de fabrikant gaat altijd voor. De tabelwaarden gelden alleen als de fabrikant geen eis stelt.",
    feedbackWrong: "De tabel gebruik je alleen als de fabrikant geen eis stelt. Hier eist de fabrikant 100 ppm, dus 160 ppm is een overschrijding.",
    hint: "Wanneer gebruik je de tabelwaarden eigenlijk?",
    bron: "Kleintje Gas, §8.6.7 (fabrikantseis gaat voor tabel 8.5)",
    les: "De eis van de fabrikant gaat altijd voor de tabelwaarden",
  },
  {
    // eigen variant: rookgas versus ruimte
    question: "Je meet een sterk verhoogde CO-waarde in het rookgas, maar de ruimtemeting geeft 0 ppm. Wat betekent dit?",
    options: [
      "Het toestel is veilig: zolang er geen CO in de ruimte komt, is er niets aan de hand.",
      "Dit is een storingssignaal: de verbranding is onvolledig en het toestel vraagt om afstellen of nader onderzoek.",
      "De CO-meter voor de ruimtemeting is defect.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! Een hoge rookgaswaarde betekent nog niet automatisch CO in de ruimte, maar het is wel een storingssignaal dat je niet mag negeren: de verbranding is onvolledig.",
    feedbackWrong: "Een hoge CO-waarde in het rookgas wijst op onvolledige verbranding. Ook zonder CO in de ruimte is dat een storingssignaal dat om actie vraagt.",
    hint: "De twee metingen zeggen allebei iets anders. Wat zegt een hoge waarde in het rookgas over de verbranding?",
    bron: "Kleintje Gas, §8.6.7 en lesstof cluster 2.4",
    les: "Een hoge rookgaswaarde betekent nog geen CO in de ruimte, maar is wel een storingssignaal",
  },
];

const POOL_R3 = [
  {
    question: "Je stelt een gastoestel buiten bedrijf vanwege een CO-overschrijding. Wat is je eerste handeling?",
    options: [
      "Het toestel uitschakelen, zodat de CO-productie direct stopt.",
      "Een label op het toestel aanbrengen.",
      "De melding aan het bevoegd gezag versturen.",
    ],
    correct: 0,
    feedbackCorrect: "GOED! Eerst schakel je het toestel uit: daarmee stopt de CO-productie meteen. Daarna volgen toestelkraan, label, klant en rapportage.",
    feedbackWrong: "De volgorde begint bij de bron: toestel uit, toestelkraan dicht, label erop, klant informeren en vastleggen.",
    hint: "Wat stopt de CO-productie het snelst?",
    bron: "Lesstof BvV CO verlenging, cluster 2.4 (buiten bedrijf stellen)",
    les: "Buiten bedrijf stellen begint met het uitschakelen van het toestel",
  },
  {
    question: "Waarom sluit je bij het buiten bedrijf stellen de toestelkraan en breng je een label aan?",
    options: [
      "Zodat het toestel niet ongemerkt weer in bedrijf genomen kan worden.",
      "Omdat de verzekering dat eist.",
      "Om het gasverbruik van de bewoner te verlagen.",
    ],
    correct: 0,
    feedbackCorrect: "GOED! Kraan dicht plus een duidelijk label voorkomt dat iemand het onveilige toestel ongemerkt weer inschakelt.",
    feedbackWrong: "Het doel is veiligheid: zonder gas en met een duidelijk label kan het toestel niet ongemerkt weer in bedrijf komen.",
    hint: "Denk aan wat er kan gebeuren als jij de deur uit bent en iemand het toestel weer aanzet.",
    bron: "Lesstof BvV CO verlenging, cluster 2.4 (buiten bedrijf stellen)",
    les: "Kraan dicht plus label voorkomt dat het toestel ongemerkt weer aangaat",
  },
  {
    question: "Je wilt de gastoevoer van een toestel afsluiten. Welke afsluiters horen er volgens NEN 8078 in elk geval in een bestaande woning te zitten?",
    options: [
      "Alleen een hoofdkraan bij de gasmeter.",
      "Een hoofdkraan bij het punt van binnenkomst en een goed bereikbare aansluitkraan bij elk aangesloten toestel.",
      "Alleen een afsluiter buiten de woning, in beheer bij de netbeheerder.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! NEN 8078 eist dat de gasinstallatie op vaste punten afsluitbaar is: de hoofdkraan bij binnenkomst in de woning en een bereikbare aansluitkraan bij elk toestel. Afsluiten is dus altijd mogelijk.",
    feedbackWrong: "NEN 8078 eist afsluitbaarheid op vaste punten: hoofdkraan bij binnenkomst en een bereikbare aansluitkraan bij elk aangesloten toestel.",
    hint: "De norm zorgt dat je een onveilig toestel altijd kunt afsluiten, ook zonder de hele woning af te sluiten.",
    bron: "NEN 8078:2023, §5.2.3 (afsluitbaarheid van de gastoevoer)",
    les: "NEN 8078: hoofdkraan bij binnenkomst en een bereikbare aansluitkraan bij elk toestel",
  },
];

const POOL_R4 = [
  {
    // dataset leerdoel 4, vraag 3
    question: "Stelling: als de monteur de oorzaak van een gemeten CO-overschrijding in de woning direct verhelpt, hoeft de overschrijding niet meer gemeld te worden aan het bevoegd gezag. Is deze stelling waar of niet waar?",
    options: ["Waar", "Niet waar"],
    correct: 1,
    feedbackCorrect: "GOED! De meldplicht blijft bestaan, ook als je de oorzaak direct kunt herstellen. Een overschrijding meld je terstond.",
    feedbackWrong: "Melden blijft verplicht, ook na direct herstel. De overschrijding is er geweest en moet gemeld worden.",
    hint: "De overschrijding heeft plaatsgevonden. Verandert het herstel daar iets aan?",
    bron: "Toetsmatrijs/proefexamens BvV CO en Kleintje Gas §1.1.2 (meldplicht: terstond melden)",
    les: "Melden blijft verplicht, ook als je de oorzaak direct verhelpt",
  },
  {
    question: "Je constateert een overschrijding van de CO-grenswaarde in een woning. Aan welke partijen meld je dit?",
    options: [
      "Bewoner of gebruiker, eigenaar, bevoegd gezag (gemeente) en de certificerende instelling.",
      "Bewoner, fabrikant van het toestel, netbeheerder en je verzekeringsmaatschappij.",
      "Alleen de eigenaar: die informeert zelf de andere partijen.",
    ],
    correct: 0,
    feedbackCorrect: "GOED! De meldplicht kent vier vaste partijen: bewoner of gebruiker, eigenaar, bevoegd gezag (gemeente) en de certificerende instelling.",
    feedbackWrong: "De vier partijen zijn: bewoner of gebruiker, eigenaar, bevoegd gezag (gemeente) en de certificerende instelling.",
    hint: "Denk aan de mensen in en om de woning en aan de twee instanties die toezicht houden.",
    bron: "Kleintje Gas, §1.1.2 (meldplicht gasketelwet)",
    les: "Melden doe je aan vier partijen: bewoner, eigenaar, bevoegd gezag en certificerende instelling",
  },
  {
    question: "In een huurwoning stel je een toestel buiten bedrijf vanwege CO. Wie informeer je in elk geval?",
    options: [
      "Alleen de huurder: die kan de verhuurder zelf inlichten.",
      "De huurder en ook de eigenaar (verhuurder), naast de melding aan bevoegd gezag en certificerende instelling.",
      "Alleen je eigen planning, zodat er een vervolgafspraak komt.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! In een huurwoning informeer je de bewoner en ook de eigenaar. Alleen de huurder informeren is niet genoeg.",
    feedbackWrong: "Bewoner en eigenaar informeer je allebei. Daarnaast meld je aan bevoegd gezag en certificerende instelling.",
    hint: "De bewoner en de eigenaar zijn hier twee verschillende personen. Voor wie is de melding bedoeld?",
    bron: "Kleintje Gas, §1.1.2 (melden aan bewoner/gebruiker, eigenaar, bevoegd gezag en CI)",
    les: "Informeer bewoner en eigenaar allebei, niet alleen de huurder",
  },
];

const POOL_R5 = [
  {
    question: "Wanneer mag een buiten bedrijf gesteld toestel weer in bedrijf worden genomen?",
    options: [
      "Zodra de ruimte goed is geventileerd en de meter 0 ppm aangeeft.",
      "Nadat de oorzaak is gevonden en verholpen en een controlemeting aantoont dat de installatie veilig functioneert.",
      "Zodra de bewoner een goedgekeurde CO-melder heeft opgehangen.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! Vrijgave kan pas als de oorzaak is weggenomen en een controlemeting laat zien dat de installatie veilig functioneert. Ventileren of een melder ophangen neemt de bron niet weg.",
    feedbackWrong: "Ventileren en een CO-melder nemen de bron niet weg. Vrijgeven doe je pas na herstel van de oorzaak plus een goede controlemeting.",
    hint: "Wat is er nodig om zeker te weten dat het probleem echt weg is?",
    bron: "Lesstof BvV CO verlenging, cluster 2.4 (vrijgave na buiten bedrijf stellen)",
    les: "Vrijgeven kan pas na oorzaak verholpen plus een goede controlemeting",
  },
  {
    question: "Stelling: een CO-melder ophangen is een acceptabel alternatief voor het wegnemen van de CO-bron. Is deze stelling waar of niet waar?",
    options: ["Waar", "Niet waar"],
    correct: 1,
    feedbackCorrect: "GOED! Een CO-melder waarschuwt alleen, hij lost niets op. De bron moet altijd worden weggenomen.",
    feedbackWrong: "Een CO-melder is een extra vangnet, geen oplossing. De bron moet altijd worden weggenomen.",
    hint: "Wat doet een CO-melder eigenlijk met de CO-bron?",
    bron: "Lesstof BvV CO verlenging, cluster 2.4 (vrijgave); Kleintje Gas §3.1.4",
    les: "Een CO-melder waarschuwt alleen: hij neemt de bron niet weg",
  },
  {
    question: "Je controlemeting geeft 0 ppm, maar je twijfelt of je meter goed werkt. Wat doe je?",
    options: [
      "Je geeft het toestel vrij: 0 ppm is 0 ppm.",
      "Je controleert je meter (kalibratie en nulstelling in de buitenlucht), herhaalt de meting en geeft bij twijfel niet vrij.",
      "Je vraagt de bewoner of hij gezondheidsklachten heeft en beslist op basis daarvan.",
    ],
    correct: 1,
    feedbackCorrect: "GOED! Twijfel je aan je meetresultaat, dan controleer je eerst je meter en herhaal je de meting. Bij twijfel geef je een toestel nooit vrij.",
    feedbackWrong: "Een meting is zo betrouwbaar als de meter. Controleer kalibratie en nulstelling, meet opnieuw en geef bij twijfel niet vrij.",
    hint: "Waar staat of valt elke CO-meting mee?",
    bron: "Lesstof BvV CO verlenging, cluster 2.4; Kleintje Gas §8.5 (eisen aan meetinstrumenten)",
    les: "Twijfel aan je meting: meter controleren en opnieuw meten, niet vrijgeven",
  },
];

// ─── RONDE 1: DE GRENSWAARDEN ───

const R1_BAKKEN = [
  { id: "ok", titel: "In orde", sub: "normale waarde", kleur: C.green, licht: C.greenLight },
  { id: "onderzoek", titel: "Onderzoeken", sub: "verhoogd: oorzaak zoeken", kleur: C.amber, licht: C.amberLight },
  { id: "ingrijpen", titel: "Direct ingrijpen", sub: "grens overschreden", kleur: C.red, licht: C.redLight },
];

const R1_KAARTEN = [
  {
    id: "k1", ppm: 0, sub: "ruimtemeting",
    situatie: "Eengezinswoning, jaarlijks onderhoud. Meting bij het toestel in bedrijf.",
    juist: "ok",
    hulp: "Wettelijke grens in de ruimte: 20 ppm. De normale waarde is 0 ppm.",
    uitlegGoed: "0 ppm is de normale, veilige situatie: buitenlucht bevat vrijwel geen CO.",
    hintFout: "Buitenlucht bevat vrijwel geen CO. Is deze waarde afwijkend?",
  },
  {
    id: "k2", ppm: 9, sub: "ruimtemeting",
    situatie: "Eengezinswoning. Meting bij de rookgasafvoer, toestel in bedrijf.",
    juist: "onderzoek",
    hulp: "Wettelijke grens in de ruimte: 20 ppm. Maar CO hoort helemaal niet in een opstellingsruimte.",
    uitlegGoed: "Onder de grens, maar duidelijk verhoogd: CO hoort niet in een opstellingsruimte. Onderzoek de oorzaak.",
    hintFout: "De grens van 20 ppm is niet overschreden. Maar is 9 ppm normaal in een opstellingsruimte?",
  },
  {
    id: "k3", ppm: 30, sub: "ruimtemeting",
    situatie: "Eengezinswoning. Meting bij het toestel in bedrijf.",
    juist: "ingrijpen",
    hulp: "Wettelijke grens in de ruimte: 20 ppm.",
    uitlegGoed: "Boven de wettelijke grens van 20 ppm: toestel buiten bedrijf, onderzoek instellen en melden.",
    hintFout: "Vergelijk 30 ppm met de wettelijke grens van 20 ppm.",
  },
  {
    id: "k4", ppm: 23, sub: "ruimtemeting",
    situatie: "Appartement (gestapelde bouw). Verplichte meting direct na onderhoud volgens BRL 6000-25.",
    juist: "onderzoek",
    uitlegGoed: "Bij deze verplichte meting in gestapelde bouw geldt een grens van 25 ppm. 23 ppm zit daaronder, maar is duidelijk verhoogd: oorzaak onderzoeken. De CO kan hier ook uit een omliggende woning komen.",
    hintFout: "Gestapelde bouw, meting na onderhoud: hier geldt de grens van 25 ppm. Zit 23 ppm daarboven of daaronder? En is het een normale waarde?",
  },
  {
    id: "k5", ppm: 28, sub: "ruimtemeting",
    situatie: "Appartement (gestapelde bouw). Verplichte meting direct na onderhoud volgens BRL 6000-25.",
    juist: "ingrijpen",
    uitlegGoed: "Boven de grens van 25 ppm die bij deze verplichte meting in gestapelde bouw geldt: buiten bedrijf, onderzoeken en melden.",
    hintFout: "Bij deze verplichte meting in gestapelde bouw ligt de grens op 25 ppm.",
  },
  {
    id: "k6", ppm: 40, sub: "ruimtemeting",
    situatie: "Jij werkt al de hele ochtend in een stookruimte. Je persoonlijke melder geeft constant deze waarde aan.",
    juist: "ingrijpen",
    uitlegGoed: "Voor je eigen blootstelling geldt maximaal 25 ppm gemiddeld over 8 uur. Constant 40 ppm betekent: werk staken en de oorzaak aanpakken. Alleen een korte piek tot 50 ppm (hooguit een kwartier) is toelaatbaar.",
    hintFout: "Dit gaat om jouw eigen blootstelling. Wat is de Arbo-grens voor langdurig werk?",
  },
  {
    id: "k7", ppm: 17, sub: "ruimtemeting",
    situatie: "Eengezinswoning. Meting bij het toestel in bedrijf.",
    juist: "onderzoek",
    uitlegGoed: "Onder de wettelijke grens van 20 ppm, maar ver boven de normale 0 ppm: oorzaak onderzoeken.",
    hintFout: "Vergelijk met de wettelijke grens van 20 ppm en bedenk wat een normale waarde is.",
  },
];

const R1_DRAAGPLEKKEN = [
  { id: "borst", label: "Op borsthoogte, aan je borstzak", goed: true },
  { id: "broekzak", label: "In je broekzak", goed: false },
  { id: "kist", label: "In je gereedschapskist, naast het toestel", goed: false },
  { id: "ketel", label: "Bovenop het toestel", goed: false },
];

function RondeGrenswaarden({ addScore, onDone }) {
  const [fase, setFase] = useState("uitleg"); // uitleg | waar | spel
  const [waarGoed, setWaarGoed] = useState(false);
  const [waarHint, setWaarHint] = useState(null);
  const [idx, setIdx] = useState(0);
  const [laatste, setLaatste] = useState(null); // uitleg van de laatst goed geplaatste kaart
  const [hint, setHint] = useState(null);
  const [popup, setPopup] = useState(false);

  const kaart = R1_KAARTEN[idx];
  const spiekOpen = idx < 3; // spiekbriefje klapt dicht zodra de hulp-kaarten voorbij zijn

  const drop = (bakId) => (payload, point) => {
    if (payload !== kaart.id) return undefined;
    if (bakId === kaart.juist) {
      addScore(5, point);
      setLaatste(kaart.uitlegGoed);
      setHint(null);
      if (idx + 1 >= R1_KAARTEN.length) setPopup(true);
      else setIdx(idx + 1);
      return "correct";
    }
    addScore(-5, point);
    setHint(kaart.hintFout);
    return "wrong";
  };

  if (fase === "uitleg") {
    return (
      <RondeIntro
        title="Ronde 1: De grenswaarden"
        intro="Missie 1, ronde 1. Kort de basis, daarna ga je meteen meten."
        onStart={() => setFase("waar")}
      >
        <UitlegItem term="Zo meet je">
          de ruimtemeting doe je met je <b>persoonlijke CO-detector</b>: een klein, gekalibreerd kastje dat je <b>op borsthoogte</b> draagt. Meet met het toestel <b>in bedrijf</b>, bij het toestel en de rookgasafvoer.
        </UitlegItem>
        <UitlegItem term="Zo beoordeel je">
          alleen <b>0 ppm</b> is normaal. Elke verhoogde waarde vraagt om <b>onderzoek</b>; boven de wettelijke grens grijp je <b>direct in</b>.
        </UitlegItem>
        <UitlegItem term="Spiekbriefje">
          de grenswaarden staan tijdens het spelen op je spiekbriefje. Na drie metingen klapt het dicht en moet je ze zelf kennen.
        </UitlegItem>
      </RondeIntro>
    );
  }

  if (fase === "waar") {
    return (
      <div className="flex-1 flex flex-col items-center p-5">
        <StepBanner step={1} />
        <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
          Ronde 1: De grenswaarden
        </h2>
        <p className="text-xs mb-3 text-center font-medium" style={{ color: C.brown }}>
          Voordat je de woning binnenstapt: waar draag je je persoonlijke CO-detector?
        </p>
        <CoMelderSVG ppm={0} w={100} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-4">
          {R1_DRAAGPLEKKEN.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                if (waarGoed) return;
                if (o.goed) {
                  addScore(5);
                  setWaarHint(null);
                  setWaarGoed(true);
                } else {
                  addScore(-5);
                  setWaarHint("Denk aan wat de detector bewaakt: de lucht die jij inademt.");
                }
              }}
              className="px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all hover:shadow"
              style={{
                backgroundColor: waarGoed && o.goed ? C.greenLight : "white",
                borderColor: waarGoed && o.goed ? C.green : C.beigeMid,
                color: C.brownText,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        {waarHint && (
          <p className="text-xs text-center italic mt-3 font-medium max-w-md" style={{ color: C.red }}>{waarHint}</p>
        )}
        {waarGoed && (
          <>
            <p className="text-xs text-center italic mt-3 font-medium max-w-md flex items-start gap-1.5" style={{ color: C.green }}>
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Precies: op borsthoogte bewaakt hij jouw ademzone, waar je ook bent in de woning.
            </p>
            <GameButton onClick={() => setFase("spel")} className="mt-3">Start de metingen</GameButton>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-5">
      <StepBanner step={1} />
      <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
        Ronde 1: De grenswaarden
      </h2>
      <p className="text-xs mb-3 text-center font-medium" style={{ color: C.brown }}>
        Sleep elke meting naar de juiste bak (of tik op de kaart en dan op de bak). Meting {idx + 1} van {R1_KAARTEN.length}.
      </p>

      <UitlegStrook key={spiekOpen ? "open" : "dicht"} title="Spiekbriefje: de grenswaarden" defaultOpen={spiekOpen}>
        <p>Ruimte: boven <b>20 ppm</b> direct ingrijpen · gestapelde bouw na onderhoud: <b>25 ppm</b>.</p>
        <p>Verhoogd maar onder de grens: onderzoeken. Alleen <b>0 ppm</b> is normaal.</p>
        <p>Jouw blootstelling (Arbo): <b>25 ppm</b> gemiddeld over 8 uur, piek <b>50 ppm</b> hooguit een kwartier.</p>
      </UitlegStrook>

      <CoMelderSVG ppm={kaart.ppm} />

      <Draggable payload={kaart.id} ghost={<DragCard label={`${kaart.ppm} ppm`} small />}>
        <div
          className="border-2 rounded-2xl px-4 py-3 max-w-md w-full mt-3 mb-4 shadow-md text-center"
          style={{ backgroundColor: C.bgCard, borderColor: C.olive }}
        >
          <p className="text-sm font-medium leading-snug" style={{ color: C.brownText }}>{kaart.situatie}</p>
          {kaart.hulp && (
            <p className="text-[11px] mt-1.5 italic font-medium" style={{ color: C.olive }}>
              Hulp: {kaart.hulp}
            </p>
          )}
        </div>
      </Draggable>

      <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {R1_BAKKEN.map((bak) => (
          <DropTarget key={bak.id} id={`r1-${bak.id}`} onDropItem={drop(bak.id)}>
            {({ isHover, flash }) => (
              <div
                className="rounded-xl border-2 p-2.5 min-h-[86px] flex flex-col items-center justify-center text-center transition-colors"
                style={{
                  borderStyle: "dashed",
                  borderColor: flash === "wrong" ? C.red : flash === "correct" ? C.green : isHover ? bak.kleur : C.beigeMid,
                  backgroundColor: flash === "wrong" ? C.redLight : flash === "correct" ? C.greenLight : isHover ? bak.licht : "white",
                }}
              >
                <span className="w-3.5 h-3.5 rounded-full mb-1 border" style={{ backgroundColor: bak.kleur, borderColor: C.brownText }} />
                <span className="text-xs font-bold" style={{ color: C.brownText }}>{bak.titel}</span>
                <span className="text-[10px] italic" style={{ color: C.brown }}>{bak.sub}</span>
              </div>
            )}
          </DropTarget>
        ))}
      </div>

      {hint && (
        <p className="text-xs text-center italic mt-3 font-medium max-w-md" style={{ color: C.red }}>{hint}</p>
      )}
      {laatste && !hint && (
        <p className="text-xs text-center italic mt-3 font-medium max-w-md flex items-start gap-1.5" style={{ color: C.green }}>
          <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {laatste}
        </p>
      )}

      {popup && (
        <FeedbackPopup
          type="correct"
          text="Alle metingen beoordeeld! Onthoud: alleen 0 ppm is normaal, verhoogd is onderzoeken, en boven de grens (20 ppm, in gestapelde bouw na onderhoud 25 ppm) grijp je direct in."
          onClose={onDone}
          buttonText="Naar de controlevraag"
        />
      )}
    </div>
  );
}

// ─── RONDE 2: RUIMTE OF ROOKGAS? ───

const R2_GRENZEN = [
  { id: "fab", label: "Eis van de fabrikant", kort: "Eis van de fabrikant" },
  { id: "r20", label: "20 ppm: ruimte", kort: "20 ppm" },
  { id: "r25", label: "25 ppm: ruimte, na onderhoud in gestapelde bouw", kort: "25 ppm" },
  { id: "a50", label: "50 ppm: rookgas type A (open, zonder afvoer)", kort: "50 ppm" },
  { id: "b200", label: "200 ppm: rookgas type B (open, met afvoer)", kort: "200 ppm" },
  { id: "c400", label: "400 ppm: rookgas type C (gesloten)", kort: "400 ppm" },
];

const R2_KAARTEN = [
  {
    id: "m1", ppm: 250, sub: "rookgasmeting",
    tekst: "Rookgasmeting bij een gesloten toestel (type C). De fabrikant stelt geen eis aan de CO-waarde.",
    grens: "c400", oordeel: "binnen",
    hulp: "Gesloten toestel zonder fabrikantseis: pak de tabelwaarde voor type C.",
    hintGrens: "Geen fabrikantseis, dus de tabel geldt. Welk toesteltype is dit?",
    hintOordeel: "Vergelijk 250 ppm met de grens van 400 ppm.",
    uitlegGoed: "Type C zonder fabrikantseis: grens 400 ppm. 250 ppm valt daarbinnen.",
  },
  {
    id: "m2", ppm: 22, sub: "ruimtemeting",
    tekst: "Ruimtemeting in een eengezinswoning, bij het toestel in bedrijf.",
    grens: "r20", oordeel: "over",
    hintGrens: "Dit is een meting in de ruimte, geen rookgasmeting. Welke wettelijke grens geldt daar?",
    hintOordeel: "22 ppm tegenover een grens van 20 ppm: wat is je conclusie?",
    uitlegGoed: "22 ppm is boven de wettelijke grens van 20 ppm: buiten bedrijf, onderzoeken en melden.",
  },
  {
    id: "m3", ppm: 80, sub: "rookgasmeting",
    tekst: "Rookgasmeting bij een keukengeiser zonder afvoer (type A). Geen fabrikantseis.",
    grens: "a50", oordeel: "over",
    hintGrens: "Een afvoerloos open toestel is type A. Welke tabelwaarde hoort daarbij?",
    hintOordeel: "Vergelijk 80 ppm met de grens van 50 ppm.",
    uitlegGoed: "Type A heeft de strengste grens: 50 ppm. 80 ppm is een overschrijding: afstellen of nader onderzoek.",
  },
  {
    id: "m4", ppm: 150, sub: "rookgasmeting",
    tekst: "Rookgasmeting bij een open toestel met rookgasafvoer (type B). Geen fabrikantseis.",
    grens: "b200", oordeel: "binnen",
    hintGrens: "Open met afvoer is type B. Welke tabelwaarde hoort daarbij?",
    hintOordeel: "Vergelijk 150 ppm met de grens van 200 ppm.",
    uitlegGoed: "Type B: grens 200 ppm. 150 ppm valt daarbinnen.",
  },
  {
    id: "m5", ppm: 24, sub: "ruimtemeting",
    tekst: "Ruimtemeting in een appartement (gestapelde bouw), direct na onderhoud volgens BRL 6000-25.",
    grens: "r25", oordeel: "binnen",
    hintGrens: "Ruimtemeting na onderhoud in gestapelde bouw: daar geldt een eigen grens.",
    hintOordeel: "Vergelijk 24 ppm met de grens van 25 ppm.",
    uitlegGoed: "Onder de grens van 25 ppm die hier geldt. Maar 24 ppm is wel duidelijk verhoogd: onderzoek de oorzaak.",
  },
  {
    id: "m6", ppm: 160, sub: "rookgasmeting",
    tekst: "Rookgasmeting bij een gesloten toestel (type C). De fabrikant eist maximaal 100 ppm.",
    grens: "fab", oordeel: "over",
    hintGrens: "Er is hier wel een fabrikantseis. Wat gaat er dan voor: de eis of de tabel?",
    hintOordeel: "De fabrikant eist maximaal 100 ppm. Je meet 160 ppm.",
    uitlegGoed: "De fabrikantseis (100 ppm) gaat voor de tabelwaarde. 160 ppm is dus een overschrijding.",
  },
];

function RondeRuimteOfRookgas({ addScore, onDone }) {
  const [fase, setFase] = useState("uitleg");
  const [idx, setIdx] = useState(0);
  const [stap, setStap] = useState("grens"); // "grens" | "oordeel"
  const [hint, setHint] = useState(null);
  const [laatste, setLaatste] = useState(null);
  const [popup, setPopup] = useState(false);

  const kaart = R2_KAARTEN[idx];

  const kiesGrens = (id) => {
    if (id === kaart.grens) {
      addScore(5);
      setHint(null);
      setStap("oordeel");
    } else {
      addScore(-5);
      setHint(kaart.hintGrens);
    }
  };

  const kiesOordeel = (o) => {
    if (o === kaart.oordeel) {
      addScore(5);
      setHint(null);
      setLaatste(kaart.uitlegGoed);
      if (idx + 1 >= R2_KAARTEN.length) setPopup(true);
      else {
        setIdx(idx + 1);
        setStap("grens");
      }
    } else {
      addScore(-5);
      setHint(kaart.hintOordeel);
    }
  };

  if (fase === "uitleg") {
    return (
      <RondeIntro
        title="Ronde 2: Ruimte of rookgas?"
        intro="De klassieke instinker op het examen: welke grenswaarde is hier eigenlijk van toepassing?"
        onStart={() => setFase("spel")}
      >
        <UitlegItem term="Rookgasmeting">
          je meet de CO-waarde <b>in het rookgas zelf</b>, met de sonde van de <b>rookgasanalysemeter</b> in het meetpunt. Die meter ken je uit de MicroGame Rookgasanalyse. Iets heel anders dan de ruimtemeting met je persoonlijke detector.
        </UitlegItem>
        <UitlegItem term="Welke grens geldt">
          de <b>eis van de fabrikant</b> gaat altijd voor. Zonder fabrikantseis geldt de tabel; die staat bij de eerste metingen in de antwoordknoppen, bij de laatste twee moet je hem kennen.
        </UitlegItem>
        <UitlegItem term="Let op">
          een hoge waarde in het rookgas betekent nog geen CO in de ruimte, maar is wel een <b>storingssignaal</b>: onvolledige verbranding.
        </UitlegItem>
      </RondeIntro>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-5">
      <StepBanner step={1} />
      <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
        Ronde 2: Ruimte of rookgas?
      </h2>
      <p className="text-xs mb-3 text-center font-medium" style={{ color: C.brown }}>
        Kies eerst de grens die hier geldt, beoordeel daarna de meetwaarde. Meting {idx + 1} van {R2_KAARTEN.length}.
      </p>

      {kaart.sub === "rookgasmeting" ? <RookgasMeterSVG ppm={kaart.ppm} /> : <CoMelderSVG ppm={kaart.ppm} />}

      <div
        className="border-2 rounded-2xl px-4 py-3 max-w-md w-full mt-3 mb-3 shadow-md text-center"
        style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}
      >
        <p className="text-sm font-medium leading-snug" style={{ color: C.brownText }}>{kaart.tekst}</p>
        {kaart.hulp && stap === "grens" && (
          <p className="text-[11px] mt-1.5 italic font-medium" style={{ color: C.olive }}>Hulp: {kaart.hulp}</p>
        )}
      </div>

      {stap === "grens" && (
        <div className="w-full max-w-md">
          <p className="text-xs font-bold mb-1.5" style={{ color: C.brownText }}>Welke grens geldt hier?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {/* scaffolding-fade: de laatste twee metingen tonen kale grenzen, zonder toesteltype */}
            {R2_GRENZEN.map((g) => (
              <button
                key={g.id}
                onClick={() => kiesGrens(g.id)}
                className="text-left px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all hover:shadow"
                style={{ backgroundColor: "white", borderColor: C.beigeMid, color: C.brownText }}
              >
                {idx >= 4 ? g.kort : g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {stap === "oordeel" && (
        <div className="w-full max-w-md">
          <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: C.green }}>
            <CheckCircle className="w-3.5 h-3.5" />
            Grens: {R2_GRENZEN.find((g) => g.id === kaart.grens).label}
          </p>
          <p className="text-xs font-bold mb-1.5" style={{ color: C.brownText }}>Wat is je oordeel?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => kiesOordeel("binnen")}
              className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow"
              style={{ backgroundColor: C.greenLight, borderColor: C.green, color: C.brownText }}
            >
              Binnen de grens
            </button>
            <button
              onClick={() => kiesOordeel("over")}
              className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow"
              style={{ backgroundColor: C.redLight, borderColor: C.red, color: C.brownText }}
            >
              Grens overschreden
            </button>
          </div>
        </div>
      )}

      {hint && (
        <p className="text-xs text-center italic mt-3 font-medium max-w-md" style={{ color: C.red }}>{hint}</p>
      )}
      {laatste && !hint && stap === "grens" && (
        <p className="text-xs text-center italic mt-3 font-medium max-w-md flex items-start gap-1.5" style={{ color: C.green }}>
          <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {laatste}
        </p>
      )}

      {popup && (
        <FeedbackPopup
          type="correct"
          text="Sterk! Eerst de juiste grens kiezen, dan pas oordelen. Fabrikantseis gaat voor; zonder eis geldt 50 ppm (type A), 200 ppm (type B) of 400 ppm (type C)."
          onClose={onDone}
          buttonText="Naar de controlevraag"
        />
      )}
    </div>
  );
}

// ─── RONDE 3: BUITEN BEDRIJF (VOLGORDEPUZZEL) ───

const R3_STAPPEN = [
  {
    id: "uit", label: "Toestel uitschakelen", icon: Power,
    waarom: "Daarmee stopt de CO-productie direct.",
    nietNu: "Eerst stop je de bron: het toestel uitschakelen is altijd de eerste handeling.",
  },
  {
    id: "kraan", label: "Toestelkraan sluiten", icon: Wrench,
    waarom: "Zonder gas kan het toestel niet opnieuw starten. Volgens NEN 8078 zit er bij elk toestel een bereikbare aansluitkraan.",
    nietNu: "De toestelkraan sluit je direct na het uitschakelen, voordat je verder gaat.",
  },
  {
    id: "label", label: "Label aanbrengen: buiten bedrijf", icon: Tag,
    waarom: "Zo ziet iedereen dat het toestel niet gebruikt mag worden.",
    nietNu: "Het label komt pas als het toestel uit staat en de kraan dicht is.",
  },
  {
    id: "klant", label: "Aan de klant uitleggen waarom", icon: Users,
    waarom: "De klant moet begrijpen wat er aan de hand is en wat er nu gaat gebeuren.",
    nietNu: "Eerst maak je het toestel veilig (uit, kraan dicht, label), daarna informeer je de klant.",
  },
  {
    id: "vastleggen", label: "Vastleggen in je rapportage", icon: ClipboardList,
    waarom: "Zo is aantoonbaar wat je hebt gemeten, gedaan en gemeld.",
    nietNu: "Vastleggen is de afsluiting: dat doe je als de andere stappen zijn gezet.",
  },
];

function schud(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function RondeBuitenBedrijf({ addScore, onDone }) {
  const [fase, setFase] = useState("uitleg");
  const [geplaatst, setGeplaatst] = useState([]);
  const [rest, setRest] = useState(() => schud(R3_STAPPEN.map((s) => s.id)));
  const [foutMelding, setFoutMelding] = useState(null);
  const [popup, setPopup] = useState(false);

  const verwacht = R3_STAPPEN[geplaatst.length]?.id;

  const drop = (payload, point) => {
    if (!rest.includes(payload)) return undefined;
    if (payload === verwacht) {
      addScore(5, point);
      setFoutMelding(null);
      const nieuw = [...geplaatst, payload];
      setGeplaatst(nieuw);
      setRest(rest.filter((id) => id !== payload));
      if (nieuw.length === R3_STAPPEN.length) setPopup(true);
      return "correct";
    }
    addScore(-5, point);
    setFoutMelding(R3_STAPPEN.find((s) => s.id === payload).nietNu);
    return "wrong";
  };

  if (fase === "uitleg") {
    return (
      <RondeIntro
        title="Ronde 1: Buiten bedrijf"
        intro="Missie 2, ronde 1. De meting was niet goed: nu telt je handelen. In welke volgorde stel je een toestel buiten bedrijf?"
        onStart={() => setFase("spel")}
      >
        <UitlegItem term="Wanneer">
          bij een onveilige situatie: een overschrijding van de grenswaarde in de ruimte, een lekkende rookgasafvoer of een toestel dat aantoonbaar CO produceert.
        </UitlegItem>
        <UitlegItem term="Afsluiten kan altijd">
          NEN 8078 eist dat een gasinstallatie op vaste punten afsluitbaar is: de <b>hoofdkraan</b> bij binnenkomst in de woning en een bereikbare <b>aansluitkraan bij elk toestel</b>. Ongebruikte aansluitpunten horen afgedopt te zijn.
        </UitlegItem>
        <UitlegItem term="De opdracht">
          sleep de vijf handelingen in de juiste volgorde. Denk logisch: eerst de bron stoppen, dan borgen, dan communiceren.
        </UitlegItem>
      </RondeIntro>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-5">
      <StepBanner step={1} />
      <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
        Ronde 1: Buiten bedrijf
      </h2>
      <p className="text-xs mb-3 text-center font-medium" style={{ color: C.brown }}>
        Sleep de handelingen een voor een in de juiste volgorde (of tik op een kaart en dan op de lijst).
      </p>

      <DropTarget id="r3-lijst" onDropItem={drop} className="w-full max-w-md">
        {({ isHover, flash }) => (
          <div
            className="rounded-xl border-2 p-3 transition-colors"
            style={{
              borderStyle: "dashed",
              borderColor: flash === "wrong" ? C.red : flash === "correct" ? C.green : isHover ? C.olive : C.beigeMid,
              backgroundColor: flash === "wrong" ? C.redLight : isHover ? C.oliveLight : "white",
            }}
          >
            <span className="text-xs italic" style={{ color: C.brown }}>
              Jouw volgorde ({geplaatst.length}/{R3_STAPPEN.length}):
            </span>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {geplaatst.map((id, i) => {
                const stap = R3_STAPPEN.find((s) => s.id === id);
                const Icon = stap.icon;
                return (
                  <div key={id} className="rounded-lg px-2.5 py-2 border-2 bg-white" style={{ borderColor: C.green }}>
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: C.brownText }}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                        style={{ backgroundColor: C.green }}
                      >
                        {i + 1}
                      </span>
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: C.olive }} />
                      {stap.label}
                    </div>
                    <p className="text-[10px] italic mt-0.5 ml-7" style={{ color: C.brown }}>{stap.waarom}</p>
                  </div>
                );
              })}
              {geplaatst.length < R3_STAPPEN.length && (
                <div
                  className="rounded-lg px-2.5 py-2 border-2 text-xs italic text-center"
                  style={{ borderStyle: "dashed", borderColor: C.beigeMid, color: C.brown }}
                >
                  Sleep hier stap {geplaatst.length + 1} naartoe
                </div>
              )}
            </div>
          </div>
        )}
      </DropTarget>

      <div className="flex flex-col gap-1.5 mt-4 w-full max-w-md">
        {rest.map((id) => {
          const stap = R3_STAPPEN.find((s) => s.id === id);
          return (
            <Draggable key={id} payload={id} ghost={<DragCard label={stap.label} small />}>
              <DragCard label={stap.label} small />
            </Draggable>
          );
        })}
      </div>

      {foutMelding && (
        <p className="text-xs text-center italic mt-3 font-medium max-w-md" style={{ color: C.red }}>
          Nog niet: {foutMelding}
        </p>
      )}

      {popup && (
        <FeedbackPopup
          type="correct"
          text="Precies de goede volgorde: uitschakelen, toestelkraan sluiten, label erop, de klant uitleggen waarom en alles vastleggen. Zo staat het toestel veilig buiten bedrijf en kan niemand het ongemerkt weer inschakelen."
          onClose={onDone}
          buttonText="Naar de controlevraag"
        />
      )}
    </div>
  );
}

// ─── RONDE 4: WIE MELD JE? ───

const R4_PARTIJEN = [
  { id: "bewoner", label: "Bewoner of gebruiker", juist: true },
  { id: "fabrikant", label: "Fabrikant van het toestel", juist: false, uitleg: "De fabrikant heeft geen rol in de meldplicht." },
  { id: "eigenaar", label: "Eigenaar (bijvoorbeeld de verhuurder)", juist: true },
  { id: "huisarts", label: "Huisarts van de bewoner", juist: false, uitleg: "Medische hulp regel je alleen bij gezondheidsklachten; dit is geen meldplicht-partij." },
  { id: "gemeente", label: "Bevoegd gezag (gemeente)", juist: true },
  { id: "netbeheerder", label: "Netbeheerder", juist: false, uitleg: "De netbeheerder gaat over het gasnet, niet over deze melding." },
  { id: "ci", label: "Certificerende instelling", juist: true },
  { id: "verzekeraar", label: "Je verzekeringsmaatschappij", juist: false, uitleg: "Je verzekering staat buiten de wettelijke meldplicht." },
];

function RondeWieMeldJe({ addScore, onDone }) {
  const [fase, setFase] = useState("uitleg"); // uitleg | selectie | scenario
  const [selectie, setSelectie] = useState([]);
  const [beoordeeld, setBeoordeeld] = useState(false); // eerste bevestiging telt voor de score
  const [foutUitleg, setFoutUitleg] = useState([]);
  const [scenarioResultaat, setScenarioResultaat] = useState(null);

  const toggle = (id) => {
    setSelectie((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setFoutUitleg([]);
  };

  const bevestig = () => {
    const goed = selectie.filter((id) => R4_PARTIJEN.find((p) => p.id === id).juist);
    const fout = selectie.filter((id) => !R4_PARTIJEN.find((p) => p.id === id).juist);

    if (!beoordeeld) {
      setBeoordeeld(true);
      addScore(goed.length * 5 - fout.length * 5);
    }

    if (fout.length === 0 && goed.length === 4) {
      setFase("scenario");
      return;
    }

    setFoutUitleg(fout.map((id) => R4_PARTIJEN.find((p) => p.id === id).uitleg));
    setSelectie(goed); // instinkers vallen af, de speler vult verder aan
  };

  const kiesScenario = (ja) => {
    if (scenarioResultaat) return;
    if (ja) addScore(5);
    else addScore(-5);
    setScenarioResultaat(ja ? "goed" : "fout");
  };

  if (fase === "uitleg") {
    return (
      <RondeIntro
        title="Ronde 2: Wie meld je?"
        intro="Je hebt een overschrijding gemeten en het toestel buiten bedrijf gesteld. Nu de meldplicht."
        onStart={() => setFase("selectie")}
      >
        <UitlegItem term="Meldplicht">
          bij een overschrijding van de grenswaarde of het vrijkomen van CO meld je dit <b>terstond</b> aan vier vaste partijen.
        </UitlegItem>
        <UitlegItem term="Ook na herstel">
          de melding blijft verplicht, <b>ook</b> als je de oorzaak direct kunt verhelpen.
        </UitlegItem>
        <UitlegItem term="De opdracht">
          kies uit de acht partijen de vier waaraan je moet melden. Elke juiste partij levert punten op, elke verkeerde kost punten.
        </UitlegItem>
      </RondeIntro>
    );
  }

  if (fase === "selectie") {
    return (
      <div className="flex-1 flex flex-col items-center p-5">
        <StepBanner step={1} />
        <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
          Ronde 2: Wie meld je?
        </h2>
        <p className="text-xs mb-3 text-center font-medium" style={{ color: C.brown }}>
          Tik de vier partijen aan waaraan je de overschrijding meldt en bevestig je keuze.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mb-4">
          {R4_PARTIJEN.map((p) => {
            const actief = selectie.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all hover:shadow"
                style={{
                  backgroundColor: actief ? C.oliveLight : "white",
                  borderColor: actief ? C.olive : C.beigeMid,
                  color: C.brownText,
                }}
              >
                <span
                  className="w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: actief ? C.olive : C.beigeMid, backgroundColor: actief ? C.olive : "white" }}
                >
                  {actief && <CheckCircle className="w-3 h-3 text-white" />}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>

        <GameButton onClick={bevestig} disabled={selectie.length === 0}>
          Bevestig mijn keuze ({selectie.length} gekozen)
        </GameButton>

        {foutUitleg.length > 0 && (
          <div className="max-w-md w-full mt-3 rounded-xl border-2 px-3 py-2" style={{ borderColor: C.red, backgroundColor: C.redLight }}>
            {foutUitleg.map((u) => (
              <p key={u} className="text-xs italic font-medium flex items-start gap-1.5" style={{ color: C.red }}>
                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {u}
              </p>
            ))}
            <p className="text-xs italic font-medium mt-1" style={{ color: C.brownText }}>
              Vul je selectie aan tot de vier juiste partijen en bevestig opnieuw.
            </p>
          </div>
        )}
        {foutUitleg.length === 0 && beoordeeld && selectie.length < 4 && (
          <p className="text-xs text-center italic mt-3 font-medium" style={{ color: C.amber }}>
            Goed bezig, maar je mist nog {4 - selectie.length} van de vier partijen.
          </p>
        )}
      </div>
    );
  }

  // fase === "scenario"
  return (
    <div className="flex-1 flex flex-col items-center p-5">
      <StepBanner step={1} />
      <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
        Ronde 2: Wie meld je?
      </h2>
      <p className="text-xs mb-4 text-center font-medium flex items-center gap-1.5" style={{ color: C.green }}>
        <CheckCircle className="w-3.5 h-3.5" />
        De vier partijen staan op je lijst: bewoner, eigenaar, bevoegd gezag en certificerende instelling.
      </p>

      <div className="border-2 rounded-2xl p-5 max-w-md w-full shadow-md" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.olive }}>Nog een situatie</div>
        <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: C.brownText }}>
          Je vond een losliggende rookgasafvoer als oorzaak van de overschrijding en hebt hem direct vastgezet. De controlemeting is in orde. Meld je de overschrijding nog?
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => kiesScenario(true)}
            className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow text-left"
            style={{
              backgroundColor: scenarioResultaat === "goed" ? C.greenLight : "white",
              borderColor: scenarioResultaat === "goed" ? C.green : C.beigeMid,
              color: C.brownText,
            }}
          >
            Ja, melden blijft verplicht.
          </button>
          <button
            onClick={() => kiesScenario(false)}
            className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow text-left"
            style={{
              backgroundColor: scenarioResultaat === "fout" ? C.redLight : "white",
              borderColor: scenarioResultaat === "fout" ? C.red : C.beigeMid,
              color: C.brownText,
            }}
          >
            Nee, de oorzaak is al verholpen.
          </button>
        </div>

        {scenarioResultaat && (
          <div className="mt-3">
            <p className="text-sm italic font-medium" style={{ color: scenarioResultaat === "goed" ? C.green : C.red }}>
              {scenarioResultaat === "goed"
                ? "Precies: de overschrijding is er geweest, dus je meldt hem terstond aan alle vier de partijen. Dat het probleem al is opgelost, zet je in je rapportage."
                : "Toch wel: de overschrijding is er geweest, dus de meldplicht blijft. Dat je de oorzaak direct hebt verholpen, zet je in je rapportage."}
            </p>
            <GameButton onClick={onDone} variant="green" className="w-full mt-3">
              Naar de controlevraag
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RONDE 5: DE VRIJGAVE (KAAL) ───

const R5_SCENARIOS = [
  {
    id: "s1",
    tekst: "Je hebt de opstellingsruimte flink geventileerd. De meter staat nu op 0 ppm. De oorzaak van de eerdere overschrijding is nog niet gevonden.",
    vrijgeven: false,
    uitleg: "Ventileren verdunt de CO, maar neemt de bron niet weg. Zonder gevonden en verholpen oorzaak blijft het toestel buiten bedrijf.",
  },
  {
    id: "s2",
    tekst: "De losliggende rookgasafvoer is hersteld. Je controlemeting bij het toestel en de rookgasafvoer geeft 0 ppm, met een gekalibreerde meter.",
    vrijgeven: true,
    uitleg: "Oorzaak gevonden en verholpen, en de controlemeting toont aan dat de installatie veilig functioneert: het toestel mag weer in bedrijf.",
  },
  {
    id: "s3",
    tekst: "De klant heeft een CO-melder opgehangen en belooft goed te ventileren tot de reparatie van volgende week.",
    vrijgeven: false,
    uitleg: "Een CO-melder waarschuwt alleen en ventileren verdunt alleen: allebei nemen ze de bron niet weg. Nooit een alternatief voor herstel.",
  },
  {
    id: "s4",
    tekst: "Je hebt een onderdeel vervangen dat vermoedelijk de oorzaak was. Een controlemeting heb je nog niet uitgevoerd.",
    vrijgeven: false,
    uitleg: "Vermoedelijk verholpen is niet genoeg: pas als een controlemeting aantoont dat de installatie veilig functioneert, mag het toestel weer in bedrijf.",
  },
  {
    id: "s5",
    tekst: "Je controlemeting geeft 0 ppm, maar de kalibratie van je meter is verlopen en je vertrouwt de uitslag niet helemaal.",
    vrijgeven: false,
    uitleg: "Twijfel je aan je meetresultaat, controleer dan eerst je meter (kalibratie, nulstelling in de buitenlucht) en herhaal de meting. Bij twijfel geef je niet vrij.",
  },
];

function RondeVrijgave({ addScore, onDone }) {
  const [fase, setFase] = useState("uitleg");
  const [idx, setIdx] = useState(0);
  const [resultaat, setResultaat] = useState(null); // "goed" | "fout"
  const [popup, setPopup] = useState(false);

  const scenario = R5_SCENARIOS[idx];

  const kies = (vrijgeven) => {
    if (resultaat) return;
    if (vrijgeven === scenario.vrijgeven) {
      addScore(5);
      setResultaat("goed");
    } else {
      addScore(-5);
      setResultaat("fout");
    }
  };

  const volgende = () => {
    if (idx + 1 >= R5_SCENARIOS.length) {
      setPopup(true);
      return;
    }
    setIdx(idx + 1);
    setResultaat(null);
  };

  if (fase === "uitleg") {
    return (
      <RondeIntro
        title="Ronde 3: De vrijgave"
        intro="De laatste ronde, zonder spiekbriefje. Jij beslist of een buiten bedrijf gesteld toestel weer in bedrijf mag."
        onStart={() => setFase("spel")}
        buttonText="Ik ben er klaar voor"
      >
        <p className="text-sm leading-relaxed text-center" style={{ color: C.brownText }}>
          Je krijgt vijf situaties. Per situatie kies je: <b>vrijgeven</b> of <b>buiten bedrijf laten</b>. Je hebt per situatie een kans, zoals in de praktijk. Geen hulp meer: alles wat je nodig hebt, heb je in de vorige rondes geleerd.
        </p>
      </RondeIntro>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-5">
      <StepBanner step={1} />
      <h2 className="text-lg font-bold italic mb-1 text-center" style={{ color: C.brownText }}>
        Ronde 3: De vrijgave
      </h2>
      <p className="text-xs mb-4 text-center font-medium" style={{ color: C.brown }}>
        Situatie {idx + 1} van {R5_SCENARIOS.length}. Mag het toestel weer in bedrijf?
      </p>

      <div className="border-2 rounded-2xl p-5 max-w-md w-full shadow-md" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: C.brownText }}>{scenario.tekst}</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => kies(true)}
            disabled={!!resultaat}
            className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow disabled:opacity-60"
            style={{
              backgroundColor: resultaat && scenario.vrijgeven ? C.greenLight : "white",
              borderColor: resultaat && scenario.vrijgeven ? C.green : C.beigeMid,
              color: C.brownText,
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" style={{ color: C.green }} />
              Vrijgeven
            </span>
          </button>
          <button
            onClick={() => kies(false)}
            disabled={!!resultaat}
            className="px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow disabled:opacity-60"
            style={{
              backgroundColor: resultaat && !scenario.vrijgeven ? C.greenLight : "white",
              borderColor: resultaat && !scenario.vrijgeven ? C.green : C.beigeMid,
              color: C.brownText,
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" style={{ color: C.red }} />
              Buiten bedrijf laten
            </span>
          </button>
        </div>

        {resultaat && (
          <div className="mt-3">
            <p className="text-sm italic font-medium flex items-start gap-1.5" style={{ color: resultaat === "goed" ? C.green : C.red }}>
              {resultaat === "goed"
                ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {scenario.uitleg}
            </p>
            <GameButton onClick={volgende} variant={resultaat === "goed" ? "green" : "danger"} className="w-full mt-3">
              {idx + 1 >= R5_SCENARIOS.length ? "Ronde afronden" : "Volgende situatie"}
            </GameButton>
          </div>
        )}
      </div>

      {popup && (
        <FeedbackPopup
          type="correct"
          text="Zo hoort het: vrijgeven doe je pas als de oorzaak is verholpen en een controlemeting aantoont dat het veilig is. Ventileren of een CO-melder ophangen is nooit de oplossing."
          onClose={onDone}
          buttonText="Naar de laatste controlevraag"
        />
      )}
    </div>
  );
}

// ─── STARTSCHERM ───

function StartScreen({ onStart }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="py-3 px-5 text-center" style={{ backgroundColor: C.bgHeader }}>
        <span className="text-white font-bold italic text-lg">De CO-meting</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="rounded-full p-7 border-4" style={{ backgroundColor: C.beigeLight, borderColor: C.brownText }}>
          <Gauge className="w-20 h-20" style={{ color: C.brownText }} />
        </div>
        <h1 className="text-3xl font-bold italic text-center" style={{ color: C.brownText }}>De CO-meting</h1>
        <p className="max-w-sm text-center font-medium" style={{ color: C.brown }}>
          Jij bent de monteur. Drie klussen wachten: meten, de meetwaarde beoordelen en juist handelen als het mis is. Weet jij wanneer een toestel buiten bedrijf moet, wie je dan meldt en wanneer het weer aan mag?
        </p>
        <div className="border-2 rounded-2xl p-4 max-w-sm w-full text-xs leading-relaxed" style={{ backgroundColor: C.bgCard, borderColor: C.beigeMid, color: C.brownText }}>
          <p className="font-bold mb-1">Zo werkt het</p>
          <p className="mb-1">Sleep kaarten naar de juiste plek, of tik eerst op een kaart en daarna op de plek waar hij hoort. Sommige rondes werken met knoppen.</p>
          <p>Goede zet: +5 · foute zet: -5 · controlevraag goed: +10. Je hebt 5 hartjes; elke foute controlevraag kost er een. Zijn ze op, dan speel je die ronde opnieuw.</p>
        </div>
        <GameButton onClick={onStart}>Start de game</GameButton>
      </div>
    </div>
  );
}

// ─── GAME OVER (hartjes op) ───

function GameOver({ onRestart }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <div className="rounded-2xl border-2 shadow-2xl p-6 w-full max-w-sm text-center" style={{ backgroundColor: C.bgCard, borderColor: C.red }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: C.red }} />
        <h2 className="font-bold italic text-xl mb-2" style={{ color: C.brownText }}>Je hartjes zijn op</h2>
        <p className="text-sm mb-4" style={{ color: C.brown }}>
          Geen probleem: van fouten leer je. Je speelt deze ronde opnieuw, met volle hartjes en de score die je aan het begin van de ronde had.
        </p>
        <GameButton onClick={onRestart} className="w-full">Speel deze ronde opnieuw</GameButton>
      </div>
    </div>
  );
}

// ─── MAIN ───

// screen → [missie, ronde] voor de progressbar en de voortgangsmeldingen
const SCREEN_INFO = {
  m1intro: [1, 1], r1: [1, 1], r1mc: [1, 1], r2: [1, 2], r2mc: [1, 2],
  m2intro: [2, 1], r3: [2, 1], r3mc: [2, 1], r4: [2, 2], r4mc: [2, 2],
  r5: [2, 3], r5mc: [2, 3],
};

// De kern van het leerdoel: staat altijd op het eindscherm.
const LEERMOMENTEN = [
  "0 ppm is normaal; elke verhoogde waarde in de opstellingsruimte vraagt om onderzoek",
  "Boven 20 ppm in de ruimte: buiten bedrijf, onderzoeken en melden (gestapelde bouw na onderhoud: grens 25 ppm)",
  "Rookgas: eerst de fabrikantseis; zonder eis geldt 50 ppm (type A), 200 ppm (type B) of 400 ppm (type C)",
  "Buiten bedrijf: uitschakelen, toestelkraan dicht, label, klant informeren, vastleggen; melden aan bewoner, eigenaar, bevoegd gezag en certificerende instelling, ook na direct herstel",
  "Vrijgeven kan pas na oorzaak gevonden en verholpen plus een goede controlemeting; ventileren of een CO-melder is nooit de oplossing",
];

const RONDE_SCHERMEN = ["r1", "r2", "r3", "r4", "r5"];
const MC_NAAR_RONDE = { r1mc: "r1", r2mc: "r2", r3mc: "r3", r4mc: "r4", r5mc: "r5" };

export default function CoMetingGame({ initialScreen = "start", onExit }) {
  const [screen, setScreen] = useState(initialScreen);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [aandacht, setAandacht] = useState([]);
  const juice = useGameJuice();

  // score bij de start van de huidige ronde, voor de herstart als de hartjes op zijn
  const scoreBijRondeStart = useRef(0);
  useEffect(() => {
    if (RONDE_SCHERMEN.includes(screen)) scoreBijRondeStart.current = score;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // onthoudt waar deze speler de mist in ging; elk punt maar een keer
  const noteer = useCallback((les) => {
    if (!les) return;
    setAandacht((prev) => (prev.includes(les) ? prev : [...prev, les]));
  }, []);

  const addScore = useCallback(
    (pts, point) => {
      setScore((prev) => Math.max(0, Math.min(MAX_SCORE, prev + pts)));
      if (pts >= 0) juice.triggerCorrect(pts, point);
      else juice.triggerWrong(pts, point);
    },
    [juice]
  );

  const loseLife = useCallback(() => {
    setLives((prev) => Math.max(0, prev - 1));
    juice.triggerWrong();
  }, [juice]);

  const resetGame = () => {
    setScreen("start");
    setScore(0);
    setLives(5);
    setAandacht([]);
  };

  // hartjes op: niet de hele game opnieuw, maar de huidige ronde
  const herstartRonde = () => {
    const doel = MC_NAAR_RONDE[screen] ?? (RONDE_SCHERMEN.includes(screen) ? screen : null);
    setLives(5);
    if (!doel) {
      resetGame();
      return;
    }
    setScore(scoreBijRondeStart.current);
    setScreen(doel);
  };

  useEffect(() => {
    if (screen === "end") {
      juice.triggerLevelUp();
      meldVoortgang({ missie: 2, ronde: 3, score, maxScore: MAX_SCORE, completed: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const showProgress = !["start", "end"].includes(screen);
  const [missie, ronde] = SCREEN_INFO[screen] ?? [1, 1];

  const mc = (pool, next, opts = {}) => (
    <div className="flex-1 flex flex-col items-center p-6">
      <StepBanner step={2} />
      <MCControle
        pool={pool}
        addScore={addScore}
        loseLife={loseLife}
        noteer={noteer}
        onComplete={() => {
          meldVoortgang({ missie, ronde, score, maxScore: MAX_SCORE, completed: false });
          setScreen(next);
        }}
        {...opts}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: C.bgPage }}>
      <juice.JuiceOverlay />
      <DragProvider>
        <div
          className="max-w-[800px] w-full mx-auto flex flex-col min-h-screen shadow-lg overflow-x-hidden"
          style={{ backgroundColor: C.bgPage, animation: juice.shaking ? "shake 0.3s ease-in-out" : "none" }}
        >
          {showProgress && <ProgressBar currentMission={missie} currentRound={ronde} score={score} lives={lives} />}

          {screen === "start" && <StartScreen onStart={() => setScreen("m1intro")} />}

          {screen === "m1intro" && (
            <IntroScreen title="Missie 1: Lees en beoordeel de meter" buttonText="Aan de slag" onNext={() => setScreen("r1")}>
              <div className="leading-relaxed" style={{ color: C.brownText }}>
                <p className="mb-2 font-bold italic">Klus 1: de meetronde.</p>
                <p className="mb-2">
                  Een CO-meter geeft alleen een getal. Jij maakt er een oordeel van: is dit normaal, verhoogd of een overschrijding? Daarvoor moet je de <b>grenswaarden</b> kennen, en vooral weten <b>welke grens</b> waar geldt.
                </p>
                <p>Eerst de ruimtemeting, daarna de instinker van het examen: ruimte of rookgas?</p>
              </div>
            </IntroScreen>
          )}

          {screen === "r1" && <RondeGrenswaarden addScore={addScore} onDone={() => setScreen("r1mc")} />}
          {screen === "r1mc" && mc(POOL_R1, "r2")}

          {screen === "r2" && <RondeRuimteOfRookgas addScore={addScore} onDone={() => setScreen("r2mc")} />}
          {screen === "r2mc" && mc(POOL_R2, "m2intro")}

          {screen === "m2intro" && (
            <IntroScreen title="Missie 2: Handel juist" buttonText="Naar de klus" onNext={() => setScreen("r3")}>
              <div className="leading-relaxed" style={{ color: C.brownText }}>
                <p className="mb-2 font-bold italic">Goed gemeten! Nu wordt het serieus.</p>
                <p className="mb-2">
                  Meten is stap een, handelen is stap twee. Bij een onveilige situatie stel je het toestel <b>buiten bedrijf</b>, je <b>meldt</b> aan de juiste partijen en je geeft pas weer vrij als het <b>echt veilig</b> is: oorzaak gevonden en verholpen, plus een goede controlemeting.
                </p>
                <p>Drie rondes: de volgorde van het buiten bedrijf stellen, de meldplicht en als afsluiter de vrijgave, zonder hulp.</p>
              </div>
            </IntroScreen>
          )}

          {screen === "r3" && <RondeBuitenBedrijf addScore={addScore} onDone={() => setScreen("r3mc")} />}
          {screen === "r3mc" && mc(POOL_R3, "r4")}

          {screen === "r4" && <RondeWieMeldJe addScore={addScore} onDone={() => setScreen("r4mc")} />}
          {screen === "r4mc" && mc(POOL_R4, "r5")}

          {screen === "r5" && <RondeVrijgave addScore={addScore} onDone={() => setScreen("r5mc")} />}
          {screen === "r5mc" && mc(POOL_R5, "end", { lastRound: true })}

          {screen === "end" && (
            <EndScreen
              score={score}
              maxScore={MAX_SCORE}
              lives={lives}
              text="Sterk werk! Je leest een CO-meter niet alleen af, je beoordeelt hem: met de juiste grenswaarde voor ruimte en rookgas. En als het mis is, weet je precies wat je doet: buiten bedrijf stellen, melden aan de vier partijen en pas vrijgeven als het aantoonbaar veilig is. Dit is het grootste vraagblok van het examen, en jij hebt hem net doorlopen."
              leermomenten={LEERMOMENTEN}
              aandacht={aandacht}
              onRestart={resetGame}
              onExit={onExit}
            />
          )}

          {lives === 0 && screen !== "end" && <GameOver onRestart={herstartRonde} />}

          <div className="py-2 text-center text-[10px]" style={{ color: C.brown }}>
            Studium B.V. · Vakmanschap CO · MicroGame · De CO-meting · eindterm 2.4, leerdoel 4
          </div>
        </div>
      </DragProvider>
    </div>
  );
}
