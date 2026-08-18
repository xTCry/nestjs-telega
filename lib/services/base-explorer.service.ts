import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

export class BaseExplorerService {
  getModules(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    if (!include || include.length === 0) {
      return [...modulesContainer.values()];
    }
    return this.includeWhitelisted(modulesContainer, include);
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    const modules = [...modulesContainer.values()];
    return modules.filter(({ metatype }) => include.includes(metatype));
  }

  flatMap<T>(
    modules: Module[],
    callback: (
      instance: InstanceWrapper,
      moduleRef: Module,
    ) => T | T[] | undefined,
  ): T[] {
    const visitedModules = new Set<Module>();

    const unwrap = (moduleRef: Module): T[] => {
      // Защита от циклических imports при обходе Nest-модулей.
      if (visitedModules.has(moduleRef)) {
        return [];
      }
      visitedModules.add(moduleRef);

      const providers = [...moduleRef.providers.values()];
      const defined = providers.flatMap((wrapper) => {
        const result = callback(wrapper, moduleRef);

        if (result === undefined) {
          return [];
        }

        return Array.isArray(result) ? result : [result];
      });

      const imported = [...moduleRef.imports.values()].flatMap(unwrap);

      return [...defined, ...imported];
    };

    return modules.flatMap(unwrap);
  }
}
