// Mapování měst/obcí na kraje
const REGION_MAP = {
  // Praha
  "Praha": "Praha",

  // Plzeňský kraj — všechna města okresu
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
  "Horažďovice": "Plzeňský kraj",
  "Sušice": "Plzeňský kraj",
  "Nýřany": "Plzeňský kraj",
  "Třemošná": "Plzeňský kraj",
  "Dobřany": "Plzeňský kraj",
  "Kaznějov": "Plzeňský kraj",
  "Kralovice": "Plzeňský kraj",
  "Planá": "Plzeňský kraj",
  "Bor": "Plzeňský kraj",
  "Kdyně": "Plzeňský kraj",
  "Horšovský Týn": "Plzeňský kraj",
  "Holýšov": "Plzeňský kraj",
  "Stříbro": "Plzeňský kraj",
  "Chodov": "Plzeňský kraj",
  "Spálené Poříčí": "Plzeňský kraj",
  "Zbiroh": "Plzeňský kraj",
  "Radnice": "Plzeňský kraj",
  "Nová Huť": "Plzeňský kraj",
  "Chotěšov": "Plzeňský kraj",

  // Karlovarský kraj
  "Karlovy Vary": "Karlovarský kraj",
  "Cheb": "Karlovarský kraj",
  "Sokolov": "Karlovarský kraj",
  "Mariánské Lázně": "Karlovarský kraj",
  "Františkovy Lázně": "Karlovarský kraj",
  "Aš": "Karlovarský kraj",
  "Kraslice": "Karlovarský kraj",
  "Ostrov": "Karlovarský kraj",
  "Jáchymov": "Karlovarský kraj",
  "Nejdek": "Karlovarský kraj",
  "Nová Role": "Karlovarský kraj",
  "Chodov": "Karlovarský kraj",
  "Horní Slavkov": "Karlovarský kraj",
  "Toužim": "Karlovarský kraj",
  "Žlutice": "Karlovarský kraj",

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
  "Středočeský": "Středočeský kraj",

  // Jihočeský kraj
  "České Budějovice": "Jihočeský kraj",
  "Český Krumlov": "Jihočeský kraj",
  "Jindřichův Hradec": "Jihočeský kraj",
  "Písek": "Jihočeský kraj",
  "Prachatice": "Jihočeský kraj",
  "Strakonice": "Jihočeský kraj",
  "Tábor": "Jihočeský kraj",
  "Třeboň": "Jihočeský kraj",
  "Milevsko": "Jihočeský kraj",
  "Blatná": "Jihočeský kraj",

  // Ústecký kraj
  "Ústí nad Labem": "Ústecký kraj",
  "Most": "Ústecký kraj",
  "Chomutov": "Ústecký kraj",
  "Teplice": "Ústecký kraj",
  "Děčín": "Ústecký kraj",
  "Louny": "Ústecký kraj",
  "Litoměřice": "Ústecký kraj",
  "Kadaň": "Ústecký kraj",
  "Žatec": "Ústecký kraj",
  "Roudnice nad Labem": "Ústecký kraj",
  "Lovosice": "Ústecký kraj",
  "Bílina": "Ústecký kraj",

  // Liberecký kraj
  "Liberec": "Liberecký kraj",
  "Jablonec nad Nisou": "Liberecký kraj",
  "Česká Lípa": "Liberecký kraj",
  "Semily": "Liberecký kraj",
  "Turnov": "Liberecký kraj",
  "Frýdlant": "Liberecký kraj",

  // Královéhradecký kraj
  "Hradec Králové": "Královéhradecký kraj",
  "Jičín": "Královéhradecký kraj",
  "Náchod": "Královéhradecký kraj",
  "Rychnov nad Kněžnou": "Královéhradecký kraj",
  "Trutnov": "Královéhradecký kraj",
  "Broumov": "Královéhradecký kraj",
  "Nový Bydžov": "Královéhradecký kraj",

  // Pardubický kraj
  "Pardubice": "Pardubický kraj",
  "Chrudim": "Pardubický kraj",
  "Svitavy": "Pardubický kraj",
  "Ústí nad Orlicí": "Pardubický kraj",
  "Hlinsko": "Pardubický kraj",
  "Litomyšl": "Pardubický kraj",

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
  "Kuřim": "Jihomoravský kraj",
  "Veselí nad Moravou": "Jihomoravský kraj",

  // Olomoucký kraj
  "Olomouc": "Olomoucký kraj",
  "Prostějov": "Olomoucký kraj",
  "Přerov": "Olomoucký kraj",
  "Šumperk": "Olomoucký kraj",
  "Jeseník": "Olomoucký kraj",
  "Litovel": "Olomoucký kraj",

  // Zlínský kraj
  "Zlín": "Zlínský kraj",
  "Kroměříž": "Zlínský kraj",
  "Uherské Hradiště": "Zlínský kraj",
  "Vsetín": "Zlínský kraj",
  "Uherský Brod": "Zlínský kraj",
  "Valašské Meziříčí": "Zlínský kraj",
  "Rožnov pod Radhoštěm": "Zlínský kraj",

  // Moravskoslezský kraj
  "Ostrava": "Moravskoslezský kraj",
  "Opava": "Moravskoslezský kraj",
  "Karviná": "Moravskoslezský kraj",
  "Frýdek-Místek": "Moravskoslezský kraj",
  "Nový Jičín": "Moravskoslezský kraj",
  "Bruntál": "Moravskoslezský kraj",
  "Havířov": "Moravskoslezský kraj",
  "Třinec": "Moravskoslezský kraj",
  "Kopřivnice": "Moravskoslezský kraj",
  "Orlová": "Moravskoslezský kraj",
  "Bohumín": "Moravskoslezský kraj",
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

// Plzeňský kraj + Karlovarský kraj = historické Západní Čechy
const ZAPADNI_CECHY = new Set(["Plzeňský kraj", "Karlovarský kraj"]);

export function regionGroup(region) {
  if (!region) return "Ostatní";
  if (region === "Praha") return "Praha";
  if (ZAPADNI_CECHY.has(region)) return "Západní Čechy";
  return "Zbytek ČR";
}
