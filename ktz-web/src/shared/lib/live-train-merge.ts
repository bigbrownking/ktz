import type { MapTrain } from '@/shared/lib/fleet-data';
import type { BackendHealthFactor } from '@/shared/lib/backend-types';
import type { TelemetryData } from '@/shared/lib/mock-data';

/**
 * Для локомотива, совпадающего с кабиной (TelemetryContext / ktz_loco_number),
 * подставляем живые health/speed/fuel и факторы, если с карты ещё не пришли.
 */
export function mergeMapTrainWithTelemetry(
  train: MapTrain,
  telemetryLoco: string,
  telemetry: TelemetryData,
): MapTrain {
  if (train.locomotiveNumber !== telemetryLoco) return train;

  const factorsFromTel: BackendHealthFactor[] | undefined =
    telemetry.healthFactors.length > 0
      ? telemetry.healthFactors.map(f => ({
          paramName: f.name,
          label: f.name,
          rawValue: f.value,
          penalty: 0,
          weight: f.weight * 100,
          contribution: f.contribution,
          status: (f.status === 'good' ? 'OK' : f.status === 'warning' ? 'WARN' : 'CRIT') as BackendHealthFactor['status'],
          description: '',
        }))
      : undefined;

  const recsFromTel =
    telemetry.recommendations.length > 0
      ? telemetry.recommendations.map(r => r.description)
      : undefined;

  return {
    ...train,
    health: telemetry.health,
    healthCategory: telemetry.healthCategory,
    speed: telemetry.speed,
    fuelLevel: telemetry.locomotiveType === 'KZ8A' ? train.fuelLevel : telemetry.fuelLevel,
    healthFactors: train.healthFactors?.length ? train.healthFactors : factorsFromTel,
    healthRecommendations: train.healthRecommendations?.length ? train.healthRecommendations : recsFromTel,
  };
}
