import { DestroyRef, effect, Injector, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type QueryValue = string | number;

export interface QueryBinding<T extends QueryValue = QueryValue> {
  signal: WritableSignal<T>;
  defaultValue: T;
  parse?: (value: string) => T;
  serialize?: (value: T) => string | null;
}

export type QueryBindings = Record<string, QueryBinding>;

/** Keeps filter/pagination signals and the current URL query string in sync. */
export function bindQueryState(
  route: ActivatedRoute,
  router: Router,
  injector: Injector,
  destroyRef: DestroyRef,
  bindings: QueryBindings,
): void {
  let writingUrl = false;

  const applyUrl = (): void => {
    const params = route.snapshot.queryParamMap;
    for (const [key, binding] of Object.entries(bindings)) {
      const raw = params.get(key);
      const next = raw === null
        ? binding.defaultValue
        : binding.parse?.(raw) ?? raw;
      binding.signal.set(next as never);
    }
  };

  applyUrl();
  const subscription = route.queryParamMap.subscribe(() => {
    if (!writingUrl) applyUrl();
  });
  destroyRef.onDestroy(() => subscription.unsubscribe());

  effect(() => {
    const queryParams: Record<string, string | null> = {};
    let changed = false;
    for (const [key, binding] of Object.entries(bindings)) {
      const value = binding.signal();
      const serialized = binding.serialize
        ? binding.serialize(value)
        : value === binding.defaultValue ? null : String(value);
      queryParams[key] = serialized;
      if ((route.snapshot.queryParamMap.get(key) ?? null) !== serialized) changed = true;
    }
    if (!changed) return;
    writingUrl = true;
    void router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).finally(() => { writingUrl = false; });
  }, { injector });
}

export const positiveInteger = (fallback: number, maximum = Number.MAX_SAFE_INTEGER) =>
  (value: string): number => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(maximum, Math.max(1, parsed)) : fallback;
  };

export const integer = (fallback: number) => (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
