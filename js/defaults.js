// Dados iniciais do site. Usados enquanto o Firebase não foi populado
// e para o botão "importar catálogo inicial" do modo de edição.

export const DEFAULT_CONTACT = { whatsapp: "5500000000000", phoneDisplay: "(00) 00000-0000" };

export const BASE_CATS = ["ABS", "Injeção", "Airbag", "Carroceria", "Câmbio", "Direção"];

export const SHOW = [
  ["ABS", "Módulo ABS", "Freios"],
  ["Injeção", "Injeção", "Motor"],
  ["Airbag", "Airbag SRS", "Segurança"],
  ["Carroceria", "Carroceria", "Conforto"],
  ["Câmbio", "Câmbio", "Transmissão"],
  ["Direção", "Direção elétrica", "EPS"]
];

export const PRODUCTS = [
  { n: "Módulo ABS 4 canais", c: "MC-ABS-1042", v: "Gol G5, Voyage, Saveiro 2009–2016", t: "ABS", s: "freio antitravamento hidraulico" },
  { n: "Módulo ABS Bosch 9.0", c: "MC-ABS-1108", v: "Onix, Prisma 2013–2019", t: "ABS", s: "freio antitravamento hidraulico" },
  { n: "Módulo ABS Mando", c: "MC-ABS-1215", v: "HB20, Creta 2012–2020", t: "ABS", s: "freio antitravamento hidraulico" },
  { n: "Módulo ABS Teves", c: "MC-ABS-1330", v: "Corsa, Celta, Meriva 2003–2012", t: "ABS", s: "freio antitravamento hidraulico" },
  { n: "Módulo de Injeção Marelli", c: "MC-ECU-2051", v: "Palio, Uno, Siena Fire 2008–2016", t: "Injeção", s: "ecu motor computador modulo de injecao" },
  { n: "Módulo de Injeção Bosch ME7", c: "MC-ECU-2077", v: "Gol, Fox, Polo 1.6 2007–2014", t: "Injeção", s: "ecu motor computador modulo de injecao" },
  { n: "Módulo de Injeção Delphi", c: "MC-ECU-2140", v: "Fiesta, Ka, EcoSport 2008–2017", t: "Injeção", s: "ecu motor computador modulo de injecao" },
  { n: "Módulo de Injeção Diesel", c: "MC-ECU-2288", v: "Hilux, S10, Ranger 2012–2020", t: "Injeção", s: "ecu motor computador diesel" },
  { n: "Módulo de Airbag SRS", c: "MC-SRS-3012", v: "Civic, Fit 2010–2016", t: "Airbag", s: "srs bolsa seguranca" },
  { n: "Módulo de Airbag Bosch", c: "MC-SRS-3064", v: "Corolla, Hilux 2012–2019", t: "Airbag", s: "srs bolsa seguranca" },
  { n: "Módulo de Carroceria BCM", c: "MC-BCM-4021", v: "Sandero, Logan, Duster 2012–2019", t: "Carroceria", s: "bcm body conforto central" },
  { n: "Módulo de Conforto", c: "MC-BCM-4105", v: "Onix, Cruze 2013–2018", t: "Carroceria", s: "bcm body conforto central" },
  { n: "Módulo de Câmbio Automático", c: "MC-TCU-5008", v: "Cruze, Tracker 2012–2020", t: "Câmbio", s: "tcu transmissao automatico cambio" },
  { n: "Módulo de Câmbio Automatizado", c: "MC-TCU-5036", v: "Palio, Punto, Siena Dualogic 2008–2016", t: "Câmbio", s: "tcu transmissao automatizado cambio dualogic" },
  { n: "Módulo de Direção Elétrica", c: "MC-EPS-6017", v: "Fiesta, Ka, Sandero 2010–2018", t: "Direção", s: "eps direcao eletrica assistida" },
  { n: "Módulo de Direção Elétrica", c: "MC-EPS-6044", v: "Palio, Argo, Mobi 2012–2020", t: "Direção", s: "eps direcao eletrica assistida" }
];

// [texto, nome, cargo] — exemplos, troque pelas avaliações reais no modo de edição.
export const REVIEWS = [
  ["Peça chegou certinha, código conferido e carro voltou a funcionar no mesmo dia. Atendimento excelente.", "Ricardo M.", "Oficina mecânica"],
  ["Já comprei três módulos aqui. Embalagem reforçada, entrega rápida e o suporte responde na hora.", "Fernanda L.", "Auto elétrica"],
  ["Me ajudaram a achar o módulo do meu Gol só com o modelo e o ano. Confiança total.", "Carlos E.", "Cliente particular"],
  ["Procedência é o que mais pesa pra mim, e aqui eu sei exatamente o que estou recebendo.", "Anderson P.", "Mecânico autônomo"],
  ["Preço justo e atendimento direto no WhatsApp. Resolveram meu ABS sem enrolação.", "Juliana S.", "Cliente particular"],
  ["Indico para todos os colegas de oficina. Catálogo organizado e peças de qualidade.", "Marcelo T.", "Oficina de injeção"],
  ["Tirei todas as dúvidas antes de comprar e o módulo veio funcionando perfeitamente.", "Patrícia R.", "Cliente particular"]
];

export const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";
