import { type LanguageModel, type LanguageModelV1GenerateResult, type LanguageModelV1StreamResult } from 'ai';
import { useAppStore } from '../../store';

/**
 * Wrap a Vercel AI SDK LanguageModel with health tracking.
 * Reports success/failure to the GatewayService for UI visualization.
 */
export function withHealthTracking(model: LanguageModel, gatewayId: string): LanguageModel {
  const store = useAppStore.getState();
  const gatewayService = store.gatewayService;

  if (!gatewayService) return model;

  const originalDoGenerate = model.doGenerate.bind(model);
  const originalDoStream = model.doStream.bind(model);

  model.doGenerate = async (...args) => {
    const startTime = Date.now();
    try {
      const result = await originalDoGenerate(...args);
      // Record success if we got a result without a permanent error
      // Note: We can't easily check HTTP status here, but exceptions usually mean failure
      recordGatewaySuccess(gatewayId, Date.now() - startTime);
      return result;
    } catch (err) {
      recordGatewayFailure(gatewayId, err);
      throw err;
    }
  };

  model.doStream = async (...args) => {
    const startTime = Date.now();
    try {
      const result = await originalDoStream(...args);
      // For streaming, we consider it a success once the stream starts
      recordGatewaySuccess(gatewayId, Date.now() - startTime);
      return result;
    } catch (err) {
      recordGatewayFailure(gatewayId, err);
      throw err;
    }
  };

  return model;
}

function recordGatewaySuccess(gatewayId: string, latencyMs: number) {
  const store = useAppStore.getState();
  const service = store.getGatewayService();
  // Accessing private method for tracking - we'll need to make it public or use an event
  (service as any).recordSuccess(gatewayId, latencyMs);
  // Trigger store update
  useAppStore.setState({ gatewayHealth: service.getHealth() });
}

function recordGatewayFailure(gatewayId: string, error: any) {
  const store = useAppStore.getState();
  const service = store.getGatewayService();
  (service as any).recordFailure(gatewayId);
  
  // Trigger store update
  const event = {
    type: 'failed' as const,
    gatewayId,
    gatewayLabel: gatewayId,
    message: `${gatewayId} failed`,
    error: error instanceof Error ? error.message : String(error),
  };
  useAppStore.setState({ 
    gatewayHealth: service.getHealth(),
    lastGatewayEvent: event
  });
}
