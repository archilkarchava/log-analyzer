import * as maxmind from "maxmind";

export const countryLookup = maxmind.openSync<maxmind.CountryResponse>(
  `${__dirname}/../../data/ipLookupDb/GeoLite2-Country.mmdb`
);
