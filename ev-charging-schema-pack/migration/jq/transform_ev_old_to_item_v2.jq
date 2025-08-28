# Input: an object with .catalog.providers[] like your sample
# Output: { catalogs: [ { "@type":"beckn:Catalog", "beckn:items":[ ... ] } ] }

def parseGps($gps):
  if ($gps // "" | test("^\\s*-?\\d+(\\.\\d+)?\\s*,\\s*-?\\d+(\\.\\d+)?\\s*$")) then
    ($gps | split(",") | map(gsub("^\\s+|\\s+$";""))) as $p
    | { "geo:lat": ($p[0]|tonumber), "geo:lng": ($p[1]|tonumber) }
  else {} end;

def fromTags($it; $code):
  ($it.tags // [])
  | map(select(.descriptor?.code == "Connector_Specifications"))
  | map(.list[]?)
  | flatten
  | map(select(.descriptor?.code == $code))
  | (if length>0 then .[0].value else null end);

def toUpperSafe:
  if type == "string" then ascii_upcase else . end;

def normAvail($v):
  ( ($v // "") | toUpperSafe )
  | if . == "AVAILABLE" then "AVAILABLE"
    elif . == "OCCUPIED" then "OCCUPIED"
    elif . == "OUT_OF_SERVICE" or . == "OUT OF SERVICE" then "OUT_OF_SERVICE"
    elif . == "" then null
    else "UNKNOWN" end;

def parsePowerKW($s):
  if ($s // null) == null then null
  else ($s | gsub("\\s+";"") | gsub("[kK][wW]$";"") | tonumber? ) end;

def priceCurrency($cur):
  # Handle "INR/kWh" -> "INR"
  if ($cur // null) == null then null
  else ($cur | split("/") | .[0]) end;

def priceUnit($cur):
  # Handle "INR/kWh" -> "PER_KWH"
  if ($cur // null) == null then null
  else (
    ($cur | ascii_downcase) as $c |
    if ($c | contains("/kwh")) then "PER_KWH"
    elif ($c | contains("/min")) then "PER_MINUTE"
    else null end
  ) end;

def providerLocationById($prov; $locId):
  ($prov.locations // [])
  | map(select(.id == $locId))
  | if length>0 then .[0] else {} end;

def toLocation($prov; $locId):
  providerLocationById($prov; $locId) as $L
  | (parseGps($L.gps)) as $g
  | {
      "@type": "schema:Place",
      "schema:address": ($L.address // $L.descriptor?.name // null)
    }
  + $g
  | with_entries(select(.value != null));

def itemLocations($prov; $it):
  ($it.location_ids // [])
  | map(toLocation($prov; .))
  | map(select(length>0));

def toItem($prov; $it):
  # extract from tags
  (fromTags($it; "Connector_Type")) as $connector
  | (fromTags($it; "Charger_Type"))   as $current
  | (fromTags($it; "Power_Rating"))   as $pwr
  | (fromTags($it; "Availability"))   as $avail
  | {
      "@context": "https://becknprotocol.io/schemas/core/v1/Item/schema-context.jsonld",
      "beckn:id": ($it.id // "UNKNOWN-STATION-ID"),
      "beckn:descriptor": {
        "@type": "beckn:Descriptor",
        "schema:name": ($it.descriptor?.name // $prov.descriptor?.name // "EV Charging")
      },
      "beckn:provider": {
        "beckn:id": ($prov.id // "unknown-provider"),
        "beckn:descriptor": { "schema:name": ($prov.descriptor?.name // "Unknown Provider") }
      },
      "beckn:locations": (itemLocations($prov; $it)),
      "beckn:attributes": (
        {
          "@type": "ev:EVCharging",
          "ev:stationId": ($it.id),
          "ev:connectorType": $connector,
          "ev:currentType": ($current | toUpperSafe),
          "ev:maxPowerKW": (parsePowerKW($pwr)),
          "ev:availability": (normAvail($avail)),
          "ev:openingHours": null,
          "ev:amenities": [],
          "ev:providerTags": []
        }
        + (
          # tariff: derive from price.value & price.currency ("INR/kWh")
          ($it.price // {}) as $price
          | if ($price|length) > 0 then
              {
                "ev:tariff": {
                  "@type": "ev:Tariff",
                  "schema:price": ( ($price.value // null) | (if type=="string" then tonumber? else . end) ),
                  "schema:priceCurrency": priceCurrency($price.currency),
                  "ev:pricingUnit": ( priceUnit($price.currency) // ($price.unit // null) )
                } | with_entries(select(.value != null))
              }
            else {} end
        )
      )
    }
  | with_entries(select(.value != null));

{
  "catalogs": [
    {
      "@type": "beckn:Catalog",
      "beckn:descriptor": {
        "@type": "beckn:Descriptor",
        "schema:name": (.catalog.descriptor?.name // "EV Catalog")
      },
      "beckn:items": (
        .catalog.providers[] as $p
        | ( ($p.items // [])[] | toItem($p; .) )
      )
    }
  ]
}