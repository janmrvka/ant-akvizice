// Mapování měst/obcí na kraje
const REGION_MAP = {
  // Praha
  "Praha": "Praha",

  // Plzeňský kraj
  "Plzeň": "Plzeňský kraj",
  "Rokycany": "Plzeňský kraj",
  "Klatovy": "Plzeňský kraj",
  "Domažlice": "Plzeňský kraj",
  "Tachov": "Plzeňský kraj",
  "Stod": "Plzeňský kraj",
  "Přeštice": "Plzeňský kraj",
  "Nepomuk": "Plzeňský kraj",
  "Blovice": "Plzeňský kraj",
  "Starý Plzenec": "Plzeňský kraj",

  // Středočeský kraj
  "Kladno": "Středočeský kraj",
  "Mladá Boleslav": "Středočeský kraj",
  "Příbram": "Středočeský kraj",
  "Kolín": "Středočeský kraj",
  "Kutná Hora": "Středočeský kraj",
  "Mělník": "Středočeský kraj",
  "Beroun": "Středočeský kraj",
  "Rakovník": "Středočeský kraj",
  "Benešov": "Středočeský kraj",
  "Brandýs nad Labem": "Středočeský kraj",
  "Nymburk": "Středočeský kraj",
  "Poděbrady": "Středočeský kraj",
  "Říčany": "Středočeský kraj",
  "Neratovice": "Středočeský kraj",
  "Lysá nad Labem": "Středočeský kraj",
  "Čáslav": "Středočeský kraj",

  // Jihočeský kraj
  "České Budějovice": "Jihočeský kraj",
  "Český Krumlov": "Jihočeský kraj",
  "Jindřichův Hradec": "Jihočeský kraj",
  "Písek": "Jihočeský kraj",
  "Prachatice": "Jihočeský kraj",
  "Strakonice": "Jihočeský kraj",
  "Tábor": "Jihočeský kraj",

  // Karlovarský kraj
  "Karlovy Vary": "Karlovarský kraj",
  "Cheb": "Karlovarský kraj",
  "Sokolov": "Karlovarský kraj",

  // Ústecký kraj
  "Ústí nad Labem": "Ústecký kraj",
  "Most": "Ústecký kraj",
  "Chomutov": "Ústecký kraj",
  "Teplice": "Ústecký kraj",
  "Děčín": "Ústecký kraj",
  "Louny": "Ústecký kraj",
  "Litoměřice": "Ústecký kraj",

  // Liberecký kraj
  "Liberec": "Liberecký kraj",
  "Jablonec nad Nisou": "Liberecký kraj",
  "Česká Lípa": "Liberecký kraj",
  "Semily": "Liberecký kraj",

  // Královéhradecký kraj
  "Hradec Králové": "Královéhradecký kraj",
  "Jičín": "Královéhradecký kraj",
  "Náchod": "Královéhradecký kraj",
  "Rychnov nad Kněžnou": "Královéhradecký kraj",
  "Trutnov": "Královéhradecký kraj",

  // Pardubický kraj
  "Pardubice": "Pardubický kraj",
  "Chrudim": "Pardubický kraj",
  "Svitavy": "Pardubický kraj",
  "Ústí nad Orlicí": "Pardubický kraj",

  // Kraj Vysočina
  "Jihlava": "Kraj Vysočina",
  "Havlíčkův Brod": "Kraj Vysočina",
  "Pelhřimov": "Kraj Vysočina",
  "Třebíč": "Kraj Vysočina",
  "Žďár nad Sázavou": "Kraj Vysočina",

  // Jihomoravský kraj
  "Brno": "Jihomoravský kraj",
  "Blansko": "Jihomoravský kraj",
  "Břeclav": "Jihomoravský kraj",
  "Hodonín": "Jihomoravský kraj",
  "Vyškov": "Jihomoravský kraj",
  "Znojmo": "Jihomoravský kraj",
  "Boskovice": "Jihomoravský kraj",

  // Olomoucký kraj
  "Olomouc": "Olomoucký kraj",
  "Prostějov": "Olomoucký kraj",
  "Přerov": "Olomoucký kraj",
  "Šumperk": "Olomoucký kraj",
  "Jeseník": "Olomoucký kraj",

  // Zlínský kraj
  "Zlín": "Zlínský kraj",
  "Kroměříž": "Zlínský kraj",
  "Uherské Hradiště": "Zlínský kraj",
  "Vsetín": "Zlínský kraj",

  // Moravskoslezský kraj
  "Ostrava": "Moravskoslezský kraj",
  "Opava": "Moravskoslezský kraj",
  "Karviná": "Moravskoslezský kraj",
  "Frýdek-Místek": "Moravskoslezský kraj",
  "Nový Jičín": "Moravskoslezský kraj",
  "Bruntál": "Moravskoslezský kraj",
  "Havířov": "Moravskoslezský kraj",
  "Třinec": "Moravskoslezský kraj",
};

export function cityToRegion(cityRaw) {
  if (!cityRaw) return null;
  // Odstraň část za pomlčkou (Praha – Modřany → Praha)
  const city = cityRaw.split("–")[0].split("-")[0].trim();
  // Přímé hledání
  if (REGION_MAP[city]) return REGION_MAP[city];
  // Hledej prefix (Brno-střed → Brno)
  for (const [key, region] of Object.entries(REGION_MAP)) {
    if (city.startsWith(key) || key.startsWith(city)) return region;
  }
  return "Ostatní";
}

export function regionGroup(region) {
  if (!region) return "Ostatní";
  if (region === "Praha") return "Praha";
  if (region === "Plzeňský kraj") return "Plzeňský kraj";
  return "Zbytek ČR";
}
