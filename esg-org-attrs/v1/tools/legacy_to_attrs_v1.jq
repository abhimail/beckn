def normbool: if . == true or . == "true" or . == "True" then true else false end;
def toNumberOrSelf: try (tonumber) catch .;

def providerAttributes($root):
{
  "@context": "https://schema.example.org/mixed/esg-org-attrs/v1/context.jsonld",
  "@type": "org:ProviderAttributes",
  legalName: ($root.descriptor.name // null),
  alternateName: ($root.descriptor.alternateName // null),
  website: ($root.descriptor.website // null),
  industry: ($root.descriptor.industry // null),
  classification: ({} + 
    (if $root.descriptor.industryClassification then {industryClassification:$root.descriptor.industryClassification} else {} end) +
    (if $root.descriptor.industryCode then {industryCode:$root.descriptor.industryCode} else {} end) +
    (if $root.descriptor.industryName then {industryName:$root.descriptor.industryName} else {} end)),
  yearOfIncorporation: ($root.descriptor.yearOfIncorporation // null),
  identifiers: {
    leiNumber: ($root.tags.leiNumber // null),
    gstNumber: ($root.tags.gstNumber // null),
    isin: ($root.tags.isin // null),
    cusip: ($root.tags.cusip // null)
  }
};

def itemToMetricAttrs($it):
{
  "@context": "https://schema.example.org/mixed/esg-org-attrs/v1/context.jsonld",
  "@type": "esg:MetricAttributes",
  metricId: ($it.id // $it.tags.metricName // null),
  groupName: ($it.tags.groupName // []),
  metricName: ($it.descriptor.name // $it.tags.metricName),
  description: ($it.tags.desc // null),
  value: ($it.tags.value | toNumberOrSelf),
  unit: ($it.tags.unit // null),
  source: ($it.tags.source // null),
  methodology: ($it.tags.methodology // null),
  reportingPeriod: {
    start: ($it.tags.reportingPeriodStart // null),
    end:   ($it.tags.reportingPeriodEnd // null)
  },
  scenario: ($it.tags.scenario // null),
  verification: {
    status: ( $it.tags.verificationStatus | normbool ),
    by: ($it.tags.verificationBy // null),
    standard: ($it.tags.verificationStandard // null)
  },
  entity: ($it.tags.entity // {})
};

{
  providerAttributes: providerAttributes(.),
  items: (.items // []) | map({
    id: .id,
    descriptor: .descriptor,
    itemAttributes: (itemToMetricAttrs(.))
  })
}
