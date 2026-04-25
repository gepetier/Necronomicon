export const STORAGE_KEY = "campaign-compendium";
export const DATA_VERSION = 8;


const CHARACTER_PORTRAITS = {
  ilu: new URL("./resources/imatges/ilu.jpg", import.meta.url).href,
  nelthan: new URL("./resources/imatges/nelthan.jpg", import.meta.url).href,
  damakos: new URL("./resources/imatges/damakos.jpg", import.meta.url).href,
  elatoris: new URL("./resources/imatges/elatoris.jpg", import.meta.url).href,
};

const GLOSSARY_ILLUSTRATIONS = {
  mijo: new URL("./resources/glossary/mijo.png", import.meta.url).href,
  portadoresDelVelo: new URL("./resources/glossary/portadores-del-velo.png", import.meta.url).href,
  marcaDeNishaar: new URL("./resources/glossary/marca-de-nishaar.png", import.meta.url).href,
  kaelorSimbol: new URL("./resources/glossary/kaelor-simbol.png", import.meta.url).href,
  avatarDeNishaar: new URL("./resources/glossary/avatar-de-nishaar.png", import.meta.url).href,
  vozDeKaelor: new URL("./resources/glossary/voz-de-kaelor.png", import.meta.url).href,
  nishaar: new URL("./resources/glossary/nishaar.png", import.meta.url).href,
  reinaElisabeth: new URL("./resources/glossary/reina-elisabeth.png", import.meta.url).href,
  varronThayne: new URL("./resources/glossary/varron-thayne.png", import.meta.url).href,
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
      title: "Judici, pacte i fuga",
      date: "Arc d'Acantilado",
      summary:
        `## Ordre de la sessió
1. Arribada a [[acantilado-del-silencio|Acantilado del Silencio]] i judici davant del [[concilio-del-silencio|Concilio del Silencio]], el [[gran-hierofante|Gran Hierofante]], [[varron-thayne|Varron Thayne]] i [[hermana-seraphe|la Hermana Seraphe]].
2. Empresonament sota la [[catedral-del-silencio|Catedral]], trobada amb [[mijo|Mijo]], fugida per la claveguera i primer pacte amb [[nishaar|Nisha'ar]] a la [[fossa-ritual|Fossa ritual]].
3. Segona oportunitat, desaparició de Mijo, robatori d'equip, infiltració per la ciutat i arribada forçada a la gran celebració on reapareixen [[uric|Uric]] i Mijo.`,
      content:
        `Els nostres protagonistes van arribar a Acantilado del Silencio encadenats, dins una carreta de presoners escortada per sis Portadores del Velo i amb Uric entre ells. La ciutat els va rebre com rebia tothom: amb pedra, silenci i judici. Un cop dins la Catedral, van ser conduïts davant del Concilio del Silencio, sota la mirada del Gran Hierofante, Varron Thayne i la Hermana Seraphe. Allí es van exposar els delictes de tots. Uric va intentar declarar-se digne de Kaelor, però fou condemnat. Damakos i Nelthan van ser considerats dignes de la salvació. Elatoris i Ilu, no. Després del veredicte, tots van ser tancats a la presó sota la Catedral, custodiats per dos guardes. A les cel·les properes hi van descobrir en Mijo, un vell mediano poruc i espavilat, amb més instint de supervivència que no pas coratge. Després de diversos intents, el grup va aconseguir enganyar els guardes gràcies a una il·lusió d’Ilu, simulant una crida de Varron des de l’exterior. Quan la sala va quedar buida, van aprofitar l’instant per escapar. Durant la fugida van trobar, a l’última cel·la del recinte, un cadàver amb una túnica estranyament semblant a la del Gran Hierofante i un collar que semblava important. Sense una sortida clara pels passadissos de la Catedral, van optar per una via més desesperada: la claveguera de la mateixa sala. Damakos en va arrencar la tapa, i tots cinc es van llançar a la foscor. Al final del conducte no hi havia llibertat, sinó la paret interior de la Fossa ritual i un abisme immens separat d’ells només per uns barrots rovellats. Sense cap altra alternativa, van fer caure les reixes i, mentre buscaven una sortida impossible, una veu va parlar dins les seves ments. Només va dir una cosa: “Llença’t.” Tots ho van fer, excepte en Mijo. Però en comptes de morir, van quedar suspesos en una foscor infinita, atrapats per una entitat desconeguda que es comunicava amb ells mentalment. L’ésser els va oferir un pacte: els salvaria de la mort, però a canvi li haurien de servir. La seva primera missió seria clara: precipitar el Gran Hierofante dins la Fossa. Quan van acceptar, l’entitat els va retornar al moment just abans d’obrir la claveguera. Amb aquella segona oportunitat, van reprendre l’escapada sabent que ja no fugien només per salvar la vida. En aquesta nova línia temporal, però, Mijo es va escórrer pels passadissos i li van perdre la pista. Els protagonistes van registrar les estances properes a la presó i hi van trobar provisions, ganivets i un dormitori amb un guarda adormit. El van matar. Després es van equipar amb llances, roba de Portadores del Velo, una armadura i una nota escrita pel mateix soldat. Finalment, gràcies a la memòria prodigiosa i als artificis d’Ilu, van aconseguir sortir de la Catedral sense ser reconeguts. Ja a la ciutat, es van reagrupar, van robar roba per passar desapercebuts i van començar a moure’s entre els carrers d’Acantilado del Silencio. Fou aleshores quan van notar que els observaven. Un gat negre amb una mirada massa conscient va revelar la seva naturalesa quan Nelthan va percebre que es tractava d’una entitat demoníaca i el va expulsar amb el seu poder diví. Tot i així, el missatge era clar: no estaven sols, ni lliures. Recollint informació i lligant el que havien sentit dels guardes i dels fidels de la ciutat, van arribar a una conclusió: aquella mateixa nit se celebraria una gran festivitat a la Fossa ritual, i el Gran Hierofante hi seria present. Seria l’ocasió perfecta per complir la missió encomanada. Però la seva fugida ja havia estat descoberta i la ciutat sencera es trobava en alerta. Refugiats en una taverna, van intentar trobar suport entre una noblesa arraconada pel poder de l’Església. No en van treure aliances clares, però sí una dada important: la Reina Elisabeth d’Andoras era a la ciutat i assistiria a la cerimònia. Sense un pla del tot definit, van acudir a la festivitat. Allà van veure el Gran Hierofante i el Concilio en una gran tribuna protegida. També van veure un patíbul i unes gàbies: dins hi havia Mijo i Uric. Però abans de poder actuar, Varron els va descobrir, i els protagonistes es van veure obligats a ocupar el seu lloc dins la celebració, resignats a esperar el moment oportú.`,
      highlights:
        `- [[portadores-del-velo|Portadores del Velo]] escorten el comboi inicial i més tard proporcionen el primer disfressat funcional del grup.
- [[mijo|Mijo]] i [[uric|Uric]] queden lligats a la trama sacrificial des del primer contacte.
- El [[collar-de-la-preso|collar trobat a la presó]] queda identificat com un objecte important abans de ser robat més endavant.
- [[nishaar|Nisha'ar]] irromp a la història amb un pacte temporal i una missió molt concreta: fer caure el [[gran-hierofante|Gran Hierofante]] a la [[fossa-ritual|Fossa]].`,
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
      title: "La màscara de la Voz",
      date: "Nit del ritual",
      summary:
        `## Ordre de la sessió
1. Preparatius del ritual a la plaça: Nelthan detecta presències demoníaques i el grup intenta desfer-se dels [[amulets-despines-de-kaelor|amulets maleïts]].
2. La [[reina-elisabeth|Reina Elisabeth d'Andoras]] prova de desafiar el clergat mentre Ilu prepara el caos a la tribuna i [[hermana-seraphe|Seraphe]] deixa entreveure dubtes.
3. Elatoris desemmascara [[zaher-ar-kal|Zaher-Ar'Kal]], la ciutat entra en massacre i el [[mar-de-sang|mar de sang]] arrossega tothom cap a la [[fossa-ritual|Fossa]].`,
      content:
        `Situats a la plaça, sota la tribuna principal del clergat, van observar els preparatius del ritual. Nelthan va notar de seguida una presència demoníaca entre la multitud. Poc després, els Portadores del Velo van començar a repartir amulets amb el símbol de Kaelor, fets d’espines i esbarzers. Nelthan hi va percebre màgia demoníaca i es va treure discretament el penjoll, advertint els altres que fessin el mateix. Ilu va coordinar mentalment la resta del grup perquè poguessin desfer-se dels amulets sense aixecar sospites. Alguns ho van aconseguir. Damakos, no del tot. Des de la seva posició també van identificar la Reina Elisabeth, asseguda entre els nobles. Elegant, serena, i amb armadura amagada sota el vestit. Van intentar posar-se en contacte amb ella per via mental, però descobriren que estava protegida contra aquest tipus de màgia. Més endavant, després d’alguns intents arriscats, van aconseguir fer arribar el missatge a un dels seus homes: no estaven del costat del clergat. Enmig del ritual, Damakos va rebre un cop i va arribar a veure una figura encaputxada, amb orelles d’elf, que desapareixia entre la multitud. Just aleshores va comprendre que li havien robat el collar trobat a la presó. Mentrestant, Ilu va encendre les cordes que sostenien el gran símbol de ferro de Kaelor damunt la tribuna, intentant preparar el caos necessari per actuar. El ritual va començar. Varron en va explicar el sentit davant la multitud, i quan la primera sang va omplir l’urna del sacrifici, el poble va reaccionar amb fervor. Però Ilu va percebre una cosa més: la sang no només queia a la Fossa, sinó que hi era atreta d’una manera antinatural. Amb l’ajuda de Nelthan, el grup va començar a entendre que darrere de tot allò hi havia una força demoníaca. En aquell context, la Hermana Seraphe va acostar-se als protagonistes i els va oferir una beguda com a ofrena de pau. D’aquell breu intercanvi van intuir que Seraphe no compartia del tot els mètodes de l’Església del Silenci, encara que tampoc no s’atrevia a plantar-s’hi. El següent condemnat fou en Mijo. Ilu va intentar guanyar-li temps amb una distracció màgica, posant-se en risc, però no va servir de res. Mijo sembla que va morir sacrificat a l’altar. La tensió, que ja era extrema, va trencar-se del tot quan les campanes de la ciutat van començar a sonar i una columna de soldats d’Andoras va irrompre a la plaça. La Reina Elisabeth va aprofitar aquell instant per intentar desposseir l’Església del seu poder. Va acusar la Voz de ser un impostor i de no tenir legitimitat per governar. Però sense poder presentar una prova decisiva, el seu cop no va convèncer el poble. La plaça es va dividir. La guàrdia andorana va protegir la reina. Els Portadores del Velo es van mantenir fidels al clergat. Varron va declarar la reina heretge i va anunciar que seria la següent sacrificada. I llavors tot es va precipitar. Elatoris va veure el gat demoníac infiltrar-se entre les files andoranes, prendre la forma d’un soldat, apunyalar un Portador del Velo davant de tothom i desaparèixer entre les ombres. Aquell gest va encendre definitivament la batalla. Enmig del caos, els protagonistes van veure la seva oportunitat. Podien fugir. Podien buscar refugi. Però van triar avançar cap a la tribuna de la Voz. Després de combatre i obrir-se pas entre membres del Círculo, molt més poderosos del que semblaven, Elatoris va aconseguir arribar fins al Gran Hierofante i arrencar-li la màscara. I sota la màscara no hi havia cap rostre humà. La Voz es va revelar com Zaher-Ar’Kal, un dimoni al servei d’Ish’nael. Davant de tothom, va confessar que havia substituït l’autèntica Voz i que havia convertit l’Església d’Acantilado del Silencio en una maquinària ritual destinada a extreure la sang dels penitents de la ciutat. Sang que després era conduïda cap a la Fossa amb un propòsit encara desconegut. Un cop descobert, Zaher-Ar’Kal va abandonar qualsevol aparença de subtilesa. Va declarar que ja no tenia sentit continuar drenat la ciutat a poc a poc, i que recolliria tota la sang dels seus habitants en aquell mateix instant. A continuació, va abandonar la seva forma humana i va reabsorbir quatre dels sis membres del Círculo, adoptant una forma demoníaca monstruosa. Des de la Fossa es van començar a sentir gemecs, rugits i sons de bèsties impossibles. Zaher-Ar’Kal va aixecar un assistent del ritual i el va esclafar, deixant-ne la sang caure a l’abisme. La plaça sencera va entrar en pànic. En adonar-se de l’engany, Varron i els Portadores del Velo van girar les armes contra aquell mateix ésser a qui havien servit. El que va seguir va ser una massacre. Criatures demoníaques van envair la plaça. Els protagonistes van lluitar per sobreviure mentre el combat s’estenia entre soldats, clergues, nobles i monstres. Enmig d’aquell infern, una de les feres es va llançar sobre la posició on es trobaven la Reina Elisabeth i Seraphe. En un instant, Elatoris va haver de triar. I va salvar la reina. Seraphe va morir entre les mandíbules de la criatura. Al mateix temps, el foc que Ilu havia encès a les cordes del símbol de ferro de Kaelor va acabar fent-lo caure sobre Zaher-Ar’Kal. Aquell impacte, sumat a l’embat desesperat de Varron, va forçar el dimoni a recórrer al seu últim recurs. Els amulets repartits per tota la ciutat es van activar alhora. De cadascun en va emergir una espina destinada a travessar el cor del seu portador. Damakos, per pura voluntat, va aconseguir desviar la seva a l’últim instant i evitar la mort. Llavors, un immens mar de sang va començar a fluir pels carrers d’Acantilado del Silencio, arrossegant-ho tot cap a una gran esfera escarlata suspesa damunt la Fossa. Persones, soldats, fidels, nobles... i també els mateixos protagonistes, van ser atrapats per aquella marea. I, finalment, arrossegats i desorientats, van caure dins la Fossa.`,
      highlights:
        `- [[amulets-despines-de-kaelor|Els amulets d'espines]] són la infraestructura amagada del sacrifici massiu.
- [[reina-elisabeth|Elisabeth]] intenta un cop polític contra la [[voz-de-kaelor|Voz de Kaelor]], però el poble queda dividit.
- [[zaher-ar-kal|Zaher-Ar'Kal]] es revela com a dimoni al servei d'[[ish-nael|Ish'Nael]] i converteix la plaça en un escorxador.
- [[hermana-seraphe|Seraphe]] mor, [[varron-thayne|Varron]] gira contra el dimoni i Dámakos sobreviu per voluntat pura a l'espina ritual.`,
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
      title: "Descens al Sagnatori",
      date: "Després de la caiguda",
      summary:
        `## Ordre de la sessió
1. Suspensió de la caiguda i nova audiència amb [[nishaar|Nisha'ar]], que es revela, es mostra a través del [[avatar-de-nishaar|gat negre]] i imposa la [[marca-de-nishaar|seva marca]].
2. Arribada al [[sagnatori|Sagnatori]], exploració entre restes i criatures, i primeres troballes sobre el processament de ferro i sang.
3. Rescat de [[varron-thayne|Varron]], fugida davant les [[abominacions-del-sagnatori|abominacions]] i descobriment final del ritual que extreu essència del [[mar-de-sang|mar de sang]].`,
      content:
        `Després de la massacre a Acantilado del Silencio, els nostres protagonistes van ser arrossegats per la marea de sang cap a l’interior de la Fossa. Però en plena caiguda, tot es va aturar. Van quedar suspesos en la ingravidesa, dins un espai que ja coneixien: la mateixa immensitat fosca on havien estat quan van fer el seu pacte. Aquesta vegada, però, la foscor era menys hostil, i una nit estrellada s’estenia al seu voltant. Davant seu va aparèixer l’entitat que els havia reclamat abans. Aquesta vegada es presentà amb un nom: Nisha’ar. Confirmà que havia estat ell qui havia pactat amb ells, els va guarir les ferides —especialment les de Damakos, greument malferit— i els deixà clar que, malgrat el seu fracàs, encara pensava utilitzar-los. Els advertí que es dirigien als dominis d’Ish’Nael, un lloc perillós del qual ell no els podia apartar. Només els exigí dues coses: que sobrevisquessin... i que sembressin tant de caos com poguessin. També els mostrà el seu avatar: el gat negre que ja havien vist abans. A través seu, els marcà amb la marca de Nisha’ar, que, segons ell, els podria ser útil al lloc on estaven a punt d’arribar. Tot seguit, l’espai es va dissoldre i la caiguda es reprengué. Els protagonistes van impactar sobre una pila de cadàvers i restes orgàniques dins una cavitat de pedra natural il·luminada per cristalls vermells. Tots van quedar inconscients excepte Damakos, que en recuperar el coneixement va veure com una petita criatura encorbada transportava més restes fins a la pila. Quan va aconseguir despertar Nelthan, tots dos van provar d’interrogar l’ésser, però en no obtenir cap resposta útil el van matar. Poc després van veure una altra criatura molt més gran i deforme, cega, armada amb un ferro, que s’enduia un dels cossos sense adonar-se de la seva presència. Entre la massa de cadàvers també van trobar, per últim cop, el cos deformat d’en Mijo. Quan van aconseguir despertar la resta, Ilu va descobrir una obertura elevada a la roca, i el grup hi va escapar. Continuant per les grutes, va detectar també una il·lusió amagant una zona propera, i darrere d’ella van trobar una criatura ocupada fonent el ferro que arribava d’altres portals. Després d’un intent arriscat d’aconseguir millors armes, van continuar avançant fins arribar a una gran sala circular. Allí van veure com diverses criatures classificaven tot allò que arribava des d’un portal superior. Al centre de la sala hi havia una pila d’éssers vius i morts barrejats: supervivents d’Acantilado del Silencio entre els quals hi havia Varron, molt debilitat i lluitant contra una de les criatures. Els protagonistes van baixar immediatament a ajudar-lo. Després d’un combat a contrarellotge, van aconseguir rescatar-lo i fugir plegats pel passadís principal, perseguits per abominacions. La fugida els va conduir fins a una immensa sala cilíndrica on una passarel·la elevada envoltava un autèntic mar de sang. Milers de fils vermells desembocaven en aquella massa, revelant el destí final de tota la sang recol·lectada. Sense temps per pensar, van córrer per la passarel·la mentre les criatures els tancaven el pas. En aquell moment, Ilu va detectar una porta secreta, i el grup va aconseguir travessar-la i barrar el pas rere seu. A l’altra banda van trobar un corredor d’arquitectura molt més refinada: terra polit, parets guarnides, veus agitades i sorolls de preparatius. Alguna cosa important estava a punt de passar. Per evitar ser descoberts, es desviaren per un passadís lateral que els conduí a un nivell superior. Des d’allí van contemplar el ritual. A la gran sala de sang va aparèixer Zaher-Ar’Kal, acompanyat d’una altra entitat misteriosa. Sis abominacions arrossegaven sis figures mig etèries, mig demoníaques, encadenades fins a una plataforma de pedra al centre del mar de sang. Un cop ancorades, el ritual va començar. La sang es va il·luminar. I d’ella van començar a extreure una substància incolora, brillant i ingràvida, que s’elevava flotant cap a una obertura enorme fora de la vista dels protagonistes. A mesura que aquella essència era arrancada, la sang anava perdent la seva lluïssor, fins que les sis figures van caure exhaustes i el ritual es va donar per acabat. Per primera vegada des de la seva arribada, els protagonistes van tenir un instant per aturar-se. No per descansar. Només per entendre que havien sobreviscut a la caiguda... per descobrir alguna cosa encara molt pitjor.`,
      highlights:
        `- [[nishaar|Nisha'ar]] deixa clar que no és un salvador: només vol agents capaços de crear caos als dominis d'[[ish-nael|Ish'Nael]].
- El [[sagnatori|Sagnatori]] apareix com una cadena subterrània de restes, portals, sang i transformació material.
- [[mijo|Mijo]] reapareix només com a cos deformat entre els cadàvers; [[varron-thayne|Varron]] sobreviu prou per ser rescatat.
- El ritual final suggereix que la sang recollida amaga una essència diferent i més valuosa que el simple sacrifici.`,
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
        "Ciutat aixecada sobre penya-segats i sotmesa a una litúrgia de silenci, penitència i sang, dominada per la Catedral, la Fossa ritual i el poder clerical.",
      tags: ["ciutat", "catedral", "ritual"],
      notes:
        "És l'escenari del judici inicial, de la gran cerimònia sacrificial i del desastre que envia els protagonistes al món subterrani.",
      latestStatus:
        "La ciutat ha quedat enrere després de la massacre ritual i la caiguda del grup al món subterrani; no hi han tornat a entrar des d'aleshores.",
      lastSeenChronicleId: "ritual-fossa",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori"],
      palette: ["#45505c", "#b88e62"],
    },
    {
      id: "catedral-del-silencio",
      name: "Catedral del Silencio",
      category: "Llocs",
      description:
        "Temple fortificat i centre de poder d'Acantilado del Silencio, amb presons, dormitoris de guàrdia i accessos ocults cap a la Fossa ritual.",
      tags: ["temple", "presó", "clergat"],
      notes:
        "Aquí té lloc el judici del grup, la seva primera fugida i la troballa del collar que més endavant serà robat.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado"],
      palette: ["#4a4742", "#ae8d68"],
    },
    {
      id: "fossa-ritual",
      name: "Fossa ritual",
      category: "Llocs",
      description:
        "Abisme monumental vinculat al culte de la ciutat, als sacrificis públics i al drenatge de sang que alimenta un mecanisme molt més profund.",
      tags: ["abisme", "sacrifici", "sang"],
      notes:
        "És el lloc del pacte inicial amb Nisha'ar, del ritual multitudinari i de la caiguda posterior cap al Sagnatori.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori"],
      palette: ["#4b2e31", "#b66e58"],
    },
    {
      id: "sagnatori",
      name: "Sagnatori",
      category: "Llocs",
      description:
        "Complex subterrani de pedra, portals, restes i canals de sang situat sota Acantilado del Silencio, aparentment dedicat a processar tot allò que la Fossa engoleix.",
      tags: ["subterrani", "portals", "sang"],
      notes:
        "Les criatures hi classifiquen cossos i materials, s'hi fon ferro i s'hi concentra el mar de sang que alimenta un ritual encara més gran.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori"],
      palette: ["#382c3a", "#aa625a"],
    },
    {
      id: "andoras",
      name: "Andoras",
      category: "Llocs",
      description:
        "Regne o potència política vinculada a la Reina Elisabeth i a la guàrdia que irromp a la plaça per disputar el control del clergat.",
      tags: ["regne", "reialesa", "soldats"],
      notes:
        "La seva intervenció transforma el ritual en una batalla oberta i exposa la fractura entre noblesa, clergat i poble.",
      playerNotes: [],
      characterIds: ["elatoris", "nelthan"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#3c465c", "#c0a169"],
    },
    {
      id: "kaelor",
      name: "Kaelor, el Portador del Silenci",
      category: "Religió",
      description:
        "Nom sota el qual Acantilado del Silencio justifica penitència, sacrificis i devoció a través del dolor, tot i que el culte actiu a la ciutat ha estat corromput o usurpat.",
      tags: ["culte", "sang", "silenci"],
      notes:
        "El seu símbol apareix a estendards, penjolls d'espines, altars i estructures rituals com el gran emblema de ferro damunt la tribuna.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.kaelorSimbol],
      playerNotes: [],
      characterIds: ["ilu", "nelthan"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#6c2f28", "#d0a667"],
    },
    {
      id: "esglesia-del-silenci",
      name: "Església del Silenci",
      category: "Faccions",
      description:
        "Institució religiosa dominant a Acantilado del Silencio, aparentment dedicada a Kaelor però en realitat instrumentalitzada per forces demoníaques.",
      tags: ["clergat", "culte", "poder"],
      notes:
        "Controla judicis, presons, rituals i la disciplina pública de la ciutat fins que la impostura de Zaher-Ar'Kal surt a la llum.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#5a3b35", "#c69661"],
    },
    {
      id: "concilio-del-silencio",
      name: "Concilio del Silencio",
      category: "Faccions",
      description:
        "Cúpula dirigent del clergat local, present al judici inicial i a la gran cerimònia de la Fossa sota l'autoritat del Gran Hierofante.",
      tags: ["consel", "judici", "clergat"],
      notes:
        "És la cara institucional del règim religiós, però part dels seus membres també acaben atrapats pel sistema que servien.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#594847", "#b58b6a"],
    },
    {
      id: "portadores-del-velo",
      name: "Portadores del Velo",
      category: "Faccions",
      description:
        "Élite militar-religiosa de la Iglesia del Silencio, formada por antiguos soldados y devotos sometidos a un ritual donde un velo es clavado a su frente con ganchos, simbolizando la renuncia a su identidad y voz. Actúan como ejecutores del dogma de Kaelor, obedeciendo sin cuestionar y manteniendo el orden a través del miedo, el dolor y el silencio.",
      tags: ["guàrdia", "culte", "escolta"],
      notes:
        "Apareixen al transport inicial, al control de la ciutat i al repartiment dels amulets d'espines abans del sacrifici massiu.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.portadoresDelVelo],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#4f4441", "#c9a378"],
    },
    {
      id: "circulo",
      name: "Círculo",
      category: "Faccions",
      description:
        "Nucli de servidors poderosos associats al fals hierofant i presents a la tribuna durant el ritual major de la Fossa.",
      tags: ["èlit", "ritual", "servidors"],
      notes:
        "Els protagonistes descobreixen en combat que són molt més perillosos del que semblen, i Zaher-Ar'Kal en reabsorbeix quatre per transformar-se.",
      playerNotes: [],
      characterIds: ["damakos", "elatoris"],
      chronicleIds: ["ritual-fossa"],
      palette: ["#4f2d36", "#c47a61"],
    },
    {
      id: "gran-hierofante",
      name: "Gran Hierofante",
      category: "Altres",
      description:
        "Màxima figura visible del culte a la ciutat i objectiu explícit del primer pacte imposat al grup, tot i que després se sabrà que el càrrec estava usurpat.",
      tags: ["títol", "culte", "autoritat"],
      notes:
        "La missió donada per Nisha'ar consisteix a precipitar-lo dins la Fossa ritual durant la festivitat pública.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#5c3334", "#c89a68"],
    },
    {
      id: "voz-de-kaelor",
      name: "Voz de Kaelor",
      category: "Religió",
      description:
        "Títol de legitimitat religiosa i política que la Reina Elisabeth desafia públicament quan acusa el líder del culte de ser un impostor.",
      tags: ["títol", "legitimitat", "culte"],
      notes:
        "A la pràctica, la Voz que governava Acantilado del Silencio era Zaher-Ar'Kal sota disfressa.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.vozDeKaelor],
      playerNotes: [],
      characterIds: ["elatoris", "nelthan"],
      chronicleIds: ["ritual-fossa"],
      palette: ["#5a3138", "#bd8f5d"],
    },
    {
      id: "varron-thayne",
      name: "Varron Thayne",
      category: "Altres",
      description:
        "Alt càrrec del clergat present al judici, portaveu del ritual major i una de les figures més visibles del poder religiós de la ciutat.",
      tags: ["clergat", "jutge", "ritual"],
      notes:
        "El grup l'utilitza com a fals reclam en la primera fugida, més tard el veu declarar heretge la reina i finalment el rescata al Sagnatori.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.varronThayne],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori"],
      palette: ["#5d4640", "#c08c62"],
    },
    {
      id: "hermana-seraphe",
      name: "Hermana Seraphe",
      category: "Altres",
      description:
        "Membre destacada del clergat present al judici i al ritual, percebuda com a menys alineada amb la brutalitat de l'Església del Silenci.",
      tags: ["clergat", "dubte", "sacrifici"],
      notes:
        "Ofereix una beguda de pau als protagonistes i sembla reticent als mètodes del sistema, però acaba morint durant la batalla a la plaça.",
      playerNotes: [],
      characterIds: ["ilu", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#624b52", "#c69e7a"],
    },
    {
      id: "reina-elisabeth",
      name: "Reina Elisabeth d'Andoras",
      category: "Altres",
      description:
        "Monarca andorana present a la cerimònia de la Fossa, protegida contra contacte mental i prou decidida a desafiar l'autoritat religiosa en públic.",
      tags: ["reina", "andoras", "cop d'estat"],
      notes:
        "Intenta desposseir el clergat del poder, però sense prova concloent no convenç el poble. Elatoris la salva quan una fera es llança sobre ella.",
      latestStatus:
        "Desapareguda després de la massacre de la plaça; el grup no sap on és des que Elatoris la va salvar enmig del caos.",
      lastSeenChronicleId: "ritual-fossa",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.reinaElisabeth],
      playerNotes: [],
      characterIds: ["elatoris", "ilu", "nelthan"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#3d4758", "#d0ab72"],
    },
    {
      id: "mijo",
      name: "Mijo",
      category: "Altres",
      description:
        "Vell mediano poruc i espavilat, descobert a les cel·les de sota la Catedral i arrossegat després al centre dels rituals d'Acantilado.",
      tags: ["mediano", "presó", "supervivència"],
      notes:
        "No salta amb el grup durant el primer pacte, desapareix en la segona línia temporal, reapareix sacrificat a la plaça i finalment només torna com a cos deformat al Sagnatori.",
      latestStatus:
        "Mort. L'última informació rellevant del grup és que només el tornen a trobar com un cos deformat dins la pila de cadàvers del Sagnatori.",
      lastSeenChronicleId: "sagnatori",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.mijo],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori"],
      palette: ["#5c4c3e", "#bf9968"],
    },
    {
      id: "uric",
      name: "Uric",
      category: "Altres",
      description:
        "Presoner que arriba amb els protagonistes a Acantilado del Silencio i intenta declarar-se digne de Kaelor abans de ser condemnat.",
      tags: ["presoner", "judici", "condemnat"],
      notes:
        "Després del judici reapareix a les gàbies de la festivitat pública, convertit també en part del dispositiu sacrificial.",
      latestStatus:
        "Probablement mort durant el ritual o la massacre posterior; l'última vegada que el grup el veu encara és empresonat a les gàbies de la festivitat.",
      lastSeenChronicleId: "ritual-fossa",
      playerNotes: [],
      characterIds: ["nelthan", "damakos"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#5a493f", "#b88960"],
    },
    {
      id: "zaher-ar-kal",
      name: "Zaher-Ar'Kal",
      category: "Antagonistes",
      description:
        "Dimoni que es feia passar per la Voz de Kaelor i dirigia el gran ritual de sang d'Acantilado del Silencio darrere d'una màscara i d'una litúrgia fabricada.",
      tags: ["dimoni", "impostor", "ritual"],
      notes:
        "Elatoris li va arrencar la màscara en plena batalla, va confessar el drenatge ritual de la ciutat i més tard reapareix al Sagnatori presidint un ritual encara més gran.",
      playerNotes: [],
      characterIds: ["ilu", "elatoris", "damakos", "nelthan"],
      chronicleIds: ["ritual-fossa", "sagnatori"],
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
        "Primer força el pacte a la vora de la Fossa i després es presenta amb nom propi, cura el grup i els ordena sobreviure i sembrar caos als dominis d'Ish'Nael.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.nishaar],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "sagnatori"],
      palette: ["#2b2537", "#8f5f6a"],
    },
    {
      id: "ish-nael",
      name: "Ish'Nael",
      category: "Entitats",
      description:
        "Entitat o poder major al qual serveix Zaher-Ar'Kal i als dominis del qual són arrossegats els protagonistes després de la caiguda.",
      tags: ["dimonis", "dominis", "sang"],
      notes:
        "Encara no se'n coneix l'objectiu final, però tant Nisha'ar com Zaher-Ar'Kal el situen al centre del conflicte subterrani.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["ritual-fossa", "sagnatori"],
      palette: ["#33263a", "#9b625c"],
    },
    {
      id: "avatar-de-nishaar",
      name: "Avatar de Nisha'ar",
      category: "Entitats",
      description:
        "Gat negre d'aspecte massa conscient que observa, espia i finalment es revela com a avatar o manifestació directa de Nisha'ar.",
      tags: ["gat", "avatar", "vigilància"],
      notes:
        "Nelthan el detecta primer com a presència demoníaca a la ciutat i més tard Nisha'ar confirma que aquesta criatura és la seva forma visible.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.avatarDeNishaar],
      playerNotes: [],
      characterIds: ["nelthan", "ilu", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori"],
      palette: ["#26242c", "#8c6b5e"],
    },
    {
      id: "amulets-despines-de-kaelor",
      name: "Amulets d'espines de Kaelor",
      category: "Objectes",
      description:
        "Penjolls d'espines i esbarzers repartits durant el ritual públic, aparentment devocionals però en realitat preparats com a mecanisme letal massiu.",
      tags: ["amulets", "espines", "màgia"],
      notes:
        "Quan Zaher-Ar'Kal activa el seu últim recurs, de cada amulet emergeix una espina destinada a travessar el cor del portador.",
      playerNotes: [],
      characterIds: ["nelthan", "ilu", "damakos"],
      chronicleIds: ["ritual-fossa"],
      palette: ["#5e3130", "#c77758"],
    },
    {
      id: "collar-de-la-preso",
      name: "Collar de la presó",
      category: "Objectes",
      description:
        "Collar important trobat a l'última cel·la del recinte, al costat d'un cadàver amb una túnica semblant a la del Gran Hierofante.",
      tags: ["collar", "pista", "robatori"],
      notes:
        "Dámakos el recupera durant la fugida, però una figura encaputxada amb orelles d'elf li'l roba en plena multitud durant la segona sessió.",
      playerNotes: [],
      characterIds: ["damakos", "ilu"],
      chronicleIds: ["judici-acantilado", "ritual-fossa"],
      palette: ["#5b453f", "#c8a06d"],
    },
    {
      id: "marca-de-nishaar",
      name: "Marca de Nisha'ar",
      category: "Objectes",
      description:
        "Marca imposada pel mateix Nisha'ar a través del seu avatar, presentada com una eina útil per sobreviure al lloc on cau el grup.",
      tags: ["marca", "pacte", "protecció"],
      notes:
        "No se n'han vist encara tots els efectes, però queda associada explícitament al pacte i a l'entrada als dominis d'Ish'Nael.",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.marcaDeNishaar],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori"],
      palette: ["#352a38", "#9a6770"],
    },
    {
      id: "abominacions-del-sagnatori",
      name: "Abominacions del Sagnatori",
      category: "Monstres",
      description:
        "Criatures deformes i demoníaques que custodien, transporten i persegueixen tot allò que arriba al món subterrani sota la Fossa.",
      tags: ["monstres", "subterrani", "persecució"],
      notes:
        "Inclou des d'éssers menors que manipulen restes fins a feres cegues o servidors prou grans per arrossegar cossos i sostenir rituals.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["ritual-fossa", "sagnatori"],
      palette: ["#432a2c", "#aa6559"],
    },
    {
      id: "mar-de-sang",
      name: "Mar de sang",
      category: "Llocs",
      description:
        "Massa immensa de sang recol·lectada sota la ciutat, alimentada per milers de fils vermells i usada en rituals de transmutació o extracció d'essència.",
      tags: ["sang", "ritual", "abisme"],
      notes:
        "Primer apareix com a marea destructiva pels carrers d'Acantilado i després com a dipòsit central del Sagnatori, on se'n treu una substància incolora i ingràvida.",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["ritual-fossa", "sagnatori"],
      palette: ["#5f2629", "#cb705e"],
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
    glossaryChronicleIds: [],
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

