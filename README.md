# Capsule

> Event-driven DOM programming in a new style

# Features

- **Small** DOM programming library. < **1.1 kb** gzipped
- Use **plain JavaScript**, **plain HTML**. **No special syntax**.
- **No dependencies**. **No build** steps.
- Support **event-driven** style of frontend programming in a **new way**.

# Slogans

- Local query is good. Global query is bad.
- Define behaviors based on HTML classes.
- Use pubsub when making remote effect.

## Local query is good. Global query is bad

When people use jQuery, they often do:

```
$(".some-class").each(function () {
  $(this).on("some-event", () => {
    $("some-random-query").each(function () {
      // some random effect on this element
    });
  });
});
```

This is very common pattern, and this is very bad.

The above code can been seen as a behavior of `.some-class` elements, and they
use global query `$(query)`. Because they use global query here, they depends on
the entire DOM tree of the page. If the page change anything in it, the behavior
of the above code can potentially change.

This behavior of this code is so unprectable because in a single page any event
handler can change anything in a page, and the combination of those change can
be infinitely complex.

To make this code more predictable, you should use local query.

```js
$(".some-class").each(function () {
  $(this).on("some-event", () => {
    $(this).find("some-random-query").each(function () {
      // some random effect on this element
    });
  });
});
```

The difference is `$(this).find("some-random-query")` part. This selects the
elements only under each `.some-class` element. So this code only have effect
under each target of event handler.

This is very good because `.some-class`'s event handler only affects the inside
of itself.

`capsule` enforces this pattern by providing `find` function which only finds
elements under the given element.

## Define behaviors based on HTML classes

## Use pubsub when making remote effect

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

Mirrors input value to other dom.

```js
import { component } from "https://deno.land/x/capsule/mod.ts";

const { on, query } = component("mirroring");

on.input = (e, { query }) => {
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
  const { sub } = component("sub-element");

  sub(EVENT);

  on[EVENT] = (data) => {
    console.log(data.hello); // => world!
  };
}
```

Bubbling events.

```
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

```
import { component } from "https://deno.land/x/capsule/mod.ts";

const { on } = component("my-component");

on.mount = () => {
  console.log("hello, I'm mounted")
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
