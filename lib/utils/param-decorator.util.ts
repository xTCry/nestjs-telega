import { assignMetadata, ParamData, PipeTransform, Type } from '@nestjs/common';
import { isNil, isObject, isString } from '@nestjs/common/utils/shared.utils';

import { TelegrafParamtype } from '../enums/telegraf-paramtype.enum';
import { PARAM_ARGS_METADATA } from '../telegraf.constants';

type TelegrafPipe = Type<PipeTransform> | PipeTransform;
type ParamDecoratorData = ParamData | TelegrafPipe;
type ParameterDecoratorTarget = object & { constructor: Function };

export const createTelegrafParamDecorator =
  (paramtype: TelegrafParamtype) =>
  (data?: ParamData): ParameterDecorator =>
  (target, key, index) => {
    if (key === undefined) {
      return;
    }

    const args =
      Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
    Reflect.defineMetadata(
      PARAM_ARGS_METADATA,
      assignMetadata(args, paramtype, index, data),
      target.constructor,
      key,
    );
  };

export const createTelegrafPipesParamDecorator =
  (paramtype: TelegrafParamtype) =>
  (data?: ParamDecoratorData, ...pipes: TelegrafPipe[]): ParameterDecorator =>
  (target, key, index) => {
    if (key === undefined) {
      return;
    }

    addPipesMetadata(paramtype, data, pipes, target, key, index);
  };

export const addPipesMetadata = (
  paramtype: TelegrafParamtype,
  data: ParamDecoratorData | undefined,
  pipes: TelegrafPipe[],
  target: ParameterDecoratorTarget,
  key: string | symbol,
  index: number,
) => {
  const args =
    Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
  const hasParamData =
    isNil(data) || isString(data) || typeof data === 'number';
  const paramData = hasParamData ? data : undefined;
  const paramPipes: TelegrafPipe[] =
    hasParamData || data === undefined
      ? pipes
      : isObject(data) && 'transform' in data
        ? [data as TelegrafPipe, ...pipes]
        : pipes;

  Reflect.defineMetadata(
    PARAM_ARGS_METADATA,
    assignMetadata(args, paramtype, index, paramData, ...paramPipes),
    target.constructor,
    key,
  );
};
