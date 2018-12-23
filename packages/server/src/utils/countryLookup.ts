import * as maxmind from "maxmind";

const ipCountryDb = maxmind.openSync<maxmind.CountryResponse>(
  `${__dirname}/../../data/ipLookupDb/GeoLite2-Country.mmdb`
);

export function countryLookup(ip: string): string | null {
  if (ipCountryDb.get(ip) && ipCountryDb.get(ip)!.country) {
    return ipCountryDb.get(ip)!.country!.names.en;
  } else {
    return null;
  }
}
