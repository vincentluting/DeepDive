# O\*NET 30.2 Database Attribution

This product includes information from the O\*NET 30.2 Database by the U.S.
Department of Labor, Employment and Training Administration (USDOL/ETA), used
under the Creative Commons Attribution 4.0 International License (CC BY 4.0).

- **Source**: https://www.onetcenter.org/
- **License**: https://creativecommons.org/licenses/by/4.0/
- **Database version**: 30.2 (released February 2026)
- **Downloaded**: 2026-05-18
- **Files retained**:
  - `Job Zones.txt` — O\*NET-SOC Code → Job Zone (2-5) mapping, 923 entries
  - `Occupation Data.txt` — O\*NET-SOC Code → title/description, 1016 entries
  - `Job Zone Reference.txt` — Definitions of Job Zones 2-5

## Modifications

Deep Dive uses the `Job Zone` field (2-5) to inform its career recommendation
algorithm. Specifically, the system applies a post-scoring penalty to careers
outside the user's target professional level band (default: Job Zone 4-5 for
the platform's primary white-collar audience), keeping cross-tier careers
visible in an "exploration" section rather than removing them.

No modifications are made to the underlying O\*NET data — the data is consumed
read-only and the SOC-code-to-Job-Zone mapping is preserved as-is.

## Re-download

To refresh to a newer O\*NET version:

```bash
curl -L -o data/onet-30.2/db_30_2_text.zip \
  https://www.onetcenter.org/dl_files/database/db_30_2_text.zip
unzip -j data/onet-30.2/db_30_2_text.zip \
  "db_30_2_text/Job Zones.txt" \
  "db_30_2_text/Occupation Data.txt" \
  "db_30_2_text/Job Zone Reference.txt" \
  -d data/onet-30.2/
```

Note: O*NET 30.2 merged historical Job Zones 1 and 2 into a single "Job Zone
1-2" category. The raw `Job Zones.txt` file contains values 2, 3, 4, 5 only.
The Deep Dive schema retains `CHECK ("jobZone" >= 1 AND "jobZone" <= 5)` for
forward compatibility with future O*NET versions and LLM-inferred edge cases.
