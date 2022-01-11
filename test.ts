// Copyright 2022 Yoshiya Hinosawa. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { deferred } from "https://deno.land/std@0.119.0/async/deferred.ts";
import "./dom_polyfill_deno.ts";
import { component, mount, unmount } from "./mod.ts";

// deno-lint-ignore no-explicit-any
(globalThis as any).__DEV__ = false;

Deno.test("on.__mount__ is called when the component is mounted", () => {
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML = `<div class="${name}"></div>`;

  let called = false;

  on.__mount__ = () => {
    called = true;
  };

  mount();

  assert(called);
});

Deno.test("on.__unmount__ is called when the componet is unmounted", () => {
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML = `<div class="${name}"></div>`;

  let called = false;

  on.__unmount__ = () => {
    called = true;
  };

  mount();
  assert(!called);
  unmount(name, query(`.${name}`)!);
  assert(called);
});

Deno.test("unmount removes the event listeners", () => {
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML = `<div class="${name}"></div>`;
  const el = queryByClass(name);

  let count = 0;
  on["my-event"] = () => {
    count++;
  };
  mount();
  assertEquals(count, 0);
  el?.dispatchEvent(new CustomEvent("my-event"));
  assertEquals(count, 1);
  el?.dispatchEvent(new CustomEvent("my-event"));
  assertEquals(count, 2);
  unmount(name, el!);
  el?.dispatchEvent(new CustomEvent("my-event"));
  assertEquals(count, 2);
});

Deno.test("on[event] is called when the event is dispatched", () => {
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML = `<div class="${name}"></div>`;

  let called = false;

  on.click = () => {
    called = true;
  };

  mount();

  query("div")?.dispatchEvent(new Event("click"));
  assert(called);
});

Deno.test("on(selector)[event] is called when the event is dispatched only under the selector", async () => {
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML =
    `<div class="${name}"><button class="btn1"></button><button class="btn2"></button></div>`;

  let onBtn1ClickCalled = false;
  let onBtn2ClickCalled = false;

  on(".btn1").click = () => {
    onBtn1ClickCalled = true;
  };

  on(".btn2").click = () => {
    onBtn2ClickCalled = true;
  };

  mount();

  const btn = queryByClass("btn1");
  // FIXME(kt3k): workaround for deno_dom & deno issue
  // deno_dom doesn't bubble event when the direct target dom doesn't have event handler
  btn?.addEventListener("click", () => {});
  btn?.dispatchEvent(new Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 100));

  assert(onBtn1ClickCalled);
  assert(!onBtn2ClickCalled);
});

const randomName = () => "c-" + Math.random().toString(36).slice(2);
const query = (s: string) => document.querySelector(s);
const queryByClass = (name: string) => document.querySelector(`.${name}`);
