// Copyright 2022 Yoshiya Hinosawa. All rights reserved. MIT license.

const READY_STATE_CHANGE = "readystatechange";

let p: Promise<void>;
export function documentReady() {
  return p = p || new Promise<void>((resolve) => {
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
