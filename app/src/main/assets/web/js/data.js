// Datos de las 12 salas municipales. Fuente: Museo Digital 3D (js/datos.js)
// Cada municipio guarda historia, cultura, lugares, paisajes, cultivos y riqueza,
// además de cifras de referencia para la sala de estadísticas.
const MUNICIPIOS = [
    {
        id: "amecameca", nombre: "Amecameca", emoji: "🌋", color: "#b06a3b",
        historia: "Amecameca nació entre la niebla de los volcanes y fue, desde tiempos prehispánicos, un alto santuario donde se veneraba a Quetzalcóatl. Formó parte del señorío de Chalco y sirvió de paso obligado para quienes subían al Popocatépetl y al Iztaccíhuatl. En la Colonia se convirtió en cabecera de doctrina franciscana y en punto de encuentro de arrieros, peregrinos y viajeros que cruzaban la sierra.",
        cultura: "La fe se vuelve fiesta: el Señor del Sacromonte convoca peregrinaciones que suben al cerro entre velas y cánticos, la Semana Santa llena el aire de cera y el Día de Muertos lo endulza con alfeñique. El carnaval, las danzas y la música de viento acompañan el calendario del pueblo. La cocina de cecina, quesadillas y pan mantiene vivo el sabor de la comarca.",
        lugares: "El Santuario del Señor del Sacromonte, el exconvento de San Juan Evangelista y los miradores del Paso de Cortés, puerta del bosque de los volcanes. En el centro, el mercado y los portales reúnen cada mañana a vendedores de flores, fruta y pan.",
        paisaje: "La llanura se abre entre milpas y niebla; arriba, arenales y glaciares dibujan la silueta de los dos volcanes. Los bosques de pino y oyamel cubren las faldas, y en temporada de lluvias los arroyos bajan con fuerza hacia el valle.",
        cultivos: "Maíz, haba, avena y hortalizas de temporal, con claveles y flores de invernadero que viajan a los mercados del valle. La tierra volcánica y el agua de deshielo sostienen una agricultura de altura, paciente y diversa.",
        riqueza: "Su riqueza está en el agua de los deshielos, la tierra volcánica y la memoria de quienes suben a la montaña. Al turismo de montaña se suma el comercio de flores y alimentos, que conecta al pueblo con la ciudad de México.",
        lema: "Donde la niebla se vuelve montaña.",
        poblacion: 47800, superficie: 220, altitud: 2480,
        imagenes: [
            { src: "ameca1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ameca2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ameca3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "chalco", nombre: "Chalco", emoji: "🏰", color: "#6f8062",
        historia: "Capital del señorío acolhua, Chalco controló las chinampas y el comercio del lago mucho antes de la llegada de los españoles. Sus señores dominaron un territorio de agua, tule y milpa que se extendía por el oriente de la cuenca de México. En la Colonia fue corredor del Camino Real a Veracruz y escenario de desecaciones, epidemias y nuevas devociones. El viejo lago se fue cerrando hasta dejar solo canales y memoria.",
        cultura: "San Martín, los molinos de nixtamal y las comparsas de barrio sostienen una identidad nacida entre el agua y el cemento. La ciudad celebra su pasado lacustre mientras el antiguo lago se vuelve memoria. En los pueblos de Xico y San Mateo sobreviven mayordomías, danzas y cocinas de tamal, atole y pescado, sabores de una tierra que alguna vez fue orilla.",
        lugares: "El centro histórico, el pueblo de Xico entre los cerros y los canales que aún sobreviven entre las chinampas. La parroquia de San Martín, el antiguo camino real y los mercados populares conservan el trazo de la vieja capital acolhua.",
        paisaje: "Llanura lacustre desecada, con suelo salino, tulares y los últimos espejos de agua del oriente del valle. Entre las milpas asoman cerros de baja altura, y en los bordes de los canales crecen ahuejotes y carrizos que recuerdan el paisaje original.",
        cultivos: "Maíz, amaranto, hortalizas y flores en chinampas, huertos familiares y tierras de temporal. El amaranto, heredado de las culturas antiguas, se tuesta y se endulza con miel para convertirse en alegría, dulce típico de la región.",
        riqueza: "Chinampas, memoria acolhua y el pulso comercial de la puerta oriente de la cuenca de México. Su gente combina el trabajo del campo con el empleo urbano y mantiene vivas las fiestas que nacieron a la orilla del agua.",
        lema: "La ciudad que aprendió a vivir sobre el agua.",
        poblacion: 176000, superficie: 84, altitud: 2240,
        imagenes: [
            { src: "chalco1.jpg", titulo: "Chinampas de maíz y amaranto", fecha: "", leyenda: "Las chinampas del antiguo lago de Chalco sostuvieron el cultivo de maíz y amaranto, base de la alimentación y del paisaje lacustre de la región." },
            { src: "chalco2.jpg", titulo: "Pájaro carpintero", fecha: "", leyenda: "El pájaro carpintero habita los bosques y huertos de la zona; su presencia recuerda la riqueza de aves que acompañaba los humedales chalquenses." },
            { src: "Chalco_1651.jpg", titulo: "Mapa de Chalco", fecha: "1651", leyenda: "Mapa colonial de Chalco y su sistema lacustre, clave para imaginar el paisaje que habitó Sor Juana." }
        ]
    },
    {
        id: "ozumba", nombre: "Ozumba", emoji: "🍐", color: "#a9762e",
        historia: "Ozumba creció sobre un asentamiento mexica y tomó su nombre del ozote, el árbol que sombrea sus huertas. Durante la Colonia fue doctrina y paso de arrieros entre la tierra fría y las barrancas del sur; su convento y su mercado hicieron del valle un cruce de caminos. En el siglo XIX las haciendas frutícolas consolidaron su vocación agrícola y su fama de tierra de peras.",
        cultura: "La Feria de la Pera marca el calendario: música, dulces y concursos alrededor de la fruta. Las mayordomías y los rezos de barrio mantienen el ritmo comunitario. En Semana Santa se elaboran dulces tradicionales y en noviembre las ofrendas llenan de flores los hogares. La banda y los juegos pirotécnicos anuncian la fiesta del patrono.",
        lugares: "El exconvento de Santo Domingo, el templo de San Juan Bautista y las huertas que trepan hacia las faldas de los volcanes. En el centro, los portales y el mercado conservan el ambiente de un pueblo que vive del campo y de la fruta.",
        paisaje: "Valle templado entre el Popocatépetl y la sierra de Ajusco-Chichinautzin, con lluvias de verano y tardes de luz dorada. Las barrancas y los manantiales cortan el terreno, y en el horizonte la silueta del volcán cambia con la niebla.",
        cultivos: "Pera, manzana, higo y durazno, además de maíz y hortalizas que se venden en los tianguis de la región. Los huertos familiares y los árboles de aguacate completan una economía de temporada, en la que la cosecha se comparte y se celebra.",
        riqueza: "Sus huertas y su feria son el orgullo de un pueblo que sabe esperar la cosecha. Al fruto se suman los dulces artesanales, la madera y el comercio de los tianguis, que sostienen a muchas familias del valle.",
        lema: "El valle donde septiembre sabe a pera.",
        poblacion: 25000, superficie: 107, altitud: 2300,
        imagenes: [
            { src: "ozumba1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ozumba2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ozumba3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "tlalmanalco", nombre: "Tlalmanalco", emoji: "⛲", color: "#8a6a4a",
        historia: "Tlalmanalco, «lugar llano», fue señorío de peso antes de la conquista y después sede de uno de los primeros conventos franciscanos de América. Sus muros guardan frescos, capillas abiertas y el silencio de los primeros evangelizadores. El conjunto de San Luis Obispo, iniciado en el siglo XVI, es testimonio del encuentro entre la piedra indígena y la traza europea.",
        cultura: "Las fiestas de San Luis Obispo y las procesiones entre atrios y capillas mantienen el pulso de un pueblo que cuida su patrimonio como parte de la vida diaria. La música de viento, los moros y cristianos y las ofrendas de flores acompañan el calendario. Los talleres de cantera y las cocinas de barbacoa completan una identidad hecha de piedra y maíz.",
        lugares: "El exconvento de San Luis Obispo con su capilla abierta, el cerro del Tláloc y las barrancas que bajan hacia el valle. Cerca del pueblo, los bosques y los manantiales invitan al paseo, y en el centro el mercado conserva el ritmo de la vida cotidiana.",
        paisaje: "Llanuras de pastoreo bajo el Iztaccíhuatl, cercadas por bosques de pino y barrancas que descienden hacia el sur. La niebla se detiene en las laderas y el verde de los potreros contrasta con la piedra gris de los volcanes.",
        cultivos: "Maíz, cebada, avena y hortalizas; en las zonas altas pastan vacas y caballos entre los pinos. La cercanía de los bosques permite la extracción de madera y la recolección de hongos y frutos silvestres en temporada.",
        riqueza: "Un conjunto conventual del siglo XVI y una comunidad que lo habita todos los días. Su riqueza combina el patrimonio, el pastoreo y el agua de las barrancas, que riega huertas y abastece a los pueblos vecinos.",
        lema: "Piedra, fresco y silencio franciscano.",
        poblacion: 45000, superficie: 156, altitud: 2440,
        imagenes: [
            { src: "tlama1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tlama2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tlama3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "ayapango", nombre: "Ayapango", emoji: "🐄", color: "#b08d57",
        historia: "Ayapango, «lugar en la orilla del agua», nació como pueblo de paso y de labranza a los pies de la sierra. Sus casonas de adobe y sus portales cuentan siglos de arriería, comercio y fiesta. En la época colonial consolidó un casco urbano de calles rectas, iglesia y plazuela que aún conserva su arquitectura de adobe y teja.",
        cultura: "La feria ganadera y las fiestas de San Juan llenan el pueblo de música de banda, olor a pan y caballos. Las familias conservan el gusto por la vida de campo y por recibir a quien llega. En noviembre, las ofrendas y los panes de muerto reúnen a quienes migraron; en Semana Santa, las procesiones recorren las calles empedradas.",
        lugares: "El templo de San Juan Bautista, las casonas con arcadas y los miradores que dominan la sierra nevada. Los callejones de piedra y las huertas cercanas invitan a caminar sin prisa, entre muros de adobe y árboles frutales.",
        paisaje: "Altiplano abierto al pie de la Sierra Nevada, con potreros, callejones de piedra y vistas limpias a los volcanes. El viento recorre los pastizales y, al atardecer, la luz tiñe de rosa la nieve del Iztaccíhuatl.",
        cultivos: "Maíz, frijol y avena, además de apicultura y ganadería bovina en los pastizales de altura. Los huertos familiares aportan ciruela, pera y durazno, y la leche de las vacas alimenta una pequeña producción de quesos y crema.",
        riqueza: "Su riqueza está en la tierra, en la fiesta y en la hospitalidad de sus cocinas. La ganadería, el turismo rural y la cercanía con Amecameca y los volcanes le dan un lugar propio en la región.",
        lema: "Portales de adobe frente a la sierra.",
        poblacion: 10500, superficie: 47, altitud: 2440,
        imagenes: [
            { src: "ayapa1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ayapa2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "ayapa3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "tepetlixpa", nombre: "Tepetlixpa", emoji: "🌽", color: "#9a7b4f",
        historia: "Tepetlixpa toma su nombre del tepetate, la piedra dura que sostiene caminos y casas. Fue tierra de paso entre la cuenca y Morelos, y aún conserva el trazo de sus antiguos barrios. Durante la Colonia quedó vinculada a la jurisdicción de Chalco y a las doctrinas de la región; su población creció entre milpas, barrancas y caminos de herradura.",
        cultura: "Los molinos de nixtamal, las mayordomías y la feria patronal organizan el año. La música de viento y los cohetes anuncian que la comunidad vuelve a reunirse. En las fiestas patronales y en el Día de Muertos, las familias comparten pan, tamales y moles, y los jóvenes aprenden los pasos de las danzas tradicionales.",
        lugares: "El centro histórico, la parroquia y los caminos de tepetate que bajan hacia las barrancas. Cerca se encuentra San Miguel Nepantla, cuna de Sor Juana, y los miradores desde donde se divisa la silueta del Popocatépetl.",
        paisaje: "Cerros secos y barrancas cálidas en el límite con Morelos, con vegetación de selva baja y olor a tierra. En temporada de lluvias el paisaje se cubre de verde y los arroyos bajan entre piedras; en secas, el tepetate blanquea los caminos.",
        cultivos: "Maíz, frutales y hortalizas de temporal; la ganadería y el nixtamal completan la economía del pueblo. Las familias cultivan también nopal, calabaza y frijol en parcelas pequeñas, y venden tortillas y tlacoyos en los mercados de la región.",
        riqueza: "Una comunidad que hace de la piedra y del grano su manera de estar en el mundo. A ello se suma la cercanía con Nepantla y los volcanes, que atrae a visitantes interesados en la historia y el paisaje.",
        lema: "Caminos de piedra, sabor de nixtamal.",
        poblacion: 15500, superficie: 75, altitud: 2100,
        imagenes: [
            { src: "tepe1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tepe2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tepe3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "cocotitla", nombre: "Cocotitla", emoji: "🕊️", color: "#7d8471",
        historia: "«Lugar de tórtolas»: un pueblo pequeño de origen prehispánico que creció ligado al señorío de Chalco. Su caserío se acomodó entre la cañada y el agua, en un rincón que todavía huele a bosque. En la Colonia fue visitado por los frailes que atendían las doctrinas de la región, y su iglesia y sus capillas de barrio conservan esa huella.",
        cultura: "Las fiestas de barrio, la música y las danzas se organizan desde los patios y las capillas. El santo patrono convoca cada año a las familias que migraron y vuelven. La elaboración de pan, conservas y bebidas tradicionales acompaña las celebraciones, y los mayores transmiten a los niños los relatos del agua y del monte.",
        lugares: "El exconvento de San Juan Bautista, las capillas de barrio y los senderos de la cañada. Sus manantiales y pozos, así como los puentes de piedra, forman parte de un recorrido breve pero lleno de historia y vegetación.",
        paisaje: "Cañada boscosa entre Chalco y Ozumba, con manantiales, encinos y oyameles que cubren las laderas. La niebla matinal y el sonido del agua acompañan un paisaje de barrancas que contrasta con la llanura vecina.",
        cultivos: "Maíz, frutales y hortalizas, con apicultura y avicultura familiar en los traspatios. Los huertos producen pera, manzana y durazno, y la cercanía del bosque permite recolectar hongos y plantas medicinales en temporada.",
        riqueza: "Un pueblo de agua y bosque, donde la fiesta se hereda y el trabajo se comparte. Su riqueza es también su paisaje: manantiales, sombra y aire limpio a pocos minutos de la ciudad.",
        lema: "El rincón de las tórtolas y el agua.",
        poblacion: 5200, superficie: 17, altitud: 2100,
        imagenes: [
            { src: "co1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "co2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "co3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "atlautla", nombre: "Atlautla", emoji: "🍎", color: "#8f5d3a",
        historia: "Atlautla, «lugar bajo el agua», se asienta en las faldas orientales del Iztaccíhuatl, donde el deshielo alimenta barrancas y manantiales. Fue tierra de paso y de milpa antes de ser municipio, y formó parte de los dominios que controlaban el paso entre la cuenca de México y Morelos. Su nombre y sus leyendas hablan de corrientes que bajaban con fuerza desde la montaña.",
        cultura: "Las peregrinaciones al volcán, las bandas de viento y la fiesta del patrono marcan el año. El pueblo conserva una fuerte identidad indígena y un gusto por la música al aire libre. En las fiestas se preparan moles, tamales y pan de pueblo, y los danzantes recorren el atrio con máscaras y sonajas.",
        lugares: "El templo de San Pedro, los miradores de la sierra y las barrancas que bajan hacia el oriente. Los senderos hacia el Iztaccíhuatl y las cascadas de temporada atraen a quienes buscan naturaleza y silencio.",
        paisaje: "Falda volcánica con bosques de encino y pino, niebla de tarde y barrancas profundas. El deshielo forma arroyos que riegan huertas y pastizales, y en invierno la nieve corona la montaña.",
        cultivos: "Maíz, flores ornamentales, hortalizas y frutales; la apicultura y la ganadería completan el paisaje. La producción de flores y plantas de ornamento se vende en mercados cercanos y acompaña la fiesta de los pueblos vecinos.",
        riqueza: "Agua de deshielo, bosque y comunidad: una tierra de peregrinos y músicos. La cercanía del volcán y sus paisajes abren también una vía para el turismo de naturaleza.",
        lema: "Al pie del volcán, entre niebla y milpa.",
        poblacion: 17000, superficie: 88, altitud: 2000,
        imagenes: [
            { src: "atlau1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "atlau2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "atlau3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "tenango-del-aire", nombre: "Tenango del Aire", emoji: "🪁", color: "#c2a25a",
        historia: "Tenango del Aire nació como punto de paso y abasto entre los valles de México y Morelos. El viento que baja de la sierra le dio nombre y también fama de tierra de cometas y cielos abiertos. En la Colonia fue parte de las rutas que unían la cuenca con el sur, y su casco conserva el trazo de un pueblo de caminos y paradas.",
        cultura: "La Feria de la Primavera y las fiestas patronales llenan el calendario de juegos, bandas y antojitos. El ambiente rural se conserva en las calles y en los patios. Los vecinos elaboran pan y conservas, y en diciembre las posadas reúnen a las familias alrededor de la fogata y los villancicos.",
        lugares: "El centro con su templo, la plaza de la feria y los campos abiertos que rodean al pueblo. Los miradores hacia la sierra y los caminos de tierra invitan a caminar y a mirar el paisaje desde las lomas.",
        paisaje: "Altiplano frío de pastizales y lomas, con vistas largas a la sierra nevada y atardeceres rojizos. El viento constante mueve los pastos y despeja el cielo, uno de los más limpios de la región.",
        cultivos: "Maíz, avena y hortalizas de altura, con ganadería bovina en los pastizales. Los huertos de durazno y pera y la producción de forraje complementan una economía rural de pequeña escala.",
        riqueza: "Un pueblo de aire y feria, cruce de caminos entre dos valles. Su riqueza está en el campo, la ganadería y la tranquilidad de un paisaje abierto que atrae a visitantes de fin de semana.",
        lema: "El pueblo donde el viento hace fiesta.",
        poblacion: 6300, superficie: 34, altitud: 2400,
        imagenes: [
            { src: "tena1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tena2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tena3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "temamatla", nombre: "Temamatla", emoji: "🪨", color: "#8d8b86",
        historia: "«Entre piedras»: el nombre resume el paisaje de Temamatla, antiguo poblado agrícola del señorío de Chalco. Sus caminos de piedra y sus cerros bajos guardan la memoria de una vida hecha de temporal. En la Colonia fue parte de las tierras de Chalco y conservó una economía de milpa y pastoreo que aún marca su paisaje.",
        cultura: "Las vaquerías son la fiesta mayor: música, danza y comida campirana que se comparten entre familias. La mayordomía y el trabajo comunal sostienen la vida del pueblo. En las fiestas patronales se preparan barbacoa, mole y pan, y los grupos de danza recorren la plaza con vestimenta tradicional.",
        lugares: "El templo del Sagrado Corazón, la plaza del centro y los caminos empedrados entre los cerros. Las antiguas haciendas y los jagüeyes, pequeños depósitos de agua, recuerdan el trabajo del campo en una tierra seca.",
        paisaje: "Lomeríos pedregosos y pastizales secos al oriente del valle, con magueyes y manchones de nopal. En temporada de lluvias el paisaje se viste de verde, y los cerros dejan ver la silueta de los volcanes al fondo.",
        cultivos: "Maíz, frijol, nopal y hortalizas de temporal, con ganadería y huertos de traspatio. El maguey se aprovecha para pulque y para la elaboración de artesanías, y el nopal forma parte de la dieta y del mercado local.",
        riqueza: "Una comunidad que celebra su trabajo al ritmo de la banda. Su riqueza combina la piedra, el maguey y la ganadería, en un paisaje austero que sabe florecer en temporada de lluvias.",
        lema: "Entre piedras, música y comida de campo.",
        poblacion: 12000, superficie: 117, altitud: 2200,
        imagenes: [
            { src: "tema1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tema2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "tema3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "nepantla", nombre: "San Miguel Nepantla", emoji: "🪶", color: "#9c7a3c",
        historia: "San Miguel Nepantla, «en medio», es célebre por ser la cuna de Sor Juana Inés de la Cruz. Hacia 1648, la hacienda y el pueblo formaban un paisaje de milpas y aguas donde la niña aprendió a leer. Hija de una familia criolla, Juana creció entre libros y campo, y llegó a ser una de las voces más importantes del Barroco hispanoamericano.",
        cultura: "Cada año el pueblo recuerda a la Décima Musa con lecturas, música y ofrendas. La vida cotidiana sigue girando en torno al campo, la fiesta del patrono y la escuela. Las escuelas y talleres locales enseñan a los niños versos de Sor Juana, y en noviembre la casa natal se llena de flores y velas.",
        lugares: "La casa natal de Sor Juana, el templo de San Miguel Arcángel y los callejones que miran al Popocatépetl. El museo y los jardines cercanos completan un recorrido que une historia, literatura y paisaje.",
        paisaje: "Poblado de altura entre Amecameca y Ayapango, rodeado de pastizales, magueyes y la silueta del volcán. Los caminos de tierra y las huertas dibujan un paisaje tranquilo, con tardes de viento y cielos abiertos.",
        cultivos: "Maíz, haba, avena y hortalizas de temporal, con ganadería familiar. Los huertos de pera y durazno y la recolección de plantas silvestres complementan la economía de un pueblo pequeño y trabajador.",
        riqueza: "La memoria de Sor Juana y la tierra que la vio crecer: un pueblo pequeño con una herencia enorme. El turismo literario y la cercanía de los volcanes le dan un lugar especial en la región.",
        lema: "La cuna de la Décima Musa.",
        poblacion: 6000, superficie: 62, altitud: 2400,
        imagenes: [
            { src: "nepa1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "nepa2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "nepa3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    },
    {
        id: "ecatzingo", nombre: "Ecatzingo de Hidalgo", emoji: "🌴", color: "#7f6a52",
        historia: "Ecatzingo, «lugar del viento sobre el agua», se levantó entre cerros y barrancas en el límite con Morelos. Su nombre evoca el viento que corre sobre los manantiales y las presas antiguas. Fue asentamiento de paso entre la cuenca y el sur, y su población conservó durante siglos una economía de milpa, palma y ganadería. Con el tiempo añadió el nombre de Hidalgo a su denominación, en homenaje al padre de la Independencia.",
        cultura: "Las fiestas patronales y los talleres de palma reúnen a las familias. La artesanía se aprende en casa y se vende en ferias y mercados de la región. En las celebraciones se escuchan bandas de viento y se preparan platillos de maíz, carne y chile, mientras los danzantes recorren el atrio.",
        lugares: "El templo de San Juan Bautista, los talleres de palma y las barrancas del oriente mexiquense. Los manantiales y las presas antiguas, así como los miradores hacia Morelos, forman parte del paisaje que rodea al pueblo.",
        paisaje: "Cerros, barrancas y palmares en el límite con Morelos, con clima cálido y aire seco. La transición entre el altiplano y las tierras bajas crea un paisaje de contrastes, con vegetación de matorral y cultivos en terrazas.",
        cultivos: "Maíz, palma, frutales y hortalizas; la palma se teje en sombreros, canastas y juguetes. Los huertos de aguacate, durazno y ciruela aprovechan el microclima de las barrancas, y la ganadería menor completa la economía familiar.",
        riqueza: "Artesanos que convierten una hoja en sombrero, canasta o juguete. A la palma se suman la fruta de sus barrancas y el paso de visitantes, que encuentran en Ecatzingo un paisaje distinto dentro de la región.",
        lema: "El viento, la palma y la barranca.",
        poblacion: 35000, superficie: 135, altitud: 2400,
        imagenes: [
            { src: "eca1.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "eca2.jpg", titulo: "", fecha: "", leyenda: "" },
            { src: "eca3.jpg", titulo: "", fecha: "", leyenda: "" }
        ]
    }
];

// Sala 13: estadísticas de la Región de los Volcanes.
// Las cifras son aproximadas y están pensadas como material de consulta del museo.
const ESTADISTICAS = {
    id: "estadisticas",
    nombre: "Sala de estadísticas",
    emoji: "📊",
    color: "#b8862b",
    nota: "Cifras aproximadas de referencia, redondeadas a partir de fuentes públicas (INEGI, Censo 2020 y cartografía básica). Ante cualquier uso formal consulte siempre el dato oficial vigente.",
    bienvenida: "Doce municipios y un mismo paisaje de volcanes. Aquí los datos se vuelven territorio: cuántos somos, cuánto abarca cada municipio y a qué altura madura el maíz. Camina y compara: las cifras de la Región de los Volcanes caben en una sola sala.",
    imagenes: [
        {
            src: "est1.jpg",
            titulo: "El territorio en 1474",
            fecha: "Mapa histórico",
            leyenda: "Mapa del territorio de la región en 1474, cuando los señoríos de la cuenca aún se repartían las tierras entre volcanes, bosques y milpas. La cartografía antigua ayuda a entender los límites actuales de los doce municipios."
        },
        {
            src: "est2.jpg",
            titulo: "Calendario agrícola",
            fecha: "Saberes locales",
            leyenda: "El calendario agrícola ordena las siembras y las cosechas según la lluvia, el frío y las fases de la luna. Es un saber que se transmite de generación en generación en las comunidades de la región."
        },
        {
            src: "est3.jpg",
            titulo: "Milpa y amaranto",
            fecha: "Paisaje productivo",
            leyenda: "La milpa -maíz, frijol y calabaza- convive con el amaranto en las laderas de los volcanes. Ese paisaje de cultivos explica buena parte de la población y la superficie de la región."
        }
    ],
    cifras: [
        { valor: "12", etiqueta: "municipios" },
        { valor: "13", etiqueta: "salas del museo" },
        { valor: "36", etiqueta: "obras expuestas" },
        { valor: "2", etiqueta: "volcanes nevados" },
        { valor: "≈ 401 mil", etiqueta: "habitantes" },
        { valor: "≈ 1 142 km²", etiqueta: "superficie" }
    ]
};
