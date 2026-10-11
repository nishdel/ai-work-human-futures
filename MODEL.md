# Model and provenance

An **illustrative scenario explorer, not a validated forecast**. Outputs are conditional on author assumptions; no slider is a measured probability.

Model **3.0.0**, career method **1.0.0**, evidence snapshot **2026-10-11**.

## Slider meanings and directions

All sliders run from 0 to 100. Pace settings shift assumed dates; they are not measured growth rates. Every slider has its own on-page **Explain** link and return link.

### Technology

| Slider | Left (0) | Right (100) | Meaning and effect of moving right |
|---|---|---|---|
| How quickly AI's thinking skills improve | Slower progress | Faster progress | Reasoning, coding, planning and understanding. Moves cognitive and downstream reliability/deployment dates earlier. |
| How soon AI can work reliably without supervision | Needs frequent help | Reliable on longer tasks | Finishing multi-step work, checking results and recovering from mistakes. Moves reliability and downstream deployment dates earlier. |
| How much AI speeds up AI research | Little acceleration | Strong acceleration | AI helping researchers develop better AI. Advances capability milestones in proportion to each domain's AI research sensitivity. |
| Growth of AI computing, power and data resources | Slower expansion | Faster expansion | Useful chips, electricity, data centres, data and efficiency. Advances cognitive and robot milestones, with downstream deployment effects. |
| How quickly robots improve at physical work | Slower progress | Faster progress | Handling objects, moving and working outside a computer. Advances the physical contribution to technical capability and substitution. |
| Shortages limiting AI and robot deployment | Few shortages | Severe shortages | Limits in chips, electricity, materials, factories and investment. Higher values delay cognitive, reliability, robotics and deployment dates. |
| How quickly workplaces put AI into use | Slow rollout | Fast rollout | Integrating AI into tools, training and everyday workflows. Higher values advance actual substitution; technical capability is unchanged. |
| Deployment barriers: rules, liability and trust | Lower barriers | Higher barriers | Requirements and acceptance barriers before deployment. Higher values delay deployment, especially in regulated domains; technical capability is unchanged. |
| How strongly people want humans involved | Less human involvement demanded | More human involvement demanded | Continued demand for human care, teaching, authority or accountability. Higher values can lower the ceiling on actual substitution; technical capability is unchanged. |
| How much new work for people appears | Little new human work | More new human work | New activities as older tasks become automated. Higher values increase remaining human work; capability and current-task substitution are unchanged. |

### Society

These eight sliders affect social scenario scores only, never technology curves. “Raises” and “lowers” below describe the raw scores before normalization, not measured probabilities.

| Slider | Left (0) | Right (100) | Meaning and effect of moving right |
|---|---|---|---|
| Control and safety of advanced AI | Weaker control and safety | Stronger control and safety | Robust monitoring, correction and security. Raises shared, human-centered, oligarchic and authoritarian scores; lowers chaotic and loss-of-control scores. |
| Who owns productive AI | Concentrated ownership | Broad ownership | How widely households, workers or public institutions share ownership. Raises shared and human-centered scores; lowers oligarchic and authoritarian scores. |
| Sharing through services or dividends | Less sharing | More sharing | How gains are shared through services, benefits and dividends. Raises shared and human-centered scores; lowers oligarchic and chaotic scores. |
| Public accountability | Weaker accountability | Stronger accountability | Rights, transparency, courts and public voice. Raises shared and human-centered scores; lowers oligarchic, authoritarian and loss-of-control scores. |
| Support during changes in work | Little transition support | Extensive transition support | Learning, insurance and practical help through job transitions. Raises shared and human-centered scores; lowers chaotic and loss-of-control scores. |
| Community and purposeful activity | Fewer community institutions | More community institutions | Opportunities for care, art, education and civic participation. Raises shared and human-centered scores. |
| Surveillance and coercion | Less surveillance and coercion | More surveillance and coercion | The concentration of monitoring and coercive power. Raises oligarchic and authoritarian scores; lowers shared and human-centered scores. |
| International coordination | Weak coordination | Strong coordination | Shared standards, reporting and evaluations across borders. Raises the shared score; lowers authoritarian, chaotic and loss-of-control scores. |

## Domain model

The retained model has 15 domains and illustrative work-hour weights summing to 100. Each domain combines logistic cognitive capability, reliability and embodiment curves. Technical capability is the product of these factors and an assumed ceiling. Actual substitution multiplies technical capability by adoption, capped by human-presence demand. Remaining human work is `1 − actual + actual × (newTasks / 100) × 0.30`.

For a year `y`, each curve is `L((y − midpoint) / width)`, where `L(z) = 1 / (1 + exp(−z))`. Technical share is `maxAuto × cognitive × reliability × (digitalShare + physicalShare × robotics)`. Actual share is the smaller of `technical × adoption` and `maxAuto × (1 − 0.55 × domainPreference × humanPref / 100)`. Global shares sum domain shares multiplied by their work-hour weights.

Midpoints are linear shifts from domain-specific dates. For example, with `n(v) = (v − 50) / 50`, cognitive midpoint is `domain.cog − 8n(capability) − 3n(compute) − 4((feedback − 35)/65) × domain.ai + 3n(supply)`, plus sampled perturbations. Reliability and adoption build on those shifted dates; robotics has its own midpoint. Exact coefficients, widths, ceilings and domain weights are in [src/model.js](src/model.js), especially `computeParams` and `domainValues`. They are assumptions, not fitted or validated estimates. The horizon is 2026–2100 in annual steps.

The uncertainty calculation preserves 240 Mulberry32-seeded paths (default seed 418762), including original domain and global perturbations. Continuous 10/50/90% quantiles match the numeric baseline for all six presets. These ranges describe this model's paths, not validated forecast coverage.

### Version 3 censoring correction

The old engine used 2105 as an internal non-attainment sentinel and linearly interpolated it in date quantiles. Version 3 uses Infinity internally and nearest-rank empirical date quantiles. Thus a non-event cannot become a fabricated year. The median of an even sample can differ from the previous interpolated midpoint. Curves, coefficients and preset values are unchanged.

Sensitivity first uses the 25% remaining-work threshold, then the 80% weighted substitution threshold if the first is not attained. If both are unachieved, it explicitly switches to actual substitution in 2035 and reports percentage-point changes. A missing threshold is never subtracted as a year.

## Social outcome calculation

The six raw branch scores are weighted linear combinations of social settings divided by 100 and a technology-speed index. Speed is `(capability + reliability + feedback + compute + robotics + adoption + 100 − supply + 100 − regulation) / 800`. The human-centered score also uses human preference and new tasks; the loss-of-control score includes research feedback; the chaotic score also includes supply shortages.

The app converts scores to weights with `exp((score − maxScore) / 1.15) / sum(exp((allScores − maxScore) / 1.15))`. These weights sum to 1 but are **not probabilities**. Living standards, equality, autonomy, meaning, stability, safety and skill-retention bars are weighted averages of fixed, author-assumed branch values. Exact score coefficients and branch values are in [src/charts.js](src/charts.js), `computeOutcomeWeights` and `outcomeScenarios`, and the score equations are expandable in the on-page method section. No social result is statistically calibrated.

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

## Limitations

Domain descriptions are qualitative model interpretations, not independently established forecasts. Illustrative work-hour weights are not official employment shares. The model omits prices, wages, demand feedback, retraining costs, regional differences, war, pandemics, climate shocks and abrupt discontinuities. Fixed task mappings cannot describe every job. A 10–90% band measures variation among these simulated paths, not real-world coverage; “Not by 2100” means the threshold was not reached within the horizon, not never.

## State and performance

The app debounces technology input, calculates eight simulation paths per batch, yields to the browser, discards stale computations and keeps an eight-entry cache. Profile and social changes never trigger this global simulation. No worker or runtime AI is required. Errors retain the last valid charts. The status identifies updating versus completed results.

Version-3 exports identify schema, model, career and evidence versions, assumptions, planning year, timeline options, seed and preset origin. They exclude personal answers by default. Imports reject unknown keys, oversized input, non-finite/out-of-range values, unsupported versions and invalid structures before mutation. Valid v2 assumptions keep their original scale; obsolete private preparation fields are discarded with a visible migration notice. Unsupported model replay is explicitly rejected.
