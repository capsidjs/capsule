// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const READY_STATE_CHANGE = "readystatechange";
let p;
function documentReady() {
    return p = p || new Promise((resolve)=>{
        const doc = document;
        const checkReady = ()=>{
            if (doc.readyState === "complete") {
                resolve();
                doc.removeEventListener(READY_STATE_CHANGE, checkReady);
            }
        };
        doc.addEventListener(READY_STATE_CHANGE, checkReady);
        checkReady();
    });
}
const boldColor = (color)=>`color: ${color}; font-weight: bold;`
;
const defaultEventColor = "#f012be";
function logEvent({ component: component1 , e , module , color  }) {
    if (typeof __DEV__ === "boolean" && !__DEV__) return;
    const event = e.type;
    console.groupCollapsed(`${module}> %c${event}%c on %c${component1}`, boldColor(color || defaultEventColor), "", boldColor("#1a80cc"));
    console.log(e);
    if (e.target) {
        console.log(e.target);
    }
    console.groupEnd();
}
const registry = {};
function assert(assertion, message) {
    if (!assertion) {
        throw new Error(message);
    }
}
function assertComponentNameIsValid(name) {
    assert(typeof name === "string", "The name should be a string");
    assert(!!registry[name], `The component of the given name is not registered: ${name}`);
}
function component(name1) {
    assert(typeof name1 === "string" && !!name1, "Component name must be a non-empty string");
    assert(!registry[name1], `The component of the given name is already registered: ${name1}`);
    const initClass = `${name1}-💊`;
    const hooks = [
        ({ el  })=>{
            el.classList.add(name1);
            el.classList.add(initClass);
            el.addEventListener(`__ummount__:${name1}`, ()=>{
                el.classList.remove(initClass);
            }, {
                once: true
            });
        }
    ];
    const mountHooks = [];
    const initializer = (el)=>{
        if (!el.classList.contains(initClass)) {
            const e = new CustomEvent("__mount__", {
                bubbles: false
            });
            const ctx = createEventContext(e, el);
            hooks.map((cb)=>{
                cb(ctx);
            });
            mountHooks.map((cb)=>{
                cb(ctx);
            });
        }
    };
    initializer.sel = `.${name1}:not(.${initClass})`;
    registry[name1] = initializer;
    documentReady().then(()=>{
        mount(name1);
    });
    const on = new Proxy(()=>{}, {
        set (_, type, value) {
            return addEventBindHook(name1, hooks, mountHooks, type, value);
        },
        get (_, outside) {
            if (outside === "outside") {
                return new Proxy({}, {
                    set (_, type, value) {
                        assert(typeof value === "function", `Event handler must be a function, ${typeof value} (${value}) is given`);
                        hooks.push(({ el  })=>{
                            const listener = (e)=>{
                                if (el !== e.target && !el.contains(e.target)) {
                                    logEvent({
                                        module: "outside",
                                        color: "#39cccc",
                                        e,
                                        component: name1
                                    });
                                    value(createEventContext(e, el));
                                }
                            };
                            document.addEventListener(type, listener);
                            el.addEventListener(`__unmount__:${name1}`, ()=>{
                                document.removeEventListener(type, listener);
                            }, {
                                once: true
                            });
                        });
                        return true;
                    }
                });
            }
            return null;
        },
        apply (_target, _thisArg, args) {
            const selector = args[0];
            assert(typeof selector === "string", "Delegation selector must be a string. ${typeof selector} is given.");
            return new Proxy({}, {
                set (_, type, value) {
                    return addEventBindHook(name1, hooks, mountHooks, type, value, selector);
                }
            });
        }
    });
    const is = (name)=>{
        hooks.push(({ el  })=>{
            el.classList.add(name);
        });
    };
    const sub = (type)=>is(`sub:${type}`)
    ;
    const innerHTML = (html)=>{
        hooks.push(({ el  })=>{
            el.innerHTML = html;
        });
    };
    return {
        on,
        is,
        sub,
        innerHTML
    };
}
function createEventContext(e, el1) {
    return {
        e,
        el: el1,
        query: (s)=>el1.querySelector(s)
        ,
        queryAll: (s)=>el1.querySelectorAll(s)
        ,
        pub: (type, data)=>{
            document.querySelectorAll(`.sub\\:${type}`).forEach((el)=>{
                el.dispatchEvent(new CustomEvent(type, {
                    bubbles: false,
                    detail: data
                }));
            });
        },
        emit: (type, data)=>{
            el1.dispatchEvent(new CustomEvent(type, {
                bubbles: true,
                detail: data
            }));
        }
    };
}
function addEventBindHook(name, hooks, mountHooks, type, handler, selector) {
    assert(typeof handler === "function", `Event handler must be a function, ${typeof handler} (${handler}) is given`);
    if (type === "__mount__") {
        mountHooks.push(handler);
        return true;
    }
    if (type === "__unmount__") {
        hooks.push(({ el  })=>{
            el.addEventListener(`__unmount__:${name}`, ()=>{
                handler(createEventContext(new CustomEvent("__unmount__"), el));
            }, {
                once: true
            });
        });
        return true;
    }
    hooks.push(({ el  })=>{
        const listener = (e)=>{
            if (!selector || [].some.call(el.querySelectorAll(selector), (node)=>node === e.target || node.contains(e.target)
            )) {
                logEvent({
                    module: "💊",
                    color: "#e0407b",
                    e,
                    component: name
                });
                handler(createEventContext(e, el));
            }
        };
        el.addEventListener(`__unmount__:${name}`, ()=>{
            el.removeEventListener(type, listener);
        }, {
            once: true
        });
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
        classNames = [
            name
        ];
    }
    classNames.map((className)=>{
        [].map.call((el || document).querySelectorAll(registry[className].sel), registry[className]);
    });
}
function unmount(name, el) {
    assert(!!registry[name], `The component of the given name is not registered: ${name}`);
    el.dispatchEvent(new CustomEvent(`__unmount__:${name}`));
}
export { component as component };
export { mount as mount };
export { unmount as unmount };

