// Copyright 2022 Yoshiya Hinosawa. All rights reserved. MIT license.

export {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { deferred } from "https://deno.land/std@0.119.0/async/deferred.ts";
import "./dom_polyfill_deno.ts";
import { component } from "./mod.ts";

const randomName = () => "c-" + Math.random().toString().slice(2);

Deno.test("component.on.__mount__ is called when component is mounted", async () => {
  const p = deferred();
  const name = randomName();
  const { on } = component(name);

  document.body.innerHTML = `<div class="${name}"></div>`

  on.__mount__ = () => {
    p.resolve();
  };

  await p;
});
