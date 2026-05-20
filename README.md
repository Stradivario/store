# Reactive state container

## Install

#### `npm i rxjs ts-action reselect @reactive-redux/store`

## Examples

### Basic Store

```typescript
import { of, Subject } from 'rxjs';
import { createStore } from '@reactive-redux/store';
import { action, on, payload, reducer } from "ts-action";

const actionQ = new Subject<ActionsUnion>();

const increment = action("Increment", payload<{ value: number }>());
const decrement = action("Decrement", payload<{ value: number }>());

interface State {
  value: number;
}

const initialState: State = { value: 0 };

const { state$ } = createStore<State, ActionsUnion>({
  actionStream$: actionQ.asObservable(),
  reducer$: of(reducer(initialState,
    on(increment, (state, { payload }) => ({ value: state.value + payload.value })),
    on(decrement, (state, { payload }) => ({ value: state.value - payload.value }))
  )),
  initialState$: of(initialState),
});

state$.subscribe(console.log);
actionQ.next(increment({ value: 1 }));
```

### Effects with `epic$`

The `epic$` option allows you to handle side effects (API calls, etc.) and dispatch new actions.

```typescript
import { createStore, ofType, createEffect, createEpicRegistry } from '@reactive-redux/store';

const fetchUserEffect$ = createEffect()(
  (action$) => action$.pipe(
    ofType(fetchUser),
    mergeMap(action =>
      userService.getUser(action.payload.id).pipe(
        map(user => fetchUserSuccess({ user })),
        catchError(error => of(fetchUserFailure({ error })))
      )
    )
  )
);

const store = createStore<AppState, ActionsUnion>({
  actionStream$,
  reducer$,
  initialState$,
  epic$: createEpicRegistry(fetchUserEffect$),
});
```

### Action Creators with `ofType`

```typescript
import { action, payload } from 'ts-action';

// Define actions
const login = action('LOGIN', payload<{ email: string; password: string }>());
const logout = action('LOGOUT');

// Use ofType to filter actions in effects
const authEffect$ = createEffect()(
  (action$) => action$.pipe(
    ofType(login),  // filters for LOGIN actions only
    mergeMap(({ payload }) =>
      authService.login(payload.email, payload.password).pipe(
        map(response => loginSuccess({ user: response.user })),
        catchError(error => of(loginFailure({ error })))
      )
    )
  )
);
```

### Subscription Effects with `createSubscriptionEffect`

For effects that need cleanup when the store is destroyed:

```typescript
import { Subject } from 'rxjs';

const destroy$ = new Subject<void>();

const websocketEffect$ = createSubscriptionEffect(destroy$)(
  (action$) => action$.pipe(
    ofType(connectWebsocket),
    switchMap(() =>
      websocket.connect().pipe(
        map(message => websocketMessageReceived({ message })),
        catchError(error => of(websocketError({ error })))
      )
    )
  )
);

// When destroying the store:
destroy$.next();
destroy$.complete();
```

### `epic$` with Multiple Effects

Use `createEpicRegistry` to combine multiple effects:

```typescript
const rootEpic = createEpicRegistry(
  authEffect$,
  userEffect$,
  websocketEffect$,
  // ... more effects
);

const store = createStore<AppState, ActionsUnion>({
  actionStream$,
  reducer$,
  initialState$,
  epic$: rootEpic,
  destroy$,
});
```

## API

### `createStore<State, ActionsUnion>(config, options)`

Creates a reactive store.

**Config options:**
- `actionStream$: Observable<ActionsUnion>` - Stream of actions
- `reducer$: Observable<ReducerFn<State, ActionsUnion>>` - Reducer observable
- `initialState$: Observable<State>` - Initial state observable
- `middleware$?: Observable<Middleware[]>` - Middleware
- `destroy$?: Observable<any>` - Destruction trigger
- `epic$?: EpicFn<State, ActionsUnion>` - Effects epic function

### `ofType<Action>(...actionCreators)`

Filters an action stream by action type(s).

### `createEffect(options?)`

Factory for creating effects. Options: `{ dispatch: true | false }`

### `createSubscriptionEffect(destroy$)`

Factory for subscription-style effects with auto `takeUntil(destroy$)`.

### `createEpicRegistry<State, Action>(...effects)`

Combines multiple effect functions into a single epic.

### `EpicFn<State, Action>`

Type definition for epic functions:
```typescript
(action$: Observable<Action>, state$: Observable<State>) => Observable<Action>
```

## Changelog

## Want to help?