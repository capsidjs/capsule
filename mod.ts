/*! Capsule v0.1.0 | Copyright 2022 Yoshiya Hinosawa and Capsule contributors | MIT license */
import { documentReady } from "./util.ts";

interface Initializer {
  (el: Element): void;
  /** The elector for the component */
  sel: string;
}
interface RegistryType {
  [key: string]: Initializer;
}

interface ComponentResult {
  // TODO(kt3k): type this
  // deno-lint-ignore no-explicit-any
  on: any;
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
  query(selector: string): Element | null;
  /** Publishes the event. Events are delivered to elements which have `sub:event` class.
   * The dispatched events don't bubbles up */
  pub<T = unknown>(name: string, data: T): void;
  /** Emits the event. The event bubbles up from the component dom */
  emit<T = unknown>(name: string, data: T): void;
}

type Hook = (el: ComponentEventContext) => void;

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

  const initClass = `${name}-💊`;

  // Hooks for mount phase
  const hooks: Hook[] = [({ el }) => {
    // FIXME(kt3k): the below can be written as .add(name, initClass)
    // when deno_dom fixes add class.
    el.classList.add(name);
    el.classList.add(initClass);
  }];
  // Hooks for unmount phase
  const unmountHooks: Hook[] = [];

  /** Initializes the html element by the given configuration. */
  const initializer = (el: Element) => {
    if (!el.classList.contains(initClass)) {
      const e = new CustomEvent("__mount__", { bubbles: false });
      const ctx = createEventContext(e, el);
      // Initialize `before mount` hooks
      // This includes:
      // - initialization of event handlers
      // - initialization of innerHTML
      // - initialization of class names
      hooks.forEach((cb) => {
        cb(ctx);
      });
    }
  };

  // The selector
  initializer.sel = `.${name}:not(.${initClass})`;

  registry[name] = initializer;

  documentReady().then(() => {
    prep(name);
  });

  const on = new Proxy({}, {
    set(_obj: unknown, type: string, value: unknown): boolean {
      // deno-lint-ignore no-explicit-any
      return addEventBindHook(hooks, unmountHooks, type, value as any);
    },
    // deno-lint-ignore no-explicit-any
    get(_obj: unknown, type: string): any {
      return new Proxy({}, {
        set(_obj, selector: string, value: unknown): boolean {
          // deno-lint-ignore no-explicit-any
          return addEventBindHook(hooks, unmountHooks, type, value as any, selector);
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
    pub: (type: string, v: unknown) => {
      document.querySelectorAll(`.sub\\:${type}`).forEach((el) => {
        el.dispatchEvent(new CustomEvent(type, { bubbles: false, detail: v }));
      });
    },
    emit: (type: string, v: unknown) => {
      el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: v }));
    },
  };
}

function addEventBindHook(
  hooks: Hook[],
  unmountHooks: Hook[],
  type: string,
  handler: (ctx: ComponentEventContext) => void,
  selector?: string,
): boolean {
  assert(
    typeof handler === "function",
    `Event handler must be a function, ${typeof handler} (${handler}) is given`,
  );
  if (type === "__mount__") {
    hooks.push(handler);
    return true;
  }
  if (type === "__unmount__") {
    unmountHooks.push(handler);
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
        handler(createEventContext(e, el));
      }
    };
    unmountHooks.push(() => {
      el.removeEventListener(type, listener);
    });
    el.addEventListener(type, listener);
  });
  return true;
}

export function prep(name?: string | null, el?: Element) {
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

// deno-lint-ignore no-explicit-any
(globalThis as any).capsule = {
  component,
  prep,
};
