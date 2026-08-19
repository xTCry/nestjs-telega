export type MetadataTarget = object | Function;

/** Декоратор с доступным для discovery ключом metadata. */
export type CustomDecorator<TKey extends string = string> = MethodDecorator &
  ClassDecorator & { KEY: TKey };

/** Добавляет metadata к методу, не затирая metadata предыдущих декораторов. */
export const appendMetadata = <TKey extends string, TValue>(
  metadataKey: TKey,
  metadataValue: TValue,
): CustomDecorator<TKey> => {
  const decoratorFactory = (
    target: MetadataTarget,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<Function>,
  ) => {
    if (descriptor?.value) {
      const previousValue = Reflect.getMetadata(metadataKey, descriptor.value);
      const values = Array.isArray(previousValue) ? previousValue : [];

      Reflect.defineMetadata(
        metadataKey,
        [...values, metadataValue],
        descriptor.value,
      );
      return descriptor;
    }

    Reflect.defineMetadata(metadataKey, metadataValue, target);
    return target;
  };

  decoratorFactory.KEY = metadataKey;
  return decoratorFactory as CustomDecorator<TKey>;
};
