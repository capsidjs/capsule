// util.ts
var READY_STATE_CHANGE = "readystatechange";
var p;
function documentReady() {
  return p = p || new Promise((resolve) => {
    const doc = document;
    const checkReady = () => {
      if (doc.readyState === "complete") {
        resolve();
        doc.removeEventListener(READY_STATE_CHANGE, checkReady);
      }
    };
    doc.addEventListener(READY_STATE_CHANGE, checkReady);
    checkReady();
  });
}
var boldColor = (color) => `color: ${color}; font-weight: bold;`;
var defaultEventColor = "#f012be";
function logEvent({
  component: component2,
  e,
  module,
  color
}) {
  if (typeof __DEV__ === "boolean" && !__DEV__)
    return;
  const event = e.type;
  console.groupCollapsed(
    `${module}> %c${event}%c on %c${component2}`,
    boldColor(color || defaultEventColor),
    "",
    boldColor("#1a80cc")
  );
  console.log(e);
  if (e.target) {
    console.log(e.target);
  }
  console.groupEnd();
}

// mod.ts
var registry = {};
function assert(assertion, message) {
  if (!assertion) {
    throw new Error(message);
  }
}
function assertComponentNameIsValid(name) {
  assert(typeof name === "string", "The name should be a string");
  assert(
    !!registry[name],
    `The component of the given name is not registered: ${name}`
  );
}
function component(name) {
  assert(
    typeof name === "string" && !!name,
    "Component name must be a non-empty string"
  );
  assert(
    !registry[name],
    `The component of the given name is already registered: ${name}`
  );
  const initClass = `${name}-\u{1F48A}`;
  const hooks = [({ el }) => {
    el.classList.add(name);
    el.classList.add(initClass);
    el.addEventListener(`__ummount__:${name}`, () => {
      el.classList.remove(initClass);
    }, { once: true });
  }];
  const mountHooks = [];
  const initializer = (el) => {
    if (!el.classList.contains(initClass)) {
      const e = new CustomEvent("__mount__", { bubbles: false });
      const ctx = createEventContext(e, el);
      hooks.map((cb) => {
        cb(ctx);
      });
      mountHooks.map((cb) => {
        cb(ctx);
      });
    }
  };
  initializer.sel = `.${name}:not(.${initClass})`;
  registry[name] = initializer;
  documentReady().then(() => {
    mount(name);
  });
  const on = new Proxy(() => {
  }, {
    set(_, type, value) {
      return addEventBindHook(name, hooks, mountHooks, type, value);
    },
    get(_, outside) {
      if (outside === "outside") {
        return new Proxy({}, {
          set(_2, type, value) {
            assert(
              typeof value === "function",
              `Event handler must be a function, ${typeof value} (${value}) is given`
            );
            hooks.push(({ el }) => {
              const listener = (e) => {
                if (el !== e.target && !el.contains(e.target)) {
                  logEvent({
                    module: "outside",
                    color: "#39cccc",
                    e,
                    component: name
                  });
                  value(createEventContext(e, el));
                }
              };
              document.addEventListener(type, listener);
              el.addEventListener(`__unmount__:${name}`, () => {
                document.removeEventListener(type, listener);
              }, { once: true });
            });
            return true;
          }
        });
      }
      return null;
    },
    apply(_target, _thisArg, args) {
      const selector = args[0];
      assert(
        typeof selector === "string",
        "Delegation selector must be a string. ${typeof selector} is given."
      );
      return new Proxy({}, {
        set(_, type, value) {
          return addEventBindHook(
            name,
            hooks,
            mountHooks,
            type,
            // deno-lint-ignore no-explicit-any
            value,
            selector
          );
        }
      });
    }
  });
  const is = (name2) => {
    hooks.push(({ el }) => {
      el.classList.add(name2);
    });
  };
  const sub = (type) => is(`sub:${type}`);
  const innerHTML = (html) => {
    hooks.push(({ el }) => {
      el.innerHTML = html;
    });
  };
  return { on, is, sub, innerHTML };
}
function createEventContext(e, el) {
  return {
    e,
    el,
    query: (s) => el.querySelector(s),
    queryAll: (s) => el.querySelectorAll(s),
    pub: (type, data) => {
      document.querySelectorAll(`.sub\\:${type}`).forEach((el2) => {
        el2.dispatchEvent(
          new CustomEvent(type, { bubbles: false, detail: data })
        );
      });
    }
  };
}
function addEventBindHook(name, hooks, mountHooks, type, handler, selector) {
  assert(
    typeof handler === "function",
    `Event handler must be a function, ${typeof handler} (${handler}) is given`
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
    const listener = (e) => {
      if (!selector || [].some.call(
        el.querySelectorAll(selector),
        (node) => node === e.target || node.contains(e.target)
      )) {
        logEvent({
          module: "\u{1F48A}",
          color: "#e0407b",
          e,
          component: name
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
function mount(name, el) {
  let classNames;
  if (!name) {
    classNames = Object.keys(registry);
  } else {
    assertComponentNameIsValid(name);
    classNames = [name];
  }
  classNames.map((className) => {
    [].map.call(
      (el || document).querySelectorAll(registry[className].sel),
      registry[className]
    );
  });
}
function unmount(name, el) {
  assert(
    !!registry[name],
    `The component of the given name is not registered: ${name}`
  );
  el.dispatchEvent(new CustomEvent(`__unmount__:${name}`));
}
export {
  component,
  mount,
  unmount
};
/*! Capsule v0.6.0 | Copyright 2022 Yoshiya Hinosawa and Capsule contributors | MIT license */
