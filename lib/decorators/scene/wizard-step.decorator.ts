import { Reflector } from '@nestjs/core';

import { WizardStepMetadata } from '../../interfaces';

/** Внутренний reflectable decorator metadata шага wizard-сцены. */
export const WizardStepMetadataDecorator =
  Reflector.createDecorator<WizardStepMetadata>();

type WizardStepDecorator = (step: number) => MethodDecorator;

export const WizardStep: WizardStepDecorator = (
  step: number,
): MethodDecorator => WizardStepMetadataDecorator({ step });
