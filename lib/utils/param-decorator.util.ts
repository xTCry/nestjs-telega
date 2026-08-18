import { assignMetadata, PipeTransform, Type } from '@nestjs/common';
import { TelegrafParamtype } from '../enums/telegraf-paramtype.enum';
import { PARAM_ARGS_METADATA } from '../telegraf.constants';

export type ParamData = object | string | number;
type ParamDecoratorData = string | Type<PipeTransform> | PipeTransform;

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
  (
    data?: ParamDecoratorData,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
  ): ParameterDecorator =>
  (target, key, index) => {
    if (key === undefined) {
      return;
    }

    addPipesMetadata(paramtype, data, pipes, target, key, index);
  };

export const addPipesMetadata = (
  paramtype: TelegrafParamtype,
  data: ParamDecoratorData | undefined,
  pipes: (Type<PipeTransform> | PipeTransform)[],
  target: object,
  key: string | symbol,
  index: number,
) => {
  const args =
    Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
  const hasParamData = typeof data === 'string';
  const paramData = hasParamData ? data : undefined;
  const paramPipes = hasParamData
    ? pipes
    : data === undefined
      ? pipes
      : [data, ...pipes];

  Reflect.defineMetadata(
    PARAM_ARGS_METADATA,
    assignMetadata(args, paramtype, index, paramData, ...paramPipes),
    target.constructor,
    key,
  );
};
