/*! Capsule v0.5.0 | Copyright 2022 Yoshiya Hinosawa and Capsule contributors | MIT license */
import { documentReady, logEvent } from "./util.ts";

interface Initializer {
  (el: Element): void;
  /** The elector for the component */
  sel: string;
}
interface RegistryType {
  [key: string]: Initializer;
}
interface EventRegistry {
  outside: {
    [key: string]: EventHandler;
  };
  // deno-lint-ignore ban-types
  [key: string]: EventHandler | {};
  (selector: string): {
    [key: string]: EventHandler;
  };
}
interface ComponentResult {
  on: EventRegistry;
  is(name: string): void;
  sub(type: string): void;
  innerHTML(html: string): void;
}

interface ComponentEventContext {
  /** The event */
  e: Event;
  /** The element */
  el: Element;
  /** Queries elements by the given selector under the component dom */
  query<T extends Element = Element>(selector: string): T | null;
  /** Queries all elements by the given selector under the component dom */
  queryAll<T extends Element = Element>(selector: string): NodeListOf<T>;
  /** Publishes the event. Events are delivered to elements which have `sub:event` class.
   * The dispatched events don't bubbles up */
  pub<T = unknown>(name: string, data?: T): void;
  /** Emits the event. The event bubbles up from the component dom */
  emit<T = unknown>(name: string, data?: T): void;
}

type EventHandler = (el: ComponentEventContext) => void;

/** The registry of component initializers. */
const registry: RegistryType = {};

/**
 * Asserts the given condition holds, otherwise throws.
 * @param assertion The assertion expression
 * @param message The assertion message
 */
function assert(assertion: boolean, message: string): void {
  if (!assertion) {
    throw new Error(message);
  }
}

/** Asserts the given name is a valid component name.
 * @param name The component name */
function assertComponentNameIsValid(name: unknown): void {
  assert(typeof name === "string", "The name should be a string");
  assert(
    !!registry[name as string],
    `The component of the given name is not registered: ${name}`,
  );
}

export function component(name: string): ComponentResult {
  assert(
    typeof name === "string" && !!name,
    "Component name must be a non-empty string",
  );
  assert(
    !registry[name],
    `The component of the given name is already registered: ${name}`,
  );

  const initClass = `${name}-💊`;

  // Hooks for mount phase
  const hooks: EventHandler[] = [({ el }) => {
    // FIXME(kt3k): the below can be written as .add(name, initClass)
    // when deno_dom fixes add class.
    el.classList.add(name);
    el.classList.add(initClass);
    el.addEventListener(`__ummount__:${name}`, () => {
      el.classList.remove(initClass);
    }, { once: true });
  }];
  const mountHooks: EventHandler[] = [];

  /** Initializes the html element by the given configuration. */
  const initializer = (el: Element) => {
    if (!el.classList.contains(initClass)) {
      const e = new CustomEvent("__mount__", { bubbles: false });
      const ctx = createEventContext(e, el);
      // Initialize `before mount` hooks
      // This includes:
      // - initialization of event handlers
      // - initialization of innerHTML
      // - initialization of class names (is, sub)
      hooks.map((cb) => {
        cb(ctx);
      });
      // Execute __mount__ hooks
      mountHooks.map((cb) => {
        cb(ctx)
      });
    }
  };

  // The selector
  initializer.sel = `.${name}:not(.${initClass})`;

  registry[name] = initializer;

  documentReady().then(() => {
    mount(name);
  });

  // deno-lint-ignore no-explicit-any
  const on: any = new Proxy(() => {}, {
    set(_: unknown, type: string, value: unknown): boolean {
      // deno-lint-ignore no-explicit-any
      return addEventBindHook(name, hooks, mountHooks, type, value as any);
    },
    get(_: unknown, outside: string) {
      if (outside === "outside") {
        return new Proxy({}, {
          set(_: unknown, type: string, value: unknown): boolean {
            assert(
              typeof value === "function",
              `Event handler must be a function, ${typeof value} (${value}) is given`,
            );
            hooks.push(({ el }) => {
              const listener = (e: Event) => {
                // deno-lint-ignore no-explicit-any
                if (el !== e.target && !el.contains(e.target as any)) {
                  logEvent({
                    module: "outside",
                    color: "#39cccc",
                    e,
                    component: name,
                  });
                  (value as EventHandler)(createEventContext(e, el));
                }
              };
              document.addEventListener(type, listener);
              el.addEventListener(`__unmount__:${name}`, () => {
                document.removeEventListener(type, listener);
              }, { once: true });
            });
            return true;
          },
        });
      }
      return null;
    },
    apply(_target, _thisArg, args) {
      const selector = args[0];
      assert(
        typeof selector === "string",
        "Delegation selector must be a string. ${typeof selector} is given.",
      );
      return new Proxy({}, {
        set(_: unknown, type: string, value: unknown): boolean {
          return addEventBindHook(
            name,
            hooks,
            mountHooks,
            type,
            // deno-lint-ignore no-explicit-any
            value as any,
            selector,
          );
        },
      });
    },
  });

  const is = (name: string) => {
    hooks.push(({ el }) => {
      el.classList.add(name);
    });
  };
  const sub = (type: string) => is(`sub:${type}`);
  const innerHTML = (html: string) => {
    hooks.push(({ el }) => {
      el.innerHTML = html;
    });
  };

  return { on, is, sub, innerHTML };
}

function createEventContext(e: Event, el: Element): ComponentEventContext {
  return {
    e,
    el,
    query: (s: string) => el.querySelector(s),
    queryAll: (s: string) => el.querySelectorAll(s),
    pub: (type: string, data?: unknown) => {
      document.querySelectorAll(`.sub\\:${type}`).forEach((el) => {
        el.dispatchEvent(
          new CustomEvent(type, { bubbles: false, detail: data }),
        );
      });
    },
    emit: (type: string, data?: unknown) => {
      el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: data }));
    },
  };
}

function addEventBindHook(
  name: string,
  hooks: EventHandler[],
  mountHooks: EventHandler[],
  type: string,
  handler: (ctx: ComponentEventContext) => void,
  selector?: string,
): boolean {
  assert(
    typeof handler === "function",
    `Event handler must be a function, ${typeof handler} (${handler}) is given`,
  );
  if (type === "__mount__") {
    mountHooks.push(handler);
    return true;
  }
  if (type === "__unmount__") {
    hooks.push(({ el }) => {
      el.addEventListener(`__unmount__:${name}`, () => {
        handler(createEventContext(new CustomEvent("__unmount__"), el));
      }, { once: true });
    });
    return true;
  }
  hooks.push(({ el }) => {
    const listener = (e: Event) => {
      if (
        !selector ||
        [].some.call(
          el.querySelectorAll(selector),
          (node: Node) => node === e.target || node.contains(e.target as Node),
        )
      ) {
        logEvent({
          module: "💊",
          color: "#e0407b",
          e,
          component: name,
        });
        handler(createEventContext(e, el));
      }
    };
    el.addEventListener(`__unmount__:${name}`, () => {
      el.removeEventListener(type, listener);
    }, { once: true });
    el.addEventListener(type, listener);
  });
  return true;
}

export function mount(name?: string | null, el?: Element) {
  let classNames: string[];

  if (!name) {
    classNames = Object.keys(registry);
  } else {
    assertComponentNameIsValid(name);

    classNames = [name];
  }

  classNames.map((className) => {
    [].map.call(
      (el || document).querySelectorAll(registry[className].sel),
      registry[className],
    );
  });
}

export function unmount(name: string, el: Element) {
  assert(
    !!registry[name],
    `The component of the given name is not registered: ${name}`,
  );
  el.dispatchEvent(new CustomEvent(`__unmount__:${name}`));
}
