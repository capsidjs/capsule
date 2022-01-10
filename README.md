<img src="https://raw.githubusercontent.com/capsidjs/capsule/master/capsule-logo.svg" width="70" alt="capsule" />

# Capsule v0.1.0

> Event-driven DOM programming in a new style

# Features

- Supports **event-driven** style of frontend programming in a **new way**.
- **Lightweight** library. **1.1 kb** gzipped. **No dependencies**. **No build**
  steps.
- Uses **plain JavaScript** and **plain HTML**, requires **No special syntax**.
- **TypeScript** friendly.

[See live examples](https://capsidjs.github.io/capsule/)

# Motivation

Virtual DOM frameworks are good for many use cases, but sometimes they are
overkill for the use cases where you only need a little bit of event handlers
and dom modifications.

This `capsule` library explores the new way of simple event-driven DOM
programming without virtual dom.

# Slogans

- Local query is good. Global query is bad.
- Define behaviors based on HTML classes.
- Use pubsub when making remote effect.

## Local query is good. Global query is bad

When people use jQuery, they often do:

```js
$(".some-class").each(function () {
  $(this).on("some-event", () => {
    $(".some-target").each(function () {
      // some effects on this element
    });
  });
});
```

This is very common pattern, and this is very bad.

The above code can been seen as a behavior of `.some-class` elements, and they
use global query `$(".some-target")`. Because they use global query here, they
depend on the entire DOM tree of the page. If the page change anything in it,
the behavior of the above code can potentially be changed.

This is so unpredictable because any change in the page can affect the behavior
of the above class. You can predict what happens with the above code only when
you understand every details of the entire application, and that's often
impossible when the application is large size, and multiple people working on
that app.

So how to fix this? We recommend you should use **local** queries.

Let's see this example:

```js
$(".some-class").each(function () {
  $(this).on("some-event", () => {
    $(this).find(".some-target").each(function () {
      // some effects on this element
    });
  });
});
```

The difference is `$(this).find(".some-target")` part. This selects the elements
only under each `.some-class` element. So this code only depends on the elements
inside it, which means there is no global dependencies here.

`capsule` enforces this pattern by providing `query` function to event handlers
which only finds elements under the given element.

```js
const { on } = component("some-class");

on.click = ({ query }) => {
  query(".some-target").textContent = "clicked";
};
```

Here `query` is the alias of `el.querySelector` and it finds `.some-target` only
under it. So the dependency is **local** here.

## Define behaviors based on HTML classes

From our observation, skilled jQuery developers always define DOM behaviors
based on HTML classes.

We borrowed this pattern, and `capsule` allows you to define behavior only based
on HTML classes, not random combination of query selectors.

```html
<div class="hello">John Doe</div>
```

```js
const { on } = component("hello");

on.__mount__ = () => {
  alert(`Hello, I'm ${el.textContext}!`); // Alerts "Hello, I'm John Doe!"
};
```

## Use pubsub when making remote effect

We generally recommend using only local queries, but how to make effects to the
remote elements?

We reommend using pubsub pattern here. By using this pattern, you can decouple
those affecting and affected elements. If you decouple those elements, you can
test those components independently by using events as I/O of those components.

`capsule` library provides `pub` and `sub` APIs for encouraging this pattern.

```js
const EVENT = "my-event";
{
  const { on } = component("publisher");

  on.click = ({ pub }) => {
    pub(EVENT);
  };
}

{
  const { on, sub } = component("subscriber");

  sub(EVENT);

  on[EVENT] = () => {
    alert(`Got ${EVENT}!`);
  };
}
```

Note: `capsule` uses DOM Event as event payload, and `sub:EVENT` HTML class as
registration to the event. When `pub(EVENT)` is called the CustomEvent of
`EVENT` type are dispatched to the elements which have `sub:EVENT` class.

# Install

Vanilla js:

```html
<script type="module">
import { component } from "https://deno.land/x/capsule/dist.js";
// ... your code
</script>
```

Deno:

```js
import { component } from "https://deno.land/x/capsule@0.1.0/mod.ts";
```

Via npm:

```
npm install @kt3k/capsule
```

and

```js
import { component } from "@kt3k/capsule";
```

# Examples

Mirrors input value of `<input>` element to another dom.

```js
import { component } from "https://deno.land/x/capsule@v0.1.0/mod.ts";

const { on } = component("mirroring");

on.input = ({ query }) => {
  query(".src").textContent = query(".dest").value;
};
```

Pubsub.

```js
import { component } from "https://deno.land/x/capsule@v0.1.0/mod.ts";

const EVENT = "my-event";

{
  const { on } = component("pub-element");

  on.click = ({ pub }) => {
    pub(EVENT, { hello: "world!" });
  };
}

{
  const { on, sub } = component("sub-element");

  sub(EVENT);

  on[EVENT] = ({ e }) => {
    console.log(e.detail.hello); // => world!
  };
}
```

Bubbling events.

```js
import { component } from "https://deno.land/x/capsule@v0.1.0/mod.ts";

const { on } = component("my-component");

const EVENT = "my-event";

on.click = ({ emit }) => {
  // dispatch CustomEvent of type "my-event"
  // and it bubbles up.
  emit(EVENT);

  // dispatch CustomEvent of type "my-event"
  // with details = { foo: "bar" };
  // and it bubbles up.
  emit(EVENT, { foo: "bar" }); // dispatch
};
```

Mount hooks.

```js
import { component } from "https://deno.land/x/capsule@0.1.0/mod.ts";

const { on } = component("my-component");

// __mount__ handler is called when the component mounts to the elements.
on.__mount__ = () => {
  console.log("hello, I'm mounted");
};
```

Prevent default, stop propagation.

```js
import { component } from "https://deno.land/x/capsule@0.1.0/mod.ts";

const { on } = component("my-component");

on.click = ({ e }) => {
  // e is the native event object.
  // You can call methods of Event object
  e.stopPropagation();
  e.preventDefault();
  console.log("hello, I'm mounted");
};
```

Event delegation. You can assign handlers to `on(selector).event` to use
[event delegation](https://www.geeksforgeeks.org/event-delegation-in-javascript/)
pattern.

```js
import { component } from "https://deno.land/x/capsule@0.1.0/mod.ts";

const { on } = component("my-component");

on(".btn").click = ({ e }) => {
  console.log(".btn is clicked!");
};
```

# API reference

```
const { component, prep } from "https://deno.land/x/capsule@v0.1.0/mod.ts";
```

## `component(name): ComponentResult`

This registers the component of the given name. This returns a `ComponentResult`
which has the followin shape.

```ts
interface ComponentResult {
  on;
  is;
  sub;
  innerHTML;
}
```

## `component().on[eventName] = EventHandler`

## `component().on(selector)[eventName] = EventHandler`

## `component().is(name: string): void`

## `component().innerHTML(html: string): void`

## `component().sub(name: string): void`

## `EventHandler`

The event handler in `capsule` has the following signature. The first argument
is `EventHandlerContext`, not `Event`.

```ts
type EventHandler = (ctx: EventHandlerContext) => void;
```

## `EventHandlerContext`

```ts
interface EventHandlerContext {
  e: Event;
  el: Element;
  emit<T = unknown>(name: string, data: T): void;
  pub<T = unknown>(name: string, data: T): void;
  query(selector: string): Element | null;
  queryAll(selector: string): NodeListOf<Element> | null;
}
```

`e` is the native DOM Event. You can call APIs like `.preventDefault()` or
`.stopPropagation()` via this object.

`el` is the DOM Element, which the event handler is bound to, and the event is
dispatched on.

`emit(type)` dispatches the event on this DOM Element. The event bubbles up. So
the parent component can handle those events. If you'd like to communicate with
the parent elements, then use this method to send information to parent
elements.

You can optionally attach data to the event. The attached data is available via
`.detail` property of `CustomEvent` object.

`pub(type)` dispatches the event to the remote elements which have `sub:type`
class. For example:

```
pub("my-event")
```

This call dispatches `new CustomEvent("my-type")` to the elements which have
`sub:my-type` class, like `<div class="sub:my-type"></div>`. The event doesn't
bubbles up.

This method is for communicating with the remote elements which aren't in
parent-child relationship.

## `prep(name?: string, dom?: Element): void`

This function initializes the elements with the given configuration. `component`
call itself initializes the component of the given class name automatically when
document got ready, but if elements are added after the initial page load, you
need to call this method explicitly to initialize capsule's event handlers.

```js
// Initializes the all components in the entire page.
prep();

// Initializes only "my-component" components in the entire page.
// You can use this when you only added "my-component" component.
prep("my-compnent");

// Initializes the all components only in `myDom` element.
// You can use this when you only added something under `myDom`.
prep(null, myDom);

// Initializes only "my-component" components only in `myDom` element.
// You can use this when you only added "my-component" under `myDom`.
prep("my-component", myDom);
```

# License

MIT

# Prior art

- [capsid](https://github.com/capsidjs/capsid)
  - This library is heavily inspired by capsid.

# Projects with similar concepts

- [Flight](https://flightjs.github.io/) by twitter
  - Not under active development
- [eddy.js](https://github.com/WebReflection/eddy)
  - Archived
