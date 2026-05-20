import { Observable, Subject } from 'rxjs';
/**
 * Action creator interface - has a `type` property and is callable
 */
export interface ActionCreator<A = any> {
    type: string;
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
export declare function ofType<A>(...actionCreators: ActionCreator<A>[]): (action$: Observable<A>) => Observable<A>;
/**
 * createEffect - factory pattern for creating effects
 * Usage: createEffect()(action$ => action$.pipe(ofType(...), switchMap(...)))
 */
export declare function createEffect<A = any>(options?: EffectOptions): (effectFactory: (action$: Observable<A>) => Observable<A>) => ((action$: Observable<A>) => Observable<A>);
/**
 * createSubscriptionEffect - for subscription-style effects with auto-takeUntil
 * Usage: createSubscriptionEffect(destroy$)(action$ => action$.pipe(...))
 */
export declare function createSubscriptionEffect(destroy$: Subject<void>): <A>(effectFactory: (action$: Observable<A>) => Observable<A>) => ((action$: Observable<A>) => Observable<A>);
/**
 * EpicFn type - the function signature for an epic
 * Compatible with the epic$ option in createStore
 */
export type EpicFn<State, A> = (action$: Observable<A>, state$: Observable<State>) => Observable<A>;
/**
 * createEpicRegistry - combines multiple effects into a single epic
 * Usage: epic$ = createEpicRegistry(effect1, effect2, effect3)
 */
export declare function createEpicRegistry<State, A>(...effects: Array<(action$: Observable<A>) => Observable<A>>): EpicFn<State, A>;
/**
 * createEffectRegistry - alias for createEpicRegistry for semantic clarity
 * When using epic$ with createStore, effects are automatically wired together
 */
export { createEpicRegistry as createEffectRegistry };
