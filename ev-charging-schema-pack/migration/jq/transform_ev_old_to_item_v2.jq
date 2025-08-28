# Transforms an old-style EV object into Beckn V2 Catalog → Item (core + attributes).
# INPUT: an object resembling an old EV catalog or station record.
# OUTPUT: { catalogs: [ { "@type":"beckn:Catalog", "beckn:items":[ ... ] } ] }

def toLocations:
  [
    {
      "schema:address": (.. | objects | .address // .stationAddress // empty),
      "geo:lat": (.. | objects | .lat // .latitude // empty),
      "geo:lng": (.. | objects | .lng // .longitude // empty)
    }
  ]
  | map( with_entries(select(.value != null)) )
  | map(select(length>0));

def toAttributes:
  {
    "@context": "https://example.org/schema/items/v1/EVCharging/schema-context.jsonld",
    "@type": "beckn:EVChargingItem",
    "ev:connectorType": (.connectorType // .tags?.connectorType // .connector_type // "Other"),
    "ev:currentType":   (.currentType   // .powerType // .current_type // "DC"),
    "ev:maxPowerKW":    (.maxPowerKW    // .kw       // .powerKW     // 0),
    "ev:maxCurrentA":   (.maxCurrentA   // .currentA // empty),
    "ev:voltageV":      (.voltageV      // .voltage  // empty),
    "ev:availability":  (.availability  // .status   // "UNKNOWN"),
    "ev:slotsAvailable":(.slotsAvailable// .portsAvailable // .availablePorts // 0),
    "ev:tariff": (
      if (.tariff // .price // .pricing) then
        ({
          "schema:price": (.tariff.price // .price.value // .pricing.value // 0),
          "schema:priceCurrency": (.tariff.currency // .price.currency // .pricing.currency // "INR"),
          "ev:pricingUnit": (.tariff.unit // .pricing.unit // "PER_KWH")
        } + (if (.tariff.idlePerMin // .pricing.idlePerMin) then
               {"ev:idleFeePerMinute": (.tariff.idlePerMin // .pricing.idlePerMin)}
             else {} end))
      else {} end
    ),
    "ev:openingHours": (.openingHours // .hours // empty),
    "ev:amenities": (.amenities // []),
    "ev:providerTags": (.providerTags // [])
  }
  | with_entries(select(.value != null))
  ;

def toItem:
  {
    "@context": "https://becknprotocol.io/schemas/core/v1/Item/schema-context.jsonld",
    "beckn:id": (.stationId // .id // .identifier // "UNKNOWN-STATION-ID"),
    "beckn:descriptor": {
      "@type": "beckn:Descriptor",
      "schema:name": (.name // .stationName // "EV Charging Station")
    },
    "beckn:rating": (
      if (.ratingValue or .ratingCount) then
        {
          "beckn:ratingValue": (.ratingValue // 0),
          "beckn:ratingCount": (.ratingCount // 0)
        }
      else {} end
    ),
    "beckn:rateable": true,
    "beckn:networkId": ( [ .network_id ] | flatten | map(select(. != null)) | if length==0 then ["uei.energy/ev"] else . end ),
    "beckn:provider": (
      if (.providerId or .providerName) then
        {
          "beckn:id": (.providerId // "unknown-provider"),
          "beckn:descriptor": { "schema:name": (.providerName // "Unknown Provider") }
        } else {} end
    ),
    "beckn:locations": toLocations,
    "beckn:attributes": toAttributes
  }
  | with_entries(select(.value != null));

. as $root
| {
    "context": {
      "ts": (now | todateiso8601),
      "msgid": (uuidv4),
      "traceid": (uuidv4),
      "network_id": ([$root.network_id] | flatten | map(select(. != null)) | if length==0 then ["uei.energy/ev"] else . end)
    },
    "catalogs": [
      {
        "@type": "beckn:Catalog",
        "beckn:descriptor": { "@type": "beckn:Descriptor", "schema:name": ($root.catalogName // "EV Catalog") },
        "beckn:items": (
          if ($root | type) == "array" then
            map(toItem)
          elif ($root.stations // $root.items // $root.providers // null) then
            ($root.stations // $root.items // $root.providers) | map(toItem)
          else
            [ $root | toItem ]
          end
        )
      }
    ]
  }
