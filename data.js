export const STORAGE_KEY = "campaign-compendium";
export const DATA_VERSION = 4;


const CHARACTER_PORTRAITS = {
  ilu: new URL("./resources/imatges/ilu.jpg", import.meta.url).href,
  nelthan: new URL("./resources/imatges/nelthan.jpg", import.meta.url).href,
  damakos: new URL("./resources/imatges/damakos.jpg", import.meta.url).href,
  elatoris: new URL("./resources/imatges/elatoris.jpg", import.meta.url).href,
};

export const seedData = {
  characters: [
    {
      id: "ilu",
      name: "Ilu",
      title: "L'ull rere el vel",
      lineage: "Humà",
      className: "Mag de les Il·lusions",
      level: 5,
      summary:
        "Mag veterà d'uns cinquanta anys obsessionat amb els arxius prohibits i amb la màgia que altera allò que els altres juren haver vist.",
      quickNotes:
        "Il·lusions subtils, memòria prodigiosa, infiltració arcana i control del camp des de la rereguarda.",
      lore: {
        origin:
          "Després de dècades perseguint mites, identitats falses i fragments de biblioteques, va intentar suplantar una figura d'alt rang per accedir a l'arxiu de la ciutat i estudiar màgia d'il·lusió prohibida.",
        bonds:
          "Confia que Nelthan detecti el que la màgia oculta, que Dámakos aguanti la línia quan el pla es trenca i que Elatoris faci passar l'audàcia per elegància.",
        secrets:
          "Alguna cosa del que va llegir o buscar als arxius encara el persegueix, i la veu de Nisha'ar sembla saber exactament què vol.",
        goals:
          "Entendre l'origen real de les il·lusions que manipulen la campanya i reunir prou coneixement per deixar de reaccionar a cegues.",
        wounds:
          "El preocupa convertir-se en el tipus de mag que manipula la veritat només perquè pot fer-ho.",
      },
      sheet: {
        ac: "13",
        hp: "31",
        proficiency: "+3",
        abilities: "For 8, Des 14, Con 13, Int 18, Sav 12, Car 10",
        features:
          "Minor Illusion, Servent Invisible, encanteris de distracció, lectura arcana i memòria excepcional.",
      },
      inventory: {
        items: "Llibre de conjurs gastat\nCredencials falsificades\nComponentera d'ònix i guix",
        currency: "54 po",
        artifacts: "Notes sobre il·lusió prohibida\nFocus gravat\nEsquemes mentals de la Catedral",
        notes:
          "Va coordinar el grup per desfer-se dels amulets maleïts i va encendre el símbol de ferro de Kaelor per forçar el caos.",
      },
      history:
        "Va passar de falsificador de credencials i buscador de mites a arquitecte de l'escapada del grup. A la Catedral va enganyar guardes, va detectar que la sang era atreta antinaturalment per la Fossa i, ja al Sagnatori, va trobar portes i il·lusions amagades quan ningú més veia cap sortida.",
      sigil: "I",
      portrait: CHARACTER_PORTRAITS.ilu,
      palette: ["#4e3a2d", "#b68b5d"],
    },
    {
      id: "nelthan",
      name: "Nelthan",
      title: "Jurament del sender antic",
      lineage: "Elfo",
      className: "Paladí dels Ancestres",
      level: 5,
      summary:
        "Paladí elf de camins forestals que empunya armes a dues mans i llegeix la corrupció espiritual abans que els altres entenguin d'on ve el perill.",
      quickNotes:
        "Frontliner amb arma a dues mans, detecció del profà, protecció del grup i lectura espiritual del terreny.",
      lore: {
        origin:
          "Feia de vigilant dels camins boscosos fins que va sorprendre un caçador furtiu i, durant la baralla per detenir-lo, el va matar sense voler.",
        bonds:
          "Sosté Dámakos en els moments crítics, dona credibilitat als advertiments d'Ilu i observa Elatoris amb prudència, però sense negar-li el mèrit quan cal.",
        secrets:
          "El seu jurament no neix del culte de Kaelor, sinó d'una força antiga lligada als senders, la vida persistent i les veus velles del bosc.",
        goals:
          "Desemmascarar allò demoníac que s'amaga sota la fe imposada i tornar a demostrar que el seu jurament serveix per protegir, no només per castigar.",
        wounds:
          "Arrossega el pes d'haver matat algú mentre pretenia imposar ordre.",
      },
      sheet: {
        ac: "17",
        hp: "42",
        proficiency: "+3",
        abilities: "For 16, Des 10, Con 14, Int 10, Sav 12, Car 16",
        features:
          "Sentit diví, Imposició de mans, cops a dues mans, protecció ancestral i presència serena.",
      },
      inventory: {
        items: "Espasó de viatge\nCapa de guardabosc\nArmadura de campanya",
        currency: "28 po",
        artifacts: "Amulet maleït de Kaelor arrencat\nSímbol del jurament antic",
        notes:
          "Va ser el primer a notar la presència demoníaca del gat i dels penjolls repartits a la plaça.",
      },
      history:
        "Acantilado del Silencio el va considerar digne de la salvació de Kaelor, però ell va ser dels primers a entendre que tot era corrupció. Va detectar dimonis entre la multitud, va advertir el grup sobre els amulets i va ser una de les primeres ànimes a alçar-se després de la caiguda al Sagnatori.",
      sigil: "N",
      portrait: CHARACTER_PORTRAITS.nelthan,
      palette: ["#2f4c3a", "#c9a15c"],
    },
    {
      id: "damakos",
      name: "Dámakos",
      title: "Menteclara d'Aruk'Paros",
      lineage: "Tiefling",
      className: "Guerrer Psiónic",
      level: 5,
      summary:
        "Tiefling fortíssim format entre forges i casernes, capaç de combinar disciplina militar, potència física i esclats psiónics en ple combat.",
      quickNotes:
        "Combat cos a cos, força imponent, impulsos psiónics, disciplina de soldat i voluntat gairebé impossible de doblegar.",
      lore: {
        origin:
          "Nascut a Aruk'Paros, fill d'un ferrer i d'una guaridora, va créixer envoltat d'armes, disciplina i llibres d'història i estratègia militar.",
        bonds:
          "Entén el grup com una unitat de campanya: Nelthan és l'àncora moral, Ilu el cap tàctic i Elatoris el factor imprevisible que sovint obre el pas.",
        secrets:
          "Va acceptar un càstig que no li pertocava per protegir un company de divisió, i encara no sap quin preu real li acabarà exigint aquesta lleialtat.",
        goals:
          "Sobreviure prou per entendre què s'ha trencat al seu voltant i convertir el seu poder en escut abans que en simple força bruta.",
        wounds:
          "Li pesa més la culpa de fallar als altres que qualsevol cop rebut en combat.",
      },
      sheet: {
        ac: "17",
        hp: "47",
        proficiency: "+3",
        abilities: "For 18, Des 10, Con 16, Int 12, Sav 12, Car 10",
        features:
          "Psionic Strike, telecinesi instintiva, disciplina marcial, empentes devastadores i resistència de ferro.",
      },
      inventory: {
        items: "Espasa militar ben equilibrada\nGuantelets reforçats\nInsígnia de divisió",
        currency: "35 po",
        artifacts: "Collar robat de la presó\nManual de tàctica gastat",
        notes:
          "Va arrencar la tapa de la claveguera amb pura força i més tard va desviar l'espina ritual de Zaher-Ar'Kal a l'últim instant.",
      },
      history:
        "La seva història personal ja el definia com un soldat disposat a carregar culpes alienes, però la campanya l'ha convertit en la columna física del grup. A la Catedral va obrir la via d'escapada, a la plaça va resistir un ritual de mort i al Sagnatori va ser el primer a recuperar-se per despertar la resta.",
      sigil: "D",
      portrait: CHARACTER_PORTRAITS.damakos,
      palette: ["#6b2f2e", "#d38a58"],
    },
    {
      id: "elatoris",
      name: "Elatoris Silvariel",
      title: "Noble sense casa",
      lineage: "Semielf",
      className: "Bard de l'Escola de les Espases",
      level: 5,
      summary:
        "Semielf noble, espadatí i músic itinerant que converteix humiliació social, ironia i precisió amb el rapier en una sola manera d'avançar.",
      quickNotes:
        "Rapier, música, duels elegants, presència social i audàcia teatral quan tot s'ensorra.",
      lore: {
        origin:
          "Fill il·legítim d'un noble humà i d'una elfa de sang antiga esclavitzada, va ser criat dins la casa familiar sota una barreja de vergonya, refinament i conveniència.",
        bonds:
          "Ilu li dona context, Nelthan li imposa límits i Dámakos li ofereix una lleialtat molt més neta que la de qualsevol saló noble.",
        secrets:
          "Encara vol recuperar casa i nom, fins i tot si es burla constantment de la noblesa que l'ha expulsat.",
        goals:
          "Transformar la desgràcia en avantatge, recuperar el que li van prendre i decidir per ell mateix quin lloc ocupa entre humans i elfs.",
        wounds:
          "El menyspreu de la noblesa i la traïció dels convidats que li van prendre la mansió continuen definint cada decisió que pren.",
      },
      sheet: {
        ac: "15",
        hp: "34",
        proficiency: "+3",
        abilities: "For 10, Des 18, Con 12, Int 12, Sav 10, Car 16",
        features:
          "Blade Flourish, inspiració bàrdica, duel amb rapier, ironia afilada i gran presència escènica.",
      },
      inventory: {
        items: "Rapier de guàrdia noble\nLira de viatge\nJaqueta brodada gastada",
        currency: "46 po",
        artifacts: "Segell de la casa Silvariel\nDocuments del vell arrest",
        notes:
          "Va ser detingut per entrar a la seva pròpia casa i, malgrat això, encara es mou amb els modals d'algú educat per dominar una sala.",
      },
      history:
        "Durant la campanya ha passat d'artista errant a figura decisiva en el centre del desastre. Va veure com el gat demoníac encenia la batalla, va obrir-se pas fins a Zaher-Ar'Kal per arrencar-li la màscara i, enmig del caos, va salvar la reina abans que Seraphe fos devorada.",
      sigil: "E",
      portrait: CHARACTER_PORTRAITS.elatoris,
      palette: ["#3f365d", "#d6a35f"],
    },
  ],
  chronicles: [
    {
      id: "judici-acantilado",
      chapter: "Sessió 1",
      title: "Arribada a Acantilado del Silencio",
      date: "Pròleg",
      summary:
        "Els quatre protagonistes entren encadenats a la ciutat de Kaelor, són jutjats públicament i passen d'acusats a fugitius en una sola nit.",
      content:
        "El grup arriba a [[acantilado-del-silencio|Acantilado del Silencio]] escortat pels fanàtics de [[kaelor|Kaelor]]. Dámakos i Nelthan són declarats dignes de la salvació, mentre que Ilu i Elatoris queden marcats com a culpables. Tancats sota la Catedral, enganyen els guardes amb una il·lusió d'Ilu, troben un collar sospitós i escapen per una claveguera oberta per Dámakos.",
      highlights:
        "Judici ritual. Primer ús clau de les il·lusions d'Ilu. Dámakos obre la fuga. El grup surt de la Catedral sense ser reconegut.",
      imageNote:
        "Carruatge sota la pluja, ciutat dalt del penya-segat, Catedral negra i presoners encadenats entrant a una audiència ritual.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      palette: ["#5a3a36", "#caa06a"],
    },
    {
      id: "ritual-fossa",
      chapter: "Sessió 2",
      title: "Eclipsi sobre la Fossa",
      date: "Partida 1",
      summary:
        "La plaça d'Acantilado del Silencio es converteix en un sacrifici multitudinari, un fals déu queda exposat i la batalla esclata davant de noblesa, clergat i poble.",
      content:
        "Ja a la plaça, Nelthan detecta presències demoníaques i amulets maleïts entre la multitud. Ilu coordina el grup per desfer-se'n, descobreix que la sang és atreta cap a la Fossa i encén les cordes del símbol de ferro suspès sobre la tribuna. Enmig del caos, Elatoris arriba fins a [[zaher-ar-kal|Zaher-Ar'Kal]] i li arrenca la màscara mentre Dámakos resisteix l'espina ritual que havia de travessar-li el cor.",
      highlights:
        "Nelthan veu el dimoni abans que ningú. Mijo mor al ritual. Elatoris desemmascara la Voz. El símbol de Kaelor cau sobre Zaher-Ar'Kal.",
      imageNote:
        "Plaça de culte plena de torxes i espines, una urna de sang, noblesa armada i el símbol de ferro a punt de desplomar-se sobre un fals hierofant.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      palette: ["#4b2f35", "#c68f57"],
    },
    {
      id: "sagnatori",
      chapter: "Sessió 3",
      title: "Sota la sang i la pedra",
      date: "Partida 2",
      summary:
        "Després de l'hecatombe de la plaça, els protagonistes cauen al món subterrani del Sagnatori i descobreixen que el malson sota la ciutat tot just comença.",
      content:
        "El grup impacta sobre restes orgàniques al cor del Sagnatori. Dámakos i Nelthan són els primers a reagrupar-se, maten una criatura menor i Ilu troba una obertura i després una il·lusió amagant un nou pas. Més endavant, [[nishaar|Nisha'ar]] es manifesta, cura les ferides del grup i els ordena sobreviure i sembrar tant de caos com puguin.",
      highlights:
        "Caiguda a la Fossa. Primer contacte clar amb Nisha'ar. Ilu detecta una porta secreta. El grup entra de ple en territori demoníac.",
      imageNote:
        "Gruta il·luminada per cristalls vermells, piles de cossos, passarel·les sobre sang i figures demoníaques treballant sota la ciutat.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      palette: ["#40314d", "#b56a58"],
    },
  ],
  glossary: [
    {
      id: "acantilado-del-silencio",
      name: "Acantilado del Silencio",
      category: "Llocs",
      description:
        "Ciutat aixecada sobre penya-segats blancs i sotmesa a una litúrgia de silenci, sang i aparença religiosa dominada per la Catedral i la Fossa.",
      tags: ["ciutat", "catedral", "ritual"],
      notes:
        "És el primer gran escenari de la campanya: judici, presó, ritual públic i inici de la caiguda cap al món subterrani.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#45505c", "#b88e62"],
    },
    {
      id: "kaelor",
      name: "Kaelor, el Portador del Silenci",
      category: "Religió",
      description:
        "Nom sota el qual Acantilado del Silencio justifica penitència, sacrificis i devoció a través del dolor, tot i que la campanya ja ha revelat que el seu culte ha estat corromput o directament usurpat.",
      tags: ["culte", "sang", "silenci"],
      notes:
        "El símbol de la boca cosida i les espines apareix a estendards, penjolls, altars i rituals de la ciutat.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#6c2f28", "#d0a667"],
    },
    {
      id: "zaher-ar-kal",
      name: "Zaher-Ar'Kal",
      category: "Antagonistes",
      description:
        "Dimoni que es feia passar per la Voz de Kaelor i dirigia el gran ritual de sang d'Acantilado del Silencio darrere d'una màscara i d'una litúrgia fabricada.",
      tags: ["dimoni", "impostor", "ritual"],
      notes:
        "Elatoris li va arrencar la màscara en plena batalla i el símbol de ferro encès per Ilu li va caure al damunt quan el pla es va trencar.",
      playerNotes: [],
      characterIds: ["ilu", "elatoris"],
      chronicleIds: ["ritual-fossa"],
      palette: ["#5b2230", "#c97952"],
    },
    {
      id: "nishaar",
      name: "Nisha'ar",
      category: "Entitats",
      description:
        "Entitat fosca que s'ha manifestat davant dels protagonistes, ha admès haver pactat amb ells i sembla voler-los vius només perquè encara els pot utilitzar.",
      tags: ["pacte", "ombra", "sagnatori"],
      notes:
        "Després de la caiguda al Sagnatori va guarir sobretot les ferides de Dámakos i els va ordenar sobreviure i sembrar caos als dominis d'Ish'Nael.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori"],
      palette: ["#2b2537", "#8f5f6a"],
    },
  ],
  ui: {
    currentModule: "characters",
    selectedCharacterId: "ilu",
    selectedCharacterTab: "lore",
    showCharacterGrid: true,
    selectedChronicleId: "judici-acantilado",
    chronicleIndexSearch: "",
    glossaryCategory: "Totes",
    glossarySearch: "",
    selectedGlossaryId: "acantilado-del-silencio",
    editModes: {
      characters: false,
      chronicles: false,
      glossary: false,
    },
    drafts: {
      characters: {
        overview: {},
        tabs: {},
      },
      chronicles: {},
      glossary: {},
    },
    glossaryReturnView: null,
    glossaryReturnTargetId: "",
    notesPanelOpen: false,
    saveNotice: "",
    lastSaved: {
      module: "",
      itemId: "",
      at: "",
      message: "",
    },
  },
};


