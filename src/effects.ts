import { merge, Observable, of, Subject } from 'rxjs';
import { catchError, filter, takeUntil, tap } from 'rxjs/operators';

/**
 * Action creator interface - has a `type` property and is callable
 */
export interface ActionCreator<A = any> {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (payload?: any): A;
}

/**
 * Options for createEffect
 */
export interface EffectOptions {
  dispatch?: boolean;
}

/**
 * ofType filter - accepts action creators, extracts their `.type` for filtering
 * Usage: action$.pipe(ofType(actionCreator1, actionCreator2))
 */
export function ofType<A>(
  ...actionCreators: ActionCreator<A>[]
): (action$: Observable<A>) => Observable<A> {
  return (action$: Observable<A>): Observable<A> => {
    return action$.pipe(
      filter((action): action is A =>
        actionCreators.some((creator) => creator.type === (action as any).type),
      ),
    );
  };
}

/**
 * createEffect - factory pattern for creating effects
 * Usage: createEffect()(action$ => action$.pipe(ofType(...), switchMap(...)))
 */
export function createEffect<A = any>(
  options: EffectOptions = { dispatch: true },
) {
  return (
    effectFactory: (action$: Observable<A>) => Observable<A>,
  ): ((action$: Observable<A>) => Observable<A>) => {
    return (action$: Observable<A>): Observable<A> => {
      const mappedEffect$: Observable<A> = effectFactory(action$);

      if (!options.dispatch) {
        return mappedEffect$.pipe(
          tap(() => {
            /* side effect only */
          }),
          catchError((error) => {
            console.error('[Effect] Error:', error);
            return of();
          }),
        );
      }

      return mappedEffect$.pipe(
        catchError((error) => {
          console.error('[Effect] Error:', error);
          return of();
        }),
      );
    };
  };
}

/**
 * createSubscriptionEffect - for subscription-style effects with auto-takeUntil
 * Usage: createSubscriptionEffect(destroy$)(action$ => action$.pipe(...))
 */
export function createSubscriptionEffect(destroy$: Subject<void>) {
  return <A>(
    effectFactory: (action$: Observable<A>) => Observable<A>,
  ): ((action$: Observable<A>) => Observable<A>) => {
    return (action$: Observable<A>): Observable<A> => {
      return effectFactory(action$).pipe(
        takeUntil(destroy$),
        catchError((error) => {
          console.error('[Effect] Error:', error);
          return of();
        }),
      );
    };
  };
}

/**
 * EpicFn type - the function signature for an epic
 * Compatible with the epic$ option in createStore
 */
export type EpicFn<State, A> = (
  action$: Observable<A>,
  state$: Observable<State>,
) => Observable<A>;

/**
 * createEpicRegistry - combines multiple effects into a single epic
 * Usage: epic$ = createEpicRegistry(effect1, effect2, effect3)
 */
export function createEpicRegistry<State, A>(
  ...effects: Array<(action$: Observable<A>) => Observable<A>>
): EpicFn<State, A> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (action$, _state$): Observable<A> => {
    return merge(...effects.map((effect) => effect(action$)));
  };
}

/**
 * createEffectRegistry - alias for createEpicRegistry for semantic clarity
 * When using epic$ with createStore, effects are automatically wired together
 */
export { createEpicRegistry as createEffectRegistry };