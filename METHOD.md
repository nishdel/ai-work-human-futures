# Method and provenance

Model **3.0.0**, career method **1.0.0**, evidence snapshot **2026-10-11**.

## Domain model

The retained model has 15 domains and illustrative work-hour weights summing to 100. Each domain combines logistic cognitive capability, reliability and embodiment curves. Technical capability is the product of these factors and an assumed ceiling. Actual substitution multiplies technical capability by adoption, capped by human-presence demand. Remaining human work is `1 − actual + actual × (newTasks / 100) × 0.30`.

The ten controls retain their original directions and coefficients. Increasing capability, reliability, research feedback, compute or robotics advances affected milestones. Shortages delay capability and deployment. Adoption and regulation affect deployment, not technical capability. Human preference limits actual substitution when the ceiling binds. New tasks change remaining work, not current-task substitution. Pace settings shift dates, not measured doubling rates. All underlying numbers and social equations are author assumptions, not calibrated forecasts.

The uncertainty calculation preserves 240 Mulberry32-seeded paths (default seed 418762), including original domain and global perturbations. Continuous 10/50/90% quantiles match the numeric baseline for all six presets. These ranges describe this model's paths, not validated forecast coverage.

### Version 3 censoring correction

The old engine used 2105 as an internal non-attainment sentinel and linearly interpolated it in date quantiles. Version 3 uses Infinity internally and nearest-rank empirical date quantiles. Thus a non-event cannot become a fabricated year. The median of an even sample can differ from the previous interpolated midpoint. Curves, coefficients and preset values are unchanged.

Sensitivity first uses the 25% remaining-work threshold, then the 80% weighted substitution threshold if the first is not attained. If both are unachieved, it explicitly switches to actual substitution in 2035 and reports percentage-point changes. A missing threshold is never subtracted as a year.

## Career and preparation

Each archetype has three editable task groups mapped to existing domains. Weights are relative, normalized to 1. The exposure outputs are weighted sums of deterministic technical/actual domain values in the chosen year. A role title is only a starting point. Custom roles have no occupational-source coverage; visitors choose domains. Physical work, safety and regulation are already represented in domain curves and are not counted again as scoring bonuses.

Preparation is calculated independently of exposure:

| Component | Weight | Required |
|---|---:|---|
| Suitable AI use | 20% | Yes |
| Verification practices | 25% | Yes |
| Demonstrable transferable skills | 20% | Yes |
| Realistically available learning time | 20% | Yes |
| Optional buffer band, in months of essential expenses | 10% | No |
| Optional access to support | 5% | No |

Answer options and scores (0/25/50/75/100) are explicit author assumptions in `src/data.js`. Missing required answers withhold preparation and resilience. Missing optional answers are excluded from the denominator, so the four required components alone use total base weight 0.85. A genuine zero answer remains zero.

`Resilience = round(0.75 × preparedness + 0.25 × 100 × (1 − actual exposure))`

All required answers of 50 with optional answers omitted give preparation 50. At actual exposure 60%, resilience is round(37.5 + 10) = 48. A person with preparation 0 cannot receive more than 25 from a low-exposure role. A prepared person may still face high exposure. No score is an employment probability, guarantee, statistical confidence interval, measure of worth, or hiring recommendation.

Actions rank preparation gaps multiplied by their declared base weights, plus a role-task review weighted by modeled substitution. Unanswered components are treated as exploratory suggestions, not assumed deficits. The three highest suggestions include the chosen role or task context. Optional resource answers are never inferred from a role. The unscored note never influences arithmetic or recommendations.

## Sources

The role table in `src/data.js` links 17 verified O*NET-SOC identifiers to O*NET OnLine summaries, accessed 11 October 2026. Its current database catalog is 31.0, but the exact publication date of each living summary is not asserted. Scope is U.S. occupational description, with no Germany-specific or universal employment adjustment. Introductions are short adaptations; task groups, shares and domain mappings are author assumptions. No time shares were inferred from task importance or frequency.

The ILO [2025 exposure index](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) (20 May 2025) and [explanation](https://www.ilo.org/resource/article/generative-ai-work-what-it-means-jobs-europe-and-beyond) (29 September 2025) inform the distinction between task exposure and replacement. Their numerical occupational scores are not used here. ESCO is not bundled or claimed as a source.

The [METR controlled developer study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) (10 July 2025) is included as historical evidence about the gap between benchmarks and workplace productivity. It is not generalized to every developer or current tools; the card notes the source's later follow-up.

All three cards retain original publication dates, review dates, source links, evidence type and limitations. No separate event date is invented. Every card's model impact is “No change”. Unsupported original headline benchmark numbers were removed.

## State and performance

The app debounces technology input, calculates eight simulation paths per batch, yields to the browser, discards stale computations and keeps an eight-entry cache. Profile and social changes never trigger this global simulation. No worker or runtime AI is required. Errors retain the last valid charts. The status identifies updating versus completed results.

Version-3 exports identify schema, model, career and evidence versions, assumptions, planning year, timeline options, seed and preset origin. They exclude personal answers by default. Imports reject unknown keys, oversized input, non-finite/out-of-range values, unsupported versions and invalid structures before mutation. Valid v2 assumptions keep their original scale; obsolete private preparation fields are discarded with a visible migration notice. Unsupported model replay is explicitly rejected.
