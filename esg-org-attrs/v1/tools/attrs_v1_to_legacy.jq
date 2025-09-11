def verStr: if . then "True" else "False" end;

. as $root
| {
    becknid: ($root.providerAttributes.legalName // "provider:unknown"),
    descriptor: {
      name: ($root.providerAttributes.legalName // null),
      long_desc: null,
      website: $root.providerAttributes.website,
      industry: $root.providerAttributes.industry,
      industryClassification: ($root.providerAttributes.classification.industryClassification // null),
      yearOfIncorporation: $root.providerAttributes.yearOfIncorporation
    },
    tags: {
      leiNumber: $root.providerAttributes.identifiers.leiNumber,
      gstNumber: $root.providerAttributes.identifiers.gstNumber,
      isin: $root.providerAttributes.identifiers.isin,
      cusip: $root.providerAttributes.identifiers.cusip
    },
    items: ($root.items // []) | map({
      id, descriptor,
      tags: {
        groupName: (.itemAttributes.groupName // []),
        metricName: (.itemAttributes.metricName // null),
        desc: (.itemAttributes.description // null),
        value: (.itemAttributes.value),
        unit: (.itemAttributes.unit // null),
        source: (.itemAttributes.source // null),
        methodology: (.itemAttributes.methodology // null),
        reportingPeriodStart: (.itemAttributes.reportingPeriod.start // null),
        reportingPeriodEnd: (.itemAttributes.reportingPeriod.end // null),
        scenario: (.itemAttributes.scenario // null),
        verificationStatus: ((.itemAttributes.verification.status // false) | verStr),
        entity: (.itemAttributes.entity // {})
      }
    })
  }
