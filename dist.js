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
    const initializer = (el)=>{
        if (!el.classList.contains(initClass)) {
            const e = new CustomEvent("__mount__", {
                bubbles: false
            });
            const ctx = createEventContext(e, el);
            hooks.forEach((cb)=>{
                cb(ctx);
            });
            el.dispatchEvent(e);
        }
    };
    initializer.sel = `.${name1}:not(.${initClass})`;
    registry[name1] = initializer;
    documentReady().then(()=>{
        prep(name1);
    });
    const on = new Proxy({}, {
        set (_obj, type, value) {
            assert(typeof value === "function", `Event handler must be a function, ${typeof value} (${value}) is given`);
            hooks.push(createEventBindHook(type, value));
            return true;
        },
        get (_obj, type) {
            return new Proxy({}, {
                set (_obj, selector, value) {
                    assert(typeof value === "function", `Event handler must be a function, ${typeof value} (${value}) is given`);
                    hooks.push(createEventBindHook(type, value, selector));
                    return true;
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
        pub: (type, v, selector)=>{
            const s = selector ?? `.sub\\:${type}`;
            document.querySelectorAll(s).forEach((el)=>{
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
function createEventBindHook(type, handler, selector) {
    return ({ el  })=>{
        const listener = (e)=>{
            if (!selector || [].some.call(el.querySelectorAll(selector), (node)=>node === e.target || node.contains(e.target)
            )) {
                handler(createEventContext(e, el));
            }
        };
        listener.remove = ()=>{
            el.removeEventListener(type, listener);
        };
        el.addEventListener(type, listener);
    };
}
function prep(name, el) {
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
globalThis.capsule = {
    component,
    prep
};
export { component as component };
export { prep as prep };

