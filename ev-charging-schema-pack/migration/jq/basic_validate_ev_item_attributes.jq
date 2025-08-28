# Lightweight sanity checks for EV item attributes.
def check_required(item):
  ( item["beckn:attributes"]["ev:connectorType"] // empty ) as $conn
  | ( item["beckn:attributes"]["ev:currentType"] // empty ) as $curr
  | ( item["beckn:attributes"]["ev:maxPowerKW"]  // empty ) as $pwr
  | if ($conn|type) == "null" or ($curr|type) == "null" or ($pwr|type) == "null" then
      error("Missing required EV attributes: ev:connectorType/ev:currentType/ev:maxPowerKW in item " + (item["beckn:id"] // "UNKNOWN"))
    else
      item
    end
;

.catalogs[]["beckn:items"][] | check_required(.) | empty
