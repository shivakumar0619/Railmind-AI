# ADR-007: Simulation-Only AI with Adapter Pattern

## Status
Accepted

## Date
2026-07-05

## Context

RailMind AI includes AI-powered features (delay prediction, signal failure probability, capacity optimization, predictive maintenance). However, no trained machine learning models are available at launch. Presenting simulation outputs as real predictions would be misleading and potentially dangerous in a railway context.

The architecture must support future integration with real ML frameworks (scikit-learn, XGBoost, PyTorch) and LLM providers (OpenAI, Ollama) without changing business logic or frontend code.

## Decision

Implement an abstract `AIAdapter` interface with a concrete `SimulationAdapter` that provides rule-based heuristics. Every AI output includes a `source` field set to `"simulation"`, `"estimated"`, or `"experimental"`.

The frontend displays a prominent warning badge on all AI-generated content. No fabricated confidence percentages — use qualitative ranges ("low", "medium", "high") instead.

Future adapters (ScikitLearnAdapter, XGBoostAdapter, PyTorchAdapter, OpenAIAdapter, OllamaAdapter) implement the same interface and are registered in an adapter registry. Switching adapters requires only a configuration change.

## Consequences

### Positive
- Clear separation between AI interface and implementation
- Users are never misled about the nature of predictions
- Future ML backends plug in without business logic changes
- Adapter pattern enables A/B testing between prediction engines
- Registry pattern enables runtime adapter selection

### Negative
- Initial AI features are limited to rule-based heuristics
- Simulation outputs may not accurately represent real ML model behavior

### Risks
- Users misinterpreting simulation data as real predictions — mitigated by prominent UI labels, disclaimer text, and `source` field in API responses
