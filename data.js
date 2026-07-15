export const STORAGE_KEY = "campaign-compendium";
export const DATA_VERSION = 9;


const CHARACTER_PORTRAITS = {
  ilu: new URL("./resources/imatges/ilu.jpg", import.meta.url).href,
  nelthan: new URL("./resources/imatges/nelthan.jpg", import.meta.url).href,
  damakos: new URL("./resources/imatges/damakos.jpg", import.meta.url).href,
  elatoris: new URL("./resources/imatges/elatoris.jpg", import.meta.url).href,
};

const GLOSSARY_ILLUSTRATIONS = {
  mijo: new URL("./resources/glossary/mijo.jpg", import.meta.url).href,
  portadoresDelVelo: new URL("./resources/glossary/portadores-del-velo.jpg", import.meta.url).href,
  marcaDeNishaar: new URL("./resources/glossary/marca-de-nishaar.jpg", import.meta.url).href,
  kaelorSimbol: new URL("./resources/glossary/kaelor-simbol.jpg", import.meta.url).href,
  avatarDeNishaar: new URL("./resources/glossary/avatar-de-nishaar.jpg", import.meta.url).href,
  vozDeKaelor: new URL("./resources/glossary/voz-de-kaelor.jpg", import.meta.url).href,
  nishaar: new URL("./resources/glossary/nishaar.jpg", import.meta.url).href,
  reinaElisabeth: new URL("./resources/glossary/reina-elisabeth.jpg", import.meta.url).href,
  varronThayne: new URL("./resources/glossary/varron-thayne.jpg", import.meta.url).href,
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
    {
      id: "sala-dels-plaers",
      chapter: "Sessió 4",
      title: "La Sala dels Plaers i la pedra viva",
      date: "Profunditats del Sagnatori",
      summary:
        `## Ordre de la sessió
1. Descans al passadís després de la [[piscina-central|Piscina Central]] i del [[dren|ritual d'extracció del Dren]], amb [[varron-thayne|Varron Thayne]] qüestionant la seva fe en [[kaelor|Kaelor]] davant de [[nelthan|Nelthan]].
2. L'olor de la [[cuina-del-sagnatori|cuina del Sagnatori]] queda ajornada quan el grup segueix rialles fins a la [[sala-dels-plaers|Sala dels Plaers]], on [[ilu|Ilu]] sosté una disfressa tan atrevida com poc convincent.
3. Els [[canviaformes-del-plaer|canviaformes del plaer]] gairebé separen el grup fins que [[elyse|Elyse]] els rescata, revela la necessitat de les [[insignies-de-voluntari|insígnies de voluntari]] i adverteix del [[banquet-del-sagnatori|banquet]] imminent.
4. Al [[quarto-de-manteniment|quarto de manteniment]], el grup troba l'[[ancora-de-submissio|àncora de submissió]], la [[pedra-vermella-del-receptori|pedra vermella del Receptori]] i el mapa que assenyala una cambra amagada.
5. Darrere la paret oberta amb les insígnies, alliberen la [[criatura-mineral-encadenada|criatura mineral encadenada]], que deixa a [[nelthan|Nelthan]] l'[[espasa-viva-de-nelthan|espasa viva]] abans de fondre's dins la pedra.`,
      content:
        `Els protagonistes van fer un primer descans al passadís, encara amb la visió recent de la Piscina Central i el ritual d’extracció del Dren gravada a la ment. Amb ells hi havia Varron Thayne, l’Enano que fins no feia gaire, era temible, descansava ara a terra, trencat d’una manera més profunda que física.
La seva fe, la seva vida i tots els judicis dictats en nom de Kaelor havien quedat esmicolats després de descobrir que Acantilado del Silencio no era un lloc de salvació, sinó la enganyifa d’un dimoni que no havia pogut derrotar.
Varron, amb la mirada perduda, va preguntar a Nelthan si ell encara podia sentir els seus déus ja que ell ja no sentia a Kaelor. No ho preguntava com un inquisidor; ho preguntava com un home que havia perdut el terra sota els peus.
Al concentrar-se Nelthan va percebre encara una presència divina, distorsionada, llunyana, embrutada pel lloc on es trobaven. Els protagonistes van aconseguir donar a Varron una nova possibilitat de sentit: potser el veritable Kaelor no era fals, sino que havia estat silenciat, manipulat o fins i tot empresonat per les criatures que dominaven aquell lloc.
Aquella idea no el va curar. Però va encendre l'espurna necessària dins el seu pit com per a tornar a aixecar-se.
Quan van reprendre la marxa, una olor impossible va començar a pujar per l’escala: plats exquisits, espècies nobles, menjar digne de les millors cuines d’Andoras. Un forat a l’estomac va colpejar el grup amb força, i van deduir que una cuina els podia oferir menjar, subministraments o fins i tot una oportunitat per enverinar els aliments de aquelles criatures i provocar una distracció.
El pla semblava raonablement sòlid.
Fins que unes rialles de noies joves van ressonar per un altre passadís.
Amb una rapidesa sorprenent i una prudència discutible, el grup va canviar de prioritat i va seguir aquell so màgic a través dels passadissos fins a desembocar a una sala guarida per unes grans cortines. Abans d’entrar, Ilu va fer una ullada i va deduir que necessitaven una aparença més adequada si no volien cridar l’atenció. Va conjurar una il·lusió sobre el grup, i tots van adoptar una indumentària d’una elegància dubtosa però amb una confiança absoluta: barret de cowboy, jaqueta i pantalons de cuir ajustat marcant paquet i sandàlies romanes.
La Sala dels Plaers es va obrir davant seu com una mentida luxosa dins les entranyes del Sagnatori: una estança ampla, càlida i plena de fum perfumat, il·luminada amb tons vermells i violetes que ballaven sobre tapissos, metalls daurats, catifes gruixudes i coixins enormes. Homes i dones de races que els jugadors no havien mai ni imaginat reien, bevien, fumaven i s’abandonaven a una música baixa, mentre nois i noies d’una bellesa massa perfecta circulaven entre les taules amb somriures calculats i robes gairebé inexistents. Al voltant de la sala, diversos reservats amb llits baixos quedaven mig ocults rere cortines translúcides; cada vegada que una cortina es tancava, la música semblava pujar just prou per tapar qualsevol so inconvenient. 
Una tiefling amb roba que no descriurem per educació als lectors, va detectar el grup i es va acostar sinuosa a Dámakos, com una serp a un ratolí, aquest va quedar completament embadalit. Davant les preguntes de la noia, els protagonistes van intentar fer-se passar pel nou espectacle de la sala, i la tiefling els va seguir el corrent amb massa facilitat. L’engany va començar a trontollar quan dues noies més, una elfa amb cabells d’or i una humana de pell perfecta, es van afegir a l’escena i van proposar portar-los a un reservat.
Seguint les caricies d’aquells essers platònics,la urgència i les maquinacions del grup es van dissoldre com un terròs de sucre al tè i la tensió acumulada a les espatlles des que van arribar es desfeia entre les mans de aquelles ninfes amb més joies que roba.

Abans no es van donar compte, estaven ja entran en un dels reservats 
Just quan el tancar de les cortines estava a punt de sentenciar el seu destí, una mà delicada però ferma els va treure d’aquell somni. Una serventa elfa de cabells platejats, ulls massa desperts i una actitud molt poc servil els va arrencar dels braços d’aquelles criatures amb una mala excusa i els va conduir per un lateral de la sala fins a una cambra petita, plena de caixes, teles velles i estris de servei.

Només quan la porta va quedar tancada darrere seu va deixar anar la màscara de serventa obedient. Els va mirar un a un, amb una barreja d’incredulitat i urgència, i els va retreure que es movien com fugitius disfressats sortits de una mala broma, que cap voluntari real s’exposaría així per aquella sala sense la seva insignia i que les noies que els havien convidat al reservat no eren cap entreteniment innocent: eren dimonis canviaformes que haurien els havien identificat com a “no voluntaris” i haguessin aprofitat aquella il·lusió mal sostinguda per no deixar cap rastre d’ells . 
El grup,encara de dol i abrumat per la quantitat de informació, va comprovar que la elfa semblava dir la veritat i  va decidir confiar-hi parcialment. Ella es va presentar com Elyse. Els va explicar que eren en una zona de voluntaris, convidats i col·laboradors del Sagnatori, i que sense insígnies d’identificació que sostinguessin la seva disfressa no arribarien gaire lluny.
Els protagonistes van traçar un pla ràpid i el van executar sorprenentment bé: Elyse va atraure a varis voluntaris a un reservat on s’havien ubicat i van aconseguir les insígnies necessàries.
Van escapar de la Sala dels Plaers sense ser desemmascarats del tot. Tot i que abans de sortir, la tiefling de ulls foscos els va recordar amb un somriure que hi hauria un banquet i que els esperava allà, deixant clar que la seva presència no havia passat tan desapercebuda com haurien volgut.
Elyse els va guiar fins a un quarto de manteniment, on podien parlar amb més seguretat. Allà van intercanviar informació: ella va explicar part de la seva situació i del funcionament del Sagnatori; ells li van parlar del seu pacte amb Nisha’ar i de com haurien sobreviscut al viatge fins ara. La menció de la misteriosa entitat no la va deixar indiferent pero van decidir parlar-ne més endavant.
Mentre investigaven la sala, van trobar amagada entre caixes una àncora de cadena impregnada amb una poderosa màgia de submissió. La cadena entrava dins la paret per un forat estret, com si alguna cosa hagués estat empresonada més enllà del mur. Van intentar localitzar l’origen i durant la cerca, van trobar una de les pedres vermelles utilitzades pels àrbitres del receptori per distingir vius de morts. En van descobrir la funció, i Elatoris se la va quedar.
Elyse, en trobar un moment de calma, els va entregar llavors les restes d’un mapa que havia trobat en el cadàver d’un arrossegat. En recompondre’l, es van situar i van veure que hauria d’existir una obertura al costat mateix de la sala.
Després d’una inspecció més acurada, van localitzar unes petites marques quadrades a la paret del passadís en les que les insígnies de voluntari encaixaven perfectament.
La paret va començar a obrir-se devorant la roca.
El grup hi va entrar i darrere seu, la pedra es va tancar de nou.
A l’interior, les llums conjurades per Ilu van revelar una cambra oculta. Al centre hi havia una forma abstracta, envoltada per les cadenes que venien rastrejant i al costat seu 2 cadavers de arrosegats dels que només quedaven els ossos.
Aquella forma no s’assemblava a res del que havien vist al Sagnatori. Era un ésser aliè, compost d’una roca blanquinosa capaç de moure’s lentament com si fos teixit viu. Al centre del seu cos hi bategava un cristall de lluïssor blanca i daurada.
Quan Dámakos, impulsivament, va tocar el cristall, el seu cos es va tensar. unes imatges li van travessar la ment: galeries subterrànies, rierols, pedra humida, bolets fluorescents, una consciencia antiga que intentava comunicar-se sense paraules.
Per idea de Nelthan, els protagonistes van fer servir la barra de ferro que Dámakos portava com a arma improvisada per trencar la cadena. La barra es va partir en el procés, però la criatura va quedar alliberada.
El so de les cadenes caient va deixar un silenci enorme.
Durant uns segons, el grup va dubtar si havia comès un error.
Llavors la criatura va estampar una de les seves extremitats contra el terra. D’ella es van estendre arrels de pedra que van recórrer la sala fins a la porta, destrossant el paviment. La paret pero, va tornar a obrir-se.
Després, la criatura va observar els protagonistes durant llarga estona. La pausa es va tornar incòmoda fins que, finalment, la criatura  va arrencarse una de les seves extremitats. Aquesta va caure al terra, va avançar antinaturalment fins a Nelthan i va canviar de forma, generant una empunyadura. Quan Nelthan la va entomar, la massa mineral es va definir com una espasa viva, adaptable a les necessitats del paladí.
Els protagonistes van intentar seguir comunicant-se amb la criatura, però aquesta es va desfer sencera dins el terra. En pocs segons, només va quedar silenci.
Un silenci trencat únicament pel moviment frenètic de la ploma d’Elyse contra el seu diari.
`,
      highlights:
        `- [[varron-thayne|Varron]] passa de jutge temible a home trencat, i [[nelthan|Nelthan]] li obre la possibilitat que [[kaelor|Kaelor]] no fos fals sinó empresonat o silenciat.
- La [[sala-dels-plaers|Sala dels Plaers]] funciona com una trampa social per detectar no voluntaris; la disfressa d'[[ilu|Ilu]] aguanta prou per sobreviure, però no per passar inadvertits.
- [[elyse|Elyse]] es converteix en aliada provisional, dona context sobre els voluntaris del [[sagnatori|Sagnatori]] i ajuda el grup a obtenir [[insignies-de-voluntari|insígnies]].
- La [[pedra-vermella-del-receptori|pedra vermella]] queda en mans d'[[elatoris|Elatoris]] i pot identificar vius i morts segons el funcionament del [[receptori|Receptori]].
- L'[[ancora-de-submissio|àncora de submissió]] retenia la [[criatura-mineral-encadenada|criatura mineral]], que en ser alliberada recompensa [[nelthan|Nelthan]] amb l'[[espasa-viva-de-nelthan|espasa viva]].`,
      imageNote:
        "Sala luxosa i perfumada dins el Sagnatori, cortines vermelles, falsos plaers demoníacs, un magatzem ocult i una criatura de pedra blanca encadenada amb un cristall daurat al centre.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      palette: ["#4a2d48", "#c99a63"],
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
      latestStatus:
        "El grup ha deixat enrere la zona de processament i s'ha mogut cap a àrees de voluntaris, plaer, manteniment i cambres ocultes dins el mateix complex.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori", "sala-dels-plaers"],
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
      latestStatus:
        "La fe de Varron queda destruïda, però Nelthan obre la possibilitat que el veritable Kaelor hagi estat silenciat, manipulat o empresonat.",
      lastSeenChronicleId: "sala-dels-plaers",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.kaelorSimbol],
      playerNotes: [],
      characterIds: ["ilu", "nelthan"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sala-dels-plaers"],
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
      latestStatus:
        "Trencat per la revelació de la impostura demoníaca, torna a aixecar-se només quan el grup li ofereix la possibilitat que Kaelor no fos fals sinó empresonat o silenciat.",
      lastSeenChronicleId: "sala-dels-plaers",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.varronThayne],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "ritual-fossa", "sagnatori", "sala-dels-plaers"],
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
      latestStatus:
        "La menció del pacte amb Nisha'ar inquieta Elyse, però el grup ajorna una explicació més profunda fins a trobar un moment més segur.",
      lastSeenChronicleId: "sala-dels-plaers",
      imageAssets: [GLOSSARY_ILLUSTRATIONS.nishaar],
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["judici-acantilado", "sagnatori", "sala-dels-plaers"],
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
    {
      id: "piscina-central",
      name: "Piscina Central",
      category: "Llocs",
      description:
        "Dipòsit o cambra central del Sagnatori on el grup observa el ritual d'extracció del Dren abans del primer descans real dins les profunditats.",
      tags: ["sagnatori", "ritual", "sang"],
      notes:
        "La visió de la piscina i del ritual queda gravada en la ment dels protagonistes i marca el to de l'exploració posterior.",
      latestStatus:
        "Vista des de la distància abans que el grup es retiri pel passadís i acabi desviant-se cap a zones de voluntaris i manteniment.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori", "sala-dels-plaers"],
      palette: ["#552832", "#c66f5d"],
    },
    {
      id: "dren",
      name: "Dren",
      category: "Altres",
      description:
        "Procés o substància associada a l'extracció ritual observada a la Piscina Central, on la sang sembla perdre una essència incolora i ingràvida.",
      tags: ["extracció", "essència", "ritual"],
      notes:
        "Encara no se'n coneix la naturalesa exacta, però sembla més important que la sang mateixa i podria ser el veritable objectiu del Sagnatori.",
      latestStatus:
        "El grup només n'ha vist el ritual d'extracció i encara no sap qui o què aprofita l'essència resultant.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori", "sala-dels-plaers"],
      palette: ["#3b3043", "#c3aa73"],
    },
    {
      id: "cuina-del-sagnatori",
      name: "Cuina del Sagnatori",
      category: "Llocs",
      description:
        "Origen d'una olor impossible de plats exquisits i espècies nobles que tempta el grup amb menjar, subministraments i possibles vies d'enverinament.",
      tags: ["cuina", "subministraments", "distracció"],
      notes:
        "El grup considera la cuina com una oportunitat tàctica, però abandona el pla en sentir les rialles que porten a la Sala dels Plaers.",
      latestStatus:
        "Encara no explorada; queda com una possible ruta o recurs dins la zona de convidats i voluntaris.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#5b3b2f", "#c99b65"],
    },
    {
      id: "sala-dels-plaers",
      name: "Sala dels Plaers",
      category: "Llocs",
      description:
        "Estança luxosa, perfumada i demoníaca dins el Sagnatori, plena de música, fum, reservats i bellesa calculada per atreure i detectar intrusos.",
      tags: ["plaer", "voluntaris", "trampa"],
      notes:
        "Els protagonistes hi entren amb una il·lusió extravagant d'Ilu i gairebé són conduïts a un reservat pels canviaformes abans que Elyse els aparti.",
      latestStatus:
        "El grup n'ha escapat amb insígnies robades, però la tiefling d'ulls foscos els ha deixat clar que els espera al banquet.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#5a2d4f", "#c58c68"],
    },
    {
      id: "canviaformes-del-plaer",
      name: "Canviaformes del plaer",
      category: "Monstres",
      description:
        "Dimonis d'aparença perfecta que treballen a la Sala dels Plaers, capaços de seduir, identificar no voluntaris i fer-los desaparèixer sense deixar rastre.",
      tags: ["dimonis", "seducció", "canviaformes"],
      notes:
        "La tiefling d'ulls foscos, una elfa de cabells d'or i una humana de pell perfecta gairebé porten el grup a un reservat abans de la intervenció d'Elyse.",
      latestStatus:
        "La tiefling sap prou del grup com per convidar-los al banquet amb un somriure amenaçador.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["damakos", "ilu", "nelthan", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#61304f", "#d09a77"],
    },
    {
      id: "elyse",
      name: "Elyse",
      category: "Altres",
      description:
        "Elfa de cabells platejats que es fa passar per serventa obedient, però actua amb massa lucidesa i urgència per ser només una peça més del Sagnatori.",
      tags: ["elfa", "aliada", "serventa"],
      notes:
        "Rescata els protagonistes dels canviaformes, els explica el funcionament bàsic de la zona de voluntaris i els entrega restes d'un mapa trobat en un arrossegat.",
      latestStatus:
        "Segueix amb el grup després de veure la criatura mineral alliberada i registra frenèticament els fets al seu diari.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#46515b", "#c9b58a"],
    },
    {
      id: "voluntaris-del-sagnatori",
      name: "Voluntaris del Sagnatori",
      category: "Faccions",
      description:
        "Convidats i col·laboradors que circulen per zones internes del Sagnatori amb insígnies pròpies, aparentment autoritzats a gaudir o servir el complex.",
      tags: ["voluntaris", "convidats", "insígnies"],
      notes:
        "Sense la seva identificació, qualsevol disfressa és insuficient. Elyse ajuda el grup a atraure'n alguns a un reservat i robar-los les insígnies.",
      latestStatus:
        "Alguns han estat utilitzats pel grup per obtenir accés, però la jerarquia real d'aquests voluntaris encara és desconeguda.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#59423e", "#bd9366"],
    },
    {
      id: "insignies-de-voluntari",
      name: "Insígnies de voluntari",
      category: "Objectes",
      description:
        "Identificadors utilitzats pels voluntaris del Sagnatori per sostenir una aparença legítima i activar mecanismes ocults de pas.",
      tags: ["insígnies", "accés", "disfressa"],
      notes:
        "El grup les roba amb l'ajuda d'Elyse i després descobreix que encaixen en marques quadrades de la paret per obrir una cambra amagada.",
      latestStatus:
        "Serveixen com a clau física o ritual per accedir a passadissos ocults dins el Sagnatori.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#54473d", "#c4a269"],
    },
    {
      id: "banquet-del-sagnatori",
      name: "Banquet del Sagnatori",
      category: "Altres",
      description:
        "Esdeveniment anunciat pels canviaformes de la Sala dels Plaers, probablement una reunió de convidats, voluntaris o servidors del complex.",
      tags: ["banquet", "voluntaris", "amenaça"],
      notes:
        "La tiefling d'ulls foscos convida el grup al banquet després de veure'ls marxar, deixant clar que la seva presència ha estat detectada.",
      latestStatus:
        "Encara pendent; pot convertir-se en oportunitat d'infiltració o en una trampa preparada.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#623536", "#d1a166"],
    },
    {
      id: "quarto-de-manteniment",
      name: "Quarto de manteniment",
      category: "Llocs",
      description:
        "Cambra petita i més segura, plena de caixes, teles i estris de servei, on Elyse pot parlar amb el grup lluny de la Sala dels Plaers.",
      tags: ["manteniment", "amagatall", "mapa"],
      notes:
        "Allà el grup intercanvia informació amb Elyse, troba l'àncora de submissió, localitza una pedra vermella del Receptori i recompon un mapa parcial.",
      latestStatus:
        "Ha revelat l'existència d'una cambra oculta immediata i d'un mecanisme activat amb insígnies.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#4b4540", "#b9956d"],
    },
    {
      id: "ancora-de-submissio",
      name: "Àncora de submissió",
      category: "Objectes",
      description:
        "Àncora de cadena amagada entre caixes i impregnada amb una poderosa màgia de submissió, connectada a una criatura empresonada darrere la paret.",
      tags: ["cadena", "submissió", "presó"],
      notes:
        "La cadena guia el grup fins a la cambra oculta on hi ha la criatura mineral encadenada.",
      latestStatus:
        "Trencada amb la barra de ferro de Dámakos, que es parteix en el procés d'alliberar la criatura.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["damakos", "nelthan", "ilu"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#504843", "#c4a16e"],
    },
    {
      id: "pedra-vermella-del-receptori",
      name: "Pedra vermella del Receptori",
      category: "Objectes",
      description:
        "Pedra utilitzada pels àrbitres del Receptori per distingir vius de morts dins la logística cruel del Sagnatori.",
      tags: ["pedra", "receptori", "detecció"],
      notes:
        "El grup en descobreix la funció al quarto de manteniment i Elatoris se la queda.",
      latestStatus:
        "En possessió d'Elatoris, amb potencial per identificar estats vitals o enganyar sistemes interns del Sagnatori.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["elatoris", "ilu"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#622d31", "#d28065"],
    },
    {
      id: "receptori",
      name: "Receptori",
      category: "Llocs",
      description:
        "Àrea o sistema del Sagnatori on uns àrbitres distingeixen vius de morts mitjançant pedres vermelles.",
      tags: ["àrbitres", "classificació", "sagnatori"],
      notes:
        "Encara no ha estat explorat directament en aquesta crònica, però la pedra vermella en revela una part del funcionament.",
      latestStatus:
        "Identificat indirectament a través d'una eina dels seus àrbitres.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["elatoris", "ilu"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#47313b", "#b67663"],
    },
    {
      id: "arrossegats",
      name: "Arrossegats",
      category: "Altres",
      description:
        "Víctimes o cossos transportats pel Sagnatori, prou comuns perquè Elyse pugui trobar-hi un mapa i la cambra oculta en contingui restes òssies.",
      tags: ["víctimes", "cossos", "sagnatori"],
      notes:
        "El terme queda associat als qui són arrossegats pel sistema de processament, ja siguin vius, morts o alguna cosa intermèdia.",
      latestStatus:
        "Dos cadàvers d'arrossegats apareixen al costat de la criatura mineral encadenada.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["ilu", "nelthan", "damakos", "elatoris"],
      chronicleIds: ["sagnatori", "sala-dels-plaers"],
      palette: ["#534441", "#ad8566"],
    },
    {
      id: "criatura-mineral-encadenada",
      name: "Criatura mineral encadenada",
      category: "Entitats",
      description:
        "Ésser aliè de roca blanquinosa i moviment orgànic, amb un cristall blanc i daurat al centre i una consciència antiga vinculada a galeries subterrànies.",
      tags: ["pedra", "cristall", "consciència"],
      notes:
        "Estava sotmesa per una cadena màgica. En tocar-ne el cristall, Dámakos veu visions de rierols, pedra humida, bolets fluorescents i una consciència sense paraules.",
      latestStatus:
        "Alliberada pel grup, obre la paret amb arrels de pedra, lliura una espasa viva a Nelthan i es desfà dins el terra.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["damakos", "nelthan", "ilu", "elatoris"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#d8d2bd", "#9f8556"],
    },
    {
      id: "espasa-viva-de-nelthan",
      name: "Espasa viva de Nelthan",
      category: "Objectes",
      description:
        "Arma mineral viva nascuda d'una extremitat de la criatura alliberada, capaç d'adaptar-se a les necessitats del paladí.",
      tags: ["espasa", "mineral", "nelthan"],
      notes:
        "La criatura s'arrenca una extremitat, que avança fins a Nelthan, genera una empunyadura i es defineix com una espasa viva.",
      latestStatus:
        "En mans de Nelthan després de l'alliberament de la criatura mineral.",
      lastSeenChronicleId: "sala-dels-plaers",
      playerNotes: [],
      characterIds: ["nelthan"],
      chronicleIds: ["sala-dels-plaers"],
      palette: ["#cfc8b5", "#8f7651"],
    },
  ],
  ui: {
    currentModule: "characters",
    selectedCharacterId: "ilu",
    selectedCharacterTab: "sheet",
    showCharacterGrid: true,
    officeMode: false,
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

