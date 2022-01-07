<img src="https://raw.githubusercontent.com/capsidjs/capsule/master/capsule-logo.svg" width="70" alt="capsule" />

# Capsule

> Event-driven DOM programming in a new style

# Features

- **Small** DOM programming library. **0.87 kb** gzipped
- Use **plain JavaScript**, **plain HTML**. **No special syntax**.
- **No dependencies**. **No build** steps.
- Support **event-driven** style of frontend programming in a **new way**.

# Motivation

Virtual DOM frameworks are good for many use cases, but sometimes they are
overkill for your use cases where you only need a little bit of event handlers
and dom modifications.

This `capsule` library explores simple event-driven DOM programming without
virtual dom in a new style.

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
only under each `.some-class` element. So this code only have effects under the
target of the event handler.

This is very good because `.some-class`'s event handler only affects the inside
of itself, which means the effect of the event handler is **local**. The effects
are closed inside of this class.

`capsule` enforces this pattern by providing `query` function to event handlers
which only finds elements under the given element.

```js
const { on } = component("some-class");

on.click = ({ query }) => {
  query(".some-target").textContent = "clicked";
};
```

Here query is the alias of `el.querySelector` and it finds `.some-target` only
under it. So the effect is **local** here.

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

Deno:

```js
import { component } from "https://deno.land/x/capsule/mod.ts";
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
import { component } from "https://deno.land/x/capsule/mod.ts";

const { on } = component("mirroring");

on.input = ({ query }) => {
  query(".src").textContent = query(".dest").value;
};
```

Pubsub.

```js
import { component } from "https://deno.land/x/capsule/mod.ts";

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
import { component } from "https://deno.land/x/capsule/mod.ts";

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
import { component } from "https://deno.land/x/capsule/mod.ts";

const { on } = component("my-component");

on.__mount__ = () => {
  console.log("hello, I'm mounted");
};
```

# API reference

## `component(name: string): ComponentResult`

## `ComponentResult.on[eventName]`

## `ComponentResult.on[eventName][selector]`

## `ComponentResult.on.mount`

## `ComponentResult.is(name: string): void`

## `ComponentResult.innerHTML(html: string): void`

## `ComponentResult.sub(name: string): void`

## `EventHandler`

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
}
```

## `prep(name?: string, dom?: Element): void`

# License

# Prior art

- [capsid](https://github.com/capsidjs/capsid)
  - This library is heavily inspired by capsid.

MIT
