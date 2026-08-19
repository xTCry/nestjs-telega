import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ListenerMetadata,
  SceneMetadata,
  WizardStepMetadata,
} from '../interfaces';
import {
  COMPOSER_METADATA,
  LISTENERS_METADATA,
  SCENE_ENTER_METADATA,
  SCENE_LEAVE_METADATA,
  SCENE_METADATA,
  UPDATE_METADATA,
  WIZARD_STEP_METADATA,
} from '../telegraf.constants';

@Injectable()
export class MetadataAccessorService {
  constructor(private readonly reflector: Reflector) {}

  isComposer(target: Function): boolean {
    if (!target) return false;
    return !!this.reflector.get(COMPOSER_METADATA, target);
  }

  isUpdate(target: Function): boolean {
    if (!target) return false;
    return !!this.reflector.get(UPDATE_METADATA, target);
  }

  isScene(target: Function): boolean {
    if (!target) return false;
    return !!this.reflector.get(SCENE_METADATA, target);
  }

  getListenerMetadata(target: Function): ListenerMetadata[] | undefined {
    return this.reflector.get(LISTENERS_METADATA, target);
  }

  getSceneMetadata(target: Function): SceneMetadata | undefined {
    return this.reflector.get(SCENE_METADATA, target);
  }

  isSceneEnter(target: Function): boolean {
    return !!this.reflector.get(SCENE_ENTER_METADATA, target);
  }

  isSceneLeave(target: Function): boolean {
    return !!this.reflector.get(SCENE_LEAVE_METADATA, target);
  }

  getWizardStepMetadata(target: Function): WizardStepMetadata | undefined {
    return this.reflector.get(WIZARD_STEP_METADATA, target);
  }
}
