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
    const initClass = `${name1}-💊`;
    const hooks = [
        ({ el  })=>{
            el.classList.add(name1);
            el.classList.add(initClass);
        }
    ];
    const unmountHooks = [];
    const initializer = (el)=>{
        if (!el.classList.contains(initClass)) {
            const e = new CustomEvent("__mount__", {
                bubbles: false
            });
            const ctx = createEventContext(e, el);
            hooks.forEach((cb)=>{
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
            return addEventBindHook(name1, hooks, unmountHooks, type, value);
        },
        apply (_target, _thisArg, args) {
            const selector = args[0];
            assert(typeof selector === "string", "Delegation selector must be a string. ${typeof selector} is given.");
            return new Proxy({}, {
                set (_, type, value) {
                    return addEventBindHook(name1, hooks, unmountHooks, type, value, selector);
                }
            });
        },
        get (_, type) {
            return new Proxy({}, {
                set (_, selector, value) {
                    return addEventBindHook(name1, hooks, unmountHooks, type, value, selector);
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
        pub: (type, v)=>{
            document.querySelectorAll(`.sub\\:${type}`).forEach((el)=>{
                el.dispatchEvent(new CustomEvent(type, {
                    bubbles: false,
                    detail: v
                }));
            });
        },
        emit: (type, v)=>{
            el1.dispatchEvent(new CustomEvent(type, {
                bubbles: true,
                detail: v
            }));
        }
    };
}
function addEventBindHook(name, hooks, unmountHooks, type, handler, selector) {
    assert(typeof handler === "function", `Event handler must be a function, ${typeof handler} (${handler}) is given`);
    if (type === "__mount__") {
        hooks.push(handler);
        return true;
    }
    if (type === "__unmount__") {
        unmountHooks.push(handler);
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
        unmountHooks.push(()=>{
            el.removeEventListener(type, listener);
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
export { component as component };
export { mount as mount };

